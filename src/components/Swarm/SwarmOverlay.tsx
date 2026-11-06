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
  );
};

const Avatars = ({ agents }: { agents: Agent[] }) => {
  const shown = agents.slice(0, 4);
  return (
    <span className="flex items-center" aria-hidden>
      {shown.map((a, i) => (
        <span
          key={a.index}
          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-black text-[10px] font-bold ${
            a.dark ? "text-white" : "text-black"
          }`}
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

interface Placement {
  /** Below 800px the HUD is a slim bar under the navbar. */
  mobile: boolean;
  /** Desktop: the empty stretch of navbar after the "RV" logo. */
  left: number;
  room: number;
  navTop: number;
  navBottom: number;
}

/** Where the HUD fits inside (desktop) or just under (mobile) the navbar. */
function usePlacement(): Placement {
  const [p, setP] = useState<Placement>({
    mobile: false,
    left: 180,
    room: 600,
    navTop: 0,
    navBottom: 56,
  });
  useEffect(() => {
    const measure = () => {
      const logo = document.querySelector('a[href="/"]');
      const nav = logo?.closest(".sticky");
      const links = nav?.querySelector("ul");
      const lr = logo?.getBoundingClientRect();
      const nr = nav?.getBoundingClientRect();
      const ur = links?.getBoundingClientRect();
      const left = (lr?.right ?? 150) + 28;
      const next: Placement = {
        mobile: window.innerWidth < 800,
        left,
        room: (ur?.left ?? window.innerWidth) - left - 24,
        navTop: Math.max(0, nr?.top ?? 0),
        navBottom: Math.max(0, nr?.bottom ?? 56),
      };
      setP((old) =>
        JSON.stringify(old) === JSON.stringify(next) ? old : next
      );
    };
    measure();
    const late = window.setTimeout(measure, 600);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      window.clearTimeout(late);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, []);
  return p;
}

const Hud = ({ snap }: { snap: SwarmSnapshot }) => {
  const settled = snap.phase === "complete" || snap.phase === "idle";
  const [collapsed, setCollapsed] = useState(settled);
  const place = usePlacement();

  useEffect(() => {
    if (snap.phase === "idle") return setCollapsed(true);
    if (!snap.revealed) return setCollapsed(false);
    // Always show the payoff line for a few seconds before tucking away.
    setCollapsed(false);
    const id = window.setTimeout(() => setCollapsed(true), 3800);
    return () => window.clearTimeout(id);
  }, [snap.phase, snap.revealed]);

  const building = !snap.revealed && snap.phase !== "idle";
  const pct = snap.total ? Math.round((snap.done / snap.total) * 100) : 0;
  const count = snap.agents.length;
  const { mobile } = place;
  const roomy = place.room >= 470;

  const progress = (
    <span
      className={
        mobile
          ? "absolute bottom-0 left-0 h-[2px] w-full bg-white/10"
          : "h-1.5 w-14 overflow-hidden rounded-full bg-white/15"
      }
      aria-hidden>
      <span
        className="swarm-progress block h-full rounded-full"
        style={{ width: `${pct}%` }}
      />
    </span>
  );

  // Desktop: inside the navbar's empty middle, so it never covers content.
  // Mobile: a slim bar under the navbar while building, then a small chip.
  const style = mobile
    ? collapsed
      ? { top: place.navBottom + 8, right: 12 }
      : { top: place.navBottom, left: 0, right: 0 }
    : { top: place.navTop + 12, left: place.left };
  const shell = mobile
    ? collapsed
      ? "rounded-full border border-white/15 p-1 text-xs"
      : "h-9 justify-between gap-2 border-b border-white/10 px-3 text-xs"
    : `h-8 gap-2.5 rounded-full border border-white/15 text-[13px] ${
        collapsed ? "p-1" : "pl-1.5 pr-1"
      }`;

  // One wrapper and one button in every state, so keyboard focus survives
  // Skip → Replay → collapsed.
  return (
    <div
      data-swarm-ui
      data-swarm-hud
      style={style}
      className={`pointer-events-auto fixed z-[61] flex items-center bg-black/85 text-white shadow-2xl backdrop-blur-xl ${shell}`}>
      {!collapsed &&
        (building ? (
          <>
            {roomy && !mobile && <Avatars agents={snap.agents} />}
            <span className="min-w-0 truncate whitespace-nowrap">
              {roomy || mobile ? "Watch my stack build this page" : "Building live"}
              {snap.waiting && (
                <span className="swarm-bounce ml-1.5 inline-block" aria-hidden>
                  ↓
                </span>
              )}
            </span>
            {progress}
          </>
        ) : (
          <span className="min-w-0 truncate whitespace-nowrap pl-1.5">
            <span className="text-green" aria-hidden>
              ✓{" "}
            </span>
            {snap.skipped ? (
              "Full page shown"
            ) : roomy ? (
              `Built by ${count} cursors, each named after a tool I use`
            ) : (
              `Built by ${count} cursors named after my stack`
            )}
          </span>
        ))}
      <button
        key="action"
        onClick={building ? swarm.skip : swarm.rebuild}
        aria-label={building ? "Skip the animation" : "Replay the live build"}
        className={`shrink-0 whitespace-nowrap rounded-full font-bold hover:text-green ${
          collapsed ? "px-2.5 py-1" : "bg-white/10 px-2.5 py-0.5 hover:bg-white/20"
        }`}>
        {building ? "Skip" : "↻ Replay"}
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
      onClick={() => {
        swarm.skip();
        // This button disappears with the build: hand focus to the content.
        const main = document.querySelector("main");
        if (main) {
          main.setAttribute("tabindex", "-1");
          main.focus();
        }
      }}
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
        const wide = vw >= 640;
        const hud = document
          .querySelector("[data-swarm-hud]")
          ?.getBoundingClientRect();
        const taken: Box[] = hud
          ? [{ l: hud.left - 8, t: hud.top - 8, r: hud.right + 8, b: hud.bottom + 8 }]
          : [];

        // Cursors are plain DOM, moved without re-rendering React.
        for (const a of swarm.agents) {
          const d = a.dom;
          if (!d) continue;
          const vx = a.x - sx;
          const vy = a.y - sy;
          d.root.style.transform = `translate3d(${vx}px, ${vy}px, 0)`;
          d.root.style.opacity = a.opacity.toFixed(3);
          if (d.root.hasAttribute("data-pressed") !== a.pressed) {
            d.root.toggleAttribute("data-pressed", a.pressed);
          }
          // Status only while it's fresh and its target is actually on screen.
          const status =
            wide &&
            !a.chip &&
            a.status &&
            t - a.statusAt < STATUS_MS &&
            (!a.task || a.task.visible)
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

          // Keep labels clear of each other and of the HUD: try the default
          // spot, then nudges and the other side of the arrow.
          const onScreen =
            a.opacity > 0.05 && vx > -40 && vx < vw + 40 && vy > -40 && vy < vh + 40;
          const w = Math.max(
            a.name.length * 6.6 + 18,
            status ? status.length * 6.1 + 14 : 0,
            a.chip ? a.chip.label.length * 6.1 + 52 : 0
          );
          const h = 20 + (status ? 22 : 0) + (a.chip ? 44 : 0);
          const preferLeft = a.faceLeft ?? vx > vw - 140;
          let flip = preferLeft;
          let dy = 0;
          if (onScreen) {
            const options: [boolean, number][] = [
              [preferLeft, 0],
              [!preferLeft, 0],
              [preferLeft, 22],
              [!preferLeft, 22],
              [preferLeft, -h - 26],
              [!preferLeft, -h - 26],
              [preferLeft, 44],
            ];
            let chosen: Box | null = null;
            for (const [f, off] of options) {
              const l = f ? vx - 4 - w : vx + 16;
              const box = { l, t: vy + 20 + off, r: l + w, b: vy + 20 + off + h };
              if (box.l < 0 || box.r > vw) continue;
              if (!taken.some((o) => hits(o, box))) {
                flip = f;
                dy = off;
                chosen = box;
                break;
              }
            }
            if (chosen) taken.push(chosen);
          }
          if (d.root.hasAttribute("data-flip") !== flip) {
            d.root.toggleAttribute("data-flip", flip);
          }
          const tags = d.root.lastElementChild as HTMLElement | null;
          const shift = dy ? `translateY(${dy}px)` : "";
          if (tags && tags.style.transform !== shift) tags.style.transform = shift;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cw = Math.round(vw * dpr);
        const ch = Math.round(vh * dpr);
        if (canvas.width !== cw || canvas.height !== ch) {
          canvas.width = cw;
          canvas.height = ch;
        }
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, vw, vh);

        // Wireframe around what is still to be built; claimed jobs march in
        // the colour of the cursor that took them.
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
            : "rgba(255, 255, 255, 0.24)";
          roundRect(ctx, r.left + 0.5, r.top + 0.5, r.width - 1, r.height - 1, 8);
          if (owner) {
            ctx.fillStyle = rgba(owner.color, 0.06);
            ctx.fill();
          }
          ctx.stroke();
        }
        ctx.setLineDash([]);

        for (const a of swarm.agents) {
          if (a.sel && a.sel.w > 0 && a.sel.h > 0) {
            const x = a.sel.x - sx;
            const y = a.sel.y - sy;
            ctx.globalAlpha = Math.max(0, a.sel.alpha);
            ctx.fillStyle = rgba(a.color, 0.06);
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
            ctx.fillStyle = a.dark ? "#ffffff" : "#000000";
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

        // The finale: rainbow rings and confetti from the ring of cursors.
        const b = swarm.burst;
        if (b) {
          const bx = b.x - sx;
          const by = b.y - sy;
          const reach = Math.max(vw, vh) * 0.45;
          RAINBOW.forEach((color, i) => {
            const raw = (t - b.t0 - i * 55) / 800;
            if (raw <= 0 || raw >= 1) return;
            const p = 1 - Math.pow(1 - raw, 3);
            ctx.globalAlpha = 1 - raw * raw;
            ctx.strokeStyle = color;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(bx, by, 24 + p * reach, 0, Math.PI * 2);
            ctx.stroke();
          });
          const raw = Math.min(1, Math.max(0, (t - b.t0) / 1000));
          const p = 1 - Math.pow(1 - raw, 2);
          ctx.lineCap = "round";
          ctx.lineWidth = 3;
          for (const s of b.sparks) {
            const d = 30 + p * s.speed;
            const x1 = bx + Math.cos(s.angle) * d;
            const y1 = by + Math.sin(s.angle) * d + raw * raw * 60;
            ctx.globalAlpha = 1 - raw * raw;
            ctx.strokeStyle = s.color;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(
              x1 - Math.cos(s.angle) * s.len,
              y1 - Math.sin(s.angle) * s.len
            );
            ctx.stroke();
          }
          ctx.lineCap = "butt";
          ctx.globalAlpha = 1;
        }
      }),
    []
  );

  const live =
    onHome && (snap.phase === "running" || snap.phase === "finishing");
  const showHud =
    onHome && snap.total > 0 && (snap.phase !== "idle" || snap.seen);
  const announcement = !onHome
    ? ""
    : snap.phase === "running"
    ? "This page is being built by an animation. Everything is already readable; press Skip the animation to show it at full strength."
    : snap.revealed
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
