output "react_static_site_url" {
  description = "URL for the React frontend static website"
  value       = var.custom_domains_enabled ? "https://${var.frontend_hostname}" : azurerm_storage_account.frontend_sa.primary_web_endpoint
}

output "api_url" {
  description = "URL for the deployed C# API"
  value       = var.custom_domains_enabled ? "https://${var.api_hostname}" : "https://${azurerm_linux_web_app.backend_api.default_hostname}"
}

output "cdn_endpoint_hostname" {
  description = "Front Door endpoint hostname - use as CNAME target for torntools.dangerworm.dev"
  value       = azurerm_cdn_frontdoor_endpoint.frontend_afd_endpoint.host_name
}

output "app_service_domain_verification_id" {
  description = "App Service domain verification ID - use as TXT record value for asuid.api.torntools.dangerworm.dev"
  value       = azurerm_linux_web_app.backend_api.custom_domain_verification_id
  sensitive   = true
}

output "postgres_connection_string" {
  description = "Connection string for the Postgres database"
  value       = "jdbc:postgresql://${azurerm_postgresql_flexible_server.db_server.fqdn}:5432/${azurerm_postgresql_flexible_server_database.postgres_db.name}?sslmode=require"
}
