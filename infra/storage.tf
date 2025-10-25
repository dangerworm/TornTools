resource "azurerm_storage_account" "frontend_sa" { 
  name                     = "${var.app_name}${var.environment}frontendsa"
  resource_group_name      = azurerm_resource_group.torntools_webapp_rg.name
  location                 = azurerm_resource_group.torntools_webapp_rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = {
    environment = var.environment
    project     = "${var.app_name}"
  }
}

resource "azurerm_storage_account_static_website" "frontend_sasw" {
  storage_account_id = azurerm_storage_account.frontend_sa.id
  index_document     = "index.html"
  error_404_document = "index.html"
}
