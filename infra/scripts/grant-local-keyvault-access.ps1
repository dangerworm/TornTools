param(
    [string]$Environment = "dev"
)

$ErrorActionPreference = "Stop"
Set-Location -Path (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) '..')

$KeyVaultName = "torntools-$Environment-key-vault"

Write-Host "Fetching current user object ID..."
$objectId = az ad signed-in-user show --query id -o tsv

Write-Host "Setting access policy on Key Vault '$KeyVaultName' for object ID $objectId..."
az keyvault set-policy `
  --name $KeyVaultName `
  --object-id $objectId `
  --secret-permissions get list set delete `
  --output none

Write-Host "Access policy set for object ID $objectId" -ForegroundColor Green 