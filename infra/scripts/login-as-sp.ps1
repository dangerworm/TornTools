$ErrorActionPreference = "Stop"
Set-Location -Path (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) '..')

Write-Host "Logging into Azure using saved service principal credentials..."

# Read and parse the JSON file
$sp = Get-Content -Raw -Path "github_sp_credentials.json" | ConvertFrom-Json

# Perform the login
az login --service-principal `
  --username $sp.clientId `
  --password $sp.clientSecret `
  --tenant $sp.tenantId

# Set the subscription
az account set --subscription $sp.subscriptionId

Write-Host "Logged in as Service Principal." 