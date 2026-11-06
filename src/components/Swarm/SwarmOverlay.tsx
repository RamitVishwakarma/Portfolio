"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import { swarm, type Agent, type SwarmSnapshot } from "./engine";

/** How long a cursor's status chip stays up after it picks up a job. */
const STATUS_MS = 1200;
const RAINBOW = ["#ff8885", "#fafe8e", "#77effd", "#9e8bfd", "#ff9dfb"];

function rgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
  } else {
    ctx.rect(x, y, w, h);
  }
}

function useSwarm() {
  return useSyncExternalStore(
    swarm.subscribe,
    swarm.getSnapshot,
    swarm.getServerSnapshot
  );
}

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
      className="swarm-cursor absolute left-0 top-0"
      style={{ opacity: 0 }}>
      <svg
        className="swarm-arrow"
        width="22"
        height="24"
        viewBox="0 0 22 24"
        fill="none">
        <path
          d="M3 2.5v16.2l4.4-4.1 2.9 6.6 3.1-1.35-2.85-6.45 6.15-.2L3 2.5z"
          fill={agent.color}
          stroke="#0b0b0b"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
      <div className="swarm-tags">
        <span
          className="whitespace-nowrap rounded-full px-2 py-[3px] font-ProductSans text-[11px] font-bold leading-none text-black shadow-lg ring-1 ring-black/60"
          style={{ background: agent.color }}>
          {agent.name}
        </span>
        <span
          data-status
          className="whitespace-nowrap rounded-md border bg-black/85 px-1.5 py-[3px] font-mono text-[10px] leading-none text-white/85"
          style={{ display: "none", borderColor: rgba(agent.color, 0.45) }}
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
  );
};

const Avatars = ({ agents }: { agents: Agent[] }) => {
  const shown = agents.slice(0, 4);
  return (
    <span className="flex items-center max-five:hidden" aria-hidden>
      {shown.map((a, i) => (
        <span
          key={a.index}
          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-black text-[10px] font-bold text-black"
          style={{ background: a.color, marginLeft: i ? -8 : 0 }}>
          {a.name[0]}
        </span>
      ))}
      {agents.length > shown.length && (
        <span className="-ml-2 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-black bg-grey-900 px-1 text-[10px] font-bold text-white">
          +{agents.length - shown.length}
        </span>
      )}
    </span>
  );
};

