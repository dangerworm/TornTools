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

resource "azurerm_cdn_frontdoor_profile" "frontend_afd" {
  name                = "${var.app_name}-${var.environment}-afd"
  resource_group_name = azurerm_resource_group.torntools_webapp_rg.name
  sku_name            = "Standard_AzureFrontDoor"

  tags = {
    environment = var.environment
    project     = var.app_name
  }
}

resource "azurerm_cdn_frontdoor_endpoint" "frontend_afd_endpoint" {
  name                     = "${var.app_name}-${var.environment}-frontend"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.frontend_afd.id

  tags = {
    environment = var.environment
    project     = var.app_name
  }
}

resource "azurerm_cdn_frontdoor_origin_group" "frontend_origin_group" {
  name                     = "frontend-origin-group"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.frontend_afd.id

  load_balancing {}
}

resource "azurerm_cdn_frontdoor_origin" "frontend_origin" {
  name                          = "frontend-storage"
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.frontend_origin_group.id
  enabled                       = true

  certificate_name_check_enabled = true
  host_name                      = local.storage_web_hostname
  origin_host_header             = local.storage_web_hostname
  https_port                     = 443
  http_port                      = 80
}

resource "azurerm_cdn_frontdoor_route" "frontend_route" {
  name                          = "frontend-route"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.frontend_afd_endpoint.id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.frontend_origin_group.id
  cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.frontend_origin.id]

  supported_protocols    = ["Http", "Https"]
  patterns_to_match      = ["/*"]
  forwarding_protocol    = "HttpsOnly"
  https_redirect_enabled = true
  link_to_default_domain = true

  cdn_frontdoor_custom_domain_ids = var.custom_domains_enabled ? [azurerm_cdn_frontdoor_custom_domain.frontend_custom_domain[0].id] : []
}

resource "azurerm_cdn_frontdoor_custom_domain" "frontend_custom_domain" {
  count                    = var.custom_domains_enabled ? 1 : 0
  name                     = "torntools-dangerworm-dev-d11a"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.frontend_afd.id
  host_name                = var.frontend_hostname

  tls {
    certificate_type = "ManagedCertificate"
  }
}

resource "azurerm_cdn_frontdoor_custom_domain_association" "frontend_domain_association" {
  count                          = var.custom_domains_enabled ? 1 : 0
  cdn_frontdoor_custom_domain_id = azurerm_cdn_frontdoor_custom_domain.frontend_custom_domain[0].id
  cdn_frontdoor_route_ids        = [azurerm_cdn_frontdoor_route.frontend_route.id]
}
