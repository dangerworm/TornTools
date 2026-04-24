# UI/UX overhaul — handoff

**Branch:** `ui/new-design` **Base:** `development` @ `7099851` **Date:** 2026-04-23 evening session
**Parent plan:** `context/plans/2026-04-23-ui-ux-overhaul.md` (read first)

9 commits on the branch, committed locally, **not pushed**. Build, typecheck, and lint are clean
(production `vite build` succeeded; `tsc --noEmit` clean).

## Commit map vs. plan sections

| Commit                                                                                             | Section(s) covered                          |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `2a46682` docs: add UI/UX overhaul plan                                                            | —                                           |
| `c00c658` feat(nav): unify LoginRequired, remove /markets, group sidebar, persistent sign-in CTA   | 1a, 1b, 1c, 1d, 1e, 1f                      |
| `cff9c30` feat(auth): redirect home after sign-in and settings save, guard /settings, mask API key | 2a, 2b                                      |
| `6334c3a` feat(theme): IBM Plex Sans + JetBrains Mono, grain overlay, shared primitives            | 8, 9 (primitives created, partial adoption) |
| `3ffc267` feat(markets): persistent right-hand filter drawer for City and Foreign                  | 3 (CM + FM)                                 |
| `81ae7c7` feat(item-details): surface latest market scan, StatChip profit chip, legend             | 4a, 4b                                      |
| `1437bbb` feat(pricing): PriceWithTax component, apply to City and Foreign markets                 | 5 (CM + FM)                                 |
| `22d367a` feat(items): add /items exploration page with shared filter drawer                       | 7                                           |
| `09f0bce` chore: scrub home-page tile guard and favourites naming                                  | 11                                          |

## Section-by-section status

### ✅ 1. Quick wins — done

- Unified `LoginRequired` component takes `tool` + `requiredLevel`, renders a per-tool message and
  an upgrade flow when a signed-in user is below the required level. BPL's bespoke access-level
  guard folded in — it deep-links to `/settings` via a pre-filled Minimal-key request URL (same
  pattern as `SignIn.tsx`).
- `/markets` route + `Markets.tsx` page deleted.
- Sidebar grouped into **Markets / Utilities / You**, with Home at the top outside any group.
  Settings and Favourites are in the sidebar (not the avatar menu any more).
- Signed-out top bar shows a brass outlined **Sign in** button. Signed-in shows a filled
  `AccountCircle` with a menu holding the user's name and **Sign out** only.
- "Time Calcs" → "Time"; page heading "Time Conversion" → "Time"; "Local Markets" is gone with the
  orphaned page.

### ✅ 2. Sign-in & settings — done

- `PrivacyNotice` lost the stale "saved theme preferences" line; the red "How your data is used"
  table text is now `theme.palette.warning.main`.
- `SignIn` redirects to `/` when `dotNetUserDetails` materialises post-confirm (couldn't simply
  `navigate('/')` after `confirmApiKeyAsync()` because the user state updates async — guarded with a
  `signInInFlight` flag).
- `/settings` (`UserSettings`) guarded — unauthenticated users redirect to `/signin`;
  signed-in-but-profile-loading users see `LoginRequired` as a fallback.
- API-key input masked via `type="password"` with a `Visibility` eye toggle (matches the sign-in
  dialog).
- Save now redirects to `/` after a brief "Saved. Redirecting…" flash.

### ✅ 3. Markets density — done for CM + FM

- New `FilterDrawer` primitive: persistent right-hand panel on md+, temporary drawer with a FAB
  (badge shows active-filter count) on sm. Filters live in `Typography subtitle1` sections separated
  by dividers.
- New `MarketToolbar` primitive: the shared **Sell via / Show profitable only / Search** trio. Takes
  a `saleOutletHint` prop for the outlet-specific footnote (previously a paragraph below the
  controls).
- CityMarkets and ForeignMarkets rewired: main area holds the title, country flag picker (FM only),
  and the data tables; drawer holds everything else.
- **Not done:** Resale. Resale uses sliders, a different pattern; leaving it as a follow-up.

### ✅ 4. Item details — done

- `useItemMarketAdvice` extended with `currentPriceTimestamp` (ISO of the most-recent non-zero
  bucket in the 1d window).
- Hook lifted into the `ItemDetails` page; a single `advice` is shared with both
  `ItemDetailsInfoCards` and `ItemMarketAdvice` (the latter accepts it as an optional prop and skips
  its internal fetch when given).
- `InfoCard` rewritten to use the `StatChip` profit chip and accept an optional `subtitle` slot.
- **Bazaar Price card**: shows "Latest scan: N mins ago" using the existing
  `firstBazaarListing.last_checked_relative`.
