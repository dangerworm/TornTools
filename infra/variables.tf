variable "custom_domains_enabled" {
  description = "Whether custom domains are attached. Requires DNS CNAMEs to be in place first."
  type        = bool
  default     = false
}

variable "frontend_hostname" {
  description = "Custom hostname for the frontend (e.g. torntools.dangerworm.dev)"
  type        = string
  default     = "torntools.dangerworm.dev"
}

variable "api_hostname" {
  description = "Custom hostname for the API (e.g. api.torntools.dangerworm.dev)"
  type        = string
  default     = "api.torntools.dangerworm.dev"
}

variable "jwt_secret" {
  description = "Secret used to sign JWTs issued to authenticated users"
  type        = string
  sensitive   = true
}

variable "torn_key_encryption_key_v1" {
  description = "Base64-encoded 32-byte AES key (v1) used to encrypt stored Torn API keys at rest. Generate with `openssl rand -base64 32`."
  type        = string
  sensitive   = true
}

variable "torn_key_encryption_current_version" {
  description = "Version of the Torn API key encryption key to use for new writes. Increment after adding a new torn_key_encryption_key_vN variable."
  type        = string
  default     = "1"
}

variable "app_name" {
  description = "Name of the application"
  type        = string
}

variable "app_service_outbound_ips" {
  description = "List of outbound IPs for the App Service"
  type        = list(string)
}

variable "db_admin_password" {
  description = "Admin password for PostgreSQL"
  type        = string
  sensitive   = true
}

variable "developer_ip" {
  description = "Developer's public IP address for local DB access"
  type        = string
}

variable "enable_local_user_access" {
  description = "Whether to grant Key Vault access to the local user"
  type        = bool
  default     = false
}

variable "environment" {
  description = "Deployment environment (e.g., dev, staging, prod)"
  type        = string
}

variable "github_actions_object_id" {
  description = "Object ID for the GitHub Actions service principal"
  type        = string
}

variable "github_actions_tenant_id" {
  description = "Tenant ID for the GitHub Actions service principal"
  type        = string
}

variable "local_user_object_id" {
  description = "Object ID of the local developer's Azure AD identity"
  type        = string
  default     = "" # override in .tfvars if needed
}

variable "local_user_tenant_id" {
  description = "Tenant ID of the local developer's Azure AD identity"
  type        = string
  default     = "" # override in .tfvars if needed
}

variable "location" {
  description = "Azure region for resource deployment"
  default     = "UK South"
}

variable "sku_app_service" {
  description = "SKU for App Service Plan (e.g., B1, S1)"
  type        = string
  default     = "B1"
}

variable "sku_postgres" {
  description = "SKU for PostgreSQL Flexible Server (e.g., B_Standard_B1ms)"
  type        = string
  default     = "B_Standard_B1ms"
}

variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
}

variable "tfstate_storage_account_name" {
  description = "Storage account name for Terraform state"
  type        = string
}

locals {
  api_url             = "${var.app_name}-${var.environment}-backend-api.azurewebsites.net"
  resource_group_name = "${var.app_name}-webapp-${var.environment}-rg"
}