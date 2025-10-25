param(
    [string]$Environment = "dev"
)

$ErrorActionPreference = "Stop"
Set-Location -Path (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) '..')

$backendConfig = "backend.$Environment.config"
if (-not (Test-Path $backendConfig)) {
  Write-Host "ERROR: $backendConfig not found. Please run ./scripts/bootstrap-backend.ps1 for the correct environment." -ForegroundColor Red
  exit 1
}

$tfvarsFile = "terraform.$Environment.tfvars"
if (-not (Test-Path $tfvarsFile)) {
  Write-Host "ERROR: $tfvarsFile not found. Please refer to the 'Configuring Variables' section of README.md." -ForegroundColor Red
  exit 1
}

Write-Host "Checking Azure CLI login..."
try {
    az account show > $null
} catch {
    az login
}

Write-Host "Current Azure Subscription:"
az account show --query "{name:name, id:id}" --output table

Write-Host "Initializing Terraform..."
terraform init -reconfigure -backend-config="$backendConfig"

Write-Host "Validating Terraform..."
terraform validate

Write-Host "Generating execution plan..."
terraform plan -var-file="$tfvarsFile" -var="enable_local_user_access=true" -out=tfplan

Write-Host "Ready to apply plan. Proceeding in 5 seconds (Ctrl+C to cancel)..."
Start-Sleep -Seconds 5

Write-Host "Applying plan..."
terraform apply -var-file="$tfvarsFile" -var="enable_local_user_access=true" tfplan