import { AGENTS, MOBILE_AGENTS } from "./agents";
import { prepareTyping, type Rect, type Typing } from "./typing";

export type { Rect };

/**
 * How a cursor builds an element:
 * - text:  types the element's text in place, caret and all
 * - block: drags a selection box corner to corner and the element is drawn in
 * - image: carries the asset in as a file chip and drops it
 * - pop:   clicks and the element pops in
 */
export type BuildKind = "text" | "block" | "image" | "pop";

export interface BuildOptions {
  kind: BuildKind;
  /** Status shown under the cursor, or the file name for an image. */
  caption?: string;
  /** Doesn't hold up "build complete" (e.g. marquee cards scrolled out of view). */
  optional?: boolean;
  /** Built before anything else on screen (the name in the hero). */
  priority?: boolean;
}

type TaskState = "pending" | "claimed" | "building" | "done";
type Phase = "idle" | "running" | "finishing" | "complete";

export interface Task {
  id: string;
  el: HTMLElement;
  kind: BuildKind;
  caption?: string;
  optional: boolean;
  priority: boolean;
  state: TaskState;
  /** Within a screen of the viewport: cursors may start on it. */
  inView: boolean;
  /** Actually on screen. */
  visible: boolean;
  visibleSince: number;
  /** Scrolled past: finish it now. */
  rush: boolean;
  top: number;
  agent: Agent | null;
  removed: boolean;
  cleanup?: () => void;
  anim?: Animation;
}

export interface AgentDom {
  root: HTMLDivElement;
  status: HTMLElement;
  chip: HTMLElement;
  chipImg: HTMLImageElement;
  chipLabel: HTMLElement;
}

export interface Agent {
  index: number;
  name: string;
  color: string;
  /** Position of the cursor tip, in page coordinates. */
  x: number;
  y: number;
  opacity: number;
  targetOpacity: number;
  activateAt: number;
  active: boolean;
  landed: boolean;
  docked: boolean;
  moving: boolean;
  leaving: boolean;
  idleSince: number;
  task: Task | null;
  status: string;
  statusAt: number;
  pressed: boolean;
  moveToken: number;
  sel: (Rect & { alpha: number }) | null;
  caret: Rect | null;
  chip: { label: string; src?: string } | null;
  ripples: { x: number; y: number; t0: number }[];
  /** Deep colour: label text and outline flip to light. */
  dark: boolean;
  /** Finale: labels face outward from the ring. */
  faceLeft: boolean | null;
  dom: AgentDom | null;
}

export interface Burst {
  x: number;
  y: number;
  t0: number;
  sparks: { angle: number; speed: number; color: string; len: number }[];
}

export interface SwarmSnapshot {
  phase: Phase;
  done: number;
  total: number;
  agents: Agent[];
  roster: number;
  waiting: boolean;
  skipped: boolean;
  /** The finale has landed (or the build was skipped): show the payoff. */
  revealed: boolean;
  /** Visitor has already watched a build in this browser. */
  seen: boolean;
}

const EMPTY: SwarmSnapshot = {
  phase: "idle",
  done: 0,
  total: 0,
  agents: [],
  roster: 0,
  waiting: false,
  skipped: false,
  revealed: false,
  seen: false,
};

const SEEN_KEY = "swarm-seen";
/** An element left unclaimed on screen this long is shown without a cursor. */
const CATCH_UP_MS = 2500;
/** Opacity of not-yet-built content (see globals.css), and of the hero name. */
export const GHOST = 0.14;
export const GHOST_PRIORITY = 0.4;

