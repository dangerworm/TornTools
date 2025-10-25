param(
    [string]$Environment = "dev"
)

$ErrorActionPreference = "Stop"
Set-Location -Path (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) '..')

Write-Host "WARNING: This will destroy all infrastructure managed by Terraform."
$confirm = Read-Host "Are you sure you want to continue? (type 'yes' to confirm)"

if ($confirm -ne "yes") {
    Write-Host "Destruction aborted."
    exit 1
}

$tfvarsFile = "terraform.$Environment.tfvars"
if (-not (Test-Path $tfvarsFile)) {
    Write-Host "ERROR: $tfvarsFile not found. Please refer to the 'Configuring Variables' section of README.md." -ForegroundColor Red
    exit 1
}

Write-Host "Initializing Terraform..."
terraform init

Write-Host "Planning destroy..."
terraform plan -destroy -var-file="$tfvarsFile" -out=tfdestroy

Write-Host "Ready to apply plan. Proceeding in 5 seconds (Ctrl+C to cancel)..."
Start-Sleep -Seconds 5

Write-Host "Destroying infrastructure..."
terraform apply -var-file="$tfvarsFile" tfdestroy 