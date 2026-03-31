# These import blocks bring existing Azure resources into Terraform state.
# Once successfully applied they can be removed, but leaving them in is harmless.

import {
  to = azurerm_app_service_custom_hostname_binding.api_custom_hostname[0]
  id = "/subscriptions/0c5fdc8a-f4a3-42f1-bf05-51750ca69db6/resourceGroups/torntools-webapp-dev-rg/providers/Microsoft.Web/sites/torntools-dev-back-end-api/hostNameBindings/api.torntools.dangerworm.dev"
}

import {
  to = azurerm_cdn_frontdoor_custom_domain.frontend_custom_domain[0]
  id = "/subscriptions/0c5fdc8a-f4a3-42f1-bf05-51750ca69db6/resourceGroups/torntools-webapp-dev-rg/providers/Microsoft.Cdn/profiles/torntools-dev-afd/customDomains/torntools-dangerworm-dev-d11a"
}