function isDark(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

function setMask(el: HTMLElement, value: string) {
  el.style.setProperty("mask", value);
  el.style.setProperty("-webkit-mask", value);
}

const now = () => performance.now();
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutBack = (t: number) => {
  const c1 = 0.9;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export function pageRect(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return {
    x: r.left + window.scrollX,
    y: r.top + window.scrollY,
    w: r.width,
    h: r.height,
  };
}

function center(el: Element) {
  const r = pageRect(el);
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

function fileName(src?: string) {
  if (!src) return undefined;
  try {
    const url = new URL(src, window.location.href);
    // next/image serves /_next/image?url=%2Fimages%2Ffoo.png
    const inner = url.searchParams.get("url");
    const path = inner ? decodeURIComponent(inner) : url.pathname;
    return path.split("/").pop() || undefined;
  } catch {
    return undefined;
  }
}

function once(fn: () => void) {
  let ran = false;
  return () => {
    if (ran) return;
    ran = true;
    fn();
  };
}

/** The build was skipped or restarted: drop everything. */
class Aborted extends Error {}
/** The visitor scrolled past this element: finish it now. */
class Rush extends Error {}

class SwarmEngine {
  tasks = new Map<string, Task>();
  agents: Agent[] = [];
  /** Shared burst when the build completes, in page coordinates. */
  burst: Burst | null = null;

  private byEl = new WeakMap<Element, Task>();
  private phase: Phase = "idle";
  private settled = false;
  private skipped = false;
  private revealed = false;
  private waitOn = 0;
  private waitOff = 0;
  private waiting = false;
  private rebuilding = false;
  private gen = 0;
  private roster = 0;
  private base = 1;
  private boost = 1;
  private startedAt = 0;
  private raf = 0;
  private sleeping = false;
  private keyboard = false;
  private listening = false;
  private waiters: Array<() => void> = [];
  private ahead: IntersectionObserver | null = null;
  private seenIO: IntersectionObserver | null = null;
  private listeners = new Set<() => void>();
  private drawers = new Set<(t: number) => void>();
  private lastSchedule = 0;
  private lastCheck = 0;
  private hasEligible = false;
  private snap: SwarmSnapshot = EMPTY;

  // ---- React store API ---------------------------------------------------

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  getSnapshot = () => this.snap;
  getServerSnapshot = () => EMPTY;

  taskList() {
    return Array.from(this.tasks.values());
  }

  addDrawer(fn: (t: number) => void) {
    this.drawers.add(fn);
    return () => {
      this.drawers.delete(fn);
    };
  }

  // ---- Registration ------------------------------------------------------

  register(id: string, el: HTMLElement, opts: BuildOptions) {
    const task: Task = {
      id,
      el,
      kind: opts.kind,
      caption: opts.caption,
      optional: !!opts.optional,
      priority: !!opts.priority,
      state: "pending",
      inView: false,
      visible: false,
      visibleSince: 0,
      rush: false,
      top: 0,
      agent: null,
      removed: false,
    };
    this.tasks.set(id, task);
    this.byEl.set(el, task);

    if (this.isOn()) {
      this.observe(task);
      this.start();
    } else {
      this.finishTask(task);
    }
    this.emit();

    return () => {
      this.ahead?.unobserve(el);
      this.seenIO?.unobserve(el);
      if (this.tasks.get(id) === task) this.tasks.delete(id);
      if (this.byEl.get(el) === task) this.byEl.delete(el);
      task.removed = true;
      task.cleanup?.();
      task.cleanup = undefined;
      this.emit();
    };
  }

  /** A task can start once the element it sits inside has been built. */
  isReady(task: Task) {
    const parent = task.el.parentElement?.closest("[data-swarm-id]");
    if (!parent) return true;
    const owner = this.byEl.get(parent);
    return !owner || owner.state === "done";
  }

  // ---- Controls ----------------------------------------------------------

  skip = () => {
    if (this.phase !== "running") return;
    this.gen++;
    this.skipped = true;
    for (const t of this.taskList()) {
      t.cleanup?.();
      t.cleanup = undefined;
      if (!t.removed && t.state !== "done") {
        setMask(t.el, "");
        this.finishTask(t);
      }
    }
    for (const a of this.agents) this.resetAgent(a);
    this.finish(false);
  };

  rebuild = () => {
    if (this.rebuilding) return;
    this.rebuilding = true;
    this.gen++;
    // The old swarm fades out while the page glides back up.
    for (const a of this.agents) a.targetOpacity = 0;
    const reset = () => {
      this.rebuilding = false;
      this.settled = false;
      this.skipped = false;
      this.phase = "idle";
      document.documentElement.classList.add("swarm-on");
      for (const t of this.taskList()) {
        if (t.removed) continue;
        t.cleanup?.();
        t.cleanup = undefined;
        t.anim?.cancel();
        setMask(t.el, "");
        t.state = "pending";
        t.agent = null;
        t.rush = false;
        t.inView = false;
        t.visible = false;
        t.visibleSince = 0;
        this.setAttr(t, "pending");
        // Re-observing makes the observers report fresh positions.
        this.ahead?.unobserve(t.el);
        this.seenIO?.unobserve(t.el);
        this.observe(t);
      }
      this.start();
    };
    // Glide back to the top first, then build from there.
    if (window.scrollY < 2) return reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
    const t0 = now();
    const wait = () => {
      if (window.scrollY < 2 || now() - t0 > 2500) reset();
      else requestAnimationFrame(wait);
    };
    requestAnimationFrame(wait);
  };

  // ---- Internals ---------------------------------------------------------

  private isOn() {
    return (
      !this.settled &&
      document.documentElement.classList.contains("swarm-on")
    );
  }

  private observe(task: Task) {
    if (!this.ahead) {
      this.ahead = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            const t = this.byEl.get(e.target);
            if (!t) continue;
            t.inView = e.isIntersecting;
            t.top = e.boundingClientRect.top + window.scrollY;
            if (!e.isIntersecting && e.boundingClientRect.bottom <= 0) {
              this.pass(t);
            }
          }
          this.wake();
        },
        // Cursors start just before an element scrolls in, so the visitor
        // arrives to a section mid-build and watches it finish.
        { rootMargin: "0px 0px 15% 0px" }
      );
      this.seenIO = new IntersectionObserver((entries) => {
        for (const e of entries) {
          const t = this.byEl.get(e.target);
          if (!t) continue;
          t.visible = e.isIntersecting;
          t.visibleSince = e.isIntersecting ? t.visibleSince || now() : 0;
          // Scrolled past it: don't keep the visitor's content hidden above.
          if (
            !e.isIntersecting &&
            e.boundingClientRect.bottom <= 0 &&
            this.phase === "running"
          ) {
            this.pass(t);
          }
        }
        this.wake();
      });
    }
    this.ahead.observe(task.el);
    this.seenIO?.observe(task.el);
  }

  private pass(t: Task) {
    if (t.removed || t.state === "done" || this.phase !== "running") return;
    if (t.state === "pending") this.finishTask(t);
    else t.rush = true;
  }

  private start() {
    if (this.phase === "running") return;
    this.phase = "running";
    this.gen++;
    this.roster++;
    this.startedAt = now();
    this.burst = null;
    this.revealed = false;
    this.waiting = false;
    this.waitOn = 0;
    this.waitOff = 0;
    // Watched the opening: don't replay it on the next visit.
    const gen0 = this.gen;
    window.setTimeout(() => {
      if (
        gen0 === this.gen &&
        this.phase === "running" &&
        window.location.pathname === "/"
      ) {
        this.remember();
      }
    }, 4000);
    (window as unknown as { __swarmReady?: boolean }).__swarmReady = true;
    this.listen();

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const sx = window.scrollX;
    const sy = window.scrollY;
    const mobile = vw < 640;
    this.base = mobile ? 1.5 : 1;
    const count = mobile ? MOBILE_AGENTS : AGENTS.length;
    const t = now();

    this.agents = AGENTS.slice(0, count).map((def, i) => {
      // Fly in from all four edges of the screen.
      const side = i % 4;
      const p =
        side === 0
          ? { x: rand(0, vw), y: vh + 40 }
          : side === 1
          ? { x: -40, y: rand(vh * 0.2, vh) }
          : side === 2
          ? { x: vw + 40, y: rand(vh * 0.2, vh) }
          : { x: rand(0, vw), y: -40 };
      return {
        index: i,
        name: def.name,
        color: def.color,
        x: p.x + sx,
        y: p.y + sy,
        opacity: 0,
        targetOpacity: 0,
        // A short beat on the wireframe, then the swarm streams in as a wave.
        activateAt: t + 150 + i * (mobile ? 200 : 160),
        active: false,
        landed: false,
        docked: false,
        moving: false,
        leaving: false,
        idleSince: 0,
        task: null,
        status: "",
        statusAt: 0,
        pressed: false,
        moveToken: 0,
        sel: null,
        caret: null,
        chip: null,
        ripples: [],
        dark: isDark(def.color),
        faceLeft: null,
        dom: null,
      };
    });
    this.emit(true);
    this.wake();
    this.loop();
  }

  private listen() {
    if (this.listening) return;
    this.listening = true;
    window.addEventListener("scroll", this.wake, { passive: true });
    // Keyboard users get the full page as soon as they start tabbing into it,
    // and find-in-page gets everything to search.
    document.addEventListener("keydown", (e) => {
      if (e.key === "Tab") this.keyboard = true;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") this.skip();
    });
    document.addEventListener("pointerdown", () => {
      this.keyboard = false;
    });
    document.addEventListener("focusin", (e) => {
      const el = e.target as Element | null;
      if (!this.keyboard || el?.closest?.("[data-swarm-ui]")) return;
      this.skip();
    });
  }

  private wake = () => {
    if (this.phase !== "running") return;
    // Hand out new work on the very next frame.
    this.lastSchedule = 0;
    this.sleeping = false;
    this.loop();
  };

  private remember() {
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Storage blocked: the build just plays again next time.
    }
  }

  private finish(natural: boolean) {
    if (this.phase !== "running") return;
    this.phase = "finishing";
    this.settled = true;
    this.remember();
    const gen = this.gen;
    this.sleeping = false;
    if (!natural) this.revealed = true;
    this.emit(true);
    this.loop();

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const n = this.agents.length;
    const R = Math.min(vw, vh) * 0.2;
    const { x: cx, y: cy } = natural ? this.gatherPoint(R) : { x: vw / 2, y: vh / 2 };

    const outro = async () => {
      try {
        if (natural) {
          // Everyone gathers in a ring, labels facing out...
          await Promise.all(
            this.agents.map((a, i) => {
              const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
              a.docked = false;
              a.leaving = true;
              a.active = true;
              a.targetOpacity = 1;
              a.status = "";
              a.faceLeft = Math.cos(ang) < -0.2;
              return this.moveTo(
                a,
                () => ({
                  x: window.scrollX + cx + Math.cos(ang) * R,
                  y: window.scrollY + cy + Math.sin(ang) * R,
                }),
                gen,
                null,
                0.9
              );
            })
          );
          await this.sleep(350, gen, null);
          // ...clicks together: burst...
          for (const a of this.agents) a.pressed = true;
          this.burst = {
            x: window.scrollX + cx,
            y: window.scrollY + cy,
            t0: now(),
            sparks: Array.from({ length: 44 }, (_, i) => ({
              angle: rand(0, Math.PI * 2),
              speed: rand(0.35, 0.75) * Math.max(vw, vh) * 0.45,
              color: this.agents[i % n].color,
              len: rand(6, 14),
            })),
          };
          this.revealed = true;
          this.emit(true);
          await this.sleep(160, gen, null);
          for (const a of this.agents) a.pressed = false;
          await this.sleep(420, gen, null);
        }
        // ...and scatters off screen.
        await Promise.all(
          this.agents.map((a) => {
            a.leaving = true;
            const vx = a.x - window.scrollX;
            const vy = a.y - window.scrollY;
            const dx = vx - cx || rand(-1, 1);
            const dy = vy - cy || rand(-1, 1);
            const len = Math.hypot(dx, dy) || 1;
            const reach = Math.max(vw, vh);
            const tx = cx + (dx / len) * reach;
            const ty = cy + (dy / len) * reach;
            return this.moveTo(
              a,
              () => ({ x: window.scrollX + tx, y: window.scrollY + ty }),
              gen,
              null,
              0.8
            ).then(() => {
              a.targetOpacity = 0;
            });
          })
        );
      } catch {
        // A rebuild took over.
      }
      window.setTimeout(() => {
        if (gen !== this.gen) return;
        this.phase = "complete";
        this.burst = null;
        this.revealed = true;
        // Nothing is pending any more; drop the hiding rules entirely.
        document.documentElement.classList.remove("swarm-on");
        this.emit(true);
      }, 300);
    };
    void outro();
  }

  /** The emptiest spot on screen for the finale ring. */
  private gatherPoint(R: number) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rects: DOMRect[] = [];
    for (const t of this.taskList()) {
      if (t.removed || t.kind === "block") continue;
      const r = t.el.getBoundingClientRect();
      if (r.width > 0 && r.bottom > 0 && r.top < vh) rects.push(r);
    }
    let best = { x: vw / 2, y: vh / 2 };
    let bestScore = Infinity;
    for (const fx of [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]) {
      for (const fy of [0.3, 0.42, 0.54, 0.66]) {
        const x = vw * fx;
        const y = vh * fy;
        const l = x - R - 90;
        const r = x + R + 90;
        const t = y - R - 10;
        const b = y + R + 30;
        if (l < 0 || r > vw || t < 70 || b > vh) continue;
        let score = Math.abs(fx - 0.5) * 4000;
        for (const e of rects) {
          const w = Math.min(r, e.right) - Math.max(l, e.left);
          const h = Math.min(b, e.bottom) - Math.max(t, e.top);
          if (w > 0 && h > 0) score += w * h;
        }
        if (score < bestScore) {
          bestScore = score;
          best = { x, y };
        }
      }
    }
    return best;
  }

  private loop() {
    if (!this.raf) this.raf = requestAnimationFrame(this.tick);
  }

  private frame() {
    return new Promise<void>((resolve) => {
      this.waiters.push(resolve);
      this.loop();
    });
  }

  private rate() {
    return this.base * this.boost;
  }

  private tick = async (t: number) => {
    this.raf = 0;
    const waiters = this.waiters;
    this.waiters = [];
    for (const w of waiters) w();

    const running = this.phase === "running";
    const vh = window.innerHeight;
    for (const a of this.agents) {
      if (!a.active && running && t >= a.activateAt) {
        a.active = true;
        a.targetOpacity = 1;
        a.idleSince = t;
      }
      // Parked cursors wait just below the screen, ready to fly back up.
      if (a.docked && !a.task) a.y = window.scrollY + vh + 80;
      a.opacity += (a.targetOpacity - a.opacity) * 0.14;
      if (a.sel && !a.pressed) {
        a.sel.alpha -= 0.05;
        if (a.sel.alpha <= 0) a.sel = null;
      }
      if (a.ripples.length) a.ripples = a.ripples.filter((r) => t - r.t0 < 520);
    }
    if (this.burst && t - this.burst.t0 > 1100) this.burst = null;

    if (running) {
      if (t - this.lastSchedule > 100) {
        this.lastSchedule = t;
        this.schedule();
      }
      this.dock(t);
      if (t - this.lastCheck > 300) {
        this.lastCheck = t;
        this.checkComplete();
        this.emit();
      }
    }

    // Let this frame's cursor work (promise continuations) land before
    // drawing, so selection boxes and clips stay in lockstep.
    for (let i = 0; i < 8; i++) await Promise.resolve();
    for (const draw of Array.from(this.drawers)) draw(t);

    if (this.phase === "running" && this.isQuiet()) {
      // Re-check with fresh eligibility (an observer may have reported new
      // work since the last schedule) before letting the frame loop rest.
      this.schedule();
      if (this.isQuiet()) {
        this.sleeping = true;
        this.emit();
        return;
      }
    }
    if (
      this.phase === "running" ||
      this.phase === "finishing" ||
      this.waiters.length
    ) {
      this.loop();
    }
  };

  private isQuiet() {
    if (this.hasEligible || this.waiters.length || this.burst) return false;
    return this.agents.every(
      (a) =>
        a.active &&
        a.docked &&
        !a.task &&
        !a.moving &&
        !a.sel &&
        !a.ripples.length
    );
  }

  /** Hand the next elements to idle cursors: on screen first, top first. */
  private schedule() {
    const eligible: Task[] = [];
    let onScreen = 0;
    for (const t of this.taskList()) {
      if (t.state === "pending" && !t.removed && t.inView && this.isReady(t)) {
        eligible.push(t);
        if (t.visible) onScreen++;
      }
    }
    this.hasEligible = eligible.length > 0;
    // A backlog on screen speeds the swarm up (but let the opening breathe).
    this.boost =
      now() - this.startedAt < 3000 ? 1 : clamp(1 + onScreen / 8, 1, 2);

    const idle = this.agents.filter((a) => a.active && !a.task && !a.leaving);
    if (!idle.length || !eligible.length) return;

    eligible.sort(
      (a, b) =>
        Number(b.priority) - Number(a.priority) ||
        Number(b.visible) - Number(a.visible) ||
        a.top - b.top ||
        (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING
          ? -1
          : 1)
    );

    for (const a of idle) {
      if (!eligible.length) break;
      // Of the next few jobs in reading order, take the one closest by.
      const pool = eligible[0].priority ? 1 : Math.min(eligible.length, 4);
      let best = 0;
      let bestScore = Infinity;
      for (let i = 0; i < pool; i++) {
        const c = center(eligible[i].el);
        const score = Math.hypot(c.x - a.x, c.y - a.y) + i * 140;
        if (score < bestScore) {
          bestScore = score;
          best = i;
        }
      }
      const [task] = eligible.splice(best, 1);
      void this.run(a, task);
    }
  }

  /** Idle cursors slip off the bottom of the screen instead of loitering. */
  private dock(t: number) {
    const vw = window.innerWidth;
    for (const a of this.agents) {
      if (!a.active || a.task || a.leaving || a.moving || a.docked) continue;
      if (t < a.idleSince + 450) continue;
      a.moving = true;
      const fx = clamp(a.x - window.scrollX, 24, vw - 24);
      this.moveTo(
        a,
        () => ({
          x: window.scrollX + fx,
          y: window.scrollY + window.innerHeight + 80,
        }),
        this.gen,
        null,
        0.7
      )
        .then((arrived) => {
          if (arrived && !a.task) a.docked = true;
        })
        .catch(() => {})
        .finally(() => {
          a.moving = false;
        });
    }
  }

  private checkComplete() {
    // The navbar outlives the home page; only finish the build on "/".
    if (window.location.pathname !== "/") return;
    let live = 0;
    let required = 0;
    const t0 = now();
    for (const t of this.taskList()) {
      if (t.removed) continue;
      live++;
      if (t.state === "done") continue;
      const r = t.el.getBoundingClientRect();
      // Jumped past without it ever crossing the screen (scrollbar drag, End).
      if (r.bottom <= 0 && r.height > 0) {
        this.pass(t);
        // pass() finishes a pending task outright; a claimed one is rushed.
        if (t.state === "pending" || (t.state as TaskState) === "done") continue;
      }
      if (t.state === "pending" && this.isReady(t)) {
        // Hidden at this breakpoint (display: none) – nothing to build.
        if (r.width === 0 && r.height === 0) {
          this.finishTask(t);
          continue;
        }
        // Every cursor is busy and this has sat empty on screen: show it.
        const since = Math.max(t.visibleSince, this.startedAt + 2200);
        if (t.visible && t.visibleSince && t0 - since > CATCH_UP_MS) {
          this.setAttr(t, "building");
          this.reveal(t, "fade");
          this.finishTask(t);
          continue;
        }
      }
      if (!t.optional) required++;
    }
    if (!live || required > 0 || this.agents.some((a) => a.task)) return;
    for (const t of this.taskList()) {
      if (!t.removed && t.state !== "done") this.finishTask(t);
    }
    this.finish(true);
  }

  private async run(a: Agent, task: Task) {
    const gen = this.gen;
    task.state = "claimed";
    task.agent = a;
    a.task = task;
    a.docked = false;
    a.targetOpacity = 1;
    this.setAttr(task, "claimed");
    const overshoot = !a.landed;
    a.landed = true;
    const tag = task.el.tagName.toLowerCase();
    try {
      if (task.kind === "text") await this.doText(a, task, gen, tag, overshoot);
      else if (task.kind === "block")
        await this.doBlock(a, task, gen, tag, overshoot);
      else if (task.kind === "image") await this.doImage(a, task, gen, overshoot);
      else await this.doPop(a, task, gen, tag, overshoot);
      if (gen === this.gen && !task.removed) this.finishTask(task);
    } catch (err) {
      if (err instanceof Rush) {
        if (!task.removed) this.finishTask(task);
      } else if (!(err instanceof Aborted)) {
        console.error(err);
        if (gen === this.gen && !task.removed) this.finishTask(task);
      }
    } finally {
      if (task.agent === a) task.agent = null;
      if (a.task === task) this.resetAgent(a);
      a.idleSince = now();
    }
  }

  private resetAgent(a: Agent) {
    a.task = null;
    a.status = "";
    a.pressed = false;
    a.caret = null;
    a.chip = null;
  }

  private setStatus(a: Agent, status: string) {
    a.status = status;
    a.statusAt = now();
  }

  private async step(gen: number, task: Task | null) {
    await this.frame();
    if (gen !== this.gen || task?.removed) throw new Aborted();
    if (task?.rush) throw new Rush();
  }

  private async sleep(ms: number, gen: number, task: Task | null) {
    const end = now() + ms / this.rate();
    while (now() < end) await this.step(gen, task);
  }

  /**
   * Glide along a slight curve to a target that may itself be moving.
   * Resolves false if another move took over the cursor.
   */
  private async moveTo(
    a: Agent,
    target: () => { x: number; y: number },
    gen: number,
    task: Task | null,
    speed = 1,
    overshoot = false
  ) {
    const token = ++a.moveToken;
    const fx = a.x;
    const fy = a.y;
    let tp = target();
    const dist = Math.hypot(tp.x - fx, tp.y - fy);
    const dur = clamp(180 + dist * 0.55, 240, 1000) / (this.rate() * speed);
    const bend = (Math.random() - 0.5) * Math.min(dist * 0.35, 160);
    const start = now();
    let frames = 0;
    for (;;) {
      await this.step(gen, task);
      if (token !== a.moveToken) return false;
      const p = Math.min(1, (now() - start) / dur);
      // Re-aim every few frames (targets can drift, e.g. the marquee).
      if (++frames % 5 === 0 || p >= 1) tp = target();
      const e = overshoot ? easeOutBack(p) : easeInOut(p);
      const dx = tp.x - fx;
      const dy = tp.y - fy;
      const len = Math.hypot(dx, dy) || 1;
      const cx = fx + dx / 2 - (dy / len) * bend;
      const cy = fy + dy / 2 + (dx / len) * bend;
      const u = 1 - e;
      a.x = u * u * fx + 2 * u * e * cx + e * e * tp.x;
      a.y = u * u * fy + 2 * u * e * cy + e * e * tp.y;
      if (p >= 1) {
        a.x = tp.x;
        a.y = tp.y;
        return true;
      }
    }
  }

  private caretPoint(typing: Typing, el: HTMLElement) {
    const c = typing.caret();
    if (c) return { x: c.x + 2, y: c.y + c.h };
    const r = pageRect(el);
    return { x: r.x, y: r.y };
  }

  private async doText(
    a: Agent,
    task: Task,
    gen: number,
    tag: string,
    overshoot: boolean
  ) {
    const typing = prepareTyping(
      task.el,
      task.priority ? GHOST_PRIORITY : GHOST
    );
    const cleanup = once(() => typing.finish());
    task.cleanup = cleanup;
    try {
      this.setStatus(a, task.caption ?? `typing <${tag}>`);
      await this.moveTo(
        a,
        () => this.caretPoint(typing, task.el),
        gen,
        task,
        1,
        overshoot
      );
      this.setState(task, "building");
      typing.measure();
      const total = typing.total;
      let dur = clamp(200 + total * 20, 420, 2400) / this.rate();
      // The name is the money shot: type it at a readable pace.
      if (task.priority) dur = Math.max(dur, total * 62);
      const t0 = now();
      for (;;) {
        await this.step(gen, task);
        const p = Math.min(1, (now() - t0) / dur);
        typing.set(Math.round(total * p));
        const c = typing.caret();
        if (c) {
          a.caret = c;
          a.x += (c.x + 2 - a.x) * 0.45;
          a.y += (c.y + c.h - a.y) * 0.45;
        }
        if (p >= 1) break;
      }
    } finally {
      cleanup();
      if (task.cleanup === cleanup) task.cleanup = undefined;
      a.caret = null;
    }
  }

  private async doBlock(
    a: Agent,
    task: Task,
    gen: number,
    tag: string,
    overshoot: boolean
  ) {
    const el = task.el;
    this.setStatus(a, task.caption ?? `drawing <${tag}>`);
    await this.moveTo(
      a,
      () => {
        const r = pageRect(el);
        return { x: r.x, y: r.y };
      },
      gen,
      task,
      1,
      overshoot
    );
    const ghost = `linear-gradient(rgba(0,0,0,${GHOST}),rgba(0,0,0,${GHOST}))`;
    const draw = (p: number) =>
      setMask(
        el,
        `linear-gradient(#000,#000) 0 0 / ${(p * 100).toFixed(2)}% ${(
          p * 100
        ).toFixed(2)}% no-repeat, ${ghost}`
      );
    const cleanup = once(() => setMask(el, ""));
    task.cleanup = cleanup;
    try {
      a.pressed = true;
      // The selection paints the element in at full strength over its ghost.
      draw(0);
      this.setState(task, "building");
      // One measurement drives both the selection box and the clip, so the
      // element is revealed exactly inside the box being dragged.
      const r = pageRect(el);
      const dur =
        clamp(300 + Math.sqrt(r.w * r.h) * 0.9, 420, 1150) / this.rate();
      const t0 = now();
      for (;;) {
        await this.step(gen, task);
        const p = easeInOut(Math.min(1, (now() - t0) / dur));
        a.x = r.x + r.w * p;
        a.y = r.y + r.h * p;
        a.sel = { x: r.x, y: r.y, w: r.w * p, h: r.h * p, alpha: 1 };
        draw(p);
        if (p >= 1) break;
      }
    } finally {
      cleanup();
      if (task.cleanup === cleanup) task.cleanup = undefined;
      a.pressed = false;
    }
  }

  private async doImage(a: Agent, task: Task, gen: number, overshoot: boolean) {
    const media = task.el.querySelector("img, video");
    const src =
      media instanceof HTMLImageElement
        ? media.currentSrc || media.src
        : undefined;
    const label =
      task.caption ??
      fileName(src ?? (media as HTMLVideoElement | null)?.src) ??
      "asset";
    a.chip = { label, src };
    this.setStatus(a, `placing ${label}`);
    await this.moveTo(a, () => center(task.el), gen, task, 1, overshoot);
    a.pressed = true;
    await this.sleep(90, gen, task);
    a.chip = null;
    a.pressed = false;
    a.ripples.push({ x: a.x, y: a.y, t0: now() });
    this.setState(task, "building");
    this.reveal(task, "image");
    await this.sleep(140, gen, task);
  }

  private async doPop(
    a: Agent,
    task: Task,
    gen: number,
    tag: string,
    overshoot: boolean
  ) {
    this.setStatus(a, task.caption ?? `adding <${tag}>`);
    const jx = rand(-0.2, 0.2);
    const jy = rand(-0.15, 0.15);
    await this.moveTo(
      a,
      () => {
        const r = pageRect(task.el);
        return { x: r.x + r.w * (0.5 + jx), y: r.y + r.h * (0.5 + jy) };
      },
      gen,
      task,
      1,
      overshoot
    );
    a.pressed = true;
    await this.sleep(70, gen, task);
    a.ripples.push({ x: a.x, y: a.y, t0: now() });
    this.setState(task, "building");
    this.reveal(task, "pop");
    a.pressed = false;
    await this.sleep(80, gen, task);
  }

  private reveal(task: Task, style: "image" | "pop" | "fade") {
    const el = task.el;
    if (typeof el.animate !== "function") return;
    // Called once the element has left its ghost state, so this is its
    // real opacity.
    const opacity = getComputedStyle(el).opacity || "1";
    const g = task.priority ? GHOST_PRIORITY : GHOST;
    const frames: Keyframe[] =
      style === "pop"
        ? [
            { opacity: g, scale: "1" },
            { opacity, scale: "1.12", offset: 0.45 },
            { opacity, scale: "1" },
          ]
        : style === "image"
        ? [
            { opacity: g, scale: "0.97", filter: "blur(6px) grayscale(1)" },
            { opacity, scale: "1", filter: "blur(0px) grayscale(0)" },
          ]
        : [{ opacity: g }, { opacity }];
    task.anim = el.animate(frames, {
      duration: style === "pop" ? 360 : style === "image" ? 560 : 360,
      easing: "cubic-bezier(.2,.8,.2,1)",
    });
  }

  private setState(task: Task, state: TaskState) {
    task.state = state;
    this.setAttr(task, state);
  }

  private setAttr(task: Task, state: TaskState) {
    task.el.setAttribute("data-swarm", state);
  }

  private finishTask(task: Task) {
    task.state = "done";
    this.setAttr(task, "done");
    this.emit();
  }

  private emit(force = false) {
    let done = 0;
    let total = 0;
    for (const t of this.taskList()) {
      if (t.removed) continue;
      total++;
      if (t.state === "done") done++;
    }
    const busy = this.agents.some((a) => a.task);
    // Nudge to scroll only after 1.5 s of nothing to do, and drop the nudge
    // only after 600 ms of work, so it doesn't flicker.
    const idle =
      this.phase === "running" &&
      now() - this.startedAt > 2000 &&
      !busy &&
      !this.hasEligible &&
      done < total;
    const t = now();
    if (idle) {
      this.waitOff = 0;
      if (!this.waitOn) this.waitOn = t;
      if (t - this.waitOn > 1500) this.waiting = true;
    } else {
      this.waitOn = 0;
      if (!this.waitOff) this.waitOff = t;
      if (t - this.waitOff > 600 || this.phase !== "running") this.waiting = false;
    }
    const waiting = this.waiting;
    const seen =
      typeof document !== "undefined" &&
      document.documentElement.dataset.swarmSeen === "1";
    const s = this.snap;
    if (
      !force &&
      s.phase === this.phase &&
      s.done === done &&
      s.total === total &&
      s.waiting === waiting &&
      s.revealed === this.revealed &&
      s.roster === this.roster &&
      s.seen === seen
    ) {
      return;
    }
    this.snap = {
      phase: this.phase,
      done,
      total,
      agents: this.agents,
      roster: this.roster,
      waiting,
      skipped: this.skipped,
      revealed: this.revealed,
      seen,
    };
    this.listeners.forEach((fn) => fn());
  }
}

export const swarm = new SwarmEngine();
