locals {
  storage_web_hostname = trimprefix(trimsuffix(azurerm_storage_account.frontend_sa.primary_web_endpoint, "/"), "https://")
}

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

resource "azurerm_cdn_profile" "frontend_cdn" {
  name                = "${var.app_name}-${var.environment}-cdn"
  resource_group_name = azurerm_resource_group.torntools_webapp_rg.name
  location            = azurerm_resource_group.torntools_webapp_rg.location
  sku                 = "Standard_Microsoft"

  tags = {
    environment = var.environment
    project     = var.app_name
  }
}

resource "azurerm_cdn_endpoint" "frontend_cdn_endpoint" {
  name                = "${var.app_name}-${var.environment}-frontend"
  profile_name        = azurerm_cdn_profile.frontend_cdn.name
  resource_group_name = azurerm_resource_group.torntools_webapp_rg.name
  location            = azurerm_resource_group.torntools_webapp_rg.location

  origin_host_header = local.storage_web_hostname

  origin {
    name      = "frontend-storage"
    host_name = local.storage_web_hostname
  }

  tags = {
    environment = var.environment
    project     = var.app_name
  }
}

resource "azurerm_cdn_endpoint_custom_domain" "frontend_custom_domain" {
  count           = var.custom_domains_enabled ? 1 : 0
  name            = "frontend-custom-domain"
  cdn_endpoint_id = azurerm_cdn_endpoint.frontend_cdn_endpoint.id
  host_name       = var.frontend_hostname

  cdn_managed_https {
    certificate_type = "Dedicated"
    protocol_type    = "ServerNameIndication"
    tls_version      = "TLS12"
  }
}
