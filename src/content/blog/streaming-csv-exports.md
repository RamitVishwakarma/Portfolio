At work, our Node.js API pods on Kubernetes kept restarting at odd times, and every restart took unrelated requests down with it. It looked random. It was not. The trigger was someone else's CSV download. This post covers what I measured, why the liveness probe fired, and how a streamed export solved it.

## What the old export did

The export endpoint loaded every row from the database, built a transformed copy of each row, turned each row into a CSV line, joined all the lines into one string and sent that string as the response. Nothing streamed. Every stage held its own full copy of the data.

## What I measured

I ran the old path against 300,000 rows, which produces a CSV of about 100 MB, and watched the process memory after each stage:

| Stage | Resident memory |
| --- | --- |
| Rows loaded from the database | 221 MB |
| Transformed rows | 304 MB |
| One CSV string per row | 456 MB |
| All rows joined into one string | 567 MB |
| Response buffer | 663 MB |

The same export streamed row by row peaked at 87 MB, so the buffered version needed 7.6 times the memory. Joining the strings also blocked the event loop for 1.32 seconds in one synchronous call.

## Why the pod restarted

Memory alone did not kill the pod. The liveness probe did.

Each pod ran two worker processes. The liveness probe called `/health` with a 5-second timeout and restarted the container after three failures in a row. Two large exports at the same time blocked both workers, `/health` stopped answering, and about 30 seconds later the kubelet restarted the container, taking every request in flight with it.

Garbage collection made it worse. A pause on a heap of more than 600 MB can blow a 5-second timeout without any other help.

## A hard ceiling nobody had hit yet

V8 limits a single string to 536,870,888 characters, about 512 MB. Past that, building the string throws `RangeError: Invalid string length`. Any CSV larger than that could never be exported through the old path, however much memory the pod had. At 7.6 times overhead, a CSV close to that limit would also need around 4 GB of heap first.

## The streamed export

For the logs page I built a separate export service in Go that streams from Postgres to the browser:

1. It reads rows from the query one at a time and writes each one as a CSV line as soon as it arrives.
2. The output goes through gzip on its way to the socket. Nothing is stored in memory or on disk.
3. The response is sent with `Content-Encoding: gzip`, not as a `.csv.gz` file. The browser decompresses it, so the user saves a normal `.csv` while the network carries the compressed bytes.

On a 301,000-row export, the transfer dropped from 110.7 MB to 23.2 MB, 4.8 times smaller.

The service runs as a Cloud Run function with minimum instances set to zero. It holds no queue, no cron job and no state, so between the handful of exports a day there is nothing to pay for. Two details kept streaming working inside a function:

- **The response writer must still flush.** The functions framework passes the underlying HTTP writer through unwrapped, so each flush reaches the socket. I noted it as something to re-check whenever the framework is upgraded, because a wrapped writer would buffer the whole export again.
- **The timeout cancels the query.** The request deadline comes from the function's timeout, so a client that gives up also stops the database work.

## What I took away

- **Measure each stage, not just the peak.** The table above showed five copies of the same data, which made the fix obvious.
- **Read the probe settings before blaming memory.** The restart came from a blocked event loop failing a health check.
- **Know your runtime's hard limits.** The V8 string limit turns "slow for big exports" into "impossible for big exports".
- **Stream by default for anything a user can make arbitrarily large.** Exports, reports and backups all belong in that group.
