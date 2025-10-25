param(
    [string]$Environment = "dev"
)

$ErrorActionPreference = "Stop"
Set-Location -Path (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) '..')

# Load .env file manually
if (Test-Path "../.env") {
    Get-Content "../.env" | Where-Object { $_ -and ($_ -notmatch '^#') } | ForEach-Object {
        $parts = $_ -split '=', 2
        if ($parts.Count -eq 2) {
            $key = $parts[0].Trim()
            $value = $parts[1].Trim()
            Set-Item -Path "env:$key" -Value $value
        }
    }
}

$configPath = "../backend.$Environment.config"
if (-Not (Test-Path $configPath)) {
    Write-Host "$configPath not found. Please run bootstrap-backend.ps1 for the correct environment." -ForegroundColor Red
    exit 1
}

$storageAccountName = $null
$resourceGroupName = $null
$subscriptionId = $null

$lines = Get-Content $configPath
foreach ($line in $lines) {
    if ($line -match "^storage_account_name\s*=\s*'([^']+)'") {
        $storageAccountName = $matches[1]
    }
    if ($line -match "^resource_group_name\s*=\s*'([^']+)'") {
        $resourceGroupName = $matches[1]
    }
}

if (-not $storageAccountName -or -not $resourceGroupName) {
    Write-Host "Could not find storage_account_name or resource_group_name in $configPath" -ForegroundColor Red
    exit 1
}

# Get subscription ID from Azure CLI
$subscriptionId = az account show --query id -o tsv
if (-not $subscriptionId) {
    Write-Host "Could not determine current Azure subscription. Please run az login." -ForegroundColor Red
    exit 1
}

az account set --subscription $subscriptionId

Write-Host "Getting current user object ID..."
$objectId = az ad signed-in-user show --query id -o tsv

Write-Host "Granting 'Storage Blob Data Contributor' role to user on storage account '$storageAccountName' for environment '$Environment'..."
az role assignment create `
    --assignee $objectId `
    --role "Storage Blob Data Contributor" `
    --scope "/subscriptions/$subscriptionId/resourceGroups/$resourceGroupName/providers/Microsoft.Storage/storageAccounts/$storageAccountName"

Write-Host "Role assignment complete for environment '$Environment'." -ForegroundColor Green 