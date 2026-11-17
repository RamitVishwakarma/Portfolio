Our call analytics rollup held up to 55 database writers in line at once, and it did so every few minutes for most of the working day. It never threw an error. A teammate rewrote it so that it takes no row locks while it computes. I reviewed the change, worked through why it is correct and measured the old version in production before it shipped. This post covers the review and the before numbers. The after numbers come once it has run in production for a few days.

## How the rollup works

This is the same rollup system as in [pg_cron said succeeded for four days](/blog/pg-cron-silent-failures). Our dashboards read from 5-minute summary cells, not from the raw call logs. Each row in the call logs table has a pending flag. A `BEFORE UPDATE` trigger sets it whenever a column the summaries depend on changes. pg_cron runs a function that claims pending rows, rebuilds the cells they fall into and clears the flag. Since 13 November it runs every 3 minutes, down from 5.

A call's row is written several times after it ends: the billing step, the recording upload, status updates and post-call analysis each update it. So a call that has just finished is exactly the kind of row the rollup wants to claim.

## The old claim

The old function started like this:

```sql
CREATE TEMP TABLE claim ON COMMIT DROP AS
SELECT id FROM call_logs
WHERE analytics_pending
ORDER BY updated_at
LIMIT 1000
FOR UPDATE SKIP LOCKED;
```

`SKIP LOCKED` means two runs never claim the same row. The cost is in `FOR UPDATE`. Row locks last until the transaction ends, and the transaction was the whole tick. While the tick rebuilt its cells, every post-call writer that touched one of those 1,000 rows waited for it.

Overnight a tick took seconds. In calling hours it took minutes.

## What the old design cost

I pulled every run of the job from pg_cron's history and grouped them by hour of day, over the three days after the move to a 3-minute schedule.

![Tick runtime by hour of day in IST for 14 to 16 November. From midnight to 08:59 and from 22:00 the median is 8 to 20 seconds. From 09:00 to 20:59 the p95 is 210 to 320 seconds in every hour, above the 180-second interval.](/blog/lock-free-rollup-review/tick-runtime-by-hour-before.svg "Tick runtime by IST hour, 14 to 16 November")

From 22:00 to 08:59 the median tick took 8 to 20 seconds. From 09:00 to 20:59 the p95 was 210 to 320 seconds in every single hour, and 17 to 54% of ticks ran past the 3-minute interval. The median was 135 to 190 seconds in most of those hours and dipped to 40 to 90 seconds from 12:00 to 15:59, while the p95 stayed high. The slow hours are the calling hours. Ticks stay short only when few calls are being made.

pg_cron runs at most one instance of a job at a time. When a run overshoots, the next one starts as soon as it finishes. So in calling hours the rollup was effectively always running.

The daily view shows how it got there:

![Daily p95 and maximum tick runtime from 9 October to 16 November. The p95 stays under 50 seconds until late October, then climbs to several minutes. The worst run took 604 seconds on 12 November. The interval line steps from 300 to 180 seconds on 13 November.](/blog/lock-free-rollup-review/tick-runtime-daily-before.svg "Daily p95 and max tick runtime, with the schedule interval")

In early October the daily p95 was a few seconds. It grew with traffic through late October. From 3 to 16 November it was between 168 and 469 seconds on every day except two quiet ones, 6 and 7 November, at around 70 seconds. The worst single run took 604 seconds, on 12 November. Moving to a 3-minute schedule on 13 November made the rollup fresher on paper and put the p95 of every calling hour past the interval.

### Who was waiting

Runtime alone doesn't say who paid for it. So I sampled `pg_stat_activity` every 12 seconds or so, and for every backend waiting on a lock I followed `pg_blocking_pids()` up the chain to see whether it ended at the rollup.

![Two panels over the sample window. The top panel shows the number of backends waiting on the rollup, which climbs to around 50 during each tick and falls to near zero when the tick commits. The bottom panel shows the longest current wait, a sawtooth that climbs for as long as each tick runs, up to 209 seconds, and drops to zero when it commits. Vertical lines mark new ticks, which start right after the previous one ends.](/blog/lock-free-rollup-review/blocked-writers-before.svg "Writers blocked by the rollup, sampled every ~12 s")

