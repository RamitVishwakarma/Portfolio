#!/usr/bin/env python3
"""Static SVG charts for the lock-free rollup post.

Reads the sampler CSVs from a data directory and writes SVGs that match the
site's dark palette. Standard library only.

    python3 scripts/rollup-post-charts.py DATA_DIR public/blog/lock-free-rollup-review \
        [--suffix before] [--days "14 to 16 November"] [--last 2026-11-16] [--deploy 2026-11-17]

Inputs (in DATA_DIR). With --suffix S other than "before", each file is read
as <name>_S.csv (locks_prod_after.csv, ticks_prod_all_after.csv, ...) and a chart
whose input is missing is skipped:
  ticks_prod_by_hour_ist.csv  hour_ist,runs,p50_s,p95_s,max_s,pct_over_180s
  ticks_prod_all.csv          start_time (UTC),dur_s,status
  locks_prod.csv              ts,waiters,blocked_by_rollup,max_wait_s,max_wait_by_rollup_s,
                              rollup_running,rollup_running_s
  ticks_window.csv (optional) start_time (UTC),dur_s,status for the locks window; when
                              present its start times draw the "new tick starts" lines
  writers_hourly.csv          writer,ts_utc_epoch,count,p50_s,p95_s,p99_s,max_s,errors per
                              hour (from SigNoz traces); draws the recording-write timeline
                              and is never suffixed: one file spans before and after
--days is the day range named in the by-hour chart title, --last the last day of the
daily chart, --deploy a day to mark on the daily chart with a vertical line, and
--deploy-at the UTC instant (2026-11-17T07:30:00Z) marked on the recording-writes chart,
which is drawn only when --deploy-at is given.
"""
import csv
import datetime as dt
import os
import sys
from collections import defaultdict
from xml.sax.saxutils import escape

BG = "#000000"
TEXT = "#FFFFFF"
MUTED = "#b0b0b0"
GRID = "#3d3d3d"
P50 = "#77effd"
P95 = "#a8fe96"
MAX = "#ffc67e"
LIMIT = "#ff8885"
IST = dt.timedelta(hours=5, minutes=30)

W, H = 760, 400
ML, MR, MT, MB = 60, 24, 74, 48


def pct(xs, p):
    xs = sorted(xs)
    k = (len(xs) - 1) * p
    f = int(k)
    c = min(f + 1, len(xs) - 1)
    return xs[f] + (xs[c] - xs[f]) * (k - f)


def svg_open(label, title, h=H):
    return [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {h}" '
        f'font-family="Helvetica, Arial, sans-serif" font-size="12" role="img" '
        f'aria-label="{escape(label)}">',
        f'<rect width="{W}" height="{h}" fill="{BG}"/>',
        f'<text x="24" y="32" font-size="15" font-weight="700" fill="{TEXT}">{escape(title)}</text>',
    ]


def legend(items, x=24, y=54):
    out = []
    for kind, color, label in items:
        if kind == "bar":
            out.append(f'<rect x="{x}" y="{y - 9}" width="12" height="10" rx="2" fill="{color}"/>')
        elif kind == "dash":
            out.append(f'<path d="M{x} {y - 4}H{x + 18}" stroke="{color}" stroke-width="2" stroke-dasharray="5 4"/>')
        elif kind == "vline":
            out.append(f'<path d="M{x + 6} {y - 11}V{y + 2}" stroke="{color}" stroke-width="1"/>')
        else:
            out.append(f'<path d="M{x} {y - 4}H{x + 18}" stroke="{color}" stroke-width="2.5"/>')
        tx = x + (18 if kind in ("bar", "vline") else 24)
        out.append(f'<text x="{tx}" y="{y}" fill="{MUTED}">{escape(label)}</text>')
        x = tx + 6.6 * len(label) + 26
    return out


def y_axis(top, bottom, vmax, step, fmt=lambda v: f"{v:g}", unit="s"):
    out = []
    v = 0
    while v <= vmax + 1e-9:
        y = bottom - (bottom - top) * v / vmax
        out.append(f'<path d="M{ML} {y:.1f}H{W - MR}" stroke="{GRID}" stroke-width="1"/>')
        out.append(f'<text x="{ML - 8}" y="{y + 4:.1f}" text-anchor="end" fill="{MUTED}">{fmt(v)}{unit}</text>')
        v += step
    return out


def poly(points):
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in points)


