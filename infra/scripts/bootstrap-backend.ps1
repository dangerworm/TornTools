param(
    [string]$Environment = "dev",
    [string]$Location = "UK South",
    [string]$SubscriptionId,
    [string]$TenantId,                 # optional; read from .env if present
    [switch]$UseServicePrincipalLogin  # optional; if set and creds file exists, log in as SP
)

# --- Strict errors by default ---
$ErrorActionPreference = "Stop"

# --- Keep Azure CLI quiet; prevent native-stderr from killing the run ---
$env:AZURE_CORE_ONLY_SHOW_ERRORS = "1"
$env:PYTHONWARNINGS              = "ignore"   # silence Python UserWarnings from the CLI's SDKs
if ($PSVersionTable.PSVersion.Major -ge 7) {
    $global:PSNativeCommandUseErrorActionPreference = $false
}

# Helper: run a potentially-noisy AZ command safely (swallow native-stderr, keep exit code)
function Invoke-AzQuiet {
    param([Parameter(Mandatory)][string]$Args)
    $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    try { $null = & az @($Args.Split(' ')) --only-show-errors 2>$null }
    finally { $ErrorActionPreference = $old }
    return $LASTEXITCODE
}
# Helper: run AZ and capture stdout TSV/JSON safely
function Invoke-AzOut {
    param([Parameter(Mandatory)][string]$Args)
    $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    try { $out = & az @($Args.Split(' ')) --only-show-errors 2>$null }
    finally { $ErrorActionPreference = $old }
    if ($LASTEXITCODE -ne 0) { return $null } else { return $out }
}

# --- Run from repo root (../ from scripts/) ---
Set-Location -Path (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) '..')

# --- Load .env (optional) ---
$envFile = "../.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if (-not $SubscriptionId -and $_ -match "^\s*AZURE_SUBSCRIPTION_ID\s*=\s*(.+)\s*$") {
            $SubscriptionId = $Matches[1].Trim()
        }
        if (-not $TenantId -and $_ -match "^\s*AZURE_TENANT_ID\s*=\s*(.+)\s*$") {
            $TenantId = $Matches[1].Trim()
        }
    }
}

if (-not $SubscriptionId) {
    throw "No subscription ID provided. Pass -SubscriptionId or set AZURE_SUBSCRIPTION_ID in .env"
}

Write-Host "Using subscription $SubscriptionId"

# --- Ensure public cloud ---
try {
    $currentCloud = (& az cloud show --query name -o tsv 2>$null)
    if ($currentCloud -ne "AzureCloud") {
        $null = Invoke-AzQuiet "cloud set -n AzureCloud"
    }
} catch { }

# --- Auth & context ---
$credsFile = "github_sp_credentials.json"
$principalObjectId = $null
$principalKind = $null

if ($UseServicePrincipalLogin -and (Test-Path $credsFile)) {
    $creds = Get-Content $credsFile -Raw | ConvertFrom-Json
    if (-not $TenantId) { $TenantId = $creds.tenantId }

    Write-Host "Logging in as Service Principal (clientId ending ...$($creds.clientId.Substring($creds.clientId.Length-4))) in tenant $TenantId ..."
    & az logout 2>$null | Out-Null
    & az account clear 2>$null | Out-Null

    $null = Invoke-AzQuiet "login --service-principal --username $($creds.clientId) --password $($creds.clientSecret) --tenant $TenantId --allow-no-subscriptions"

    # Try to resolve SP objectId (may fail without Graph app perms; that's OK)
    $principalObjectId = Invoke-AzOut "ad sp show --id $($creds.clientId) --query id -o tsv"
    $principalKind = if ([string]::IsNullOrWhiteSpace($principalObjectId)) { "Service Principal (objectId unknown)" } else { "Service Principal" }
}
else {
    $null = Invoke-AzQuiet "config set core.allow_tenant_switch=true"
    # Check current login; if not logged in, log in (optionally forcing tenant)
    & az account show --only-show-errors 2>$null *>$null
    if ($LASTEXITCODE -ne 0) {
        if ($TenantId) { $null = Invoke-AzQuiet "login --tenant $TenantId" }
        else           { $null = Invoke-AzQuiet "login" }
    }
    $principalObjectId = Invoke-AzOut "ad signed-in-user show --query id -o tsv"
    if ([string]::IsNullOrWhiteSpace($principalObjectId)) {
        throw "Could not resolve signed-in user's objectId (are you in the correct tenant?)."
    }
    $principalKind = "User"
}

# --- Select the subscription explicitly ---
$old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
try {
    & az account set --subscription $SubscriptionId --only-show-errors 2>$null | Out-Null
} finally { $ErrorActionPreference = $old }
if ($LASTEXITCODE -ne 0) {
    throw "Failed to select subscription $SubscriptionId. Check access/ID/tenant."
}

