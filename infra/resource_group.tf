resource "azurerm_resource_group" "torntools_webapp_rg" { 
  name     = local.resource_group_name
  location = "UK South"
  
  tags = {
    environment = "dev"
    project     = "${var.app_name}"
  }
}