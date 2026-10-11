For four days a nightly billing rollup failed every single night, and for four days pg_cron recorded every run as `succeeded`. Nothing alerted. This post explains how a failing job reported success, how I found it, and the two rules I follow with database cron jobs now.

## How the rollups work

Our analytics dashboards read from summary tables, not from the raw call logs. pg_cron runs PL/pgSQL functions on a schedule that fold new rows into those tables, every 5 minutes for voice and WhatsApp and every minute for video. A separate job rolled up billing once a night.

Every rollup function ended the same way:

```sql
EXCEPTION WHEN others THEN
  INSERT INTO rollup_failures (...) VALUES (...);
  RETURN -1;
```

The intent was good. Record the error, keep the job alive and try again next tick. The side effect was that pg_cron never saw an error. The function caught it, wrote a row and returned normally, so `cron.job_run_details` said `succeeded`.

## The four-day outage

From one night onward, the billing function failed with `column "billed_at" does not exist`. By the time I found it, 13,115 billed rows had not been rolled up.

The cause was a gap between the repository and the database. Someone had fixed the function's source in the repo to read from the right table, but the script that installs functions into the database had never been re-run. The fix existed only in source control. The database was still running the old function, which read from a table with no `billed_at` column.

I confirmed it by comparing the two directly. `pg_get_functiondef()` returns the definition actually installed in the database, and it did not match the file.

One more trap made this harder to see. pg_cron's background worker only runs jobs registered in the database named by its `cron.database_name` setting, which is usually `postgres`, not the application database. The run history lives there too, so you have to query `cron.job_run_details` from `postgres` even though the jobs run against the app database.

## The fix

I retired the separate nightly job and moved each channel's billing into that channel's analytics job, four jobs down to three. The important part was keeping billing and analytics as separate functions, each with its own exception handler.

A PL/pgSQL `EXCEPTION` block is a subtransaction. With separate handlers, a billing fault rolls back only the billing work while the same tick's analytics work still commits. Folding billing into the analytics function would have joined them into one failure domain. I tested it by forcing billing to fail and checking that analytics still wrote its rows.

## What the cost actually was

I measured one tick that claimed 5,000 rows from a table of 1.07 million:

| Step | Time |
| --- | --- |
| Claim the rows | 306 ms |
| Recompute the totals | 34 ms |
| Flag the rows as done | 1,090 ms |
| Whole tick | 2,382 ms |

The recompute everyone worried about was 1.4% of the time. Updating the done flag dominated, and it grows with the number of rows claimed, so the batch size is the setting that actually controls cost. Once caught up, a normal tick takes about 31 ms. I also had to run `ANALYZE` on the temporary table built inside the function. Without it, the planner assumed 1,270 rows for a table holding one and scanned far more than it needed to.

## A second silent failure

A few weeks later the dashboards froze for about three and a half hours while pg_cron again reported success and the failure table stayed empty.

The jobs claim pending rows in order of `updated_at`. A bulk write outside the app had re-marked about 180,000 old rows as pending without touching `updated_at`, so all of them sorted ahead of live traffic. Each tick went from about 100 ms to 10 to 30 seconds while it worked through the backlog, and the live summaries waited behind it. It healed itself once the backlog drained. A tick time that jumps from milliseconds to tens of seconds is the sign to look for.

## Two rules I follow now

1. **Monitor the work, not the scheduler.** Alert on rows in the failure table and on the count of pending rows. pg_cron's status only tells you the function returned.
2. **Never assume the database matches the repo.** After deploying a database function, compare `pg_get_functiondef()` with the file, or make the deploy pipeline install it so the two cannot drift.
