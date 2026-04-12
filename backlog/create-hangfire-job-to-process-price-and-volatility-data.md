# Create Hangfire job to process price and volatility data

**List:** Data and analysis
**Labels:** Data & Analysis
**Trello:** https://trello.com/c/dahdcJHy

## Description

Several features would benefit from quick-access data on volatility (low or high), price changes (increasing/decreasing).

These are going to be a long-running queries/calculations. Probably best to have them as daily/half-daily jobs run from Hangfire at 00:00 and 12:00.

- For each market:
  - Store data on number of changes in the last day/week
  - Store data on price changes in the last day/week
  - Table could be
    - item_id
    - market\_changes\_1\_day … market\_changes\_N\_days
    - price\_change\_1\_day … price\_change\_N\_days
  - Is there anything else we could track?
- This enables quick querying of ‘items with M-N changes’ and ‘items with M-N price increase/decrease’ over different time periods
  - This removes the thinking on what constitutes a large change as users can pick for themselves.
  - Could be a slider on the front end which loads relevant items from the API.