# 1. Tick runtime p50/p95 by IST hour, with the 3-minute interval.
def src(data, name, suffix):
    """Path of a data file for this suffix, or None if it does not exist."""
    base, ext = os.path.splitext(name)
    p = os.path.join(data, name if suffix == "before" else f"{base}_{suffix}{ext}")
    return p if os.path.exists(p) else None


def chart_by_hour(data, out, suffix="before", days="14 to 16 November"):
    path = src(data, "ticks_prod_by_hour_ist.csv", suffix)
    if not path:
        print(f"skip {out}: no ticks_prod_by_hour_ist file for --suffix {suffix}")
        return
    rows = list(csv.DictReader(open(path)))
    top, bottom = MT, H - MB
    # The y axis grows past 6 minutes only when a bar would be clipped.
    vmax = max(360, -(-max(float(r["p95_s"]) for r in rows) // 60) * 60)
    step = 60 if vmax <= 360 else 120
    vmax = -(-vmax // step) * step
    calling = [r for r in rows if 9 <= int(r["hour_ist"]) <= 20]
    lo, hi = min(float(r["p95_s"]) for r in calling), max(float(r["p95_s"]) for r in calling)
    c0, c1 = min(int(r["hour_ist"]) for r in calling), max(int(r["hour_ist"]) for r in calling)
    s = svg_open(
        f"Tick runtime by hour of day in IST, {days}. From {c0:02d}:00 to {c1:02d}:59 the p95 is "
        f"{lo:.0f} to {hi:.0f} seconds against the 180-second interval.",
        f"Tick runtime by hour of day (IST), {days}",
    )
    s += legend([("bar", P50, "p50"), ("bar", P95, "p95"), ("dash", LIMIT, "180 s interval")])
    s += y_axis(top, bottom, vmax, step)
    plot_w = W - ML - MR
    # A full day gets 24 slots; a shorter window only the hours it covers.
    h0 = 0 if len(rows) >= 12 else min(int(r["hour_ist"]) for r in rows)
    nh = 24 if len(rows) >= 12 else max(int(r["hour_ist"]) for r in rows) - h0 + 1
    every = 3 if nh > 8 else 1
    slot = plot_w / nh
    bw = slot * 0.36
    for r in rows:
        h = int(r["hour_ist"])
        x0 = ML + slot * (h - h0) + slot * 0.12
        for i, (key, color) in enumerate((("p50_s", P50), ("p95_s", P95))):
            v = float(r[key])
            bh = (bottom - top) * min(v, vmax) / vmax
            s.append(f'<rect x="{x0 + i * bw:.1f}" y="{bottom - bh:.1f}" width="{bw - 1:.1f}" '
                     f'height="{bh:.1f}" rx="1.5" fill="{color}"/>')
        if h % every == 0:
            s.append(f'<text x="{ML + slot * (h - h0) + slot / 2:.1f}" y="{bottom + 18}" text-anchor="middle" '
                     f'fill="{MUTED}">{h:02d}:00</text>')
    y180 = bottom - (bottom - top) * 180 / vmax
    s.append(f'<path d="M{ML} {y180:.1f}H{W - MR}" stroke="{LIMIT}" stroke-width="2" stroke-dasharray="5 4"/>')
    s.append("</svg>")
    open(out, "w").write("\n".join(s) + "\n")


# 2. Daily p95 and max tick runtime, with the schedule interval as a step.
def chart_daily(data, out, suffix="before", first=dt.date(2026, 10, 9), last=dt.date(2026, 11, 16),
                switch=dt.date(2026, 11, 13), deploy=None):
    path = src(data, "ticks_prod_all.csv", suffix)
    if not path:
        print(f"skip {out}: no ticks_prod_all file for --suffix {suffix}")
        return
    days = defaultdict(list)
    for r in csv.DictReader(open(path)):
        if not r["dur_s"]:
            continue
        t = dt.datetime.fromisoformat(r["start_time"].replace("+00", "+00:00")) + IST
        if first <= t.date() <= last:
            days[t.date()].append(float(r["dur_s"]))
    keys = sorted(days)
    top, bottom = MT, H - MB
    vmax, step = max(700, -(-max(max(v) for v in days.values()) // 100) * 100), 100
    plot_w = W - ML - MR
    n = (last - first).days

    def x(d):
        return ML + plot_w * (d - first).days / n

    def y(v):
        return bottom - (bottom - top) * v / vmax

    span = f'{first.day} {first.strftime("%B")} to {last.day} {last.strftime("%B")}'
    worst = max(max(days[d]) for d in keys)
    s = svg_open(
        f"Daily p95 and maximum tick runtime from {span}. The p95 climbs from a few seconds "
        f"to several minutes and passes the interval on the worst days; the worst single run "
        f"took {worst:.0f} seconds." + (f" The deploy on {deploy.day} {deploy.strftime('%B')} is marked." if deploy else ""),
        f"Daily tick runtime (IST days), {span}",
    )
    items = [("line", P95, "p95"), ("line", MAX, "max"), ("dash", LIMIT, "schedule interval")]
    if deploy:
        items.append(("vline", MUTED, "lock-free rollup deployed"))
    s += legend(items)
    s += y_axis(top, bottom, vmax, step)
    s.append(f'<polyline fill="none" stroke="{MAX}" stroke-width="1.5" stroke-opacity="0.85" '
             f'points="{poly([(x(d), y(max(days[d]))) for d in keys])}"/>')
    s.append(f'<polyline fill="none" stroke="{P95}" stroke-width="2.5" '
             f'points="{poly([(x(d), y(pct(days[d], 0.95))) for d in keys])}"/>')
    xs = x(switch)
    s.append(f'<path d="M{ML} {y(300):.1f}H{xs:.1f}V{y(180):.1f}H{W - MR}" fill="none" '
             f'stroke="{LIMIT}" stroke-width="2" stroke-dasharray="5 4"/>')
    s.append(f'<text x="{ML + 6}" y="{y(300) - 6:.1f}" fill="{LIMIT}">every 5 min</text>')
    s.append(f'<text x="{W - MR}" y="{y(180) + 16:.1f}" text-anchor="end" fill="{LIMIT}">every 3 min</text>')
    if deploy:
        xd = x(deploy)
        s.append(f'<path d="M{xd:.1f} {top}V{bottom}" stroke="{MUTED}" stroke-width="1" stroke-dasharray="2 3"/>')
    d = first
    while d <= last:
        s.append(f'<text x="{x(d):.1f}" y="{bottom + 18}" text-anchor="middle" fill="{MUTED}">'
                 f'{d.strftime("%b")} {d.day}</text>')
        d += dt.timedelta(days=7)
    s.append("</svg>")
    open(out, "w").write("\n".join(s) + "\n")


# 3. Backends blocked by the rollup, and the longest wait, over the live sample window.
def chart_locks(data, out, suffix="before"):
    path = src(data, "locks_prod.csv", suffix)
    if not path:
        print(f"skip {out}: no locks_prod file for --suffix {suffix}")
        return
    rows = list(csv.DictReader(open(path)))
    ts = [dt.datetime.strptime(r["ts"], "%Y-%m-%dT%H:%M:%SZ") + IST for r in rows]
    blocked = [int(r["blocked_by_rollup"]) for r in rows]
    wait = [float(r["max_wait_by_rollup_s"]) for r in rows]
    running = [float(r["rollup_running_s"]) for r in rows]
    h = 490
    t0, t1 = ts[0], ts[-1]
    span = (t1 - t0).total_seconds()
    plot_w = W - ML - MR

    def x(t):
        return ML + plot_w * (t - t0).total_seconds() / span

    a_top, a_bot = MT + 22, MT + 182
    b_top, b_bot = a_bot + 56, h - MB
    bmax = max(60, (max(blocked) // 10 + 1) * 10)
    wmax = max(240, (int(max(wait)) // 60 + 1) * 60)

    window = f'{t0.strftime("%H:%M")} to {t1.strftime("%H:%M")} IST'
    s = svg_open(
        f"Writers blocked by the rollup and the longest wait, sampled about every 12 seconds "
        f"from {window}. Up to {max(blocked)} backends were waiting at once and the longest "
        f"wait was {max(wait):.0f} seconds.",
        f"Writers blocked by the rollup, live samples {window}",
        h,
    )
    s += legend([("line", P95, "blocked backends"), ("line", MAX, "longest wait"),
                 ("vline", MUTED, "new tick starts")])

    def axis(top, bottom, vmax, step, unit):
        out = []
        v = 0
        while v <= vmax + 1e-9:
            yy = bottom - (bottom - top) * v / vmax
            out.append(f'<path d="M{ML} {yy:.1f}H{W - MR}" stroke="{GRID}" stroke-width="1"/>')
            out.append(f'<text x="{ML - 8}" y="{yy + 4:.1f}" text-anchor="end" fill="{MUTED}">{v:g}{unit}</text>')
            v += step
        return out

    s += axis(a_top, a_bot, bmax, bmax // 3 if bmax % 3 == 0 else 20, "")
    s += axis(b_top, b_bot, wmax, 60, "s")
    s.append(f'<text x="{ML}" y="{a_top - 12}" fill="{TEXT}" font-size="12" font-weight="700">Backends waiting on the rollup</text>')
    s.append(f'<text x="{ML}" y="{b_top - 12}" fill="{TEXT}" font-size="12" font-weight="700">Longest current wait</text>')

    starts = []
    ticks_path = src(data, "ticks_window.csv", suffix)
    if ticks_path:
        # Exact tick starts from pg_cron's history.
        for r in csv.DictReader(open(ticks_path)):
            starts.append(dt.datetime.fromisoformat(r["start_time"].replace("+00", "+00:00"))
                          .replace(tzinfo=None) + IST)
    else:
        # Infer: when the running counter drops, a tick started running[i] seconds ago.
        for i in range(1, len(rows)):
            if running[i] < running[i - 1]:
                starts.append(ts[i] - dt.timedelta(seconds=running[i]))
    for ts_start in starts:
        if t0 <= ts_start <= t1:
            xx = x(ts_start)
            s.append(f'<path d="M{xx:.1f} {a_top}V{b_bot}" stroke="{MUTED}" stroke-width="1" '
                     f'stroke-opacity="0.6"/>')

    def yb(v):
        return a_bot - (a_bot - a_top) * v / bmax

    def yw(v):
        return b_bot - (b_bot - b_top) * v / wmax

    pts = [(x(t), yb(v)) for t, v in zip(ts, blocked)]
    area = [(pts[0][0], a_bot)] + pts + [(pts[-1][0], a_bot)]
    s.append(f'<polygon fill="{P95}" fill-opacity="0.18" points="{poly(area)}"/>')
    s.append(f'<polyline fill="none" stroke="{P95}" stroke-width="2" points="{poly(pts)}"/>')
    s.append(f'<polyline fill="none" stroke="{MAX}" stroke-width="2" '
             f'points="{poly([(x(t), yw(v)) for t, v in zip(ts, wait)])}"/>')

    tick = t0.replace(second=0, microsecond=0)
    tick += dt.timedelta(minutes=(5 - tick.minute % 5) % 5)
    while tick <= t1:
        s.append(f'<text x="{x(tick):.1f}" y="{b_bot + 18}" text-anchor="middle" fill="{MUTED}">'
                 f'{tick.strftime("%H:%M")}</text>')
        tick += dt.timedelta(minutes=5)
    s.append("</svg>")
    open(out, "w").write("\n".join(s) + "\n")


# 4. The recording-upload write over time: hourly p95 (log scale) and the share that timed out.
def chart_writer(data, out, deploy_at=None, writer="recording_upload"):
    path = os.path.join(data, "writers_hourly.csv")
    if not os.path.exists(path):
        print(f"skip {out}: no writers_hourly.csv")
        return
    rows = [r for r in csv.DictReader(open(path)) if r["writer"] == writer and int(r["count"]) > 0]
    rows.sort(key=lambda r: int(r["ts_utc_epoch"]))
    ts = [dt.datetime.fromtimestamp(int(r["ts_utc_epoch"]), dt.timezone.utc).replace(tzinfo=None) + IST
          for r in rows]
    p95 = [max(float(r["p95_s"]), 0.001) for r in rows]
    fail = [100.0 * int(r["errors"]) / int(r["count"]) for r in rows]
    h = 490
    t0 = ts[0].replace(hour=0, minute=0, second=0)
    t1 = ts[-1] + dt.timedelta(hours=1)
    span = (t1 - t0).total_seconds()
    plot_w = W - ML - MR

    def x(t):
        return ML + plot_w * (t - t0).total_seconds() / span

    a_top, a_bot = MT + 22, MT + 182
    b_top, b_bot = a_bot + 56, h - MB
    import math
    lo, hi = -3, 3  # 1 ms to 1000 s

    def ya(v):
        return a_bot - (a_bot - a_top) * (math.log10(v) - lo) / (hi - lo)

    fmax = max(10, (int(max(fail)) // 10 + 1) * 10)

    def yb(v):
        return b_bot - (b_bot - b_top) * v / fmax

    first, last = ts[0], ts[-1]
    period = f'{first.day} {first.strftime("%B")} to {last.day} {last.strftime("%B")}'
    s = svg_open(
        f"The recording-upload write to the call logs, hourly from {period}. The top panel is the "
        f"p95 latency on a log scale from 1 millisecond to 1000 seconds; the bottom panel is the "
        f"share of writes that hit the 120-second timeout."
        + (" The deploy of the lock-free rollup is marked." if deploy_at else ""),
        f"Recording-upload writes, hourly, {period}",
        h,
    )
    items = [("line", P95, "p95 latency"), ("line", LIMIT, "writes timed out")]
    if deploy_at:
        items.append(("vline", MUTED, "lock-free rollup deployed"))
    s += legend(items)
    for e in range(lo, hi + 1):
        yy = ya(10 ** e)
        label = {-3: "1 ms", -2: "10 ms", -1: "100 ms", 0: "1 s", 1: "10 s", 2: "100 s", 3: "1000 s"}[e]
        s.append(f'<path d="M{ML} {yy:.1f}H{W - MR}" stroke="{GRID}" stroke-width="1"/>')
        s.append(f'<text x="{ML - 8}" y="{yy + 4:.1f}" text-anchor="end" fill="{MUTED}">{label}</text>')
    v = 0
    while v <= fmax + 1e-9:
        yy = yb(v)
        s.append(f'<path d="M{ML} {yy:.1f}H{W - MR}" stroke="{GRID}" stroke-width="1"/>')
        s.append(f'<text x="{ML - 8}" y="{yy + 4:.1f}" text-anchor="end" fill="{MUTED}">{v:g}%</text>')
        v += fmax // 2 if fmax <= 20 else 10
    s.append(f'<text x="{ML}" y="{a_top - 12}" fill="{TEXT}" font-size="12" font-weight="700">p95 write latency (log scale)</text>')
    s.append(f'<text x="{ML}" y="{b_top - 12}" fill="{TEXT}" font-size="12" font-weight="700">Writes that timed out</text>')
    if deploy_at:
        xd = x(deploy_at + IST)
        s.append(f'<path d="M{xd:.1f} {a_top}V{b_bot}" stroke="{MUTED}" stroke-width="1" stroke-dasharray="2 3"/>')
    s.append(f'<polyline fill="none" stroke="{P95}" stroke-width="2" '
             f'points="{poly([(x(t), ya(v)) for t, v in zip(ts, p95)])}"/>')
    pts = [(x(t), yb(v)) for t, v in zip(ts, fail)]
    area = [(pts[0][0], b_bot)] + pts + [(pts[-1][0], b_bot)]
    s.append(f'<polygon fill="{LIMIT}" fill-opacity="0.18" points="{poly(area)}"/>')
    s.append(f'<polyline fill="none" stroke="{LIMIT}" stroke-width="2" points="{poly(pts)}"/>')
    d = t0
    while d <= t1:
        s.append(f'<text x="{x(d):.1f}" y="{b_bot + 18}" text-anchor="middle" fill="{MUTED}">'
                 f'{d.strftime("%b")} {d.day}</text>')
        d += dt.timedelta(days=1)
    s.append("</svg>")
    open(out, "w").write("\n".join(s) + "\n")


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    data, out = sys.argv[1], sys.argv[2]

    def opt(name, default):
        return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default

    suffix = opt("--suffix", "before")
    days = opt("--days", "14 to 16 November")
    last = dt.date.fromisoformat(opt("--last", "2026-11-16"))
    deploy = opt("--deploy", None)
    deploy_at = opt("--deploy-at", None)  # UTC, e.g. 2026-11-17T07:30:00Z
    deploy_at = dt.datetime.fromisoformat(deploy_at.replace("Z", "")) if deploy_at else None
    deploy = dt.date.fromisoformat(deploy) if deploy else (deploy_at.date() if deploy_at else None)
    os.makedirs(out, exist_ok=True)
    chart_by_hour(data, os.path.join(out, f"tick-runtime-by-hour-{suffix}.svg"), suffix, days)
    chart_daily(data, os.path.join(out, f"tick-runtime-daily-{suffix}.svg"), suffix, last=last, deploy=deploy)
    chart_locks(data, os.path.join(out, f"blocked-writers-{suffix}.svg"), suffix)
    if deploy_at:
        chart_writer(data, os.path.join(out, "recording-writes.svg"), deploy_at)


if __name__ == "__main__":
    main()
