Our call analytics rollup held up to 55 database writers in line at once, and it did so every few minutes for most of the working day. It never threw an error. It had worked fine for months, until our call volume climbed over three weeks from late October and its cost grew far faster than the load. A teammate rewrote it so that it takes no row locks while it computes. I reviewed the change, worked through why it is correct and measured the old version in production before it shipped. This post covers the review, the before numbers and the first two hours after the deploy, which covered the top of that day's load.

## How the rollup works

This is the same rollup system as in [pg_cron said succeeded for four days](/blog/pg-cron-silent-failures). Our dashboards read from 5-minute summary cells, not from the raw call logs. A cell is one batch's dials in one 5-minute window: one row per org, batch and window, where the window comes from the call's start time.

### One call's row

Each dial is one row in the call logs table, and several services write to that row in turn:

1. The API inserts the row when the lead is uploaded. It has no start time yet.
2. The dialler places the call, marks it in progress and stamps its start time.
3. The telephony status handler writes each status the carrier reports, then the final status and the duration.
4. After the final status, a billing step and a recording upload each write their own columns.
5. The post-call analysis service writes the outcome, the analysis and the transcript. That is usually 10 to 15 seconds after hangup. When the analysis model times out and the fallbacks run their course, it can take about 6 minutes.

### How a row gets flagged

The rollup never looks for changes itself. Each row has a pending flag, `analytics_pending`, and a `BEFORE INSERT OR UPDATE` trigger sets it on any dialled row when a column the summaries depend on changes: status, duration, analysis, outcome, call journey or start time. A row that was never dialled is never flagged. A write that only touches other columns, such as the recording URL or the billing fields, doesn't flag the row.

One writer also sets the flag in code. The post-call analysis service sets it on every write, whether or not a tracked column changed.

So one call gets flagged when it is dialled, again on each status change and again when its analysis lands. Flags set between two ticks count once, because a row is either pending or not.

### One tick

pg_cron runs a function that does this in one transaction:

1. **Claim** up to a fixed number of pending rows, oldest change first.
2. **Find the cells to rebuild.** That is the cell each claimed dial sits in, plus the cell where that dial's lead had its first attempt. The per-lead numbers, such as leads connected and talk time per lead, live in the first-attempt cell so each lead is counted once. So a retry today changes a cell that can be weeks old.
3. **Delete** those cells.
4. **Rebuild** each cell from all of its dials, not just the changed ones. The only index that finds a cell's dials is keyed on the 5-minute window alone. So the rebuild reads every org's dials in that window and throws away the ones from other batches.
5. **Rebuild the per-lead numbers.** This reads every attempt of every lead in the affected cells, wherever those attempts landed, with a second pass over the same window index.
6. **Mark the claimed rows done** and commit.

The same tick also rolled up billing, with a claim of its own.

Because every cell is rebuilt from scratch, the order of writers and ticks doesn't matter. A tick that runs before the analysis write counts that call's outcome as pending. The analysis write flags the row again, and the next tick corrects the cell.

Until midday on 13 November the job claimed up to 5,000 rows every 5 minutes. Then, as a quick fix for the lock waits, it was cut to 1,000 rows every 3 minutes.

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

`SKIP LOCKED` means two runs never claim the same row, and a row someone is writing right now is left for the next tick.

`FOR UPDATE` had a real job. Without it, a write that landed between the claim and step 6 would set the flag, and step 6 would then clear it. That change would never be rolled up. With the lock, the write waits, and its flag lands after the tick has cleared the old one.

The cost was how long the lock lasted. Row locks last until the transaction ends, and the transaction was the whole tick. While the tick rebuilt its cells, every write to a claimed row waited for it: status updates, billing, the recording upload and the analysis write. Cutting the limit to 1,000 on 13 November shrank the set of locked rows, but each tick still held them for minutes.

### One retry, step by step

A small example shows both problems. One batch. Lead A was called at 10:01 and connected. Lead B was called at 10:02 and didn't answer. Both rows were rolled up long ago.

