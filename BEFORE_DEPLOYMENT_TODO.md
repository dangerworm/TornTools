# Before deploying `feature/jewelry-shoplift-watcher`

Pre-flight checklist for the Jewelry Shoplifting Watcher feature + Key Vault removal.

## 1. Sanity-check the watcher's availability rule

The watcher fires when every entry under `jewelry_store` in
`https://api.torn.com/torn/?selections=shoplifting&key=<public key>` has
`disabled: true`. That assumes:

- `disabled: true` means the camera/guard is **gone** (i.e., merit available)
- All entries (cameras + guard) need to be `disabled: true` simultaneously

Before enabling in prod, hit the endpoint manually a couple of times and
correlate against the in-game state. If the semantics turn out to be
inverted, the watcher will fire constantly except during the merit window.

## 2. Discord prep

- [ ] Webhook created in the target channel — copy the URL
- [ ] (Optional) Role ID for the mention — enable Developer Mode in Discord,
      right-click the role, "Copy Role ID"

## 3. Torn API key

- [ ] Obtain a public-access Torn API key. Any user can generate one at
      <https://www.torn.com/preferences.php#tab=api>. The watcher only hits
      a public-data endpoint, so a minimal-access key is fine. No encryption
      pipeline involved — it's set as a plain `TF_VAR_*` and lands in App
      Service `app_settings`.

## 4. GitHub Actions secrets

### Add

| Secret name                                       | Value                          |
| ------------------------------------------------- | ------------------------------ |
| `TF_VAR_SHOPLIFT_WATCHER_ENABLED`                 | `true` (or `false` to defer)   |
| `TF_VAR_SHOPLIFT_WATCHER_PUBLIC_API_KEY`          | The Torn public key from §3    |
| `TF_VAR_SHOPLIFT_WATCHER_DISCORD_WEBHOOK_URL`     | The webhook URL from §2        |
| `TF_VAR_SHOPLIFT_WATCHER_MENTION_ROLE_ID`         | The role ID from §2 (optional) |

### Delete (no longer referenced after this branch)

- [ ] `TF_VAR_GITHUB_ACTIONS_OBJECT_ID`
- [ ] `TF_VAR_GITHUB_ACTIONS_TENANT_ID`

## 5. Branch hygiene

- [ ] Rebase `feature/jewelry-shoplift-watcher` onto the latest
      `origin/development` (the branch was cut from a local HEAD that was
      2 commits behind)
- [ ] Open PR, get CI green

## 6. Read the `terraform plan` output before approving apply

This change destroys the Key Vault. Expected destroys (and **only** these):

- `azurerm_key_vault.torntools_keyvault`
- `azurerm_key_vault_secret.api_base_url`
- `azurerm_key_vault_secret.db_password`
- `azurerm_key_vault_secret.torn_key_encryption_v1`
- `azurerm_key_vault_access_policy.github_actions_user`
- `azurerm_key_vault_access_policy.local_user` (if `enable_local_user_access` was true)

If the plan tries to destroy or replace `azurerm_postgresql_flexible_server.db_server`,
**stop**. The `administrator_password` source changed expression
(`azurerm_key_vault_secret.db_password.value` → `var.db_admin_password`)
but the resolved value is identical, so Terraform should report no change.
A replacement attempt means something else is wrong — investigate before
approving.

If the plan tries to destroy/replace `azurerm_linux_web_app.backend_api`,
also stop and investigate. The connection-string substitution is the same
no-op pattern as above.

## 7. Key Vault aftermath

The vault has `purge_protection_enabled = true`. After apply:

- The vault soft-deletes; the name `torntools-dev-key-vault` is reserved for
  ~90 days.
- If you ever want a vault back at the same name within that window:
  `az keyvault purge --name torntools-dev-key-vault`.
- Otherwise, ignore — no further action needed.

## 8. Post-deploy verification

- [ ] Tail the App Service logs and confirm the line:
      `JewelryShopliftingWatcher starting with poll interval 00:00:30.`
      (If `Enabled=false` you'll see `... is disabled. Not polling.` instead.)
- [ ] If the store is currently unguarded at boot, you should get a Discord
      ping with the "watcher just restarted" caveat within 30 seconds.
- [ ] Wait for at least one organic `false → true` transition (within a
      few hours) and confirm the ping fires without the caveat.
- [ ] If the webhook fails, the App Service logs will surface the exception
      with `Discord webhook POST failed`. State is still updated, so the
      next transition won't double-ping the missed window.

## 9. Disable / kill switch

If something goes wrong in prod, you have two options without redeploying
code:

1. Set `TF_VAR_SHOPLIFT_WATCHER_ENABLED` to `false` in GitHub Actions secrets
   and re-run the deploy workflow (Web App restarts; watcher stops polling).
2. `az webapp config appsettings set --name torntools-dev-back-end-api
   --resource-group torntools-webapp-dev-rg --settings ShopliftWatcher__Enabled=false`
   for an immediate kill (will be overwritten by the next `terraform apply`).

## 10. Delete this file once deployed

Once the watcher is live and verified, this file has done its job — `git rm`
it as part of the post-deploy cleanup.
