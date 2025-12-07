############################################
# Repository/usage summary for dev env:
# - Backend: api/TornTools.Api (Program.cs) runs ASP.NET Core with Hangfire dashboard and a long-running QueueProcessor BackgroundService for Torn API polling; requires an always-on worker and stable memory.
# - Frontend: client/ (React + Vite) built to static files hosted from a storage account static website endpoint.
# - Infra: App Service Plan + Linux Web App for the API, storage static site for the client, PostgreSQL Flexible Server, Key Vault secrets, Log Analytics diagnostics; deployed via GitHub Actions (build-code.yml, deploy-all.yml).
# - Usage pattern inferred from code: recurring jobs and queued API calls mean continuous background activity even with low/bursty user traffic. Dev currently runs on a single worker hitting F1 memory quota.
# Hosting options considered for dev backend:
# * App Service B1/S1: low £/mo (~B1) while keeping existing deployment model; supports AlwaysOn for Hangfire/background loops and avoids free-tier memory caps.
# * Azure Container Apps: moderate £ due to workload profile and Log Analytics; would need new container build/push steps.
# * Azure Functions/Durable Functions: unsuitable because Hangfire/hosted services expect a continuously running process.
# Decision: stay on App Service and move dev to B1 with AlwaysOn enabled for cheapest reliable capacity and minimal pipeline change.
############################################
provider "azurerm" {
  features {}
}
