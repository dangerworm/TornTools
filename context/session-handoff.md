# Session Handoff — 2026-04-14 (second session)

## What we accomplished this session

1. **Added three Peter items to TODO.md** (from peter-ideas.txt):
   - `### Resale Page`: "Live 'last updated' counter" (Nov 29 email) — not yet implemented
   - `### Resale Page`: "Profit per click efficiency metric" (Jan 25 email) — not yet implemented
   - `## Minor / Cosmetic`: "Volatility chart Y-axis units" — immediately marked **done** because
     `ItemDetails.tsx` already passes `yAxisLabel="Number of changes"` to the bar chart.

2. **Reviewed TODO.md against the codebase** — the following were found done and annotated:
   - **Foreign Markets → Column sorting**: `ForeignMarketItemsTable` now has full `TableSortCell`
     headers including a guarded Country column (`showCountry`). Updated both the Foreign Markets
     section and the UI/UX "Column sorting on all tables" entry.
   - **Add armour** (Core Product Improvements): `ItemDetailsArmourStats` exists,
     `DetailsBaseStatsArmor` is in `ItemEntity`/`ItemDto`, `GetMarketItemsAsync` has no type filter
     → armour scanned/listed. Marked done in TODO.
   - **Include armour data across the stack** (Data and Analysis): same evidence — marked done,
     references the Core Product Improvements entry.

## Confirmed still outstanding (not verified as done)

- **Persist slider values** — only outlet toggles and checkboxes are in localStorage; the three
  sliders (min profit, max buy price, max time since last update) in `Resale.tsx` are NOT persisted.
- **Add stale-data warning** — no warning component found in the codebase.
- **Profit source indicator** — no implementation found.
- **Column sorting** for `ResaleItemsTable`, `FavouriteMarketsTable`, `Weav3rListingTable`.
- **Item Details: Add link to market and shop** — `ItemDetailsHeader.tsx` has no market/shop links.
- **Item Details: Rename "City Buy Price"** — still labeled "City Buy Price" in
  `ItemDetailsInfoCards.tsx:24`.
- **Hangfire price/volatility job** — not implemented.
- Everything in Data and Analysis except armour (done).
- All Item Quality features.
- All Selective Scanning items.
- Both new Peter Resale items (live counter, profit-per-click).

## Key file locations for next session

| Area                   | Files                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| Resale sliders         | `client/src/pages/Resale.tsx:50-58` (initialValueIndex constants, useState calls)                               |
| City Buy Price label   | `client/src/components/ItemDetailsInfoCards.tsx:24`                                                             |
| Column sorting pattern | `client/src/components/ForeignMarketItemsTable.tsx` (reference impl), `client/src/components/TableSortCell.tsx` |
| Volatility chart       | `client/src/pages/ItemDetails.tsx:111-118`, `client/src/components/Chart.tsx`                                   |
| Queue population       | `api/TornTools.Application/Services/DatabaseService.cs:238` (`PopulateQueueWithMarketAndWeav3rItemsOfInterest`) |

## Reminder from previous session

Drew wants the default time filter index in `Resale.tsx` reverted to 2 (5 min) from 5 (60 min)
**after** the Urgent issues queue flip-flop problem is addressed. See `Resale.tsx:53`.
