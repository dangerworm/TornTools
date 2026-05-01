resource "azurerm_postgresql_flexible_server" "db_server" {
  name                   = "${var.app_name}-${var.environment}-pgflex"
  resource_group_name    = azurerm_resource_group.torntools_webapp_rg.name
  location               = azurerm_resource_group.torntools_webapp_rg.location
  administrator_login    = "pgadmin"
  administrator_password = var.db_admin_password
  sku_name               = var.sku_postgres
  storage_mb             = 32768
  version                = "17"
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

resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_developer_ip" {
  name             = "AllowDeveloperIP"
  server_id        = azurerm_postgresql_flexible_server.db_server.id
  start_ip_address = var.developer_ip
  end_ip_address   = var.developer_ip
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_app_service_ips" {
  for_each         = toset(var.app_service_outbound_ips)
  name             = "AllowAppService-${replace(each.value, ".", "-")}"
  server_id        = azurerm_postgresql_flexible_server.db_server.id
  start_ip_address = each.value
  end_ip_address   = each.value
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

