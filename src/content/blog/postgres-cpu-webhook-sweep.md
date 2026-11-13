On 11 September 2026 our production Postgres went from 16% CPU to 99.8% within twenty minutes of calling hours opening, and stayed there for at least four hours. Lead uploads started failing. This post covers how I found the one query behind it, why its cost grew with the square of campaign size, and what the fix changed.

## The first symptom

The first report was about an upload, not CPU. A CSV lead upload had failed with Prisma's `P2028` error. The insert transaction had a 90-second budget and took 118 seconds, on an ordinary file of 7,427 rows. A higher timeout would only have moved the failure to MongoDB's 60-second transaction limit, so I looked at the database.

This is the database CPU from Cloud Monitoring, in 10-minute averages:

| Time, IST | Database CPU |
| --- | --- |
| 07:56 | 15.9% |
| 08:06 | 61% |
| 08:16 to 12:16 | 99.7% to 99.8% in every bucket |

Calling hours open at 8 AM, so the load started when the calls did.

## Finding the query

`pg_stat_statements` was not installed. Every service also connected with an empty `application_name` from the same cluster egress IP, so I could not tell which service a backend belonged to. Only the query text told them apart.

I sampled `pg_stat_activity` twelve times. In each sample I kept the active backends with no wait event, because those are the ones using CPU, and grouped them by query text. One query accounted for **94% of on-CPU backends**. In each sample, 39 to 51 backends were running `FetchUnclaimedTerminalPhoneLogsForBatch` from our Go producer service. A run took 6 seconds on average and up to 27, and 1 to 3 new runs started every second.

That query is the webhook sweep. When a call finishes, its result has to reach every webhook the customer configured. The sweep finds finished calls whose results have not been sent yet.

I checked the other suspects before blaming it:

- **The pg_cron rollups.** Every run that morning finished in under 20 seconds.
- **More traffic.** Call attempts per hour were the same as the day before or lower. On the previous day, with the old producer code, 2,000 to 10,000 attempts an hour ran at 20% to 40% CPU.
- **Autovacuum.** A vacuum of `calls` had been stuck for two hours. The load slowed it down. It did not cause the load.

The one change was a producer deploy at 20:20 IST the evening before.

## Two defects that multiplied

**The first was fan-out.** A refactor from 31 August, which reached production in that deploy, made every per-call trigger sweep the whole batch. Before it, a finished call looked up only its own log. After it, every call status event scanned every unsent log in the campaign. The number of status events grows with the batch size, and so does the cost of each sweep, so the total work grows with the square of the batch size. The active batches that morning had 26,000 to 37,000 calls each.

**The second was the plan.** The sweep paged through results with this query:

```sql
SELECT c.id, pl.id, pl.request_uuid
FROM calls c
JOIN phone_logs pl ON pl.call_id = c.id
WHERE c.batch_id = $1
  AND (... not yet sent to every webhook ...)
  AND (c.id, pl.id) > ($4, $5)
ORDER BY c.id, pl.id
LIMIT 30
```

Because of `ORDER BY c.id LIMIT 30`, Postgres walked the `calls` primary key in order and filtered on `batch_id`. It expected to find 30 matches near the start. That meant reading all of the roughly 2 million calls, 443,000 of them dead tuples, instead of using the batch index. Most logs had already been sent, so the 30 matches rarely came early and almost every sweep read to the end of the index. Postgres also applied the keyset condition as a join filter, not as an index condition, so every page started again from the beginning.

With both defects, every finished call started a walk of the whole `calls` primary key.

## The fix

Killing backends did not help, because every finished call started a new one. We merged the fix into the producer that afternoon. It changes three things:

1. **Per-call triggers no longer sweep.** A finished call now enqueues its own webhook and returns. The batch-wide sweep runs only when a batch completes or when someone asks for a manual resync, so the cost grows with the batch size again instead of its square.
2. **The "still unsent" check stops early.** It used to count the webhook rows for each log and compare the count with the number of integrations. Now it is a `NOT EXISTS` over the required integrations, so Postgres stops at the first missing one.
3. **Fewer rows reach that check.** The query now keeps only finished call statuses before anything else, and the page size is a setting instead of a fixed 30.

## What I took away

- **Group `pg_stat_activity` by query text first.** Twelve samples took a few minutes, needed no extension and found the cause.
- **Give every service an `application_name`.** It is one line in each connection string, and it would have named the service in the first sample.
- **Batch-wide work on a per-call trigger is quadratic.** I look for that pattern in code review now. It passes every test on small batches and fails only at production size.
- **`ORDER BY primary key LIMIT n` can make the planner walk the whole primary key.** Run `EXPLAIN` against a production-sized batch, not a test fixture.
- **Compare with the day before.** Attempts per hour matched the previous day, which showed the deploy caused the outage and the traffic did not.
