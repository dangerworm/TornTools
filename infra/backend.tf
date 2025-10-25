terraform {
  backend "azurerm" {
    resource_group_name  = ""
    storage_account_name = ""
    container_name       = "tfstate"
    key                  = "terraform.tfstate"
    # Set values via -backend-config=backend.<Environment>.config when running terraform init
  }
}