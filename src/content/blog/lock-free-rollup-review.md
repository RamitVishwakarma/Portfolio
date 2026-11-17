Our call analytics rollup held up to 55 database writers in line at once, and it did so every few minutes for most of the working day. It never threw an error. A teammate rewrote it so that it takes no row locks while it computes. I reviewed the change, worked through why it is correct and measured the old version in production before it shipped. This post covers the review, the before numbers and the first hour after the deploy. The numbers for a full three days come on 24 November.

## How the rollup works

This is the same rollup system as in [pg_cron said succeeded for four days](/blog/pg-cron-silent-failures). Our dashboards read from 5-minute summary cells, not from the raw call logs. Each row in the call logs table has a pending flag. A `BEFORE UPDATE` trigger sets it whenever a column the summaries depend on changes. pg_cron runs a function that claims pending rows, rebuilds the cells they fall into and clears the flag. Until midday on 13 November it claimed up to 5,000 rows every 5 minutes. Then, as a quick fix for the lock waits, it was cut to 1,000 rows every 3 minutes.

A call's row is written several times after it ends: the billing step, the recording upload, status updates and post-call analysis each update it. So a call that has just finished is exactly the kind of row the rollup wants to claim.

## The old claim

The old function started like this:

```sql
CREATE TEMP TABLE claim ON COMMIT DROP AS
SELECT id FROM call_logs
WHERE analytics_pending
ORDER BY updated_at
LIMIT 5000
FOR UPDATE SKIP LOCKED;
```

`SKIP LOCKED` means two runs never claim the same row. The cost is in `FOR UPDATE`. Row locks last until the transaction ends, and the transaction was the whole tick. While the tick rebuilt its cells, every post-call writer that touched one of those rows waited for it. Cutting the limit to 1,000 on 13 November shrank the set of locked rows, but each tick still held them for minutes.

Overnight a tick took seconds. In calling hours it took minutes.

## What the old design cost

I pulled every run of the job from pg_cron's history and grouped them by hour of day, over the three days after the move to a 3-minute schedule.

![Tick runtime by hour of day in IST for 14 to 16 November. From midnight to 08:59 and from 22:00 the median is 8 to 20 seconds. From 09:00 to 20:59 the p95 is 210 to 320 seconds in every hour, above the 180-second interval.](/blog/lock-free-rollup-review/tick-runtime-by-hour-before.svg "Tick runtime by IST hour, 14 to 16 November")

From 22:00 to 08:59 the median tick took 8 to 20 seconds. From 09:00 to 20:59 the p95 was 210 to 320 seconds in every single hour, and 17 to 54% of ticks ran past the 3-minute interval. The median was 135 to 190 seconds in most of those hours and dipped to 40 to 90 seconds from 12:00 to 15:59, while the p95 stayed high. The slow hours are the calling hours. Ticks stay short only when few calls are being made.

pg_cron runs at most one instance of a job at a time. When a run overshoots, the next one starts as soon as it finishes. So in calling hours the rollup was effectively always running.

The daily view shows how it got there:

![Daily p95 and maximum tick runtime from 9 October to 16 November. The p95 stays under 50 seconds until late October, then climbs to several minutes. The worst run took 604 seconds on 12 November. The interval line steps from 300 to 180 seconds on 13 November.](/blog/lock-free-rollup-review/tick-runtime-daily-before.svg "Daily p95 and max tick runtime, with the schedule interval")

In early October the daily p95 was a few seconds. It grew with traffic through late October. From 3 to 16 November it was between 168 and 469 seconds on every day except two quiet ones, 6 and 7 November, at around 70 seconds. The worst single run took 604 seconds, on 12 November. The change on 13 November, from 5,000 rows every 5 minutes to 1,000 rows every 3, made the rollup fresher on paper and put the p95 of every calling hour past the interval.

The two periods are different enough that I keep them apart when comparing. In calling hours on 10 to 12 November, with 5,000-row ticks, the p50 was 97 seconds and the p95 437 seconds, and 24% of ticks overran the 5-minute interval. On 14 to 16 November, with 1,000-row ticks, the p50 was 121 seconds and the p95 246 seconds, and 32% overran 3 minutes. Per claimed row, that is a p95 of 87 milliseconds in the first period and 246 in the second. Smaller batches did not make the work cheaper. They made it less efficient.

### Who was waiting

Runtime alone doesn't say who paid for it. So I sampled `pg_stat_activity` every 12 seconds or so, and for every backend waiting on a lock I followed `pg_blocking_pids()` up the chain to see whether it ended at the rollup.