From 11:24 to 11:52 IST on 17 November:

- The rollup was running in 100% of samples.
- 96% of samples had writers blocked by it, 34 on average and up to 55.
- The longest wait was 209 seconds.
- Every lock wait I saw traced back to the rollup. There was no other source.

The sawtooth is the old design in one picture. Writers pile up behind a tick, all of them get through when it commits, and the next tick claims a fresh set of rows and the pile starts again.

The summaries paid for it too. The oldest pending row stayed 20 to 25 minutes old through the window, so some calls took more than 20 minutes to reach the dashboards.

### Nothing ever failed

The rollup's failure log table had zero rows in the 15 days I checked. The tick never threw an error. It was only slow and in the way.

In the [earlier post](/blog/pg-cron-silent-failures) my first rule was to monitor the work, not the scheduler, and alert on rows in the failure table. That rule would not have caught this. No error-based alert fires for a job that succeeds every time and blocks 50 writers while it does. What shows it is tick duration against the interval and lock waits by blocker.

## The new design

The teammate's version keeps the same summary cells and changes how rows are claimed and released.

**The claim takes no locks.** It records each row's `xmin`, the id of the transaction that wrote the current version of the row, in a temp table:

```sql
CREATE TEMP TABLE claim ON COMMIT DROP AS
SELECT id, xmin AS xm
FROM call_logs
WHERE analytics_pending
  AND updated_at < now() - interval '6 minutes'
ORDER BY updated_at
LIMIT 5000;
```

**Cells are rebuilt, not incremented.** Each affected cell is deleted and recomputed from all of its source rows. Rebuilding a cell twice gives the same result as rebuilding it once, which is what makes the rest of the design safe.

**Rows are marked done only if nothing has touched them.** At the end of the tick:

```sql
UPDATE call_logs t
SET analytics_pending = false
FROM (
  SELECT p.id
  FROM call_logs p
  JOIN claim c ON c.id = p.id
  WHERE p.xmin = c.xm
  FOR UPDATE OF p SKIP LOCKED
) done
WHERE t.id = done.id;
```

A row is marked done only if its version hasn't changed since the claim and no writer holds it right now. Everything else stays pending for the next tick. This statement does take row locks, but it is the last step before commit, so they last milliseconds instead of minutes.

**Rows must be quiet for 6 minutes.** Only rows whose `updated_at` is at least 6 minutes old are claimed, so most of a call's post-call writes land before its cells are rebuilt. The trigger that sets the pending flag now also stamps `updated_at`, so the quiet period holds even for a writer that doesn't set it. The result is usually one rebuild per call instead of one per write.

**An advisory lock stops overlap.** pg_cron never runs two copies of the job, but someone running the function by hand could overlap it. The function starts with `pg_try_advisory_xact_lock()` and returns straight away if another run holds it.

**The batch went from 1,000 rows to 5,000.** The claim no longer blocks anyone, so a bigger batch only costs the tick itself.

**Billing left the 3-minute tick.** It moved to its own daily job.

## Why it is correct

The question I set out to answer in review was narrow: can a row ever be marked done while its cell was built from older data than the row now holds? If it can, that call is wrong in the dashboards until something else touches it, which might be never.

A tick does three things in order: claim (record `xmin`), rebuild (read the source rows), mark done (compare `xmin`, lock with `SKIP LOCKED`), then commit. A writer can land anywhere in that sequence. I took each case in turn.

1. **The writer commits before the rebuild reads the row.** The rebuild sees the new data, so the cell is correct. The row's `xmin` has changed, so it is not marked done and stays pending. The next tick rebuilds the cell once more and gets the same answer. Harmless.
2. **The writer commits after the rebuild read the row but before the done-marking.** The cell now holds the old values, so it is briefly stale. But `xmin` changed, so the row stays pending and the next tick rebuilds the cell with the new data.
3. **The writer has not committed when rows are marked done.** It holds a lock on the row. `SKIP LOCKED` skips it, so it is not marked done and stays pending. When the writer commits, the next tick picks it up.
4. **The writer starts after the done-marking has locked the row.** Its `UPDATE` waits for the tick to commit, which takes milliseconds. Then it applies on top of the version that has the flag cleared. The `BEFORE UPDATE` trigger sees a tracked column change and sets the row pending again.

