data "azurerm_client_config" "current" {}

resource "azurerm_key_vault_access_policy" "github_actions_user" {
  key_vault_id = azurerm_key_vault.torntools_keyvault.id
  tenant_id    = var.github_actions_tenant_id
  object_id    = var.github_actions_object_id

  key_permissions = [
    "Get", "List"
  ]

  secret_permissions = [
    "Get", "List", "Purge", "Set", "Delete"
  ]
}

# Optional local developer access policy (only applied if enabled)
resource "azurerm_key_vault_access_policy" "local_user" {
  count        = var.enable_local_user_access ? 1 : 0
  key_vault_id = azurerm_key_vault.torntools_keyvault.id
  tenant_id    = var.local_user_tenant_id
  object_id    = var.local_user_object_id

  key_permissions = [
    "Get", "List"
  ]

  secret_permissions = [
    "Get", "List", "Purge", "Set", "Delete"
  ]
}

resource "azurerm_key_vault" "torntools_keyvault" {
  name                     = "${var.app_name}-${var.environment}-key-vault"
  location                 = var.location
  resource_group_name      = local.resource_group_name
  tenant_id                = data.azurerm_client_config.current.tenant_id
  sku_name                 = "standard"
  purge_protection_enabled = false

  tags = {
    environment = var.environment
    project     = "${var.app_name}"
  }
}

resource "azurerm_key_vault_secret" "api_base_url" {
  name         = "react-app-api-base-url"
  value        = local.api_url
  key_vault_id = azurerm_key_vault.torntools_keyvault.id

  depends_on = [
    azurerm_key_vault_access_policy.github_actions_user,
    azurerm_key_vault_access_policy.local_user
  ]
}

resource "azurerm_key_vault_secret" "db_password" {
  name         = "db-admin-password"
  value        = var.db_admin_password
  key_vault_id = azurerm_key_vault.torntools_keyvault.id

  depends_on = [
    azurerm_key_vault_access_policy.github_actions_user,
    azurerm_key_vault_access_policy.local_user
  ]
}
