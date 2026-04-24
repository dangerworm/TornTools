# UI/UX Overhaul Plan

**Created:** 2026-04-23, after a full signed-out / public-key / full-key UI review. **Repo state at
plan time:** `development` branch, commit `7099851` (doc refresh), commit `7c55cfc` (theme removal).
Nothing mid-flight on disk.

This plan exists so a fresh Claude session can pick up the work end-to-end. Read it top to bottom
before editing. User has authorised execution; proceed without re-asking for sign-off on items
listed here, but **do** follow the project's standing rules (plan before non-trivial edits, run
`gitnexus_impact` before touching a symbol, `dotnet build` / `npm run build` before declaring a task
done, never push or force-push without asking).

---

## Aesthetic direction (settled)

Amplify the existing Torn-noir look: gold `#c8960c` on near-black `#0c0e12`, **Passero One** display
headings already baked into the theme at `client/src/theme/appTheme.ts`. User has green-lit every
aesthetic suggestion from the review. Plan assumes:

- Keep the current brass palette as-is.
- Layer in a body face with more character (**IBM Plex Sans**) and a monospace for tabular numerics
  (**JetBrains Mono** or **Space Mono**). Wire via Google Fonts link in `client/index.html` +
  `theme.typography`.
- A very subtle grain overlay on `body` (3–5% opacity noise SVG data URI) — adds atmosphere; don't
  overdo it.
- Introduce a `<SectionHeader>` component (display font + brass hairline) and a
  `<StatChip variant=…>` component family (profit / experimental / status / tradable) and migrate
  existing ad-hoc chips onto them.
- Shimmering brass skeleton instead of grey. Small line-art Torn-themed empty-state doodles (locked
  briefcase, footprint, etc.) when no data.

Execute these alongside the structural work; don't silo them at the end.

---

## Sequenced work

### 1. Quick wins — ship first (highest leverage, small risk)

Do these in one commit or one PR; they're tightly related polish.

#### 1a. Fix the login-required guards (copy-paste bug)

The shared component renders the same sentence on Favourites, City Markets, Foreign Markets, Resale
— all referring to the wrong tool.