- At 14:31 lead B's retry connects. At 14:32 the status handler writes `completed` and the duration, and the trigger flags the row.
- The 14:33 tick claims the retry row and locks it.
- It rebuilds two cells: 14:30, where the retry sits, and 10:00, where lead B's first attempt sits. To find their dials it reads every org's dials in both windows. To rebuild the lead numbers it reads every attempt of every lead in the 10:00 cell.
- At 14:34 the retry's analysis is ready. The analysis service updates the row, which is locked, so the write waits.
- The tick commits a few minutes later. The analysis write goes through and flags the row again, and the next tick rebuilds both cells again.

One changed row cost two cells, every dial in two 5-minute windows, every attempt of every lead in an older cell, and one writer stalled for the length of the tick. At low volume a tick took seconds, so nobody noticed the wait. At high volume it took minutes.

## Why it stopped keeping up

<!-- load figures: daily dials relative to the 6-18 Oct average. Quietest day from 8 Oct (18 Oct) 0.54x, 8-12 Nov 4.4-5.1x, so busy Nov day / quiet Oct day is about 8-9x. Climb about three weeks, 19 Oct to 8 Nov. Ratios only, never absolute counts. -->
The old design was fine at the load it was built for. In early October the average calling-hour tick took 1 to 4 seconds. Then load grew quickly. Busy November days carried about 8 to 9 times the dials of a quiet October day, and the climb took about three weeks, from late October to mid-November.

Against the average day from 6 to 18 October:

- The quietest October day ran at about half that average.
- In late October daily dials mostly ran at about 2 to 3x.
- From 8 to 12 November they ran at about 4.4 to 5.1x, and 30 October was about as high.

The rollup's cost grew much faster than that. The average calling-hour tick went from 1 to 4 seconds in early October to 56 to 123 seconds in late October, and up to 350 seconds on 12 November. That is roughly 100 times the tick time for about 5 times the average day's dials.

The claim was never the expensive part. The rebuild was, and its cost depends on how much each changed row drags in. A read-only replay of steps 1 to 5 against the pending rows at a light hour on 16 November found 209 changed rows. Rebuilding for them meant 63 cells, 58 of them first-attempt cells, the oldest 54 days old. All told it came to about 140,000 row reads, and about 9 in 10 of the rows the window index returned belonged to other batches and were thrown away.

Each part of that grows with traffic:

- **Busier windows.** The window index returns every org's dials in the window, so each cell costs more as total volume grows, not just its own batch's.
- **More retries per lead.** Each retry re-reads the lead's whole history and drags in its first-attempt cell, which can be weeks old.
- **Hot cells are rebuilt every tick.** While a batch is dialling, new rows land in its current cell all the time, so that cell is deleted and rebuilt on every tick. This is why cutting the claim from 5,000 rows to 1,000 didn't shorten ticks. Each claim still touches about the same set of busy cells.

And because the lock lasted as long as the tick, every second added to the tick was a second added to every blocked write.

## What the old design cost

I pulled every run of the job from pg_cron's history and grouped them by hour of day, over the three days after the move to a 3-minute schedule.

![Tick runtime by hour of day in IST for 14 to 16 November. From midnight to 08:59 and from 22:00 the median is 8 to 20 seconds. From 09:00 to 20:59 the p95 is 210 to 320 seconds in every hour, above the 180-second interval.](/blog/lock-free-rollup-review/tick-runtime-by-hour-before.svg "Tick runtime by IST hour, 14 to 16 November")

From 22:00 to 08:59 the median tick took 8 to 20 seconds. From 09:00 to 20:59 the p95 was 210 to 320 seconds in every single hour, and 17 to 54% of ticks ran past the 3-minute interval. The median was 135 to 190 seconds in most of those hours and dipped to 40 to 90 seconds from 12:00 to 15:59, while the p95 stayed high. The slow hours are the calling hours. Ticks stay short only when few calls are being made.

pg_cron runs at most one instance of a job at a time. When a run overshoots, the next one starts as soon as it finishes. So in calling hours the rollup was effectively always running.

The daily view shows how it got there:

