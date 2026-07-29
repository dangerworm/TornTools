# Note to next instance

This session was a production incident and its cleanup. Different mode from the last arc — less
building, more diagnosis under pressure, then hardening. A few things worth carrying forward.

**Don't blame the code you just shipped. Read the platform.** The API was returning 503 on every
endpoint right after a deploy that included our new `TornItemsProcessor`. The tempting story was "our
change broke it." It hadn't. The discipline that found the truth was ruling out layers in order:
frontend was up (served a 404 fast), the deploy pipeline was green, so the failure was the running
app — and the App Service docker log said it plainly: *"no listening ports detected… container did
not respond to startup probe within 230s."* The clincher was the app's own stdout: it logged
`"Initialising queue."` **seven times** (seven crash-loop restarts) and never the next line. That
located the hang precisely — in the synchronous startup block that runs *before* `app.RunAsync()`
binds Kestrel. The cause predated the session (a 190k-row `queue_items` backlog choking an
O(n/batch) clear). Lesson: when prod is down, the logs are the fast path, not the diff.

**Know where the schema actually lives.** Codex left a confident PR comment that the prune needed a
`change_time` index that didn't exist — it had searched the C# and the EF model. But this repo's
schema is **Flyway-managed** (`.docker/flyway/sql/`), and the index has been there since V1.12. Codex
was right in principle, wrong on the fact, because it looked in the wrong place. Two takeaways: verify
against the real source of truth, and Codex's *principle* can be worth acting on even when its
*premise* is wrong (its comment prompted the command-timeout hardening, which was genuinely useful).

**Terraform: commit your lock file.** An unrelated deploy failed because `infra/.terraform.lock.hcl`
was gitignored, so CI re-resolved `azurerm` every run and a new release made a key-vault argument
required. This is a whole class of "it worked yesterday, nothing changed" breakage. It's committed
and pinned now — keep it that way, and bump deliberately.

**The workflow auto-applies Terraform.** `terraform apply -auto-approve` with no manual gate. When we
bumped azurerm 4.62→4.81 (19 minors), I flagged the risk and couldn't run `plan` locally (needs the
GH secrets). The reassurance came from *Flyway migrations passing* — proof the DB survived the apply.
Watch for this if any infra change could touch a stateful resource; there's no human gate to catch a
bad plan before it lands.

**Know when to stop digging.** `gh run view --job --log` kept returning one line for the infra job. I
tried a few variants, then stopped and got the answer another way (job/step statuses + Flyway
success) rather than rat-holing on the CLI. The right call.

**Drew works live and is comfortable in prod.** He `az login`ed, truncated `queue_items` on the DB
server, flipped app settings, and merged — all in real time, at ~1am. Match that: give him the exact
SQL/commands, flag the destructive edges (VACUUM FULL locks; truncate reclaims bloat), and let him
drive the prod-touching actions. He made every real decision (30-day retention, VACUUM FULL over
pg_repack, leave the Failed rows for debugging). Argue when you have a reason; he's egoless about it.

**The good instinct this session:** the retention feature wasn't the task — it fell out of the
incident ("we're in here anyway, let's make the DB better"). That was Drew, and it was right. The
7.1G `item_change_logs` table is the real long-term cost; the prune addresses it and the audit proved
30 days is safe (only ≤7d windows read raw; everything else reads summaries).

**Open loop for you:** the prune's first run (03:30 UTC) does the big cleardown, then the one-time
`VACUUM FULL` is due to reclaim the disk. It's in TODO.md and in project memory. Check the prune
actually ran before recommending the VACUUM. See `session-handoff.md` for the full state.

He went to bed after this — good. It was a clean recovery and he stayed steady through it.
