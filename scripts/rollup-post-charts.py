#!/usr/bin/env python3
"""Static SVG charts for the lock-free rollup post.

Reads the sampler CSVs from a data directory and writes SVGs that match the
site's dark palette. Standard library only.

    python3 scripts/rollup-post-charts.py DATA_DIR public/blog/lock-free-rollup-review [--suffix before]

Inputs (in DATA_DIR):
  ticks_prod_by_hour_ist.csv  hour_ist,runs,p50_s,p95_s,max_s,pct_over_180s
  ticks_prod_all.csv          start_time (UTC),dur_s,status
  locks_prod.csv              ts,waiters,blocked_by_rollup,max_wait_s,max_wait_by_rollup_s,
                              rollup_running,rollup_running_s
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
def chart_by_hour(data, out):
    rows = list(csv.DictReader(open(os.path.join(data, "ticks_prod_by_hour_ist.csv"))))
    top, bottom = MT, H - MB
    vmax, step = 360, 60
    s = svg_open(
        "Tick runtime by hour of day in IST. Overnight ticks take seconds; from 09:00 to 20:59 "
        "the p95 is 210 to 320 seconds, above the 180-second interval.",
        "Tick runtime by hour of day (IST), 14 to 16 November",
    )
    s += legend([("bar", P50, "p50"), ("bar", P95, "p95"), ("dash", LIMIT, "180 s interval")])
    s += y_axis(top, bottom, vmax, step)
    plot_w = W - ML - MR
    slot = plot_w / 24
    bw = slot * 0.36
    for r in rows:
        h = int(r["hour_ist"])
        x0 = ML + slot * h + slot * 0.12
        for i, (key, color) in enumerate((("p50_s", P50), ("p95_s", P95))):
            v = float(r[key])
            bh = (bottom - top) * min(v, vmax) / vmax
            s.append(f'<rect x="{x0 + i * bw:.1f}" y="{bottom - bh:.1f}" width="{bw - 1:.1f}" '
                     f'height="{bh:.1f}" rx="1.5" fill="{color}"/>')
        if h % 3 == 0:
            s.append(f'<text x="{ML + slot * h + slot / 2:.1f}" y="{bottom + 18}" text-anchor="middle" '
                     f'fill="{MUTED}">{h:02d}:00</text>')
    y180 = bottom - (bottom - top) * 180 / vmax
    s.append(f'<path d="M{ML} {y180:.1f}H{W - MR}" stroke="{LIMIT}" stroke-width="2" stroke-dasharray="5 4"/>')
    s.append("</svg>")
    open(out, "w").write("\n".join(s) + "\n")


# 2. Daily p95 and max tick runtime, with the schedule interval as a step.
def chart_daily(data, out, first=dt.date(2026, 10, 9), last=dt.date(2026, 11, 16),
                switch=dt.date(2026, 11, 13)):
    days = defaultdict(list)
    for r in csv.DictReader(open(os.path.join(data, "ticks_prod_all.csv"))):
        if not r["dur_s"]:
            continue
        t = dt.datetime.fromisoformat(r["start_time"].replace("+00", "+00:00")) + IST
        if first <= t.date() <= last:
            days[t.date()].append(float(r["dur_s"]))
    keys = sorted(days)
    top, bottom = MT, H - MB
    vmax, step = 700, 100
    plot_w = W - ML - MR
    n = (last - first).days

    def x(d):
        return ML + plot_w * (d - first).days / n

    def y(v):
        return bottom - (bottom - top) * v / vmax

    s = svg_open(
        "Daily p95 and maximum tick runtime from 9 October to 16 November. The p95 climbs from "
        "a few seconds to several minutes and passes the interval on the worst days; the worst "
        "single run took 604 seconds.",
        "Daily tick runtime (IST days), 9 October to 16 November",
    )
    s += legend([("line", P95, "p95"), ("line", MAX, "max"), ("dash", LIMIT, "schedule interval")])
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
    d = first
    while d <= last:
        s.append(f'<text x="{x(d):.1f}" y="{bottom + 18}" text-anchor="middle" fill="{MUTED}">'
                 f'{d.strftime("%b")} {d.day}</text>')
        d += dt.timedelta(days=7)
    s.append("</svg>")
    open(out, "w").write("\n".join(s) + "\n")


# 3. Backends blocked by the rollup, and the longest wait, over the live sample window.
def chart_locks(data, out):
    rows = list(csv.DictReader(open(os.path.join(data, "locks_prod.csv"))))
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

    for i in range(1, len(rows)):
        if running[i] < running[i - 1]:
            # The tick started roughly running[i] seconds before this sample.
            ts_start = ts[i] - dt.timedelta(seconds=running[i])
            if ts_start >= t0:
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


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    data, out = sys.argv[1], sys.argv[2]
    suffix = sys.argv[sys.argv.index("--suffix") + 1] if "--suffix" in sys.argv else "before"
    os.makedirs(out, exist_ok=True)
    chart_by_hour(data, os.path.join(out, f"tick-runtime-by-hour-{suffix}.svg"))
    chart_daily(data, os.path.join(out, f"tick-runtime-daily-{suffix}.svg"))
    chart_locks(data, os.path.join(out, f"blocked-writers-{suffix}.svg"))


if __name__ == "__main__":
    main()