![Daily p95 and maximum tick runtime from 9 October to 16 November. The p95 stays under 50 seconds until late October, then climbs to several minutes. The worst run took 604 seconds on 12 November. The interval line steps from 300 to 180 seconds on 13 November.](/blog/lock-free-rollup-review/tick-runtime-daily-before.svg "Daily p95 and max tick runtime, with the schedule interval")

In early October the daily p95 was a few seconds. It grew with traffic through late October, much faster than the traffic itself, as described above. From 3 to 16 November it was between 168 and 469 seconds on every day except two quiet ones, 6 and 7 November, at around 70 seconds. The worst single run took 604 seconds, on 12 November. The change on 13 November, from 5,000 rows every 5 minutes to 1,000 rows every 3, made the rollup fresher on paper and put the p95 of every calling hour past the interval.

The two periods are different enough that I keep them apart when comparing. In calling hours on 10 to 12 November, with 5,000-row ticks, the p50 was 97 seconds and the p95 437 seconds, and 24% of ticks overran the 5-minute interval. On 14 to 16 November, with 1,000-row ticks, the p50 was 121 seconds and the p95 246 seconds, and 32% overran 3 minutes. Per claimed row, that is a p95 of 87 milliseconds in the first period and 246 in the second. Smaller batches did not make the work cheaper. They made it less efficient. That fits the hot cells: a 1,000-row tick rebuilds about the same busy cells as a 5,000-row tick, so it pays nearly the same cost for a fifth of the rows.

### Who was waiting

Runtime alone doesn't say who paid for it. A spot check on 4 November had found about 30 analysis writes waiting per tick, for 45 to 83 seconds each. For the full picture I sampled `pg_stat_activity` every 12 seconds or so, and for every backend waiting on a lock I followed `pg_blocking_pids()` up the chain to see whether it ended at the rollup.

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

The teammate's version keeps the same summary cells and the same rebuild, and changes how rows are claimed and released. The old lock's one real job was to stop a write between the claim and the done-marking from being lost. The new version does that job with a version check instead of a lock.

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

**Cells are still rebuilt, not incremented.** Each affected cell is deleted and recomputed from all of its source rows, as before. Rebuilding a cell twice gives the same result as rebuilding it once, which is what makes the rest of the design safe.

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

**Rows must be quiet for 6 minutes.** Only rows whose `updated_at` is at least 6 minutes old are claimed, so most of a call's post-call writes land before its cells are rebuilt. Six minutes is about how long the analysis write takes in its slowest case, when the model times out and falls back. The trigger that sets the pending flag now also stamps `updated_at`, so the quiet period holds even for a writer that doesn't set it. The result is usually one rebuild per call instead of one per write.

**An advisory lock stops overlap.** pg_cron never runs two copies of the job, but someone running the function by hand could overlap it. The function starts with `pg_try_advisory_xact_lock()` and returns straight away if another run holds it.

**The batch is back to 5,000 rows.** The claim no longer blocks anyone, so a bigger batch only costs the tick itself.

**Billing left the 3-minute tick.** It moved to its own daily job.

## Why it is correct

The question I set out to answer in review was narrow: can a row ever be marked done while its cell was built from older data than the row now holds? If it can, that call is wrong in the dashboards until something else touches it, which might be never.

A tick does three things in order: claim (record `xmin`), rebuild (read the source rows), mark done (compare `xmin`, lock with `SKIP LOCKED`), then commit. A writer can land anywhere in that sequence. I took each case in turn.

1. **The writer commits before the rebuild reads the row.** The rebuild sees the new data, so the cell is correct. The row's `xmin` has changed, so it is not marked done and stays pending. The next tick rebuilds the cell once more and gets the same answer. Harmless.
2. **The writer commits after the rebuild read the row but before the done-marking.** The cell now holds the old values, so it is briefly stale. But `xmin` changed, so the row stays pending and the next tick rebuilds the cell with the new data.
3. **The writer has not committed when rows are marked done.** It holds a lock on the row. `SKIP LOCKED` skips it, so it is not marked done and stays pending. When the writer commits, the next tick picks it up.
4. **The writer starts after the done-marking has locked the row.** Its `UPDATE` waits for the tick to commit, which takes milliseconds. Then it applies on top of the version that has the flag cleared. If it changes a tracked column, or comes from the analysis service, the row is set pending again. If it doesn't, the cell never depended on what it wrote.