![Two panels over the sample window. The top panel shows the number of backends waiting on the rollup, which climbs to around 50 during each tick and falls to near zero when the tick commits. The bottom panel shows the longest current wait, a sawtooth that climbs for as long as each tick runs, up to 223 seconds, and drops to zero when it commits. Vertical lines mark new ticks, which start right after the previous one ends.](/blog/lock-free-rollup-review/blocked-writers-before.svg "Writers blocked by the rollup, sampled every ~12 s")

From 11:24 to 12:13 IST on 17 November, 245 samples:

- The rollup was running in 100% of samples.
- 93% of samples had writers blocked by it, 37 on average and up to 55.
- The longest wait was 223 seconds.
- All but one of the lock waits I saw traced back to the rollup. The one exception was a single backend in a single sample.

The sawtooth is the old design in one picture. Writers pile up behind a tick, all of them get through when it commits, and the next tick claims a fresh set of rows and the pile starts again.

The summaries paid for it too. The oldest pending row was 20 to 27 minutes old in every one of the 41 backlog samples, so some calls took more than 20 minutes to reach the dashboards. The backlog did not drain either. It grew by about a fifth over the 50 minutes.

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

**The batch is back to 5,000 rows.** The claim no longer blocks anyone, so a bigger batch only costs the tick itself.

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

The new rollup went live in production at 12:53 IST on Tuesday 17 November. The old job was stopped at 12:52, partway through a tick, and the first new tick started at 12:54. I measured the hour from 12:53 to 13:53 IST with the same sampler and queries as the before window, which ran from 11:24 to 12:13 the same day.

### Tick runtime

The new tick is not fast. The nine ticks in the first 70 minutes all succeeded and took 375 to 635 seconds, about 7 minutes each. That is longer than the 3-minute schedule, so pg_cron starts each one as soon as the previous one ends. The difference is that a long tick now only delays the summaries. It doesn't hold up anyone else.

Per row it is cheaper. The backlog never dropped below 5,000 claimable rows in that hour, so every tick claimed a full batch. The median tick took 436 seconds, about 87 milliseconds per row. The old 1,000-row ticks earlier that day took about 220 seconds each, or 220 milliseconds per row. So the new rollup gets through about 2.4 times as many rows per hour. Against the 5,000-row ticks of 10 to 12 November it is about even: their calling-hour p95 was 437 seconds, close to what the new ticks take, and now nothing waits on them.

> TODO(after-data, 24 November run): pull every run of the new voice job (jobid 347, `rollup_tick_voice(5000, 360)`) from pg_cron's history for 21 to 23 November IST, a Saturday, Sunday and Monday like 14 to 16 November. Write `ticks_prod_all_after.csv` (all runs from 9 October on, old jobid 238 and new jobid 347 together, without the cancelled run 980755) and `ticks_prod_by_hour_ist_after.csv` (21 to 23 November, same columns as the before file). Then run `python3 scripts/rollup-post-charts.py <data-dir> public/blog/lock-free-rollup-review --suffix after --days "21 to 23 November" --last 2026-11-23 --deploy 2026-11-17`, which writes `tick-runtime-by-hour-after.svg` and `tick-runtime-daily-after.svg`. Embed both here.

> TODO(after-data, 24 November run): one or two sentences on calling-hour p50 and p95 for 21 to 23 November, against both before periods: 5,000 rows every 5 minutes on 10 to 12 November (p50 97 s, p95 437 s, max 604 s) and 1,000 rows every 3 minutes on 14 to 16 November (p50 121 s, p95 246 s). Give the cost per row as the fair measure. pg_cron's history doesn't record rows claimed, so count a tick as full only when the exported claimable-rows gauge (`backend_rollup_voice_claimable_rows`, service `backend-prod`) was at 5,000 or more when it started. Ticks over 180 s are expected now and are not a failure.

### Who is waiting now

![Two panels over the hour after the deploy, on the same scales as the before chart. The number of backends waiting on the rollup is zero in every sample, and so is the longest wait. Vertical lines mark the nine new ticks, about 7 minutes apart.](/blog/lock-free-rollup-review/blocked-writers-after.svg "Writers blocked by the rollup after the deploy, sampled every ~12 s")

From 12:53 to 13:53 IST, 233 samples:

- A tick was running in 99% of samples.
- No sample had a writer blocked by the rollup. The average and the maximum were both zero.
- One sample had a single backend waiting on a lock, for 0.2 seconds. Its blocker was not the rollup.

The rollup ran for almost the whole hour, just as the old one did. Nothing waited on it.

I also checked that rows really get released. At 13:10 I recorded the id and `xmin` of the 5,000 oldest claimable rows. By 14:04 all 5,000 were marked done, and none was left pending.

