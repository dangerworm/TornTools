# Session Handoff — 2026-04-22

## What we did this session

Built the **Bazaar Price Lookup** page end-to-end, plus the supporting access-level changes and a
site-wide privacy footer. All planned steps are complete and verified at the build level. Nothing is
committed yet — the diff is sitting on `development` ready for Drew to review and ship.

### Feature: Bazaar Price Lookup (`/bazaar-prices`)

New page that lists each item in the user's Torn inventory, per category, alongside the current
lowest Weav3r bazaar price (via the existing `GET /api/GetBazaarSummaries`). Workflow: pick a
category chip → page lazy-fetches `/v2/user/inventory?cat=<canonical>` for that category → joins
against `useItems` for image/links and `useBazaarSummaries` for the cheapest price → click the price
to copy it to the clipboard.

- Single-select chip strip in the order Drew specified (Primary → Miscellaneous, 23 chips).
- Chip-label → Torn-cat translation lives in `client/src/constants/bazaarCategories.ts` (e.g.
  Drugs→Drug, Armor→Defensive, Miscellaneous→Other).
- Equipped and faction-owned items excluded; same-id rows aggregated and quantities summed (Drew's
  example showed dup uids per id like Glock 17 ×2, Skorpion ×2).
- "No bazaar data" fallback for items the queue hasn't scanned recently.
- Per-category fetch results cached in component state.

### Sign-in changes

- `fetchTornKeyInfo` (`client/src/lib/tornapi.ts:99`) now accepts levels 1–4 instead of rejecting
  anything above Public. Custom keys still rejected.
- `AuthController.Login` reads `keyPayload.Info.Access.Level` and persists it via the new
  `UserDetailsInputModel.AccessLevel` field through `UpsertUserDetailsAsync`. Updated on every login
  so a key upgrade refreshes the stored level.
- `/auth/me` returns `accessLevel`.

### Privacy notice + footer

- Extracted the access-key copy from `SignIn.tsx` into reusable
  `client/src/components/PrivacyNotice.tsx` with an added "Choosing your key access level" section
  explaining the Public-vs-Minimal+ trade-off.
- `Footer.tsx` now renders a "Privacy & API key usage" link that opens `PrivacyNotice` in a Dialog
  (visible on every page).
- `SignIn.tsx` uses `<PrivacyNotice />` instead of the inline block.

### Schema

- `.docker/flyway/sql/Versioned/V1.16__add_access_level_to_users.sql` —
  `ALTER TABLE public.users ADD "access_level" int4 NOT NULL DEFAULT 1;`
- `UserEntity` (`api/TornTools.Persistence/Entities/UserEntity.cs:36-37`) gets `AccessLevel` with
  default 1; mirrored on `UserDto`, `UserDetailsInputModel`, and the front-end `DotNetUserDetails`.

### Nav gating

- `MenuItem` (`client/src/components/Menu.tsx`) gets optional `requiresAccessLevel: number`.
- `Layout.tsx` filters out menu items where the user's `accessLevel` is below the threshold.
- The new Bazaar Price Lookup entry has `requiresAccessLevel: 2`.

### Docs

- New `context/torn-api.md` — endpoints we use, access levels, category map, rate limits, link to
  Swagger UI.
- `CLAUDE.md` — pointer added immediately after the `<!-- gitnexus:end -->` marker so it survives
  `npx gitnexus analyze`.

---

## Files changed (uncommitted)

**New:**

- `.docker/flyway/sql/Versioned/V1.16__add_access_level_to_users.sql`
- `client/src/components/PrivacyNotice.tsx`
- `client/src/constants/bazaarCategories.ts`
- `client/src/pages/BazaarPriceLookup.tsx`
- `context/torn-api.md`

**Modified:**

- `api/TornTools.Api/Controllers/AuthController.cs`
- `api/TornTools.Application/Services/DatabaseService.cs`
- `api/TornTools.Core/DataTransferObjects/UserDto.cs`
- `api/TornTools.Core/Models/InputModels/UserDetailsInputModel.cs`
- `api/TornTools.Persistence/Entities/UserEntity.cs`
- `api/TornTools.Persistence/Repositories/UserRepository.cs`
- `client/src/App.tsx`
- `client/src/components/Footer.tsx`
- `client/src/components/Layout.tsx`
- `client/src/components/Menu.tsx`
- `client/src/lib/dotnetapi.ts`
- `client/src/lib/tornapi.ts`
- `client/src/pages/SignIn.tsx`
- `CLAUDE.md`

**Pre-existing modifications carried over from before this session:**

- `TODO.md` (M)
- `AGENTS.md` (M — gitnexus auto-managed block change)
- `context/insights.md` (D)

---

## Build state

- `dotnet build` (api/) — clean: 6 projects, 0 errors, 0 warnings.
- `npm run build` (client/) — clean: `tsc -b` + `vite build` both succeed. Pre-existing
  > 500 kB chunk-size warning is unchanged.

---

## Blockers / outstanding

1. **Migration not applied to dev DB.** `V1.16__add_access_level_to_users.sql` needs Drew to run
   Flyway against the dev Postgres. Without it, `AuthController.Login` will fail to upsert (the
   `access_level` column won't exist).
2. **No manual smoke test yet.** Build passes but the feature has not been exercised in a browser.
   Test plan: sign in with each of Drew's three keys (Public `89x3jeDB3cK0NLOf`, Minimal
   `0xmvOGNnfTBlSFdj`, Limited `GDRPEXeEqJLE8FzD`); verify nav-entry gating; click each populated
   chip; verify lowest prices match `/item/:id` for a few samples; try click-to-copy; confirm the
   privacy dialog opens from the footer on at least three pages.
3. **Nothing committed.** Drew may want to split into smaller commits (e.g. backend access-level
   plumbing / privacy footer / new page) or one big feature commit.

---

## Next action

1. Apply the migration: `flyway migrate` (or however dev DB migrations are run for this project) so
   `users.access_level` exists.
2. Start dev servers: api + client. Verify the smoke test list above.
3. Commit (Drew's call on shape of commits — current diff is one cohesive feature so a single commit
   is reasonable; backend/frontend split is the next-finest grain).
4. After committing, run `npx gitnexus analyze --embeddings` to refresh the index (a hook should
   handle this automatically per CLAUDE.md, but worth confirming).

---

## Notes

- The Torn `/v2/user/inventory` endpoint requires Minimal access — we discovered this mid-session
  and added the access-level plumbing as a result. Public keys cannot use the new page; they hit the
  access-level guard explainer instead and the nav entry is hidden.
- The category mapping in `bazaarCategories.ts` is hand-derived from Drew's screenshots of Torn's
  Swagger dropdown. If Torn ever adds a new category, add a new entry to that array.
- Pagination on `/v2/user/inventory` deferred — 250 cap should cover any realistic single-category
  inventory. Add `_metadata.links.next` paging if any category overflows.
- "All" chip intentionally omitted in v1 — would require firing 23 parallel calls. Add later if Drew
  wants it.
- The Layout nav filter uses `dotNetUserDetails != null` to gate on access level, so the entry
  doesn't flicker in for unauthenticated users while `getMe()` resolves.
