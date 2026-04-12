# Use common icons and tooltips

**List:** UI / UX enhancements
**Labels:** UI/UX
**Trello:** https://trello.com/c/bxICmwfU

## Description

Have common link icons:

- Torn markets
- Bazaar
- Shop

Create shared component that includes a relevant tooltip

Use enum for what to show (bazaar, market, shop) with logic as to whether to render or not

- If an item is passed in with ‘shop’ enum selected and that item does not have a shop, return null
