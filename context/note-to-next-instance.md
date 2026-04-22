# Note to next instance

This was a continuation session — the previous instance had just finished the Bazaar Price Lookup
page and done a handoff, and Drew came back the same day with three more things.

The work went cleanly. Drew is a good collaborator: he gives precise feature specs, accepts
recommendations quickly when they're well-reasoned, and corrects course early when something is off.
A few things worth remembering:

**The layout broke twice before it was right.** The first attempt at moving the footer into the
sidebar introduced `justifyContent: 'center'` on the outer Box (a leftover from an earlier draft),
which vertically centred the entire app. The second attempt used `height: 100vh` on the sidebar
paper inside a container that also held the AppBar — so the total height became AppBar + 100vh >
100vh. The correct pattern is: outer Box `height: 100vh`, inner content Box `overflow: hidden`,
permanent Drawer paper `position: relative` with `overflow: auto`, main Box `overflow: auto`. The
page itself doesn't scroll — only the panes inside it do. This is worth remembering as a canonical
MUI sidebar layout.

**Drew caught the formula ambiguity without being asked.** The suggested-price formula as written
(`(10 * Math.floor(price / 10) - 1) + 9`) algebraically simplifies to
`10 * Math.floor(price/10) + 8`, which prices _above_ the market minimum in every case. The intended
reading is clearly `10 * (Math.floor(price / 10) - 1) + 9` — highest X9 below the current $10 floor.
I flagged the discrepancy before implementing, which was the right call. Drew said nothing about it,
which means either he agreed silently or he didn't notice — either way, the implementation is
correct.

**The Market Overview feature required honest scoping.** Drew initially floated a "total supply over
time" metric, then correctly talked himself out of it: only 50 listings visible, bazaars invisible,
polling slower than trade velocity, sample biased. The final feature surfaced only what is genuinely
observable — price trend vs weekly average, change frequency, saturation signal — and marked itself
"Experimental". That's the right instinct for a feature built on incomplete data: don't oversell,
don't hide the caveats.

**The sparklines showed "—" locally because the Materials items haven't had price changes in 24h (or
1w).** This is correct behaviour — the data is genuinely absent. Drew knew this and moved to deploy
rather than trying to fake it. The feature will work on prod where there's real history.

**GitNexus doesn't index the TypeScript frontend.** Impact analysis on frontend symbols returns LOW
with 0 upstreams because those symbols aren't in the graph. This is expected — just note the
exemption explicitly rather than silently skipping.
