$ErrorActionPreference = "Stop"
Set-Location -Path (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) '..')
$envFile = "../.env"

# Load .env
if (Test-Path $envFile) {
    Get-Content $envFile | Where-Object { $_ -and ($_ -notmatch '^\s*#') } | ForEach-Object {
        $parts = $_ -split '=', 2
        if ($parts.Count -eq 2) {
            $key = $parts[0].Trim()
            $value = $parts[1].Trim()
            Set-Item -Path "env:$key" -Value $value
        }
    }
} else {
    Write-Host ".env file not found. Please create one with AZURE_SUBSCRIPTION_ID and AZURE_GITHUB_ACTIONS_SP_NAME." -ForegroundColor Red
    exit 1
}

if (-not $env:AZURE_SUBSCRIPTION_ID -or -not $env:AZURE_GITHUB_ACTIONS_SP_NAME) {
    Write-Host "Missing AZURE_SUBSCRIPTION_ID or AZURE_GITHUB_ACTIONS_SP_NAME in .env" -ForegroundColor Red
    exit 1
}

$subscriptionId = $env:AZURE_SUBSCRIPTION_ID
$spName        = $env:AZURE_GITHUB_ACTIONS_SP_NAME
$scope         = "/subscriptions/$subscriptionId"
$credsFile     = "github_sp_credentials.json"

Write-Host "Ensuring Service Principal '$spName' exists in the current tenant..." -ForegroundColor Cyan

# Try to find an existing SP by display name
$existingAppId = ""
try {
    $existingAppId = az ad sp list --display-name $spName --query "[0].appId" -o tsv 2>$null
} catch {}

function Write-SdkAuthJson {
    param(
        [Parameter(Mandatory=$true)][string]$ClientId,
        [Parameter(Mandatory=$true)][string]$ClientSecret,
        [Parameter(Mandatory=$true)][string]$TenantId,
        [Parameter(Mandatory=$true)][string]$SubscriptionId,
        [Parameter(Mandatory=$true)][string]$Path
    )
    $obj = [ordered]@{
        clientId                         = $ClientId
        clientSecret                     = $ClientSecret
        subscriptionId                   = $SubscriptionId
        tenantId                         = $TenantId
        activeDirectoryEndpointUrl       = "https://login.microsoftonline.com"
        resourceManagerEndpointUrl       = "https://management.azure.com/"
        activeDirectoryGraphResourceId   = "https://graph.windows.net/"
        sqlManagementEndpointUrl         = "https://management.core.windows.net:8443/"
        galleryEndpointUrl               = "https://gallery.azure.com/"
        managementEndpointUrl            = "https://management.core.windows.net/"
    }
    $obj | ConvertTo-Json -Depth 4 | Out-File -FilePath $Path -Encoding utf8 -Force
}

$clientId = ""
$tenantId = ""
$spObjectId = ""
$clientSecret = ""

if ([string]::IsNullOrWhiteSpace($existingAppId)) {
    # Create a brand new SP (no assignment yet so we can assign by objectId ourselves)
    Write-Host "Creating new Service Principal '$spName'..." -ForegroundColor Yellow
    # --skip-assignment lets us control RBAC via --assignee-object-id afterwards
    $sdkAuthJson = az ad sp create-for-rbac --name $spName --sdk-auth 2>$null

    if (-not $sdkAuthJson) {
        Write-Host "Failed to create Service Principal." -ForegroundColor Red
        exit 1
    }

    # Save creds file
    $sdkAuth = $sdkAuthJson | ConvertFrom-Json
    $clientId    = $sdkAuth.clientId
    $tenantId    = $sdkAuth.tenantId
    $clientSecret = $sdkAuth.clientSecret
    Write-SdkAuthJson -ClientId $clientId -ClientSecret $clientSecret -TenantId $tenantId -SubscriptionId $subscriptionId -Path $credsFile

    # Resolve SP objectId from clientId (appId)
    $spObjectId = az ad sp show --id $clientId --query id -o tsv
    if (-not $spObjectId) {
        Write-Host "Could not resolve SP objectId for appId $clientId." -ForegroundColor Red
        exit 1
    }
    Write-Host "Created SP. appId=$clientId objectId=$spObjectId" -ForegroundColor Green
}
else {
    # Reuse existing SP, generate a fresh secret, and produce sdk-auth JSON
    $clientId = $existingAppId
    Write-Host "Service Principal already exists (appId=$clientId). Resetting credentials..." -ForegroundColor Yellow

    $reset = az ad sp credential reset --id $clientId -o json
    if (-not $reset) {
        Write-Host "Failed to reset SP credentials." -ForegroundColor Red
        exit 1
    }
    $resetObj = $reset | ConvertFrom-Json
    $clientSecret = $resetObj.password
    $tenantId     = $resetObj.tenant

    if (-not $clientSecret -or -not $tenantId) {
        Write-Host "Could not obtain new secret/tenant for SP." -ForegroundColor Red
        exit 1
    }

    Write-SdkAuthJson -ClientId $clientId -ClientSecret $clientSecret -TenantId $tenantId -SubscriptionId $subscriptionId -Path $credsFile

    # Get SP objectId
    $spObjectId = az ad sp show --id $clientId --query id -o tsv
    if (-not $spObjectId) {
        Write-Host "Could not resolve SP objectId for appId $clientId." -ForegroundColor Red
        exit 1
    }
    Write-Host "Reused SP. appId=$clientId objectId=$spObjectId" -ForegroundColor Green
}

# Assign RBAC using **objectId**
Write-Host "Ensuring RBAC (Owner) on scope $scope via objectId..." -ForegroundColor Cyan

# Avoid JMESPath on Windows: get JSON and count in PowerShell
$assignmentsJson = az role assignment list --assignee-object-id $spObjectId --scope $scope --role "Owner" -o json 2>$null

$hasOwnerCount = 0
if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($assignmentsJson)) {
    try {
        $hasOwnerCount = @($assignmentsJson | ConvertFrom-Json).Count
    } catch {
        $hasOwnerCount = 0
    }
}

if ([int]$hasOwnerCount -lt 1) {
    # Create the assignment (retry for eventual consistency)
    $maxAttempts = 3
    for ($i = 1; $i -le $maxAttempts; $i++) {
        try {
            az role assignment create --assignee-object-id $spObjectId --role "Owner" --scope $scope | Out-Null
            Write-Host "Owner role assigned to SP (objectId=$spObjectId) at $scope." -ForegroundColor Green
            break
        } catch {
            if ($i -eq $maxAttempts) { throw }
            Start-Sleep -Seconds 5
        }
    }
} else {
    Write-Host "Owner role already present for SP (objectId=$spObjectId) at $scope." -ForegroundColor DarkGray
}

Write-Host "Service Principal ready and credentials saved to $credsFile" -ForegroundColor Green