/** Whether the page is scrolled down to the footer, and the screen is narrow. */
function useViewport() {
  const [view, setView] = useState({ atBottom: false, narrow: false });
  useEffect(() => {
    const check = () => {
      const atBottom =
        window.scrollY + window.innerHeight >
        document.documentElement.scrollHeight - 110;
      const narrow = window.innerWidth < 800;
      setView((v) =>
        v.atBottom === atBottom && v.narrow === narrow ? v : { atBottom, narrow }
      );
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);
  return view;
}

const Hud = ({ snap }: { snap: SwarmSnapshot }) => {
  const settled = snap.phase === "complete" || snap.phase === "idle";
  const [userCollapsed, setCollapsed] = useState(settled);
  const { atBottom, narrow } = useViewport();
  // At the footer, keep clear of the centred footer content: on wide screens
  // the pill moves to the empty corner, on narrow ones it shrinks to a button.
  const collapsed = userCollapsed || (atBottom && narrow && snap.phase !== "running");
  const corner = collapsed || atBottom;

  useEffect(() => {
    if (snap.phase === "idle") return setCollapsed(true);
    if (snap.phase !== "complete") return setCollapsed(false);
    const id = window.setTimeout(() => setCollapsed(true), 3500);
    return () => window.clearTimeout(id);
  }, [snap.phase]);

  const building = snap.phase === "running";
  const pct = snap.total ? Math.round((snap.done / snap.total) * 100) : 0;
  const count = snap.agents.length;

  // One wrapper and one button in every state, so keyboard focus survives
  // Skip → Rebuild → collapsed.
  return (
    <div
      data-swarm-ui
      className={`pointer-events-auto fixed bottom-4 z-[61] flex items-center gap-3 rounded-full border border-white/15 bg-black/85 text-sm text-white shadow-2xl backdrop-blur-xl ${
        corner
          ? "right-4"
          : "left-1/2 max-w-[calc(100vw-2rem)] -translate-x-1/2"
      } ${collapsed ? "p-1" : "py-1.5 pl-2 pr-1.5"}`}>
      {!collapsed &&
        (building ? (
          <>
            <Avatars agents={snap.agents} />
            <span className="whitespace-nowrap pl-1">
              Watch my stack build this page
              {snap.waiting && (
                <span className="swarm-bounce ml-1.5 inline-block" aria-hidden>
                  ↓
                </span>
              )}
            </span>
            <span
              className="h-1.5 w-16 overflow-hidden rounded-full bg-white/15 max-five:hidden"
              aria-hidden>
              <span
                className="swarm-progress block h-full rounded-full"
                style={{ width: `${pct}%` }}
              />
            </span>
          </>
        ) : (
          <>
            <span className="pl-2 text-green" aria-hidden>
              ✓
            </span>
            <span className="whitespace-nowrap">
              {snap.skipped ? (
                "Full page shown"
              ) : (
                <>
                  Built by {count} cursors
                  <span className="max-md:hidden">
                    , each named after a tool I use
                  </span>
                </>
              )}
            </span>
          </>
        ))}
      <button
        key="action"
        onClick={building ? swarm.skip : swarm.rebuild}
        aria-label={
          building
            ? "Skip the animation and show the full page"
            : "Rebuild the page live"
        }
        className={`whitespace-nowrap rounded-full font-bold hover:text-green ${
          collapsed
            ? "px-3 py-1.5 max-five:px-2.5"
            : "bg-white/10 px-3 py-1 hover:bg-white/20"
        }`}>
        {building ? (
          "Skip"
        ) : (
          <>
            <span aria-hidden>↻</span>
            <span className={collapsed ? "max-five:hidden" : ""}>
              {collapsed ? " Rebuild live" : " Rebuild"}
            </span>
          </>
        )}
      </button>
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
      onClick={swarm.skip}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:font-bold focus:text-black">
      Skip the animation and show the full page
    </button>
  );
};

const SwarmOverlay = () => {
  const snap = useSwarm();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onHome = usePathname() === "/";

  useEffect(
    () =>
      swarm.addDrawer((t) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const sx = window.scrollX;
        const sy = window.scrollY;
        const showStatus = vw >= 640;

        // Cursors are plain DOM, moved without re-rendering React.
        for (const a of swarm.agents) {
          const d = a.dom;
          if (!d) continue;
          const vx = a.x - sx;
          d.root.style.transform = `translate3d(${vx}px, ${a.y - sy}px, 0)`;
          d.root.style.opacity = a.opacity.toFixed(3);
          if (d.root.hasAttribute("data-pressed") !== a.pressed) {
            d.root.toggleAttribute("data-pressed", a.pressed);
          }
          // Labels flip to the left near the right edge so they stay readable.
          const flip = vx > vw - 140;
          if (d.root.hasAttribute("data-flip") !== flip) {
            d.root.toggleAttribute("data-flip", flip);
          }
          const status =
            showStatus && !a.chip && a.status && t - a.statusAt < STATUS_MS
              ? a.status
              : "";
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
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.round(vw * dpr);
        const h = Math.round(vh * dpr);
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, vw, vh);

        // Wireframe of what is still to be built; claimed jobs march in the
        // colour of the cursor that took them.
        ctx.lineWidth = 1;
        for (const task of swarm.taskList()) {
          if (task.removed) continue;
          if (task.state !== "pending" && task.state !== "claimed") continue;
          if (!swarm.isReady(task)) continue;
          const r = task.el.getBoundingClientRect();
          if (
            r.width < 1 ||
            r.bottom < 0 ||
            r.top > vh ||
            r.right < 0 ||
            r.left > vw
          ) {
            continue;
          }
          const owner = task.agent;
          ctx.setLineDash([4, 4]);
          ctx.lineDashOffset = owner ? -t / 40 : 0;
          ctx.strokeStyle = owner
            ? rgba(owner.color, 0.9)
            : "rgba(255, 255, 255, 0.28)";
          ctx.fillStyle = owner
            ? rgba(owner.color, 0.06)
            : "rgba(255, 255, 255, 0.03)";
          roundRect(ctx, r.left + 0.5, r.top + 0.5, r.width - 1, r.height - 1, 8);
          ctx.fill();
          ctx.stroke();
        }
        ctx.setLineDash([]);

        for (const a of swarm.agents) {
          if (a.sel && a.sel.w > 0 && a.sel.h > 0) {
            const x = a.sel.x - sx;
            const y = a.sel.y - sy;
            ctx.globalAlpha = Math.max(0, a.sel.alpha);
            ctx.fillStyle = rgba(a.color, 0.08);
            ctx.fillRect(x, y, a.sel.w, a.sel.h);
            ctx.strokeStyle = a.color;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x, y, a.sel.w, a.sel.h);
            // Corner handles, like a design tool selection.
            ctx.fillStyle = "#ffffff";
            for (const [hx, hy] of [
              [x, y],
              [x + a.sel.w, y],
              [x, y + a.sel.h],
              [x + a.sel.w, y + a.sel.h],
            ]) {
              ctx.fillRect(hx - 3, hy - 3, 6, 6);
              ctx.strokeRect(hx - 3, hy - 3, 6, 6);
            }
            const size = `${Math.round(a.sel.w)} × ${Math.round(a.sel.h)}`;
            ctx.font = "600 10px ui-monospace, SFMono-Regular, Menlo, monospace";
            const tw = ctx.measureText(size).width;
            const bx = x + a.sel.w / 2 - tw / 2 - 5;
            const by = y + a.sel.h + 8;
            ctx.fillStyle = a.color;
            roundRect(ctx, bx, by, tw + 10, 16, 4);
            ctx.fill();
            ctx.fillStyle = "#000000";
            ctx.fillText(size, bx + 5, by + 11.5);
            ctx.globalAlpha = 1;
          }
          if (a.caret) {
            ctx.fillStyle = a.color;
            ctx.fillRect(a.caret.x - sx, a.caret.y - sy, 2, a.caret.h);
          }
          for (const rp of a.ripples) {
            const p = Math.max(0, Math.min(1, (t - rp.t0) / 520));
            ctx.globalAlpha = 1 - p;
            ctx.strokeStyle = a.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(rp.x - sx, rp.y - sy, 4 + p * 24, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }

        // The shared "done" click: rainbow rings from the middle.
        const b = swarm.burst;
        if (b) {
          RAINBOW.forEach((color, i) => {
            const p = Math.max(0, Math.min(1, (t - b.t0 - i * 70) / 650));
            if (p <= 0 || p >= 1) return;
            ctx.globalAlpha = 1 - p;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(b.x - sx, b.y - sy, 20 + p * 160, 0, Math.PI * 2);
            ctx.stroke();
          });
          ctx.globalAlpha = 1;
        }
      }),
    []
  );

  const live =
    onHome && (snap.phase === "running" || snap.phase === "finishing");
  const showHud =
    onHome &&
    snap.total > 0 &&
    (snap.phase !== "idle" || snap.seen);
  const announcement = !onHome
    ? ""
    : snap.phase === "running"
    ? "This page is being built by an animation. Press Skip to show everything now."
    : snap.phase === "complete" || snap.phase === "finishing"
    ? "The full page is now shown."
    : "";

  return (
    <>
      {live && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
          {snap.agents.map((a) => (
            <Cursor key={`${snap.roster}-${a.index}`} agent={a} />
          ))}
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      {showHud && <Hud snap={snap} />}
    </>
  );
};

export default SwarmOverlay;
