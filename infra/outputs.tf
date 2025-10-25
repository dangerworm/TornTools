output "react_static_site_url" {
  description = "URL for the React frontend static website"
  value       = azurerm_storage_account.frontend_sa.primary_web_endpoint
}

output "api_url" {
  description = "URL for the deployed C# API"
  value       = "https://${azurerm_linux_web_app.backend_api.default_hostname}"
}

output "postgres_connection_string" {
  description = "Connection string for the Postgres database"
  value       = "jdbc:postgresql://${azurerm_postgresql_flexible_server.db_server.fqdn}:5432/${azurerm_postgresql_flexible_server_database.postgres_db.name}?sslmode=require"
}

