resource "azurerm_log_analytics_workspace" "torntools_log_analytics_workspace" { 
  name                = "${var.app_name}-${var.environment}-law"
  location            = azurerm_resource_group.torntools_webapp_rg.location
  resource_group_name = azurerm_resource_group.torntools_webapp_rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = {
    environment = var.environment
    project     = "${var.app_name}"
  }
} 
