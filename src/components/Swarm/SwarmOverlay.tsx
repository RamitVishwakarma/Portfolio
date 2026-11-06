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
  /** Last label placement, kept while it stays clear (no hopping). */
  place?: [boolean, number];
  fixed?: boolean;
  ripples: WeakSet<object>;
}
const extras = new WeakMap<Agent, Extra>();

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
    const measure = () => setH(document.documentElement.scrollHeight);
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
        // Paragraphs being typed right now stay readable: labels avoid them.
        const blocks = new Set<Agent["task"]>();
        for (const a of swarm.agents) if (a.caret && a.task) blocks.add(a.task);
        blocks.forEach((task) => {
          const r = task?.typing?.box();
          if (r) {
            taken.push({
              l: r.x - sx - 4,
              t: r.y - sy - 2,
              r: r.x - sx + r.w + 4,
              b: r.y - sy + r.h + 2,
            });
          }
        });

        for (const a of swarm.agents) {
          const d = a.dom;
          if (!d) continue;
          const x = extras.get(a);
          const vx = a.x - sx;
          const vy = a.y - sy;
          const docked = a.docked && !a.task;
          // Moving cursors live in page coordinates, so the browser scrolls
          // them with the content; waiting ones are pinned to the viewport.
          if (x && x.fixed !== docked) {
            x.fixed = docked;
            d.root.style.position = docked ? "fixed" : "absolute";
          }
          d.root.style.transform = docked
            ? `translate3d(${vx}px, ${vy}px, 0)`
            : `translate3d(${a.x}px, ${a.y}px, 0)`;
          d.root.style.opacity = a.opacity.toFixed(3);
          if (d.root.hasAttribute("data-pressed") !== a.pressed) {
            d.root.toggleAttribute("data-pressed", a.pressed);
          }
          if (d.root.hasAttribute("data-docked") !== docked) {
            d.root.toggleAttribute("data-docked", docked);
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
          const moving = t - (x?.movedAt ?? 0) < 250;
          const quiet =
            a.mini ||
            (phone ? !a.caret && !a.chip : !a.task && !moving) ||
            (docked && a.quiet);

          // Status only while it's fresh and its target is on screen.
          const age = t - a.statusAt;
          const status =
            !phone &&
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

          // Place the label clear of other labels and of paragraphs being
          // typed, fully on screen. Keep last frame's spot while it's still
          // clear, so labels don't hop about.
          let flip = false;
          let dy = 0;
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
            const ring = a.ringAngle;
            const preferLeft =
              ring !== null ? Math.cos(ring) < -0.2 : vx > vw - 140;
            const up = -h - 26;
            const preferUp = ring !== null && Math.sin(ring) < -0.35;
            const options: [boolean, number][] = [];
            if (x?.place && ring === null) options.push(x.place);
            options.push(
              ...((preferUp
                ? [
                    [preferLeft, up],
                    [!preferLeft, up],
                    [preferLeft, 0],
                    [!preferLeft, 0],
                  ]
                : [
                    [preferLeft, 0],
                    [!preferLeft, 0],
                    [preferLeft, 22],
                    [!preferLeft, 22],
                    [preferLeft, up],
                    [!preferLeft, up],
                  ]) as [boolean, number][])
            );
            const fits = (box: Box) =>
              box.l >= 8 && box.r <= vw - 8 && box.t >= 8 && box.b <= vh - 8;
            let chosen: Box | null = null;
            for (const [f, off] of options) {
              const l = f ? vx + 4 - w : vx + 16;
              const box = { l, t: vy + 20 + off, r: l + w, b: vy + 20 + off + h };
              if (!fits(box) || taken.some((o) => hits(o, box))) continue;
              flip = f;
              dy = off;
              chosen = box;
              break;
            }
            if (chosen) {
              taken.push(chosen);
              if (x) x.place = [flip, dy];
            } else {
              // Nowhere clean and fully on screen: hide rather than clip.
              hide = true;
            }
          }
          if (d.root.hasAttribute("data-flip") !== flip) {
            d.root.toggleAttribute("data-flip", flip);
          }
          if (d.root.hasAttribute("data-quiet") !== hide) {
            d.root.toggleAttribute("data-quiet", hide);
          }
          const tags = d.root.querySelector<HTMLElement>(".swarm-tags");
          const shift = dy ? `translateY(${dy}px)` : "";
          if (tags && tags.style.transform !== shift) tags.style.transform = shift;

          if (!x) continue;
          // Selection box while dragging out a block.
          const sel = a.sel && a.sel.w > 0 && a.sel.h > 0 ? a.sel : null;
          x.sel.style.display = sel ? "block" : "none";
          if (sel) {
            x.sel.style.transform = `translate3d(${sel.x}px, ${sel.y}px, 0)`;
            x.sel.style.width = `${sel.w}px`;
            x.sel.style.height = `${sel.h}px`;
            x.sel.style.opacity = Math.max(0, sel.alpha).toFixed(3);
            const size = `${Math.round(sel.w)} × ${Math.round(sel.h)}`;
            if (x.badge.textContent !== size) x.badge.textContent = size;
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
            el.style.transform = `translate3d(${rp.x}px, ${rp.y}px, 0)`;
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
        if (scrim < 0.01 && !b) return;
        const nav = document
          .querySelector('a[href="/"]')
          ?.closest(".sticky")
          ?.getBoundingClientRect();
        const top = Math.max(0, nav?.bottom ?? 0);
        if (scrim > 0.01) {
          ctx.fillStyle = `rgba(0, 0, 0, ${(scrim * 0.45).toFixed(3)})`;
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
            <Marks key={`m${snap.roster}-${a.index}`} agent={a} />
          ))}
          {snap.agents.map((a) => (
            <Cursor key={`${snap.roster}-${a.index}`} agent={a} />
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