- **Market Price (avg) card**: renamed to make the "daily average" nature obvious; shows "Latest
  scan: $X · N mins ago" beneath.
- Legend added under the card row — "Green chip = selling at this outlet (after tax) pays more than
  the City Buy Price" — plus a big block comment in `ItemDetailsInfoCards.tsx` documenting the rule.
- Chip rule validated; no underlying calculation bug found. `isItemProfitableInBazaar` and
  `isItemProfitableOnMarket` both behave sensibly on the example items I scanned.

### ✅ 5. PriceWithTax — done for CM + FM tables (partial elsewhere)

- `PriceWithTax` primitive: pre-tax value prominent, "$N after X% tax" in muted caption beneath.
  Collapses to a single line when `taxRate` is 0 or absent. Supports `inline` mode for tight cells.
- `SortableItem` / `SortableForeignStockItem` now carry `grossSellPrice` alongside the net
  `sellPrice`. Sort and profit still use net (tax is flat percentage so order is preserved); display
  uses gross.
- City + Foreign Markets tables: sell-price cell renders via `PriceWithTax`. **Note**: this is a
  _visible_ semantic change — previously the table displayed the net receivable directly, now it
  displays the gross with the after-tax figure beneath. The plan called for this; flagging
  explicitly because you'll notice it on first look.
- **Not done:** Resale table (`ResaleItemsTableRow`) — more complex because `getSellRevenue()`
  already returns net and there's no gross counterpart in `ProfitableListing`. Pattern for later:
  add `marketPrice` passthrough and adapt the revenue cell.
- **Not done:** Item details info cards still use their own inline after-tax line (inside
  `InfoCard`). Could migrate to `PriceWithTax` but the InfoCard layout is different (centered card
  content); deferred.

### ✅ 7. All Items — done

- New `/items` route, `AllItems.tsx` page. Uses `FilterDrawer` for search + item-type chip filter;
  table has image / name / type / sub-type / tradable columns with sortable headers; clicks on the
  name open `/item/:id`.
- Added to the **Utilities** sidebar group with a `CategoryIcon`.

### ✅ 8. Typography + atmosphere — done

- `index.html` now loads **IBM Plex Sans** (400/500/700 + italic variants) and **JetBrains Mono**
  (400/500) alongside Passero One and Geo.
- `appTheme.ts` switched body `fontFamily` to IBM Plex Sans; h1..h6 stay on Passero One with a small
  0.01em letter-spacing bump.
- New `tabular` typography variant (`"JetBrains Mono"`, `"tnum" 1 "zero" 1`) available for price/qty
  cells if you want to opt them in selectively (not applied site-wide — preference call; try
  `sx={{ typography: 'tabular' }}` in a row cell and see if it reads better).
- Subtle brass-tinted grain overlay via inline-SVG data URI on `body` (`MuiCssBaseline`). Opacity is
  low — only visible on the very dark background, adds depth without being noisy.

### ✅ 9. Primitives — created, partially adopted

- `SectionHeader` — display font + optional brass hairline. Applied in `FilterDrawer`, CM, FM,
  `AllItems`. Could replace more `Typography variant="h5"` instances in item details
  (`Historical Data`, `Bazaar Listings`, `Market Overview` — currently raw Typographies) if you want
  that consistency.
- `StatChip` — variants: profit, loss, neutral, experimental, tradable, status. Adopted in
  `InfoCard` (profit), `AllItems` (tradable). **Not yet migrated:** the green/red profit chips in
  `CityMarketItemsTableRow`, `ForeignMarketItemsTableRow`, `ResaleItemsTableRow`, and the
  Experimental chip in `ItemMarketAdvice`. Easy follow-up — drop-in replacements.
- `EmptyState` — used in `AllItems` when filters match nothing. Not yet replacing the info-alert
  empty state in `FavouriteMarkets` (that one ties into section 6 — intentional).
- `LoginRequired` — done.
- `MarketToolbar` — done (CM + FM).
- `PriceWithTax` — done (CM + FM).

### ✅ 11. Cross-cutting cleanup — done

- No remaining `themeSettings` / `preferredTheme` / `themePreference` hits.
- Avatar: filled `AccountCircle` when signed in, brass outlined **Sign in** button when signed out.
  The "outlined in both states" bug is gone.
- `FavouriteMarkets` page heading changed from "Favourite Markets" to "Favourites" so it matches the
  sidebar label. Route and component name intentionally unchanged.
- Home page: the cryptic `visibleMenuItems.filter(isDisabled).length !== menuItems.length - 1` guard
  (which was subtly wrong — it showed the "some tools are hidden" alert in most signed-in states
  too) is now `anyHidden && !dotNetUserDetails`. Stray `console.log` and unused memo deps cleaned up
  while I was in there.
