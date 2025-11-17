resource "azurerm_resource_group" "torntools_webapp_rg" { 
  name     = local.resource_group_name
  location = "${var.location}"
  
  tags = {
    environment = "${var.environment}"
    project     = "${var.app_name}"
  }
}