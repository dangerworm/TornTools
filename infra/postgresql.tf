resource "azurerm_postgresql_flexible_server" "db_server" {
  name                   = "${var.app_name}-${var.environment}-pgflexserver"
  resource_group_name    = azurerm_resource_group.torntools_webapp_rg.name
  location               = azurerm_resource_group.torntools_webapp_rg.location
  administrator_login    = "pgadmin"
  administrator_password = azurerm_key_vault_secret.db_password.value
  sku_name               = var.sku_postgres
  storage_mb             = 32768
  version                = "14"
  zone                   = "1"

  authentication {
    active_directory_auth_enabled = false
    password_auth_enabled         = true
  }
}

resource "azurerm_postgresql_flexible_server_database" "postgres_db" { 
  name      = "${var.app_name}-${var.environment}-postgres-db"
  server_id = azurerm_postgresql_flexible_server.db_server.id
  collation = "en_US.utf8"
  charset   = "UTF8"
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.db_server.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

resource "azurerm_monitor_diagnostic_setting" "pg_diagnostic" {
  name                       = "${var.app_name}-${var.environment}-pg-diag"
  target_resource_id         = azurerm_postgresql_flexible_server.db_server.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.torntools_log_analytics_workspace.id

  enabled_log {
    category = "PostgreSQLLogs"
  }
  enabled_metric {
    category = "AllMetrics"
  }
}

