terraform {
  backend "azurerm" {
    resource_group_name  = "torntools-state-rg"
    storage_account_name = "torntoolsstoretfstate"
    container_name       = "tfstate-dev"
    key                  = "terraform.tfstate"
    # Set values via -backend-config=backend.<Environment>.config when running terraform init
  }
}