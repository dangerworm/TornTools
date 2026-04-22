# Torn API quick reference

Torn API v2 base: `https://api.torn.com/v2`. Authentication header on every call:
`Authorization: ApiKey <key>`. We always pass `comment=dangerworm's Tools` so requests are
attributable in user logs.

Full Swagger UI: <https://www.torn.com/swagger.php> (interactive, requires a browser session).

## Endpoints we use

| Endpoint                                              | Min access | Where it's called from                                                            | Notes                                                                                                                                                                                         |
| ----------------------------------------------------- | ---------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /v2/key/info`                                    | Public     | `client/src/lib/tornapi.ts::fetchTornKeyInfo`, backend `AuthController.Login`     | Returns `info.access.level` (1=Public, 2=Minimal, 3=Limited, 4=Full), `info.access.type`, and the `selections` granted.                                                                       |
| `GET /v2/user/basic`                                  | Public     | `client/src/lib/tornapi.ts::fetchTornUserDetails`, backend `AuthController.Login` | Profile: id, name, level, gender, status.                                                                                                                                                     |
| `GET /v2/user/inventory?cat=<cat>&offset=0&limit=250` | Minimal    | `client/src/lib/tornapi.ts::fetchTornInventory` (Bazaar Price Lookup page)        | Per-category inventory. `cat` accepts canonical Torn values (see `client/src/constants/bazaarCategories.ts` for label→cat map). 250-row cap; pagination via `_metadata.links.next` if needed. |

## Access levels

| Level | Type    | Notes                                                                                                                              |
| ----- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Public  | The default. No personal data, but enough for site features that just need a key in the rotation pool.                             |
| 2     | Minimal | Adds personal selections like `inventory`, `bazaar`, `bars`, `cooldowns`. Required for Bazaar Price Lookup.                        |
| 3     | Limited | Superset of Minimal; everything we currently do still works.                                                                       |
| 4     | Full    | Superset of Limited. We don't currently use anything Full-only.                                                                    |
| -     | Custom  | Bespoke per-selection keys. Currently rejected by `fetchTornKeyInfo` because we have no way to know which selections were enabled. |

## Bazaar inventory categories

Torn's bazaar UI uses display labels (e.g. "Drugs", "Plushies", "Armor") that don't match the API's
canonical `cat` values (e.g. "Drug", "Plushie", "Defensive"). The mapping lives in
`client/src/constants/bazaarCategories.ts`. The two values that don't pluralise/identity-map:

- "Armor" (chip) → `Defensive` (cat)
- "Miscellaneous" (chip) → `Other` (cat)

Greyed-out in Torn's UI and not exposed in our chip strip: `Collectible`, `Book`.

## Rate limiting

- Per-key cap: 100 calls/min (Torn API ToS).
- Server-side, the queue processor stays at 80% of the per-key budget × `keyCount`.
- Frontend calls (signin preview, Bazaar Price Lookup) hit Torn directly with the user's own key;
  they consume the user's own quota, not the pool's.
