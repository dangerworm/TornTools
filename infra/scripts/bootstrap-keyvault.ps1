param(
    [string]$Environment = "dev",
    [string]$Location = "UK South",
    [string]$SubscriptionId,
    [switch]$UseServicePrincipalLogin  # optional; if set and github_sp_credentials.json exists, log in as SP
)

# --- Strict errors by default ---
$ErrorActionPreference = "Stop"

# --- Keep Azure CLI quiet; prevent native-stderr from killing the run ---
$env:AZURE_CORE_ONLY_SHOW_ERRORS = "1"
$env:PYTHONWARNINGS              = "ignore"
if ($PSVersionTable.PSVersion.Major -ge 7) {
    $global:PSNativeCommandUseErrorActionPreference = $false
}

# Helper: run a potentially-noisy AZ command safely (swallow native-stderr, keep exit code)
function Invoke-AzQuiet {
    param([Parameter(Mandatory)][string]$Arguments)
    $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    try { $null = & az @($Arguments.Split(' ')) --only-show-errors 2>$null }
    finally { $ErrorActionPreference = $old }
    return $LASTEXITCODE
}

# Helper: run AZ and capture stdout TSV/JSON safely
function Invoke-AzOut {
    param([Parameter(Mandatory)][string]$Arguments)
    $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    try { $result = (& az @($Arguments.Split(' ')) --only-show-errors 2>$null) }
    finally { $ErrorActionPreference = $old }
    return $result
}

# --- Run from repo root (../ from scripts/) ---
Set-Location -Path (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) '..')

# --- Load .env (optional) ---
$envFile = "../.env"
if (Test-Path $envFile) {
    Get-Content $envFile | Where-Object { $_ -and ($_ -notmatch '^\s*#') } | ForEach-Object {
        $parts = $_ -split '=', 2
        if ($parts.Count -eq 2) {
            $key   = $parts[0].Trim()
            $value = $parts[1].Trim()
            Set-Item -Path "env:$key" -Value $value
        }
    }
}

if (-not $SubscriptionId) { $SubscriptionId = $env:AZURE_SUBSCRIPTION_ID }
if (-not $SubscriptionId) {
    Write-Host "ERROR: SubscriptionId not provided and AZURE_SUBSCRIPTION_ID not set in .env" -ForegroundColor Red
    exit 1
}

Write-Host "Using subscription $SubscriptionId"

# --- Load per-environment secrets file ---
$secretsFile = "keyvault-secrets.$Environment.env"
if (-not (Test-Path $secretsFile)) {
    Write-Host "ERROR: $secretsFile not found." -ForegroundColor Red
    Write-Host "Copy keyvault-secrets.env.template to $secretsFile and fill in all values." -ForegroundColor Yellow
    exit 1
}

$secrets = @{}
Get-Content $secretsFile | Where-Object { $_ -and ($_ -notmatch '^\s*#') -and ($_ -match '=') } | ForEach-Object {
    $parts = $_ -split '=', 2
    if ($parts.Count -eq 2) {
        $key   = $parts[0].Trim()
        $value = $parts[1].Trim()
        if ($key -and $value) { $secrets[$key] = $value }
    }
}

if ($secrets.Count -eq 0) {
    Write-Host "ERROR: No secrets found in $secretsFile. Please fill in the values." -ForegroundColor Red
    exit 1
}

Write-Host "Loaded $($secrets.Count) value(s) from $secretsFile" -ForegroundColor Cyan

# --- Ensure public cloud ---
try { & az cloud set --name AzureCloud --only-show-errors 2>$null | Out-Null } catch { }

# --- Auth & context ---
$credsFile       = "github_sp_credentials.json"
$principalObjectId = $null

if ($UseServicePrincipalLogin -and (Test-Path $credsFile)) {
    Write-Host "Logging in as Service Principal from $credsFile..."
    $sp = Get-Content -Raw $credsFile | ConvertFrom-Json
    $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    & az login --service-principal `
        --username $sp.clientId `
        --password $sp.clientSecret `
        --tenant   $sp.tenantId `
        --only-show-errors 2>$null | Out-Null
    $ErrorActionPreference = $old
    if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Service principal login failed." -ForegroundColor Red; exit 1 }

    # Resolve the SP's object ID for access policy assignment
    $principalObjectId = Invoke-AzOut "ad sp show --id $($sp.clientId) --query id -o tsv"
    if ([string]::IsNullOrWhiteSpace($principalObjectId)) {
        Write-Host "ERROR: Could not resolve object ID for service principal." -ForegroundColor Red; exit 1
    }
    Write-Host "Logged in as Service Principal (objectId=$principalObjectId)"
}
else {
    Write-Host "Using existing Azure CLI session..."
    $currentUserJson = Invoke-AzOut "ad signed-in-user show -o json"
    if ([string]::IsNullOrWhiteSpace($currentUserJson)) {
        Write-Host "ERROR: Not logged in. Please run 'az login'." -ForegroundColor Red; exit 1
    }
    $principalObjectId = ($currentUserJson | ConvertFrom-Json).id
    Write-Host "Authenticated as user (objectId=$principalObjectId)"
}

# --- Select subscription ---
$old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
& az account set --subscription $SubscriptionId --only-show-errors 2>$null | Out-Null
$ErrorActionPreference = $old
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: Could not select subscription $SubscriptionId" -ForegroundColor Red; exit 1 }

