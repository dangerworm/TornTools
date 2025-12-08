# Infrastructure

Welcome! This guide will help you set up and manage the cloud infrastructure for dangerworm's Tools using Terraform and Azure. It is designed for users with little or no DevOps experience. Follow each section in order, and you'll have your infrastructure running smoothly.

---

## 1. Prerequisites

Before you begin, make sure you have:
- An [Azure account](https://azure.microsoft.com/)
- The [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) installed
- [Terraform](https://www.terraform.io/downloads.html) installed
- Permission to create resources in your Azure subscription
- (Optional) Access to your project's GitHub repository if you want to set up CI/CD

---

## 2. Azure Authentication & Service Principal Setup

To allow automation (like GitHub Actions) to deploy resources, you need a **service principal** (an Azure identity for automation).

### a. Ensure a subscription exists

Open a browser, navigate to https://portal.azure.com/, and log in.

Type 'Subscriptions' into the search bar at the top and select 'Subscriptions' when it appears.

Make sure that there is at least one subscription present.

If you are in a completely new account then you will need to create a subscription - this can be done by clicking '+ Add' at the
top left and following the instructions.

Once created, make a note of the subscription ID.

### b. Update environment variables

Copy the `.env-template` file in the root directory to a new file called `.env`.

Open the `.env` file.

Set the line `AZURE_SUBSCRIPTION_ID=...` to your subscription ID from step 2a.

### c. Log in to Azure from the terminal

Open a PowerShell terminal and run:

```powershell
az login
```

You should see a Window pop up prompting you for your account details. 

### d. Create a Service Principal

Run the setup script to create a service principal (SP) and output the credentials you'll use later.

```powershell
cd infra/scripts
./create-sp.ps1
```

The script will create a service principal in Azure and output a file called `github_sp_credentials.json` containing the credentials.

### e. Copy the credentials into the terraform variables file

Copy the value for `tenantId` from `github_sp_credentials.json` 

Open `/infra/terraform.<Environment>.tfvars`

Set `github_actions_tenant_id` and `local_user_tenant_id` to the tenantId you copied.

Set `subscription_id` to the subscription ID from step 2a.

### f. Get the Service Principal Object ID

Run the following command to get the Object ID. Replace `<clientId>` with the `clientId` value from `github_sp_credentials.json`.

> Note: Make sure you're still logged into the same Azure subscription used to create
> the service principal.

```powershell
az ad sp show --id <clientId> --query id -o tsv
```

**Copy the resulting Object ID and paste it into the `github_actions_object_id` field in your `infra/terraform.<Environment>.tfvars` file.**

---

## 3. Bootstrapping the Terraform Backend

Terraform needs a place to store its state (a record of your infrastructure).

A single shared Azure storage account (`torntoolsstoretfstate`) holds the Terraform state,
with one blob container per environment (e.g., `tfstate-dev`, `tfstate-staging`,
`tfstate-prod`).

This means that every environment uses the same storage account, but each environment stores its state separately to the others.

First make sure that your Azure login is all connected up and that the new service principal has the correct roles.

1. Verify what the CLI is actually logged in as
```powershell
az account show -o jsonc
az account list --refresh --all -o table
az account tenant list -o table
```

2. Re-login cleanly to the correct tenant
```powershell
az logout
az account clear
az cloud set -n AzureCloud

az login --tenant <tenant_id>
az account set --subscription <subscription_id>
az account show -o table
```

3. Give the SP a role on the subscription (if needed)
```powershell
$SP="<client_id>"

az role assignment create `
  --assignee $SP `
  --role Contributor `
  --scope /subscriptions/<subscription_id>
```

4. Now log in as the SP (right tenant, no “no-subscriptions” mode)
```powershell
# Using the values from github_sp_credentials.json
$CID="<clientId>"
$CSEC="<clientSecret>"
$TEN="<tenantId>"

az logout
az account clear
az login --service-principal --username $CID --password $CSEC --tenant $TEN
az account list -o table
az account set --subscription <subscription_id>
```

You should now be able to run this script to set up the storage for your chosen environment:

```powershell
cd infra/scripts
# dev can be replaced with test, staging, prod, etc.
./bootstrap-backend.ps1 -Environment dev -UseServicePrincipalLogin
```

This will create the resource group (if needed), the shared storage account (if needed), and the environment-specific blob container. It will also generate a `backend.dev.config` (or `backend.staging.config`, etc.) file in the parent directory, referencing the shared storage account and the correct container.

---

## 4. Configuring Variables

You need to tell Terraform about your environment. Edit the file `infra/terraform.<Environment>.tfvars` and fill in the required values for your environment. Here's a sample:
```hcl
add_name                     = "app-name"
db_admin_password            = "<choose-a-strong-password>"
enable_local_user_access     = true
environment                  = "dev"  # or test, staging, prod, etc.
github_actions_object_id     = "<the-object-id-from-step-2c>"
github_actions_tenant_id     = "<the-tenant-id-from-github_sp_credentials.json>"
local_user_object_id         = "<your-user-object-id-in-azure>"
local_user_tenant_id         = "<the-tenant-id-from-github_sp_credentials.json>"
location                     = "uksouth"
subscription_id              = "<your-subscription-id>"
tfstate_storage_account_name = "torntoolsstoretfstate"  # shared for all environments
```
- Use the values you obtained in the previous steps.
- Save the file.

---

## 5. Deploying Infrastructure

Now you're ready to deploy!

> 
> ### A note on 'state lock'
> 
> If at any point you see `Error: Error acquiring the state lock`, check whether any other Terraform deployments are in progress.
> - If they are, let them finish and retry the operation.
> 
> - If no other operations are in progress:
>   - Copy and paste the ID shown in the error message
>   - Run the command `terraform force-unlock <ID>`
>

> 
> ### A note on 'state drift'
> 
> Terraform needs to know that it has control over all resources and, due to some of the complexities of Azure, it will occasionally
> 'lose track' of some of the secrets. You may occasionally see a message similar to this:
> 
> ```powershell
> │ Error: A resource with the ID "https://torntools-dev-key-vault.vault.azure.net/secrets/db-admin-password/639a93dc98804175b6fd80d929ea8a0c" already exists 
> - to be managed via Terraform this resource needs to be imported into the State. Please see the resource documentation for "azurerm_key_vault_secret" 
> for more information.
> │
> │   with azurerm_key_vault_secret.db_password,
> │   on key_vault.tf line 46, in resource "azurerm_key_vault_secret" "db_password":
> │   46: resource "azurerm_key_vault_secret" "db_password" {
> │
> ╵
> ```
>
> When this happens, take the resource ID and name from the above and run the following command:
>
> ```powershell
> terraform import -var-file="terraform.dev.tfvars" <resource_name> "<resource-id>"
> ```
>
> As an example, the command to import the above resource would be:
> 
> ```powershell
> terraform import -var-file="terraform.dev.tfvars" azurerm_key_vault_secret.db_password "https://torntools-dev-key-vault.vault.azure.net/secrets/db-admin-password/639a93dc98804175b6fd80d929ea8a0c"
> ```
>

### a. Initialize Terraform
```powershell
cd infra
terraform init -reconfigure -backend-config="backend.dev.config"   # or backend.staging.config, etc.
```

### b. Apply the Infrastructure
You can use the provided script to validate and apply everything:
```powershell
cd scripts
./deploy.ps1 -Environment dev   # or staging, prod, etc.
```
This will:
- Check your Azure login
- Initialize Terraform
- Validate your configuration
- Show you a plan of what will be created
- Apply the changes after a short pause

When finished, Terraform will output URLs for your frontend, API, and database connection string.

> ### Troubleshooting Key Vaults
>
> #### Soft-deletion
>
> If you have recently rebuilt the infrastructure you may see "Error: creating Key Vault" at this point.
> This is because Azure “soft deletes” Key Vaults by default, so when you delete a vault, it is retained in a “soft deleted” 
> state for a retention period (usually 7 or 90 days), and you cannot create a new vault with the same name until it is 
> purged.
>
> Run the following command:
> 
> ```powershell
> az keyvault purge --name torntools-<Environment>-keyvault`
> ```
> Then rerun the `deploy` script.
>
> #### 'Secrets get' Permission
>
> When you run Terraform locally, your Azure user must have permission to manage secrets in the Key Vault for your 
> environment and these are not provided by default.
> 
> If you see an error beginning with "Error: checking for presence of existing Secret..." (which will mention
> a `403 Forbidden` error), run the following:
>
> ```powershell
> cd infra/scripts
> ./grant-local-keyvault-access.ps1 -Environment dev   # or staging, prod, etc.
> ```
> This script grants your Azure user the necessary permissions to get, set, list, and delete secrets in the Key Vault.
>
> Then rerun the `deploy` script.
>
> If you are running Terraform in CI/CD (e.g., GitHub Actions), make sure the service principal used by the workflow also has the correct Key Vault access policy. 

### c. Post-deployment admin

On completion, the deploy script will print some outputs, like so:

```powershell
Outputs:

api_url = "torntools-dev-backend-api.azurewebsites.net"
postgres_connection_string = "jdbc:postgresql://torntools-dev-pgflexserver.postgres.database.azure.com:5432/torntools-dev-postgres-db?sslmode=require"
react_static_site_url = "https://torntoolsdevfrontend.z33.web.core.windows.net/"
```

If you wish, you can make a note of these and store them in a text file for future
reference. If you lose them, don’t worry — you can regenerate them using the command
below.

```powershell
cd infra
terraform output -json
```

---

## 6. Destroying Infrastructure

To remove everything (be careful!):
```powershell
cd infra/scripts
./destroy.ps1
```
You'll be asked to confirm before anything is deleted.

---

## 7. CI/CD Setup (GitHub Actions)

To automate deployments from GitHub, create a GitHub secret named `AZURE_CREDENTIALS` in your repository settings (under **Secrets and variables > Actions**) and for the value simply copy in the contents of `github_sp_credentials.json`.

### a. Setting up a new environment

**Important:** `terraform.<Environment>.tfvars` should NEVER be commited to
source control. These may contain secrets or sensitive information.

As the `*.tfvars` file(s) won't exist in Git, we use GitHub's built-in secret handling.

Most of the values are available in the `terraform.<Environment>.tfvars` files by this point, but for completeness:

- Create a new Environment in GitHub with a name you recognise (Settings -> Environments)
  - For example, 'Test', 'Staging', 'Production', etc.
- Go to Settings -> Secrets and variables -> Actions
- Create the Environment secrets for your new environment
  - AZURE_CLIENT_ID
  - AZURE_CLIENT_SECRET
  - AZURE_SUBSCRIPTION_ID
  - AZURE_TENANT_ID
  - DB_USER
  - TF_VAR_DB_ADMIN_PASSWORD
  - TF_VAR_GITHUB_ACTIONS_OBJECT_ID
  - TF_VAR_GITHUB_ACTIONS_TENANT_ID
- Populate the AZURE_... secrets with the corresponding values from the `github_sp_credentials.json` file you created in step 4.
- Populate DB_USER with `pgadmin`
- Populate TF_VAR_DB_ADMIN_PASSWORD with the password you chose earlier
- Populate TF_VAR_GITHUB_ACTIONS_OBJECT_ID with the value from `terraform.<env>.tfvars`
- Populate TF_VAR_GITHUB_ACTIONS_TENANT_ID with the value from `terraform.<env>.tfvars`
- Run the 'Deploy Full Stack' pipeline

### b. Configure the GitHub Workflow

A workflow file (`.github/workflows/deploy-infra.yml`) is already set up to:
- Authenticate to Azure using your secret
- Run `terraform init`, `plan`, and `apply` on pushes to the `main` branch or on demand

If you want to run the workflow manually, make sure you **select the GitHub environment name at workflow dispatch:**.

You don't need to change this unless you want to customize the automation.

---

## 8. Optional: Key Vault and Remote State Access

### a. Key Vault Access
If you get errors about accessing secrets, run:

```powershell
cd infra/scripts
./bootstrap.ps1
```

This grants your currently logged-in Azure identity the necessary permissions to
manage secrets in the Key Vault. If using multiple Azure accounts, double-check which one is active with `az account show`.

### b. Remote State Access

To access the Terraform state blob from your local CLI:

```powershell
cd infra/scripts
./bootstrap-remote-state.ps1
```

This script will automatically read the correct storage account name and resource group from `backend.dev.config` (created by the backend bootstrap step). You do not need to set these values in `.env`.

This grants your user access to the storage account holding the Terraform state.

---

## 9. Reference

### a. Infrastructure Directory Structure

```
infra/
├── scripts/                    # Helper scripts for setup and automation
├── *.tf                        # Terraform configuration files
├── terraform.*.tfvars          # Your environment variables for the dev, staging, prod, etc. environments
├── github_sp_credentials.json  # Service principal credentials (do not commit)
├── .terraform.lock.hcl         # Provider lock file
└── README.md                   # This file
```

### b. Variables

See `variables.tf` for all available variables and their descriptions.

### c. Security

- Never commit `github_sp_credentials.json` or secrets to source control
- Use Key Vault for secret management
- Rotate secrets regularly (especially SP credentials and Key Vault secrets)

### d. Troubleshooting

- If you get permission errors, check your Azure login and service principal setup
- If you're stuck, ask an Azure admin for help or refer to the [official Microsoft docs on service principals](https://learn.microsoft.com/en-us/azure/active-directory/develop/howto-create-service-principal-portal)