- Find the shared `LoginRequired` component (likely in `client/src/components/`; grep for "You must
  be signed in").
- Parametrise it: `<LoginRequired tool="City Markets" requiredLevel="public" />` (or similar). The
  component should render:
  - Title: "Sign in required" (or "Minimal access required" if `requiredLevel="minimal"`).
  - Body: fills in `tool` so each page reads correctly.
- Update every page that uses it.

#### 1b. Upgrade the Bazaar Price Lookup guard to the shared component

BPL currently has a bespoke, better guard ("Minimal access required" with a concrete upgrade path).
Fold its good content into the shared `LoginRequired`:

- When `requiredLevel="minimal"` and the user is signed in with a lower-level key, show the
  "upgrade" flavour.
- Replace the "Torn API preferences page" link with a **deep link that pre-fills a Minimal key
  request** — the same pattern used in `client/src/pages/SignIn.tsx` (look for the
  `tab=api?&step=addNewKey&type=2` URL; that's the Minimal-key link).
- Replace "sign in again" with "update your key **here**" where **here** links to `/settings` (which
  by then will be a proper, guarded settings page — see 2b).

#### 1c. Delete the orphaned `/markets` route

- Remove the `Markets` page component and its route from `client/src/App.tsx`.
- Grep for references and clean up.
- Run `gitnexus_impact` on the `Markets` symbol first.

#### 1d. Group the sidebar and promote User Settings

Current sidebar is a flat list of six items. Regroup with `MUI List` + `ListSubheader`:

- **Markets** — Bazaar Price Lookup, City Markets, Foreign Markets, Resale
- **Utilities** — Time, (All Items — placeholder for section 7 below)
- **You** — Favourites, Settings

Move Settings out of the avatar dropdown and into the sidebar's "You" group. Keep Sign out in the
avatar dropdown (it's an action, not a destination).

#### 1e. Sign in CTA

- When signed out, replace the plain outlined avatar icon with a persistent **Sign in** button in
  the top bar (brass outlined). Keeps discoverability high.
- When signed in, restore the avatar/menu.

#### 1f. Unify naming

- Sidebar and page heading both use **"City Markets"** (not "Local Markets").
- Sidebar and page heading both use **"Time"** (not "Time Calcs" or "Time Conversion").
- Grep for "Local Markets" / "Time Calcs" / "Time Conversion" and fix consistently, including in the
  home-page tool tiles and any nav-item label constants.

---

### 2. Sign-in & Settings polish

#### 2a. Sign-in page

- Fix the stale "saved theme preferences" wording in the "Why sign in?" alert. Re-read the full
  paragraph and trim to current reality.
- Change the red table text in "How your data is used" — red reads as error on a dark palette. Use a
  muted amber (try `theme.palette.warning.light` or a custom `#d4a24a`) or just the brass primary.
- On successful sign-in, **redirect to `/` (home)** and close the dialog. Currently it just closes
  the dialog and leaves you on `/signin`.

#### 2b. User settings

- Guard `/settings` — if not signed in, redirect to `/signin` (or render the shared
  `LoginRequired`).
- Mask the API-key input: `type="password"` (matches the sign-in dialog). Add a "show/hide" eye
  toggle if you like.
- On successful save, redirect to `/` (same behaviour as sign-in).
- Layout: with the theme section gone the content sits in a half-width column. Promote to full
  width, or — better — keep it narrow (max-width ~480px) and center the section, so it doesn't look
  lost on wide screens. User preference: **full width** per the review; but I'd mildly argue a
  centered narrow column reads better. Make full-width unless a centered narrow form reads better in
  context — judgement call.

---

### 3. Markets density — structural improvement

User asked for a concrete proposal on fixing the density problem. Recommended approach:

**Adopt a persistent right-hand filter drawer pattern** for City Markets, Foreign Markets, and
Resale:

- Move the `Filters` + `Options` sections out of the vertical page flow and into a collapsible
  right-hand drawer (MUI `Drawer variant="persistent" anchor="right"`).
- The drawer is open by default on `md+` screens, collapses to a floating toggle icon on `sm`.
- Data table gets the full remaining width — breathes properly.
- Active filters summarised as a compact chip row above the table (clickable chip = remove filter).
- **Why this pattern**: it scales with more filters (new controls just get added inside the drawer,
  not stacked further down), keeps the data as the hero, and is familiar from other data-heavy tools
  (Linear, Notion databases, Jira).

Alternative if the drawer feels heavy: **collapsed accordion** with "Filters (3 active)" summary,
open only on user click. Less slick but less work.

#### 3a. Extract `MarketToolbar`

City Markets and Foreign Markets currently duplicate:

- Sell-via tabs (BAZAAR / MARKET (5%) / ANON (15%))
- "Show profitable items only" checkbox
- Search field

Extract these into a shared `<MarketToolbar>` component under `client/src/components/`. Props: the
current selection + change handlers. Lives inside the right-hand drawer from 3 above.

- Run `gitnexus_context` on whatever holds the current duplicated controls first to get the exact
  prop shape.

---

### 4. Item details

#### 4a. Make the profit chips comprehensible

User's feedback: the green chips are meant to show when a price is profitable but it's non-obvious
and possibly buggy.

- Audit the chip-display logic. For each of the four price cards (`City Buy`, `City Sell`,
  `Bazaar Price`, `Market Price`):
  - Which field drives the chip colour?
  - What counts as "profitable"? Document the rule in code comments AND in-UI.
- Add a tiny legend below the card row: "Green = below the current sell-price benchmark (profit
  opportunity)".
- Apply chips consistently: if a chip rule exists for one live-price card, the same rule should
  apply to all live-price cards. If two cards are static catalogue data (City Buy/Sell from Torn),
  they get no chip.
- **Flag to user if the underlying calculation is genuinely broken** before patching visuals — don't
  paper over a bug.

#### 4b. Surface the most-recent lowest market price

Current `Market Price` shows Torn's daily average. We already store the most recent lowest scanned
price. Show both:

- `Market Price $669` (the daily average, as now)
- below it, smaller: `Latest scan: $612 · 3 mins ago` (or whatever copy fits)

Or split into two cards: `Market (avg)` and `Market (latest)`. Two cards is probably clearer but
eats horizontal space — check on narrower viewports.

---

### 5. Price-after-tax pattern (cross-cutting)

Whenever a sell price is shown in a context where the user has selected an outlet that incurs tax
(Market 5%, Anon 15%), show:

```
$1,235
$1,173 after 5% tax
```

Primary price larger, after-tax smaller, muted. Build a `<PriceWithTax value={…} taxRate={…} />`
component and use it everywhere a sell price meets a selected tax outlet. Currently only Item
Details does this (and only partially).

---

### 6. Favourites — user wants to evaluate after seeding

User said: "On the next run, try adding some favourites to see the table and tell me what you think
of it."

When picking up this plan:

1. Start the site and sign in with full key `cz644S5Q6dRFtQbv`.
2. Navigate to Foreign Markets or City Markets.
3. Heart 5–10 items across different vendors/countries.
4. Screenshot the resulting `/favourites` page.
5. Report back to user with suggestions. Candidate additions:
   - Current vs. last-seen price (delta indicator)
   - How long since last update (already shown elsewhere)
   - Quick "remove favourite" affordance inline
   - Small sparkline per row showing price trend
   - Sort toggles (profit, freshness, alpha)

Don't implement before user feedback — this is a "suggest and wait" step.

---

### 7. All Items exploration page (new)

New route `/items` showing every item in the catalogue. Uses the same table pattern as City/Foreign
Markets:

- Search
- Sortable columns
- Item-type filter chips
- Item image + name + type + brief details
- Click row → navigate to `/item/:id`

Reuses the `MarketToolbar` from 3a for search + item-type filtering. Add to the "Utilities" sidebar
group.

---

### 8. Typography + atmosphere (theme layer)

All at the `appTheme.ts` level:

- Add font links in `client/index.html` for IBM Plex Sans (400, 500, 700) and JetBrains Mono (400,
  500).
- `theme.typography.fontFamily`: `'"IBM Plex Sans", system-ui, sans-serif'`.
- Add a `typography.tabular` or extend `typography.body2` with `fontFeatureSettings: '"tnum" 1'` and
  `fontFamily: '"JetBrains Mono", ui-monospace, monospace'`. Apply to price/qty cells in data
  tables.
- `h1..h6` stay on Passero One.
- Body background: add a subtle grain overlay via a CSS `background-image` with a small inline SVG
  noise pattern at 3–5% opacity. Try it and adjust by eye.

---

### 9. Shared design primitives (create these, then migrate callers)

- `<SectionHeader>` — display font + brass hairline underline. Replaces ad-hoc
  `Typography variant="h5"` usage when heading a content section (e.g. "Filters", "Options", "Torn
  City", "Market Overview").
- `<StatChip variant="profit|loss|experimental|status|tradable">` — consolidates the green/red
  profit chips, the orange Experimental badge, the green Tradable pill, status colours. One prop,
  consistent shape.
- `<LoginRequired tool requiredLevel>` — from 1a/1b.
- `<MarketToolbar>` — from 3a.
- `<PriceWithTax>` — from 5.
- `<EmptyState illustration message action?>` — replace the info-alert-as-empty-state pattern used
  on Favourites. Allow a custom small SVG illustration per use-site.

---

### 10. Adding colour & imagery beyond flags

Country flags on Foreign Markets are the single best visual element on the site. More opportunities:

- **Vendor icons on City Markets**: every Torn vendor (Bits 'n' Bobs, Big Al's, Jewelry Store…) has
  a recognisable sprite/logo in-game. A small vendor avatar next to the vendor name column would
  echo the flag pattern.
- **Item type icons** on chip filters: weapon / armour / drug / book / flower etc. Currently
  text-only chips; adding a small glyph before the label makes the filter row scannable at a glance.
- **Item images on the All Items page (7)** — already in the catalogue; use them as the primary
  visual column.
- **Access-level badges** for the user in the top bar when signed in: small brass coin indicating
  Public / Minimal / Limited / Full. Doubles as affordance to open Settings.
- **Status chips on Item Details**: Tradable / Found in city / Masked — currently only Tradable is
  shown; make the set consistent.
- **Faction / player avatars** (future): if we ever surface per-player listings, pulling the Torn
  profile avatar is a high-payoff visual.
- **Small line-art decorative elements**: section dividers with a tiny brass motif (like a `·`
  flanked by hairlines) in the noir idiom.

Pick one or two to start — vendor icons on City Markets is probably the highest-impact quickest win.

---

### 11. Cross-cutting cleanup

While in the codebase, scrub these:

- Grep for any remaining `theme[sS]ettings`, `preferredThem`, etc. — should be zero after 7c55cfc.
- Grep for `FavouriteMarkets` and related paths — may be named inconsistently in routes vs labels.
- Check if the avatar `AccountCircle` (filled) is actually being used when signed in; during the
  review it looked outlined in both states.

---

## Suggested commit structure

Split into logical commits rather than one megacommit. Rough ordering:

1. `feat(nav): group sidebar, promote Settings, remove orphaned /markets route, unify naming`
2. `feat(auth): persistent sign-in CTA, redirect to home after sign-in and key save, guard /settings, mask API key`
3. `refactor(components): extract LoginRequired with proper tool/level params; fix BPL and shared guard copy`
4. `refactor(components): extract MarketToolbar; consolidate City/Foreign/Resale toolbars`
5. `feat(markets): right-hand filter drawer pattern`
6. `feat(item-details): surface latest scanned market price; audit and document profit-chip logic`
7. `feat(pricing): PriceWithTax component, apply site-wide`
8. `feat(theme): IBM Plex Sans + JetBrains Mono, grain overlay, SectionHeader + StatChip primitives`
9. `feat(items): add /items exploration page`
10. `feat(favourites): (after user review of seeded data)`
11. `feat(visuals): vendor icons on City Markets, item-type glyphs on filter chips`

Each commit: `dotnet build`, `npm run build`, and eyeball the affected pages. Don't chain commits
blindly.

---

## Open questions for the user (resolve when back)

These aren't blockers — sensible defaults are in the plan — but flag in the handoff message when
done so the user can redirect:

1. **Settings layout**: full-width as requested, or centered narrow column? Plan defaults to the
   user's preference (full width) but I think narrow-centered reads better.
2. **Filter drawer vs. collapsed accordion** for the Markets density fix. Plan recommends drawer;
   accordion is the cheaper option if time-constrained.
3. **Market Price card**: two cards (avg + latest) or one card with stacked values?
4. **Line-art empty-state illustrations**: OK to use a simple set (briefcase / footprint / key), or
   do you want to supply / commission?
5. **Vendor icons**: OK to extract from Torn's static assets, or would that step on toes?
   Alternatively, commission or draw.

---

## Answers to open questions

1. Left-align it for consistency with the rest of the site.
2. Use a drawer
3. Two cards
4. Use MUI icons now, we'll come back to it.
5. Again, just use MUI icons for now.

## Verification checklist (run before handoff)

- [ ] `dotnet build` clean (6 projects, 0 errors, 0 warnings)
- [ ] `npm run build` (client) clean
- [ ] `npx tsc --noEmit` (client) clean
- [ ] Signed-out / public-key / full-key flows all work without visible regressions
- [ ] All `LoginRequired` guards show correct tool names
- [ ] `/settings` no longer reachable signed-out
- [ ] API key input is masked on `/settings`
- [ ] Sign-in and Save API key both redirect to `/`
- [ ] Sidebar groups render correctly
- [ ] Orphan `/markets` route returns 404 (or falls through to Not Found)
- [ ] `gitnexus_detect_changes` confirms scope matches plan
- [ ] Run `npx gitnexus analyze --embeddings` (or let the post-commit hook handle it)
