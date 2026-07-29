terraform {
  # Pin the provider and commit .terraform.lock.hcl so CI resolves the same
  # azurerm version every run. Previously the lock file was gitignored, so each
  # CI `terraform init` re-resolved to the latest release — a drift that broke a
  # deploy when a newer azurerm made azurerm_key_vault.rbac_authorization_enabled
  # required. Bump this constraint deliberately, then re-run `terraform init
  # -upgrade` locally and commit the updated lock.
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "torntools-state-rg"
    storage_account_name = "torntoolsstoretfstate"
    container_name       = "tfstate-dev"
    key                  = "terraform.tfstate"
    # Set values via -backend-config=backend.<Environment>.config when running terraform init
  }
}