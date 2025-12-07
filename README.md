# TornTools

TornTools is a full-stack application for working with Torn API data. It includes an ASP.NET Core API with Hangfire background processing and a React/Vite front-end.

## Development hosting
- **API:** Azure App Service (Linux) on the B1 SKU in UK South with AlwaysOn enabled. This keeps the Hangfire dashboard and `QueueProcessor` background service running without hitting the F1 memory quota.
- **Frontend:** React build artifacts served from an Azure Storage static website endpoint.
- **Data/Secrets:** PostgreSQL Flexible Server for storage and Azure Key Vault for the DB admin password and the `react-app-api-base-url` secret used by the client.

## Deploying with Terraform and GitHub Actions
- The `Deploy Full Stack` workflow (`.github/workflows/deploy-all.yml`) builds both stacks, runs Flyway migrations, and applies Terraform. The workflow sets `TF_VAR_sku_app_service=B1` for the dev environment.
- Required Azure credentials/secrets: `AZURE_CREDENTIALS` (service principal JSON), `TF_VAR_DB_ADMIN_PASSWORD`, `TF_VAR_GITHUB_ACTIONS_OBJECT_ID`, `TF_VAR_GITHUB_ACTIONS_TENANT_ID`, and `TF_VAR_SUBSCRIPTION_ID`.
- Terraform can be run locally from `infra/` with `terraform init -backend-config=backend.<env>.config` and `terraform apply`, passing the same TF_VAR values.

## Application configuration
- **API:** `ASPNETCORE_ENVIRONMENT` is set via App Service settings; `LocalConfiguration__RunningLocally=false` in cloud environments keeps the queue processor active. Connection strings and limits (`TornApiCallerConfiguration__MaxCallsPerMinute`) are injected as app settings.
- **Frontend:** `VITE_API_BASE_URL` points to the API root (without `/api`). A fallback of `https://localhost:7012/api` is used for local development.

## Local development
1. Run `dotnet restore` and `dotnet build` from the `api/` directory.
2. In `client/`, run `npm install` and `npm run dev` (set `VITE_API_BASE_URL` to your local API if different).
3. PostgreSQL connection details can be provided via user secrets or environment variables; see `infra/postgresql.tf` for the expected names.
