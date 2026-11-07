"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import { swarm, type Agent } from "./engine";

/** A cursor's status chip shows once it has stayed on a job this long... */
const STATUS_DELAY = 600;
/** ...stays up this long... */
const STATUS_MS = 1200;
/** ...and only this many show at once. */
const STATUS_MAX = 3;
const RAINBOW = [
  "#ff8885",
  "#ffc67e",
  "#fafe8e",
  "#a8fe96",
  "#77effd",
  "#9e8bfd",
  "#ff9dfb",
];

function rgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

interface Box {
  l: number;
  t: number;
  r: number;
  b: number;
}
const hits = (a: Box, b: Box) =>
  a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;

function useSwarm() {
  return useSyncExternalStore(
    swarm.subscribe,
    swarm.getSnapshot,
    swarm.getServerSnapshot
  );
}

/** Per-cursor drawing state kept beside the engine's agent. */
interface Extra {
  sel: HTMLElement;
  badge: HTMLElement;
  caret: HTMLElement;
  lx?: number;
  ly?: number;
  movedAt?: number;
  /** Index of the default spot last used, kept while it stays clear. */
  place?: number;
  /** When placement last failed; the label hides only after a short grace. */
  failedAt?: number;
  fixed?: boolean;
  tags?: HTMLElement | null;
  /** Had a label last frame (keeps the capped slots from changing hands). */
  shown?: boolean;
  ripples: WeakSet<object>;
}
const extras = new WeakMap<Agent, Extra>();
/** Desktop shows at most this many names at once (typists first). */
const LABEL_MAX = 6;
let copyCache: { src: unknown; boxes: Box[] } = { src: null, boxes: [] };

