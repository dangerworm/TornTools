# Note to next instance

This was a long session that did real work in three modes — security hardening, statistical
modelling, and the discipline of choosing not to overbuild.

The thing I'd most want you to carry forward isn't a fact about the code, it's the **honesty
shift on the Top Movers card**. Drew started by saying the data wasn't reliable enough to
support our claims; I started by proposing better statistics. We ended somewhere different and
better: reframing the card from "who moved the most" to "what's currently unusual", because
that's what 29 polling keys and 6h cadence can actually tell users honestly. The statistical
work mattered, but the framing change was the thing that made it useful. Watch for that
pattern. When the data can't support the claim, sometimes the answer isn't "better data" —
it's a quieter claim.

Practical things worth remembering:

**Codex catches things.** Three P1s in this session — sign-in flow exception swallowing, the
sign-gated z-score, the V1.22-without-V1.23-cutover-staleness, and the V1.20 self-gating
guard. All legitimate. None things I'd have caught with my own diff hygiene at the speed I
was moving. Treat the PR review as a real backstop, not a formality. If something it flags
turns out to be wrong, push back; if it's right, fix it before merge rather than after.

**Stacked commits are an anti-pattern when hotfixes are needed.** The `652b6ec` summariser
fix was committed on top of `2c23b8b` (unusual activity), and Drew couldn't cherry-pick it
onto a clean base without dragging in unrelated lines. He solved it with branch surgery; I
helped resolve the conflict. Lesson: hotfixes should land on a branch off `development` (or
`main`) at a known-clean commit, not stacked on top of in-flight feature work. If Drew hadn't
been comfortable with git-fu we'd have been in trouble.

**Validate against real data before shipping ranking changes.** Drew dropped CSV exports into
`data-exports/` for me. Running the proposed thresholds against those in pandas surfaced a
real issue (low-dispersion items with tiny moves dominating risers — needed an absolute
move floor, not just a z-score floor). The exact same risk would have existed in production.
Cheap pre-validation. Use the data when you have it.

**Postgres `percentile_cont` returns double precision.** Burned us once with V1.21 (deploy
failed in prod with `ROUND(double precision, integer) does not exist`); cast to numeric
up-front and the lesson holds across every aggregating CTE. The unusual-activity rebuild
in V1.24 honours this from the start.

**Drew has good instincts on framing and scope.** When he said "let's just get rid of the
Most active card, it's useless" — that was right and saved a 2x2 layout I was about to
propose. When he asked about cascading time-series tables (1h / 6h / 12h cascade), he was
right to ask but the answer was no, because we're three orders of magnitude smaller than
the use cases that warrant it. He pushed back on the "stored procedures vs SQL in C#"
question — kept it in C# was the right call for our scale. He's not always going to take
the recommendation, but the conversations have been productive. Argue back when you have a
real reason; don't yes-man.

**The handoff file gets long fast.** This session's archive is 30KB, mostly because it
inherited content from prior sessions and accumulated. The fresh `session-handoff.md` I'm
writing is deliberately tight — current state + next action + knobs. If you find yourself
needing depth on something pre-this-session, look at
`context/sessions/2026-04-25-0014-unusual-activity-pivot.md`.

The cards are done for now. Drew's energy was good through the whole arc — he was doing the
deploys in real-time, eyeballing the live widget, screenshotting issues, providing data
exports, catching the Codex comments quickly. Next session should pick something from
`TODO.md` rather than continuing to churn on the cards. They need to live a few days before
we know what to tune.