In none of the four is a row marked done with stale data behind it.

The whole argument rests on one comparison, so I checked it can't lie in the dangerous direction. Every update to a row creates a new row version stamped with the updating transaction's id. A row whose `xmin` still matches the claim has not been updated since the claim. A false "unchanged" can't happen. A false "changed" can, for example a write that touched no tracked column, and it only costs one extra rebuild. Using `xmin` rather than `updated_at` also means the check doesn't depend on every writer remembering to set a timestamp.

So the worst case is a cell that is one tick stale. It is never wrong once the next tick has run.

## What else the review turned up

Two things came up beyond the main question.

**Rows left pending are not leaked.** My first worry with any "leave it for next time" design is a row that is skipped forever. Here a skipped row is just a pending row. It goes quiet for 6 minutes and is claimed again, and the loop stops once the call's writes stop. A row only stays pending for as long as something keeps writing to it.

**Calls don't move between cells.** A call's cell comes from its start timestamp. If a writer could rewrite that timestamp, a call could move from one 5-minute cell to another, and only the new cell would be rebuilt, leaving the call counted in the old one. I went through every writer of that column. It is set once, at dial time, and nothing changes it afterwards. The worry was unfounded, but it was cheap to check and expensive to get wrong.

## After the deploy

> TODO(after-data): deploy date and time in IST, and the exact production window measured after it.

The after numbers will come from the same sampler and the same queries against pg_cron's history, plus metrics the app now exports to our observability dashboard for each post-call write. On staging the new tick's median is 0.04 seconds, but staging carries far less traffic than production, so that is an early sign and not a comparison.

### Tick runtime

> TODO(after-data): chart, tick runtime p50/p95 by IST hour with the 180 s interval, three days after deploy, matching the before mix (a Saturday, Sunday and Monday). Save as `/blog/lock-free-rollup-review/tick-runtime-by-hour-after.svg` with `scripts/rollup-post-charts.py <after-data-dir> public/blog/lock-free-rollup-review --suffix after`.

> TODO(after-data): chart, daily p95/max tick runtime extended past the deploy date, with the deploy marked (extend `last` in `chart_daily`). Save as `tick-runtime-daily-after.svg`.

> TODO(after-data): one or two sentences on calling-hour p50/p95 and the share of ticks over 180 s, against the before numbers above.

### Who is waiting now

> TODO(after-data): chart, backends blocked by the rollup and longest wait, sampled the same way for the same length of time at the same time of day (from 11:24 IST on a Tuesday). Save as `blocked-writers-after.svg`.

> TODO(after-data): share of samples with writers blocked by the rollup, average and max blocked, longest wait, and whether any lock waits remain and what they trace to.

### Post-call writes

> TODO(after-data): writer latency p95/p99 for billing, recording upload, status updates and post-call analysis, from the exported metrics. Table with one row per writer. If the metrics have no window before the deploy, say so and use the lock waits above as the before.

### How far behind the summaries run

> TODO(after-data): backlog age, the oldest pending row over a calling day, before (20 to 25 minutes) and after. Relative backlog size only.

### Before and after

| Measure | Before | After |
| --- | --- | --- |
| Calling-hour tick p95 | 210 to 320 s | TODO(after-data) |
| Ticks over the 3-minute interval, calling hours | 17 to 54% | TODO(after-data) |
| Samples with writers blocked by the rollup | 96% | TODO(after-data) |
| Writers blocked, average / max | 34 / 55 | TODO(after-data) |
| Longest lock wait | 209 s | TODO(after-data) |
| Oldest pending row | 20 to 25 min | TODO(after-data) |

> TODO(after-data): closing section, what the numbers say about the change and what I would check first next time a rollup gets slow.