const Cursor = ({ agent }: { agent: Agent }) => {
  const ref = useCallback(
    (root: HTMLDivElement | null) => {
      if (!root) {
        agent.dom = null;
        return;
      }
      agent.dom = {
        root,
        status: root.querySelector("[data-status]") as HTMLElement,
        chip: root.querySelector("[data-chip]") as HTMLElement,
        chipImg: root.querySelector("[data-chip-img]") as HTMLImageElement,
        chipLabel: root.querySelector("[data-chip-label]") as HTMLElement,
      };
    },
    [agent]
  );

  return (
    <div
      ref={ref}
      className={`swarm-cursor ${agent.mini ? "swarm-mini" : ""}`}
      style={{ opacity: 0 }}>
      <div className="swarm-body">
        <svg
          className="swarm-arrow"
          width="22"
          height="24"
          viewBox="0 0 22 24"
          fill="none">
          <path
            d="M3 2.5v16.2l4.4-4.1 2.9 6.6 3.1-1.35-2.85-6.45 6.15-.2L3 2.5z"
            fill={agent.color}
            stroke={agent.dark ? "#ffffff" : "#0b0b0b"}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
        <div className="swarm-tags">
          <span
            className={`whitespace-nowrap rounded-full px-2 py-[3px] font-ProductSans text-[11px] font-bold leading-none shadow-lg ring-1 ${
              agent.dark ? "text-white ring-white/40" : "text-black ring-black/60"
            }`}
            style={{ background: agent.color }}>
            {agent.name}
          </span>
          <span
            data-status
            className="whitespace-nowrap rounded-md border bg-black/85 px-1.5 py-[3px] font-mono text-[10px] leading-none text-white/85"
            style={{ display: "none", borderColor: rgba(agent.color, 0.6) }}
          />
          <span
            data-chip
            className="items-center gap-1.5 rounded-lg border bg-black/85 p-1 pr-2 shadow-2xl"
            style={{ display: "none", borderColor: agent.color }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img data-chip-img alt="" className="h-8 w-8 rounded object-cover" />
            <span
              data-chip-label
              className="whitespace-nowrap font-mono text-[10px] text-white/85"
            />
          </span>
        </div>
      </div>
    </div>
  );
};

/** Selection box and caret for one cursor, in page coordinates. */
const Marks = ({ agent }: { agent: Agent }) => {
  const ref = useCallback(
    (root: HTMLDivElement | null) => {
      if (!root) {
        extras.delete(agent);
        return;
      }
      extras.set(agent, {
        sel: root.querySelector("[data-sel]") as HTMLElement,
        badge: root.querySelector("[data-badge]") as HTMLElement,
        caret: root.querySelector("[data-caret]") as HTMLElement,
        ripples: new WeakSet(),
      });
    },
    [agent]
  );
  return (
    <div ref={ref}>
      <div
        data-sel
        className="swarm-sel"
        style={{
          display: "none",
          borderColor: agent.color,
          background: rgba(agent.color, 0.06),
          color: agent.color,
        }}>
        <i />
        <i />
        <i />
        <i />
        <span
          data-badge
          className="swarm-badge"
          style={{
            background: agent.color,
            color: agent.dark ? "#ffffff" : "#000000",
          }}
        />
      </div>
      <div
        data-caret
        className="swarm-caret"
        style={{ display: "none", background: agent.color }}
      />
    </div>
  );
};

/** The first thing keyboard users can reach: show the page without waiting. */
export const SwarmSkipLink = () => {
  const snap = useSwarm();
  const onHome = usePathname() === "/";
  if (!onHome || snap.phase !== "running") return null;
  return (
    <button
      data-swarm-ui
      onClick={() => {
        swarm.skip();
        // This button disappears with the build: hand focus to the content.
        const main = document.querySelector("main");
        if (main) {
          main.setAttribute("tabindex", "-1");
          main.focus();
        }
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[95] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:font-bold focus:text-black">
      Skip the animation and show the full page
    </button>
  );
};

/** The layer spans the whole document so cursors scroll with the page. */
function useDocHeight(active: boolean) {
  const [h, setH] = useState(0);
  useEffect(() => {
    if (!active) return;
    // body's own height, which the absolutely positioned layer doesn't add
    // to, so the page can still get shorter (rotation, resize).
    const measure = () => setH(document.body.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    return () => ro.disconnect();
  }, [active]);
  return h;
}

const SwarmOverlay = () => {
  const snap = useSwarm();
  const layerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onHome = usePathname() === "/";
  const live =
    onHome && (snap.phase === "running" || snap.phase === "finishing");
  const docH = useDocHeight(live);

  useEffect(
    () =>
      swarm.addDrawer((t) => {
        // Viewport values were read by the engine at the start of the frame,
        // before any cursor wrote to the page.
        const { sx, sy, vw, vh } = swarm.viewport;
        const phone = vw < 640;
        const taken: Box[] = [];
        let statuses = 0;
        // Text and buttons on screen: labels keep off them (rects read by
        // the engine at the start of the frame).
        if (copyCache.src !== swarm.obstacles) {
          copyCache = {
            src: swarm.obstacles,
            boxes: swarm.obstacles.map((r) => ({
              l: r.x - 3,
              t: r.y - 2,
              r: r.x + r.w + 3,
              b: r.y + r.h + 2,
            })),
          };
        }
        const copy = copyCache.boxes;
        // From the splash pills into the page every cursor keeps its name
        // (the splash just said each one is a tool); afterwards the names
        // drop to the cap one at a time.
        const flight = t - swarm.flightFrom;
        const firstFlight = swarm.flightFrom > 0 && flight < 1400;
        const cap = firstFlight
          ? Infinity
          : swarm.flightFrom > 0
          ? Math.max(LABEL_MAX, swarm.agents.length - Math.floor((flight - 1400) / 80))
          : LABEL_MAX;
        // Through the first flight labels may sit over the page copy (it's
        // still a ghost), so they don't hop when the splash finishes.
        const overSplash = firstFlight;
        // The first frames off the pills: names appear at full strength at
        // once, matching the pill names they replace (no fade-in blink).
        const instant = firstFlight && flight < 260;
        let labels = 0;
        let navLabels = 0;
        // Typists get first pick of label spots, then whoever had a label
        // last frame, so the capped slots don't change hands every frame.
        const rank = (a: Agent) =>
          (a.caret || a.lastCaret ? 2 : 0) + (extras.get(a)?.shown ? 1 : 0);
        const order = swarm.agents.slice().sort((p, q) => rank(q) - rank(p));

        for (const a of order) {
          const d = a.dom;
          if (!d) continue;
          const x = extras.get(a);
          const vx = a.x - sx;
          const vy = a.y - sy;
          const docked = a.docked && !a.task;
          // Moving cursors live in page coordinates, so the browser scrolls
          // them with the content; waiting ones and the finale ring are
          // pinned to the viewport.
          const pinned = docked || a.ringAngle !== null;
          if (x && x.fixed !== pinned) {
            x.fixed = pinned;
            d.root.style.position = pinned ? "fixed" : "absolute";
          }
          d.root.style.transform = pinned
            ? `translate3d(${vx}px, ${vy}px, 0)`
            : `translate3d(${a.x}px, ${a.y}px, 0)`;
          d.root.style.opacity = a.opacity.toFixed(3);
          if (d.root.hasAttribute("data-pressed") !== a.pressed) {
            d.root.toggleAttribute("data-pressed", a.pressed);
          }
          // Waiting cursors drift; on phones that includes one lingering at
          // the edge between jobs, so it never reads as a frozen page.
          const drift =
            docked ||
            (phone && a.active && !a.task && !a.moving && a.ringAngle === null);
          if (d.root.hasAttribute("data-docked") !== drift) {
            d.root.toggleAttribute("data-docked", drift);
          }

          // Labels show only while a cursor moves or works (on phones, only
          // while it types or carries an image), and fade rather than cut.
          if (x) {
            if (
              x.lx === undefined ||
              Math.abs(a.x - x.lx) + Math.abs(a.y - (x.ly ?? 0)) > 1.2
            ) {
              x.movedAt = t;
            }
            x.lx = a.x;
            x.ly = a.y;
          }
          const moving = t - (x?.movedAt ?? 0) < 600;
          const ringing = a.ringAngle !== null;
          const typing = !!a.task?.typing && !!(a.caret || a.lastCaret);
          // The nav row is short: at most two names there at once, counting
          // anyone at work in it or passing through it.
          const inNav =
            !ringing && (!!a.task?.el.closest(".sticky") || (vy > -20 && vy < 90));
          const quiet =
            a.mini ||
            (!ringing &&
              !firstFlight &&
              (phone ? !typing && !a.chip && !a.sel : !a.task && !moving)) ||
            (a.quiet && !a.task && !firstFlight) ||
            (!phone && !ringing && labels >= cap) ||
            (inNav && navLabels >= 2);

          // Status only while it's fresh and its target is on screen.
          const age = t - a.statusAt;
          const onLight = !!a.task?.el.closest('[data-swarm-surface="light"]');
          const status =
            !phone &&
            !onLight &&
            !quiet &&
            !a.chip &&
            a.status &&
            age > STATUS_DELAY &&
            age < STATUS_DELAY + STATUS_MS &&
            statuses < STATUS_MAX &&
            (!a.task || a.task.visible)
              ? a.status
              : "";
          if (status) statuses++;
          if (d.status.dataset.text !== status) {
            d.status.dataset.text = status;
            d.status.textContent = status;
            d.status.style.display = status ? "block" : "none";
          }
          const chipKey = a.chip ? `${a.chip.label}|${a.chip.src ?? ""}` : "";
          if (d.chip.dataset.key !== chipKey) {
            d.chip.dataset.key = chipKey;
            d.chip.style.display = a.chip ? "flex" : "none";
            if (a.chip) {
              d.chipLabel.textContent = a.chip.label;
              d.chipImg.style.display = a.chip.src ? "block" : "none";
              if (a.chip.src) d.chipImg.src = a.chip.src;
            }
          }

          // Place the label clear of other labels and of copy on screen,
          // fully inside the viewport. A cursor that is typing gets its name
          // in the margin on its caret's line. The last good spot is kept
          // while it stays clear, so labels don't hop about.
          let lx = 0;
          let ly = 0;
          let hide = quiet;
          const onScreen =
            !quiet && vx > -40 && vx < vw + 40 && vy > -40 && vy < vh + 40;
          if (onScreen) {
            const w = Math.max(
              a.name.length * 6.6 + 18,
              status ? status.length * 6.1 + 14 : 0,
              a.chip ? a.chip.label.length * 6.1 + 52 : 0
            );
            const h = 20 + (status ? 22 : 0) + (a.chip ? 44 : 0);
            const baseL = vx + 16;
            const baseT = vy + 20;
            const ring = a.ringAngle;
            const left = ring !== null ? Math.cos(ring) < -0.2 : vx > vw - 140;
            const up = ring !== null && Math.sin(ring) < -0.35;
            // Candidate spots: [left, top, own block allowed, default index].
            const spots: [number, number, boolean, number][] = [];
            const caret = a.caret ?? (typing ? a.lastCaret : null);
            const typingBox = caret && a.task?.typing ? a.task.typing.box() : null;
            if (typingBox && caret) {
              // A typist's name rides just after its caret (or just before
              // it near the line's end), over the ghost text it's about to
              // type; the margin is the fallback.
              const lineT = caret.y - sy + caret.h / 2 - 10;
              // Phones: a nav typist's name hangs just under the bar, clear
              // of the logo and links.
              if (phone && inNav) spots.push([caret.x - sx - 8, caret.y - sy + caret.h + 18, true, -1]);
              spots.push([caret.x - sx + 14, lineT, true, -1]);
              spots.push([caret.x - sx - 14 - w, lineT, true, -1]);
              spots.push([typingBox.x - sx - w - 12, lineT, false, -1]);
              spots.push([typingBox.x - sx + typingBox.w + 12, lineT, false, -1]);
            }
            if (a.sel) {
              // A block builder's name sits inside the box it's drawing:
              // up-left of the cursor when it drags forward, down-right when
              // it drags back from the far corner.
              const s0 = a.sel;
              const back =
                Math.abs(a.x - s0.x) + Math.abs(a.y - s0.y) <
                Math.abs(a.x - s0.x - s0.w) + Math.abs(a.y - s0.y - s0.h);
              const upLeft: [number, number, boolean, number] = [vx - w - 6, vy - 26, true, -1];
              const downRight: [number, number, boolean, number] = [vx + 16, vy + 20, true, -1];
              spots.push(back ? downRight : upLeft, back ? upLeft : downRight);
            }
            const flipL = vx + 4 - w;
            const defaults: [number, number][] = up
              ? [
                  [left ? flipL : baseL, baseT - h - 26],
                  [left ? baseL : flipL, baseT - h - 26],
                  [left ? flipL : baseL, baseT],
                ]
              : [
                  [left ? flipL : baseL, baseT],
                  [left ? baseL : flipL, baseT],
                  [left ? flipL : baseL, baseT + 22],
                  [left ? baseL : flipL, baseT + 22],
                  [left ? flipL : baseL, baseT - h - 26],
                  [left ? baseL : flipL, baseT - h - 26],
                ];
            if (x?.place !== undefined && defaults[x.place] && ring === null) {
              const [l0, t0] = defaults[x.place];
              spots.push([l0, t0, false, x.place]);
            }
            defaults.forEach(([l0, t0], i) => spots.push([l0, t0, false, i]));
            const own = typingBox ?? (a.sel && a.task ? a.sel : null);
            const ownBox = own
              ? {
                  l: own.x - sx - 4,
                  t: own.y - sy - 2,
                  r: own.x - sx + own.w + 4,
                  b: own.y - sy + own.h + 2,
                }
              : null;
            const fits = (box: Box) =>
              box.l >= 8 && box.r <= vw - 8 && box.t >= 8 && box.b <= vh - 8;
            let chosen: Box | null = null;
            let chosenIdx = -1;
            const clear = (box: Box, ownOk: boolean) =>
              fits(box) &&
              !taken.some((o) => hits(o, box)) &&
              // The finale ring sits over the page; everywhere else labels
              // keep off the copy (a typist may cover its own ghost text).
              (ring !== null ||
                overSplash ||
                !copy.some(
                  (o) =>
                    hits(o, box) &&
                    !(ownOk && ownBox && o.l >= ownBox.l - 6 && o.r <= ownBox.r + 6 && o.t >= ownBox.t - 6 && o.b <= ownBox.b + 6)
                ));
            for (const [l, top, ownOk, idx] of spots) {
              const box = { l, t: top, r: l + w, b: top + h };
              if (!clear(box, ownOk)) continue;
              chosen = box;
              chosenIdx = idx;
              break;
            }
            if (chosen) {
              taken.push(chosen);
              labels++;
              if (inNav) navLabels++;
              lx = chosen.l - baseL;
              ly = chosen.t - baseT;
              if (x) {
                // Only default spots are remembered: caret and margin spots
                // are relative to the line, not the cursor.
                x.place = chosenIdx >= 0 ? chosenIdx : undefined;
                x.failedAt = undefined;
              }
            } else {
              // Nowhere clean: hide straight away rather than drift onto copy.
              hide = true;
              if (x) x.place = undefined;
            }
          }
          if (d.root.hasAttribute("data-instant") !== instant) {
            d.root.toggleAttribute("data-instant", instant);
          }
          if (d.root.hasAttribute("data-quiet") !== hide) {
            d.root.toggleAttribute("data-quiet", hide);
          }
          if (x) x.shown = !hide;
          if (x && x.tags === undefined) {
            x.tags = d.root.querySelector<HTMLElement>(".swarm-tags");
          }
          // While hiding, the label keeps its last spot as it fades (it never
          // snaps back over the line below).
          const tags = x?.tags;
          if (tags && !hide) {
            const shift = lx || ly ? `translate(${lx}px, ${ly}px)` : "";
            if (tags.style.transform !== shift) tags.style.transform = shift;
          }

          if (!x) continue;
          // Selection box while dragging out a block.
          const sel = a.sel && a.sel.w > 0 && a.sel.h > 0 ? a.sel : null;
          x.sel.style.display = sel ? "block" : "none";
          if (sel) {
            x.sel.style.transform = `translate3d(${sel.x}px, ${sel.y}px, 0)`;
            x.sel.style.width = `${sel.w}px`;
            x.sel.style.height = `${sel.h}px`;
            x.sel.style.opacity = Math.max(0, sel.alpha).toFixed(3);
            // The size badge only once it's big enough to read.
            const readable = sel.w >= 40 && sel.h >= 16;
            x.badge.style.display = readable ? "block" : "none";
            const size = `${Math.round(sel.w)} × ${Math.round(sel.h)}`;
            if (readable && x.badge.textContent !== size) x.badge.textContent = size;
          }
          // Text caret while typing.
          x.caret.style.display = a.caret ? "block" : "none";
          if (a.caret) {
            x.caret.style.transform = `translate3d(${a.caret.x}px, ${a.caret.y}px, 0)`;
            x.caret.style.height = `${a.caret.h}px`;
          }
          // Click ripples, drawn once as short CSS animations.
          const layer = layerRef.current;
          for (const rp of a.ripples) {
            if (!layer || x.ripples.has(rp)) continue;
            x.ripples.add(rp);
            const el = document.createElement("div");
            el.className = "swarm-ripple";
            // `translate`, not `transform`: the ripple's `scale` animation
            // would otherwise scale its position too.
            el.style.translate = `${rp.x}px ${rp.y}px`;
            el.style.borderColor = a.color;
            el.addEventListener("animationend", () => el.remove());
            layer.appendChild(el);
          }
        }

        // The finale only: dimming, rainbow rings and confetti, kept below
        // the navbar. No canvas work at all the rest of the time.
        const canvas = canvasRef.current;
        if (!canvas) return;
        const b = swarm.burst;
        const scrim = swarm.scrim;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cw = Math.round(vw * dpr);
        const ch = Math.round(vh * dpr);
        if (canvas.width !== cw || canvas.height !== ch) {
          canvas.width = cw;
          canvas.height = ch;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, vw, vh);
        const ring = swarm.ring;
        if (scrim < 0.01 && !b && !ring) return;
        if (ring && ring.alpha > 0.01) {
          ctx.globalAlpha = ring.alpha * 0.35;
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        const nav = document
          .querySelector('a[href="/"]')
          ?.closest(".sticky")
          ?.getBoundingClientRect();
        const top = Math.max(0, nav?.bottom ?? 0);
        if (scrim > 0.01) {
          ctx.fillStyle = `rgba(0, 0, 0, ${(scrim * 0.22).toFixed(3)})`;
          ctx.fillRect(0, top, vw, vh - top);
        }
        if (b) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, b.top, vw, vh - b.top);
          ctx.clip();
          const bx = b.x - sx;
          const by = b.y - sy;
          const reach = Math.max(vw, vh) * 0.5;
          RAINBOW.forEach((color, i) => {
            const raw = (t - b.t0 - i * 55) / 850;
            if (raw <= 0 || raw >= 1) return;
            const p = 1 - Math.pow(1 - raw, 3);
            ctx.globalAlpha = 1 - raw * raw;
            ctx.strokeStyle = color;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(bx, by, 24 + p * reach, 0, Math.PI * 2);
            ctx.stroke();
          });
          const e = Math.max(0, t - b.t0) / 1000;
          const fade = Math.max(0, 1 - Math.max(0, e - 1.3) / 0.7);
          for (const c of b.confetti) {
            const cx = bx + c.x + c.vx * e;
            const cy = by + c.y + c.vy * e + 0.5 * 950 * e * e;
            ctx.save();
            ctx.globalAlpha = fade;
            ctx.translate(cx, cy);
            ctx.rotate(c.spin * e);
            ctx.scale(1, Math.cos(c.spin * e * 1.7));
            ctx.fillStyle = c.color;
            ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
            ctx.restore();
          }
          ctx.restore();
          ctx.globalAlpha = 1;
        }
      }),
    []
  );

  const announcement = !onHome
    ? ""
    : snap.phase === "running"
    ? "Parts of this page are shown faintly while an animation builds them. Press Skip the animation to show everything now."
    : snap.revealed
    ? "The full page is now shown."
    : "";

  return (
    <>
      {live && (
        <div
          ref={layerRef}
          aria-hidden
          className="swarm-layer"
          style={{ height: docH || undefined }}>
          {snap.agents.map((a) => (
            <Marks key={`m${a.index}`} agent={a} />
          ))}
          {snap.agents.map((a) => (
            <Cursor key={`c${a.index}`} agent={a} />
          ))}
        </div>
      )}
      {live && snap.phase === "finishing" && (
        <canvas
          ref={canvasRef}
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[89] h-full w-full"
        />
      )}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </>
  );
};

export default SwarmOverlay;
