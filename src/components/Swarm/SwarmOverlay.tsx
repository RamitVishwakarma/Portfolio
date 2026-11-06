"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
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
      className={`swarm-cursor absolute left-0 top-0 ${agent.mini ? "swarm-mini" : ""}`}
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
        const taken: Box[] = [];
        let statuses = 0;
        // Lines being typed right now stay readable: labels avoid them.
        for (const a of swarm.agents) {
          if (!a.caret) continue;
          const cy = a.caret.y - sy;
          const cx = a.caret.x - sx;
          taken.push({ l: cx - 320, t: cy - 2, r: cx + 4, b: cy + a.caret.h + 2 });
        }

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
          // Waiting in the bottom row: arrows only, bobbing.
          const docked = a.docked && !a.task;
          if (d.root.hasAttribute("data-docked") !== docked) {
            d.root.toggleAttribute("data-docked", docked);
          }
          // Status only while it's fresh and its target is actually on screen.
          const age = t - a.statusAt;
          const status =
            wide &&
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

          // Keep labels clear of each other: try the default spot, then nudges
          // and the other side of the arrow.
          const onScreen =
            !docked &&
            !a.mini &&
            a.opacity > 0.05 &&
            vx > -40 &&
            vx < vw + 40 &&
            vy > -40 &&
            vy < vh + 40;
          const w = Math.max(
            a.name.length * 6.6 + 18,
            status ? status.length * 6.1 + 14 : 0,
            a.chip ? a.chip.label.length * 6.1 + 52 : 0
          );
          const h = 20 + (status ? 22 : 0) + (a.chip ? 44 : 0);
          // On the finale ring, labels sit on the outer side of their cursor.
          const ring = a.ringAngle;
          const preferLeft =
            ring !== null ? Math.cos(ring) < -0.2 : vx > vw - 140;
          const preferUp = ring !== null && Math.sin(ring) < -0.35;
          let flip = preferLeft;
          let dy = preferUp ? -h - 26 : 0;
          if (onScreen) {
            const up = -h - 26;
            const options: [boolean, number][] = preferUp
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
                  [preferLeft, 44],
                ];
            const fits = (box: Box) =>
              box.l >= 8 && box.r <= vw - 8 && box.t >= 8 && box.b <= vh - 8;
            let chosen: Box | null = null;
            for (const [f, off] of options) {
              const l = f ? vx + 4 - w : vx + 16;
              const box = { l, t: vy + 20 + off, r: l + w, b: vy + 20 + off + h };
              if (!fits(box)) continue;
              if (!taken.some((o) => hits(o, box))) {
                flip = f;
                dy = off;
                chosen = box;
                break;
              }
            }
            if (!chosen) {
              // Nothing is free: at least keep the label fully on screen.
              const l = flip ? vx + 4 - w : vx + 16;
              if (l < 8) flip = false;
              else if (l + w > vw - 8) flip = true;
              if (vy + 20 + dy + h > vh - 8) dy = -h - 26;
              else if (vy + 20 + dy < 8) dy = 0;
            } else {
              taken.push(chosen);
            }
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
        // Finale backdrop: the page dims behind the ring of cursors, but
        // not the navbar (Resume stays readable).
        if (swarm.scrim > 0.01) {
          const nav = document
            .querySelector('a[href="/"]')
            ?.closest(".sticky")
            ?.getBoundingClientRect();
          const top = Math.max(0, nav?.bottom ?? 0);
          ctx.fillStyle = `rgba(0, 0, 0, ${(swarm.scrim * 0.65).toFixed(3)})`;
          ctx.fillRect(0, top, vw, vh - top);
        }

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
            ctx.fillStyle = rgba(owner.color, 0.03);
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
          // Confetti: spinning paper that bursts out, then falls.
          const e = Math.max(0, t - b.t0) / 1000;
          const fade = Math.max(0, 1 - Math.max(0, e - 0.9) / 0.6);
          for (const c of b.confetti) {
            const travel = c.speed * (1 - Math.exp(-e * 3.2));
            const x = bx + Math.cos(c.angle) * travel;
            const y = by + Math.sin(c.angle) * travel + 260 * e * e;
            ctx.save();
            ctx.globalAlpha = fade;
            ctx.translate(x, y);
            ctx.rotate(c.spin * e);
            ctx.scale(1, Math.cos(c.spin * e * 1.7));
            ctx.fillStyle = c.color;
            ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
            ctx.restore();
          }
          ctx.globalAlpha = 1;
        }
      }),
    []
  );

  const live =
    onHome && (snap.phase === "running" || snap.phase === "finishing");
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
    </>
  );
};

export default SwarmOverlay;