In none of the four is a row marked done with stale data behind it.

The whole argument rests on one comparison, so I checked it can't lie in the dangerous direction. Every update to a row creates a new row version stamped with the updating transaction's id. A row whose `xmin` still matches the claim has not been updated since the claim. A false "unchanged" can't happen. A false "changed" can, for example a write that touched no tracked column, and it only costs one extra rebuild. Using `xmin` rather than `updated_at` also means the check doesn't depend on every writer remembering to set a timestamp.

So the worst case is a cell that is one tick stale. It is never wrong once the next tick has run.

## What else the review turned up

Two things came up beyond the main question.

**Rows left pending are not leaked.** My first worry with any "leave it for next time" design is a row that is skipped forever. Here a skipped row is just a pending row. It goes quiet for 6 minutes and is claimed again, and the loop stops once the call's writes stop. A row only stays pending for as long as something keeps writing to it.

**Calls don't move between cells.** A call's cell comes from its start timestamp. If a writer could rewrite that timestamp, a call could move from one 5-minute cell to another, and only the new cell would be rebuilt, leaving the call counted in the old one. I went through every writer of that column. It is set once, at dial time, and nothing changes it afterwards. The worry was unfounded, but it was cheap to check and expensive to get wrong.

## After the deploy

The new rollup went live in production at 12:53 IST on Tuesday 17 November. The old job was stopped at 12:52, partway through a tick, and the first new tick started at 12:54. I measured from the deploy until 15:00 IST. That was the top of the day's load: the 13:00 hour had more dials than any hour before or after it up to 16:00. From 13:00 to 15:00 there were about 1.1 times the dials of the same hours on 10 to 12 November, and about 1.8 times those of 14 to 16 November.

That is about two hours on one day, at the day's peak. Read what follows as a first look, not a verdict. The lock sampler ran for the first hour, 12:53 to 13:53. For the whole window I have pg_cron's history, the write traces and two gauges the new version exports: how many rows are claimable and how old the oldest one is. Where I compare with earlier days, I use the same hours, 13:00 to 15:00 IST.

### Tick runtime

The new tick is not fast. All 16 ticks in the window succeeded and took 219 to 932 seconds. The median was 442 seconds and the p95 746. Every one ran past the 3-minute schedule, so pg_cron started each one as soon as the previous one ended, and a tick was running for the whole window. That is expected now. Each tick claims up to 5,000 rows, and a long tick only delays the summaries. It doesn't hold up anyone else.

![Tick runtime by hour of day in IST for 17 November, 12:53 to 15:00. The 12:00 hour has a single tick of 471 seconds. In the 13:00 hour the median is 430 seconds and the p95 593. In the 14:00 hour the median is 465 seconds and the p95 858. Every bar is above the 180-second interval.](/blog/lock-free-rollup-review/tick-runtime-by-hour-after.svg "Tick runtime by IST hour, 17 November after the deploy")

For the same hours before:

- On 10 to 12 November, with 5,000 rows every 5 minutes, the ticks that started between 13:00 and 15:00 had a median of 92 seconds and a p95 of 471. 25% ran past 5 minutes.
- On 14 to 16 November, with 1,000 rows every 3 minutes, the same hours had a median of 40 seconds and a p95 of 227. 19% ran past 3 minutes. These hours were the quiet midday dip of those days.
- Earlier on 17 November, from 11:23 to 12:14, the old 1,000-row ticks had a median of 210 seconds, and 69% ran past 3 minutes.

By the clock the new ticks are longer. But the claim size changed, so cost per claimed row is the fairer measure. pg_cron doesn't record how many rows a tick claimed, so I read the claimable-rows gauge just before each tick started. It was above 5,000 for the first 14 ticks, so each of them claimed a full batch. The last two, at 14:52 and 14:56, had less to claim.