# --- Resource names ---
$ResourceGroup = "torntools-state-rg"
$KeyVaultName  = "torntools-$Environment-tf-kv"

# --- Verify resource group exists ---
$rgJson = Invoke-AzOut "group show --name $ResourceGroup -o json"
if ([string]::IsNullOrWhiteSpace($rgJson)) {
    Write-Host "ERROR: Resource group '$ResourceGroup' not found." -ForegroundColor Red
    Write-Host "Please run bootstrap-backend.ps1 first to create the state resource group." -ForegroundColor Yellow
    exit 1
}

Write-Host "Ensuring Key Vault '$KeyVaultName' in '$ResourceGroup'..."

# --- Create Key Vault (idempotent) ---
$kvCheckJson = Invoke-AzOut "keyvault show --name $KeyVaultName --resource-group $ResourceGroup -o json"
if ([string]::IsNullOrWhiteSpace($kvCheckJson)) {
    Write-Host "Creating Key Vault '$KeyVaultName'..."
    $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    & az keyvault create `
        --name           $KeyVaultName `
        --resource-group $ResourceGroup `
        --location       $Location `
        --sku            standard `
        --enable-rbac-authorization false `
        --only-show-errors 2>$null | Out-Null
    $rc = $LASTEXITCODE
    $ErrorActionPreference = $old
    if ($rc -ne 0) { Write-Host "ERROR: Failed to create Key Vault '$KeyVaultName'." -ForegroundColor Red; exit 1 }
    Write-Host "Key Vault created." -ForegroundColor Green
}
else {
    Write-Host "Key Vault '$KeyVaultName' already exists." -ForegroundColor DarkGray
}

# --- Grant access policy to caller ---
Write-Host "Setting access policy for object ID $principalObjectId..."
$old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
& az keyvault set-policy `
    --name             $KeyVaultName `
    --object-id        $principalObjectId `
    --secret-permissions get list set delete `
    --only-show-errors 2>$null | Out-Null
$rc = $LASTEXITCODE
$ErrorActionPreference = $old
if ($rc -ne 0) { Write-Host "ERROR: Failed to set Key Vault access policy." -ForegroundColor Red; exit 1 }
Write-Host "Access policy set." -ForegroundColor Green

# --- Map secrets-file keys to Key Vault secret names ---
# Key Vault names: alphanumeric + hyphens, max 127 chars.
# Convention: TF-VAR-<TERRAFORM-VARIABLE-NAME> so the workflow can reference them consistently.
$kvSecretMap = [ordered]@{
    "SUBSCRIPTION_ID"          = "TF-VAR-SUBSCRIPTION-ID"
    "GITHUB_ACTIONS_OBJECT_ID" = "TF-VAR-GITHUB-ACTIONS-OBJECT-ID"
    "GITHUB_ACTIONS_TENANT_ID" = "TF-VAR-GITHUB-ACTIONS-TENANT-ID"
    "LOCAL_USER_OBJECT_ID"     = "TF-VAR-LOCAL-USER-OBJECT-ID"
    "LOCAL_USER_TENANT_ID"     = "TF-VAR-LOCAL-USER-TENANT-ID"
    "DB_ADMIN_PASSWORD"        = "TF-VAR-DB-ADMIN-PASSWORD"
    "DEVELOPER_IP"             = "TF-VAR-DEVELOPER-IP"
    "APP_SERVICE_OUTBOUND_IPS" = "TF-VAR-APP-SERVICE-OUTBOUND-IPS"
}

# --- Upload secrets ---
Write-Host ""
Write-Host "Uploading secrets to Key Vault '$KeyVaultName'..."

$uploaded = 0
$skipped  = 0

foreach ($envKey in $secrets.Keys) {
    $kvName = $kvSecretMap[$envKey]
    if (-not $kvName) {
        Write-Host "  [SKIP] Unrecognised key '$envKey' - add it to the map in bootstrap-keyvault.ps1 if needed." -ForegroundColor DarkYellow
        $skipped++
        continue
    }

    Write-Host "  Setting $kvName..."

    # Use direct az call (not Invoke-AzQuiet) so values containing spaces or JSON
    # brackets (e.g. APP_SERVICE_OUTBOUND_IPS) are passed as a single argument.
    $value = $secrets[$envKey]
    $old = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    & az keyvault secret set `
        --vault-name $KeyVaultName `
        --name       $kvName `
        --value      $value `
        --only-show-errors 2>$null | Out-Null
    $rc = $LASTEXITCODE
    $ErrorActionPreference = $old

    if ($rc -ne 0) {
        Write-Host "  ERROR: Failed to set secret '$kvName'." -ForegroundColor Red
        exit 1
    }

    $uploaded++
}

Write-Host ""
Write-Host "Done. $uploaded secret(s) uploaded, $skipped skipped." -ForegroundColor Green
Write-Host "Key Vault : $KeyVaultName"
Write-Host "Resource group: $ResourceGroup"
Write-Host ""
Write-Host "Workflow usage - fetch these secrets with:"
Write-Host "  uses: azure/get-keyvault-secrets@v1"
Write-Host "  with:"
Write-Host "    keyvault: `"$KeyVaultName`""
Write-Host "    secrets: `"$(($kvSecretMap.Values | Where-Object { $secrets.ContainsKey(($kvSecretMap.GetEnumerator() | Where-Object Value -eq $_).Key) }) -join ', ')`""
