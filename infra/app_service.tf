resource "azurerm_service_plan" "backend_plan" {
  name                = "${var.app_name}-${var.environment}-plan-back-end"
  location            = azurerm_resource_group.torntools_webapp_rg.location
  resource_group_name = azurerm_resource_group.torntools_webapp_rg.name
  os_type             = "Linux"
  sku_name            = var.sku_app_service
}

resource "azurerm_linux_web_app" "backend_api" {
  name                = "${var.app_name}-${var.environment}-back-end-api"
  resource_group_name = azurerm_resource_group.torntools_webapp_rg.name
  location            = azurerm_resource_group.torntools_webapp_rg.location
  service_plan_id     = azurerm_service_plan.backend_plan.id

  site_config {
    always_on = true
    application_stack {
      dotnet_version = "9.0"
    }
  }

  app_settings = {
    ASPNETCORE_ENVIRONMENT = lookup(
      {
        prod    = "Production"
        staging = "Staging"
        test    = "Test"
        dev     = "Development"
      },
      var.environment,
      "Development"
    )
    "ConnectionStrings__PostgresConnection"       = "Host=${azurerm_postgresql_flexible_server.db_server.fqdn};Database=${azurerm_postgresql_flexible_server_database.postgres_db.name};Username=${azurerm_postgresql_flexible_server.db_server.administrator_login};Password=${azurerm_key_vault_secret.db_password.value};Ssl Mode=Require"
    "EnvironmentConfiguration__EnvironmentName"   = "${var.environment}"
    "EnvironmentConfiguration__PopulateQueue"     = "true"
    "EnvironmentConfiguration__RunQueueProcessor" = "true"
    "CorsAllowedOrigins"                          = trimsuffix(azurerm_storage_account.frontend_sa.primary_web_endpoint, "/")
    "JwtConfiguration__Secret"                    = var.jwt_secret
  }

  depends_on = [azurerm_service_plan.backend_plan]
}