The 14 full ticks had a median of 457 seconds, about 91 milliseconds per row. The old 1,000-row ticks earlier that day took about 210 milliseconds per row at the median. So the new rollup gets through about 2.3 times as many rows per hour.

Against the 5,000-row ticks of 10 to 12 November the picture is mixed. Nothing recorded how many rows those ticks claimed, so their median can't be turned into a cost per row. Their slow ticks most likely claimed a full batch. Their p95 of 471 seconds comes to about 94 milliseconds per row, close to the new median. The new p95 is 771 seconds for a full tick, or 154 milliseconds per row, so the new tail is worse. Two ticks make that tail: the one at 14:03 took 684 seconds and the one at 14:14 took 932. I don't know yet why those two were slow.

![Daily p95 and maximum tick runtime from 9 October to 17 November. The p95 stays under 50 seconds until late October, then climbs to several minutes. The last point, 17 November up to 15:00, mixes the old ticks of that morning with the new ones and has the longest run of the period, 932 seconds. The deploy is marked at the right edge.](/blog/lock-free-rollup-review/tick-runtime-daily-after.svg "Daily p95 and max tick runtime up to 15:00 IST on 17 November")

The daily view now runs to 17 November. Its last point covers that day up to 15:00, so it mixes the old 1,000-row ticks of the morning with the new 5,000-row ticks of the afternoon. Its maximum is the 932-second tick.

### Who is waiting now

![Two panels over the hour after the deploy, on the same scales as the before chart. The number of backends waiting on the rollup is zero in every sample, and so is the longest wait. Vertical lines mark the nine new ticks, about 7 minutes apart.](/blog/lock-free-rollup-review/blocked-writers-after.svg "Writers blocked by the rollup after the deploy, sampled every ~12 s")

From 12:53 to 13:53 IST, 233 samples:

- A tick was running in 99% of samples.
- No sample had a writer blocked by the rollup. The average and the maximum were both zero.
- One sample had a single backend waiting on a lock, for 0.2 seconds. Its blocker was not the rollup.

The rollup ran for almost the whole hour, just as the old one did. Nothing waited on it.

The sampler stopped at 13:53, so for 13:53 to 15:00 I only have the write traces. In that stretch the slowest traced write to the call logs, across every writer, took 0.89 seconds, and none failed. A writer held behind a 7-minute tick would have shown up there. After the window, from 16:33 to 16:36, I took 75 more lock samples while a tick was running. None had a writer blocked by the rollup.

I also checked that rows really get released. At 13:10 I recorded the id and `xmin` of the 5,000 oldest claimable rows. By 14:04 all 5,000 were marked done, and none was left pending.

### Post-call writes

Our services already trace every database statement, so the writes have a before window as well as an after. These are the updates to the call logs in the two lock-sampler windows, 11:24 to 12:13 and 12:53 to 13:53.

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

![Hourly p95 latency of the recording-upload write, on a log scale, and the share of those writes that timed out, from 14 November to 15:00 IST on 17 November. The p95 sits at a few milliseconds most of the time and jumps to about 120 seconds in episodes lasting several hours, when up to 24% of writes in an hour time out. The deploy is marked near the right edge, after which the p95 is back to about 10 milliseconds and nothing times out.](/blog/lock-free-rollup-review/recording-writes.svg "Recording-upload writes, hourly, with the deploy marked")

This wasn't a one-off. Over 14 to 17 November the recording write timed out in episodes of several hours on every day. The traces alone don't prove that each timeout was a lock wait on the rollup. But the lock samples found no other blocker, and the timeouts stopped within minutes of the deploy.

They stayed at zero for the rest of the window. From 12:55 to 15:00 not one recording write timed out. The p95 was 12 milliseconds, and the slowest write took 0.42 seconds. That morning, from 08:30 to 12:30, 7 to 11% of recording writes timed out in every hour. The same hours on earlier days are a weaker comparison: on 14 November 9% of recording writes timed out between 13:00 and 15:00, but on 10 to 12, 15 and 16 November none did.

### How far behind the summaries run