### Post-call writes

Our services already trace every database statement, so the writes have a before window as well as an after. These are the updates to the call logs in the two sampled windows.

| Writer | p95 before | p95 after | Slowest before | Slowest after | Timed out before | Timed out after |
| --- | --- | --- | --- | --- | --- | --- |
| Recording upload | 119 s | 11 ms | 120 s | 0.42 s | 10% | 0% |
| Status updates, telephony events | 7 ms | 11 ms | 59 ms | 144 ms | 0% | 0% |
| Status updates, API | 8 ms | 30 ms | 24 ms | 114 ms | 0% | 0% |
| Billing | 6 ms | 4 ms | 144 ms | 163 ms | 0% | 0% |
| Expiry sweep | 10 ms | 36 ms | 0.32 s | 0.37 s | 0% | 0% |
| Number backfill | 42 ms | 112 ms | 118 s | 0.92 s | under 0.1% | 0% |

Post-call analysis doesn't show up in the traces as a write to the call logs, so it isn't in the table.

Most writers were fine in both windows, a few milliseconds either way. The recording upload was not. In the before window one write in ten ran into its 120-second timeout and failed.

![Hourly p95 latency of the recording-upload write, on a log scale, and the share of those writes that timed out, from 14 to 17 November. The p95 sits at a few milliseconds most of the time and jumps to about 120 seconds in episodes lasting several hours on each day, when up to 24% of writes in an hour time out. The deploy is marked near the right edge, after which the p95 is back to about 10 milliseconds and nothing times out.](/blog/lock-free-rollup-review/recording-writes.svg "Recording-upload writes, hourly, with the deploy marked")

This wasn't a one-off. Over 14 to 17 November the recording write timed out in episodes of several hours on every day. The traces alone don't prove that each timeout was a lock wait on the rollup. But the lock samples found no other blocker, and the timeouts stopped within the hour of the deploy. One hour is short, so the three-day run checks whether that holds.

> TODO(after-data, 24 November run): from the traces, the share of recording-upload writes that timed out and their p95, hourly over 21 to 23 November. Regenerate `recording-writes.svg` with `writers_hourly.csv` running from 14 to 23 November and `--deploy-at 2026-11-17T07:23:23Z`, and add one sentence on whether the timeouts stayed at zero.

### How far behind the summaries run

In the before window the oldest pending row was 20 to 27 minutes old, and the backlog grew by about a fifth over 50 minutes.

The after hour started with a handicap. The cancelled tick's work was rolled back and the first new tick didn't finish until 13:01, so for about 10 minutes nothing was marked done. The backlog had also kept growing between the two windows. At the deploy it was already about twice the size of the before window's average, and its oldest row was 33 minutes old.

It grew by about half again until 13:32, while the new ticks caught up. Then it fell. By 14:05 it was 10% smaller than at the deploy, and the oldest pending row was 23 minutes old. Through the hour the oldest row ranged from 22 to 40 minutes.

So the summaries are not fresher yet. They are about as far behind as before, while working off twice the backlog. Part of that delay is now by design: a row waits 6 quiet minutes before it can be claimed, then for the next tick, which takes about 7 minutes to commit.

> TODO(after-data, 24 November run): oldest pending row over the calling hours of 21 to 23 November, from the exported gauge `backend_rollup_voice_oldest_claimable_seconds` (service `backend-prod`), against the 20 to 27 minutes before. Relative backlog size only.

### Before and after

| Measure | Before | After |
| --- | --- | --- |
| Calling-hour tick p95, 5,000-row ticks | 437 s | TODO(after-data, 24 November run) |
| Calling-hour tick p95, 1,000-row ticks | 246 s | n/a |
| Ticks over the interval, calling hours | 24% at 5 min, 32% at 3 min | TODO(after-data, 24 November run) |
| Cost per claimed row, same day | 220 ms | 87 ms |
| Samples with writers blocked by the rollup | 93% | 0% |
| Writers blocked, average / max | 37 / 55 | 0 / 0 |
| Longest lock wait | 223 s | 0.2 s, not on the rollup |
| Recording-upload writes timed out | 10% | 0% |
| Recording-upload write p95 | 119 s | 11 ms |
| Oldest pending row | 20 to 27 min | 22 to 40 min, starting from a switchover backlog |

> TODO(after-data, 24 November run): closing section, once the three-day numbers are in. Say whether the calling-hour ticks keep up with the inflow, whether the recording timeouts stayed at zero, and whether the oldest pending row came down. End with what I would check first next time a rollup gets slow: lock waits by blocker, then tick duration against the interval.