# --- Verify subscription & tenant ---
$subCtxJson = Invoke-AzOut "account show --subscription $SubscriptionId -o json"
if ([string]::IsNullOrWhiteSpace($subCtxJson)) {
    throw "Azure CLI can't see subscription $SubscriptionId. Check access or ID."
}
$subscriptionTenantId = ($subCtxJson | ConvertFrom-Json).tenantId

# --- If SP login, ensure tenant alignment ---
if ($UseServicePrincipalLogin) {
    $ctxTenant = Invoke-AzOut "account show --query tenantId -o tsv"
    if ($TenantId -and ($TenantId -ne $subscriptionTenantId)) {
        throw "Service principal login is in tenant $TenantId but the subscription belongs to tenant $subscriptionTenantId. Recreate the SP in the subscription's tenant."
    }
    if ($ctxTenant -and ($ctxTenant -ne $subscriptionTenantId)) {
        throw "Logged-in context is tenant $ctxTenant but the subscription belongs to tenant $subscriptionTenantId. Recreate/login with an SP in the subscription's tenant."
    }
}

# --- RBAC preflight (skip if SP objectId couldn't be resolved) ---
$scope = "/subscriptions/$SubscriptionId"
if (-not [string]::IsNullOrWhiteSpace($principalObjectId)) {
    $assignmentsJson = Invoke-AzOut "role assignment list --assignee-object-id $principalObjectId --scope $scope -o json"
    $roles = @()
    if (-not [string]::IsNullOrWhiteSpace($assignmentsJson)) { $roles = $assignmentsJson | ConvertFrom-Json }
    $roleNames = @($roles | ForEach-Object { $_.roleDefinitionName } | Where-Object { $_ })
    $hasOwnerOrContributor = $roleNames -contains "Owner" -or $roleNames -contains "Contributor"
    if (-not $hasOwnerOrContributor) {
        $pretty = if ($roleNames.Count -gt 0) { ($roleNames -join ", ") } else { "(none)" }
        throw "$principalKind (objectId=$principalObjectId) lacks Owner/Contributor on $scope. Found: $pretty"
    }
} else {
    Write-Host "Skipping RBAC preflight: could not resolve $principalKind objectId (Graph may block app tokens)." -ForegroundColor Yellow
}

# --- Resource names ---
$StorageAccount = "torntoolsstatetfstate"   # 3–24 chars, lowercase/numbers, globally unique
$Container      = "tfstate-$Environment"
$ResourceGroup  = "torntools-state-rg"

# --- Create resource group (idempotent) ---
Write-Host "Creating resource group $ResourceGroup in $Location..."
if ((Invoke-AzQuiet "group create --subscription $SubscriptionId --name $ResourceGroup --location `"$Location`"") -ne 0) {
    throw "Failed to create or verify resource group '$ResourceGroup' in '$Location'."
}

# --- Create storage account (idempotent) ---
Write-Host "Creating storage account $StorageAccount..."
if ((Invoke-AzQuiet "storage account create --subscription $SubscriptionId --name $StorageAccount --resource-group $ResourceGroup --location `"$Location`" --sku Standard_LRS") -ne 0) {
    throw "Failed to create storage account '$StorageAccount' in resource group '$ResourceGroup'. The name might be globally taken or you lack permissions."
}

# --- Verify the storage account exists in the expected RG ---
$saId = Invoke-AzOut "storage account show --subscription $SubscriptionId --resource-group $ResourceGroup --name $StorageAccount --query id -o tsv"
if ([string]::IsNullOrWhiteSpace($saId)) {
    throw "Storage account '$StorageAccount' not found in resource group '$ResourceGroup' after create. The name may be globally taken in another subscription. Choose a unique name and retry."
}

# --- Retrieve a key for the account (or switch to data-plane RBAC if you prefer) ---
Write-Host "Retrieving storage account key..."
$accountKey = Invoke-AzOut "storage account keys list --subscription $SubscriptionId --resource-group $ResourceGroup --account-name $StorageAccount --query [0].value -o tsv"
if ([string]::IsNullOrWhiteSpace($accountKey)) {
    throw "Failed to retrieve storage account key. Ensure the principal has 'Microsoft.Storage/storageAccounts/listKeys/action' on the account."
}

# --- Create container (idempotent) ---
Write-Host "Creating blob container $Container..."
if ((Invoke-AzQuiet "storage container create --name $Container --account-name $StorageAccount --account-key $accountKey") -ne 0) {
    throw "Failed to create or verify blob container '$Container' on storage account '$StorageAccount'."
}

# --- Write backend config for Terraform ---
Write-Host "Writing backend.$Environment.config file..."
$backendConfig = @"
resource_group_name  = "$ResourceGroup"
storage_account_name = "$StorageAccount"
container_name       = "$Container"
key                  = "terraform.tfstate"
"@
Set-Content -Path "../backend.$Environment.config" -Value $backendConfig -Encoding UTF8

Write-Host "Backend bootstrap complete. You can now run:"
Write-Host "terraform init -reconfigure -backend-config=backend.$Environment.config"