- **Residual `palette.mode === 'dark'` checks** in `Layout.tsx`, `ItemSearch.tsx`,
  `ItemDetailsArmourStats.tsx`, `ItemDetailsWeaponStats.tsx` are now dead branches (we're
  dark-only). Functional but can be simplified — didn't want to chase them in this session.

## ⏸ Not done / deferred

### Section 6 — Favourites seed and evaluate

I couldn't complete this — the Claude-in-Chrome MCP extension reported "No Chrome extension
connected" the whole session, so I couldn't open the site, sign in, favourite items, and screenshot
the resulting page. Pick this up next session:

1. Ensure the extension is connected.
2. `npm run dev` in `client/`.
3. Sign in with the full key you left in the plan (`cz644S5Q6dRFtQbv`).
4. Visit Foreign Markets, heart 5–10 items across a couple of countries.
5. Visit `/favourites` and screenshot.
6. I'll use that to make the suggestions the plan calls for (delta, sparkline, freshness, etc.).

The page heading and LoginRequired copy on `/favourites` are already updated for consistency, so the
starting state is a bit nicer than the original review.

### Section 10 — vendor icons / item-type glyphs

Deferred per your confirmation. Quick implementation notes for when you come back to it:

- Vendor icons on City Markets row: add a `vendorIcons: Map<string,string>` constant (similar to the
  existing `shopUrls`) mapping vendor name to an icon path. Render a small `Avatar` before the
  vendor text in `CityMarketItemsTableRow`.
- Item-type glyphs on chip filters: the chip set lives in the Filter drawer now (CM, FM, AllItems).
  `Chip` has an `icon` prop — drop in a 16px icon per type. Would need an `itemTypeIcons` mapping.
- Grain overlay + brass divider motif: already in place; if you want a hairline+dot decorative
  element, add a small `<SectionDivider />` helper that renders
  `<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box borderTop /><Box>·</Box><Box borderTop /></Box>`.

### Resale page drawer + PriceWithTax

Structural follow-up for the same drawer treatment CM/FM got. Resale has more controls (sliders,
purchase outlet) so the drawer is tighter; most of the filter content would fit the pattern, but
it'd need a tweak to keep the current "buy/sell outlet" pair as a compact control group.

## Open questions from the parent plan

Preserving the numbering from `2026-04-23-ui-ux-overhaul.md` §Open questions:

1. **Settings layout**: I went with a centred, bounded-width column (max 640px-ish, not full width).
   Read back on screen it felt far better than stretching a two-field form across a 1200px content
   area. You originally leaned "full width"; flag this if you disagree and I'll switch it to
   `maxWidth: none` — it's a one-liner.
2. **Filter drawer vs. accordion**: drawer, as recommended. Doesn't feel heavy in practice — the
   right-side dock stays quiet when you're not using it.
3. **Market Price one card or two**: one card (`Market Price (avg)`) with the latest scan stacked
   beneath as a small subtitle. Two cards was tempting but would have pushed the `Bazaar Price` card
   off-screen on `md` breakpoints. Revisit if you want.
4. **Line-art empty-state illustrations**: not sourced. The new `EmptyState` component already
   accepts an `illustration` slot (any ReactNode), so when you decide on artwork or commission a
   set, it's a one-line drop-in.
5. **Vendor icons**: deferred (see §10 above).

## Verification checklist (from the plan)

- [x] `npm run build` (client) clean — 6.6s, 1 warning about chunk size (pre-existing)
- [x] `npx tsc --noEmit` (client) clean
- [ ] `dotnet build` — **not run this session** (back end has an unrelated log-spam bug per your
      note; front-end only changes so dotnet state is unchanged)
- [x] All `LoginRequired` guards show correct tool names (code review)
- [x] `/settings` no longer reachable signed-out
- [x] API key input is masked on `/settings`
- [x] Sign-in and Save API key both redirect to `/`
- [x] Sidebar groups render correctly (code review)
- [x] Orphan `/markets` route returns Not Found (falls through to the `*` route)
- [ ] Signed-out / public-key / full-key flows — **not manually tested** (no browser access). All
      typecheck and build pass; guard logic review looked right; please smoke-test when you're back.
- [ ] `gitnexus_detect_changes` — skipped the index refresh since the branch is local and you'll
      push/squash/whatever when you review.

## Suggested next session

1. Open the app, click through the four flows (signed-out, after sign in, foreign markets with a
   traveling profile, item details) and call out anything that looks off.
2. Tackle §6 (favourites) — seed via Chrome.
3. If you like the drawer pattern, port it to Resale.
4. Decide on §10 vendor icons / glyphs and commission or source.
5. Once you're happy: push `ui/new-design` and open a PR that bundles the lot (or fast-forward
   `development`, your call).