In the before window the oldest pending row was 20 to 27 minutes old, and the backlog grew by about a fifth over 50 minutes.

The after window started with a handicap. The cancelled tick's work was rolled back and the first new tick didn't finish until 13:01, so for about 10 minutes nothing was marked done. The backlog had also kept growing between the two windows. At the deploy the claimable backlog was about 2.3 times the before window's average, and its oldest row was 34 minutes old.

It kept growing until 13:32, to about 3.2 times the before average, while the first ticks worked through the switchover. Then it fell with almost every tick. It dropped below the before average at 14:46, and at 15:00 it was empty. Until 14:50 the oldest pending row was 20 to 42 minutes old. At 15:00 it was 6 minutes old, the quiet period and no more.

Dials did ease in the 14:00 hour, about 30% below the 13:00 hour, and that helped. But the 15:00 hour was about as busy as the two hours before it, and the backlog didn't come back. From 15:00 to 16:30, after the window, it stayed under a third of the before average, and the oldest pending row stayed between 7 and 13 minutes old. Every tick from 15:03 to 16:08 finished inside the 3-minute interval, in 12 to 157 seconds. From 16:09 they ran at about 3 minutes, right at the interval.

So for most of the window the summaries were no fresher than before, while the rollup worked off the switchover backlog at the busiest time of day. Once it had, the oldest pending row was 7 to 13 minutes old instead of 20 to 27. Part of that delay is by design: a row waits 6 quiet minutes before it can be claimed, then for the next tick to commit.

### Before and after

The after column is 17 November from 12:53 to 15:00 IST, unless a row says otherwise. The tick rows compare the same hours, 13:00 to 15:00 IST, on the earlier days.

| Measure | Before | After |
| --- | --- | --- |
| Tick p95, 5,000-row ticks | 471 s, 10 to 12 Nov, every 5 min | 746 s, every 3 min |
| Tick p95, 1,000-row ticks | 227 s, 14 to 16 Nov | n/a |
| Ticks over the interval | 25% over 5 min (10 to 12 Nov), 19% over 3 min (14 to 16 Nov) | 100% over 3 min, 16 of 16 |
| Cost per claimed row, median | 210 ms, 11:23 to 12:14 the same day | 91 ms, full ticks |
| Samples with writers blocked by the rollup | 93% | 0%, 12:53 to 13:53 |
| Writers blocked, average / max | 37 / 55 | 0 / 0, 12:53 to 13:53 |
| Longest lock wait | 223 s | 0.2 s, not on the rollup, 12:53 to 13:53 |
| Recording-upload writes timed out | 10% | 0% |
| Recording-upload write p95 | 119 s | 12 ms |
| Oldest pending row | 20 to 27 min | 20 to 42 min until 14:50, 6 min at 15:00 |

## What it showed, and what I would check next time

Two hours is a short look, but they were the busiest two hours of the day, and they answer the three questions I had going in.

- **Do the ticks keep up with the inflow?** In this window, yes. Each full tick took about 7 minutes and up to 15, but the rollup went from three times the before backlog to none in under 90 minutes, at peak load. After that the ticks fit inside the interval.
- **Did the recording timeouts stay at zero?** Yes. None timed out from 12:55 to 15:00, against 7 to 11% an hour that morning.
- **Did the oldest pending row come down?** Only at the end. It stayed 20 to 42 minutes old while the switchover backlog drained, then dropped to 6 minutes at 15:00, and stayed under 13 minutes until 16:30.

What this doesn't show yet is a full busy day, or why two ticks took 11 and 15 minutes. The new tail is worse per row than the 5,000-row ticks of 10 to 12 November, and the lock sampler only covered the first hour.

The bigger lesson is about where to look. The old rollup never failed. It succeeded on every run while 50 writers queued behind it, so no alert built on errors could have caught it. Next time a rollup gets slow, I would check two things first. First, lock waits by blocker: sample `pg_stat_activity`, follow `pg_blocking_pids()` up the chain and count who is stuck behind the job. Then tick duration against the interval, from pg_cron's run history. Those two numbers told the whole story here, before and after.
