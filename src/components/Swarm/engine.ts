import { AGENTS, MOBILE_AGENTS } from "./agents";
import {
  nextTypingFrame,
  prepareTyping,
  type Rect,
  type Typing,
} from "./typing";

export type { Rect };

/**
 * How cursors build an element:
 * - text:  typed in place, caret and all; long text is split into sentences
 *          that several cursors type at once
 * - block: a selection box is dragged corner to corner and paints it in
 * - image: carried in as a file chip and dropped
 * - pop:   clicked, and it stamps in
 */
export type BuildKind = "text" | "block" | "image" | "pop";

export interface BuildOptions {
  kind: BuildKind;
  /** Status shown under the cursor, or the file name for an image. */
  caption?: string;
  /** Doesn't hold up "build complete" (e.g. marquee cards scrolled out of view). */
  optional?: boolean;
  /** Built first and shown less faint while waiting (navbar, the name). */
  priority?: boolean;
}

type TaskState = "pending" | "claimed" | "building" | "done";
type Phase = "idle" | "running" | "finishing" | "complete";

interface SegmentJob {
  agent: Agent | null;
  done: boolean;
  /** Characters typed so far, kept when a cursor hands the sentence back. */
  typed: number;
}

export interface Task {
  id: string;
  el: HTMLElement;
  kind: BuildKind;
  caption?: string;
  optional: boolean;
  priority: boolean;
  state: TaskState;
  /** Within the look-ahead band below the viewport. */
  inView: boolean;
  /** Actually on screen. */
  visible: boolean;
  visibleSince: number;
  /** Scrolled past: finish it now. */
  rush: boolean;
  top: number;
  agent: Agent | null;
  removed: boolean;
  typing?: Typing;
  segs?: SegmentJob[];
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
  /** Finale: where on the ring this cursor sits (labels face outward). */
  ringAngle: number | null;
  /** Phones: an extra cursor that only joins the finale, drawn small. */
  mini: boolean;
  dom: AgentDom | null;
}

export interface Burst {
  x: number;
  y: number;
  t0: number;
  confetti: {
    angle: number;
    speed: number;
    color: string;
    w: number;
    h: number;
    spin: number;
  }[];
}

export interface SwarmSnapshot {
  phase: Phase;
  done: number;
  total: number;
  agents: Agent[];
  roster: number;
  skipped: boolean;
  /** The finale has landed (or the build was skipped): show the payoff. */
  revealed: boolean;
}

const EMPTY: SwarmSnapshot = {
  phase: "idle",
  done: 0,
  total: 0,
  agents: [],
  roster: 0,
  skipped: false,
  revealed: false,
};

/** An element left unclaimed on screen this long is shown without a cursor. */
const CATCH_UP_MS = 1500;
/** The splash stays up at least this long after navigation starts. */
const SPLASH_MS = 1900;

/**
 * How faint an element is before it's built. Text is kept readable, frames
 * and images sit further back, and containers are brighter because their
 * children's level multiplies with theirs. Build.tsx sets the same value as
 * `--swarm-ghost` so the first paint matches.
 */
export function ghostFor(kind: BuildKind, priority: boolean) {
  if (priority || kind === "block") return 0.6;
  return kind === "text" ? 0.45 : 0.3;
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

const onHome = () => window.location.pathname === "/";

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

/** The build was skipped or restarted, or someone else finished the task. */
class Aborted extends Error {}
/** The visitor scrolled past this element: finish it now. */
class Rush extends Error {}

class SwarmEngine {
  tasks = new Map<string, Task>();
  agents: Agent[] = [];
  /** Shared burst when the build completes, in page coordinates. */
  burst: Burst | null = null;
  /** Finale backdrop: 0–1 strength of the dimming scrim. */
  scrim = 0;

  private byEl = new WeakMap<Element, Task>();
  private phase: Phase = "idle";
  private settled = false;
  private skipped = false;
  private revealed = false;
  private gen = 0;
  private roster = 0;
  private base = 1;
  private boost = 1;
  private segTarget = 120;
  private startedAt = 0;
  private heroLine = 0;
  private raf = 0;
  private sleeping = false;
  private keyboard = false;
  private listening = false;
  private scrimTarget = 0;
  private waiters: Array<() => void> = [];
  private ahead: IntersectionObserver | null = null;
  private seenIO: IntersectionObserver | null = null;
  private listeners = new Set<() => void>();
  private drawers = new Set<(t: number) => void>();
  private lastSchedule = 0;
  private lastCheck = 0;
  private hasEligible = false;
  /** Viewport, read once per frame before any cursor writes to the page. */
  private vp = { sy: 0, vh: 0, atEnd: false };
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
    // During the finale's gather, Skip jumps straight to the payoff.
    if (this.phase === "finishing" && !this.revealed) {
      this.gen++;
      this.revealed = true;
      this.burst = null;
      this.scrimTarget = 0;
      for (const a of this.agents) a.targetOpacity = 0;
      this.complete(this.gen, 400);
      this.emit(true);
      return;
    }
    if (this.phase !== "running") return;
    this.gen++;
    this.skipped = true;
    document.documentElement.dataset.splash = "done";
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

  // ---- Internals ---------------------------------------------------------

  private isOn() {
    return (
      !this.settled &&
      document.documentElement.classList.contains("swarm-on")
    );
  }

  private observe(task: Task) {
    if (!this.ahead) {
      // Frames, cards and images start just before they scroll in; text is
      // only typed once it's on screen, so the visitor watches it happen.
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
        { rootMargin: "0px 0px 25% 0px" }
      );
      this.seenIO = new IntersectionObserver((entries) => {
        for (const e of entries) {
          const t = this.byEl.get(e.target);
          if (!t) continue;
          t.visible = e.isIntersecting;
          t.visibleSince = e.isIntersecting ? t.visibleSince || now() : 0;
          // Scrolled past it: don't keep the visitor's content faint above.
          if (!e.isIntersecting && e.boundingClientRect.bottom <= 0) {
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
    const typingNow = t.segs?.some((s) => s.agent && !s.done);
    if (t.state === "pending" || (t.state === "building" && t.segs && !typingNow)) {
      // Nobody is working on it right now: finish it outright.
      t.cleanup?.();
      t.cleanup = undefined;
      this.finishTask(t);
    } else {
      t.rush = true;
    }
  }

  private start() {
    if (this.phase === "running") return;
    this.phase = "running";
    this.gen++;
    this.roster++;
    // The cursors start as the splash fades out.
    this.startedAt = now() + this.endSplash();
    this.heroLine = window.scrollY + window.innerHeight;
    this.burst = null;
    this.scrim = 0;
    this.scrimTarget = 0;
    this.revealed = false;
    (window as unknown as { __swarmReady?: boolean }).__swarmReady = true;
    this.listen();

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const sx = window.scrollX;
    const sy = window.scrollY;
    const mobile = vw < 640;
    this.base = mobile ? 1.5 : 1;
    this.segTarget = mobile ? 70 : 120;
    const count = mobile ? MOBILE_AGENTS : AGENTS.length;

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
      return this.makeAgent(def, i, { x: p.x + sx, y: p.y + sy });
    });
    this.stagger();
    // Opened in a background tab: hold the opening wave until it's seen.
    if (document.hidden) {
      const onShow = () => {
        if (document.hidden) return;
        document.removeEventListener("visibilitychange", onShow);
        this.startedAt = now();
        this.stagger();
      };
      document.addEventListener("visibilitychange", onShow);
    }

    this.emit(true);
    this.wake();
    this.loop();
  }

  private makeAgent(
    def: { name: string; color: string },
    index: number,
    at: { x: number; y: number }
  ): Agent {
    return {
      index,
      name: def.name,
      color: def.color,
      x: at.x,
      y: at.y,
      opacity: 0,
      targetOpacity: 0,
      activateAt: 0,
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
      ringAngle: null,
      mini: false,
      dom: null,
    };
  }

  /** The swarm streams in as a quick wave: all of it within about a second. */
  private stagger() {
    const t = Math.max(now(), this.startedAt);
    const step = this.agents.length > 8 ? 60 : 120;
    for (const a of this.agents) a.activateAt = t + 150 + a.index * step;
  }

  /**
   * Fade the splash out once it has been up for SPLASH_MS since navigation.
   * Returns how long until the page is visible again.
   */
  private endSplash() {
    const d = document.documentElement;
    if (d.dataset.splash === "done") return 0;
    const wait = Math.max(0, SPLASH_MS - performance.now());
    window.setTimeout(() => {
      if (d.dataset.splash !== "done") d.dataset.splash = "out";
      window.setTimeout(() => {
        d.dataset.splash = "done";
      }, 500);
    }, wait);
    return wait + 250;
  }

  private listen() {
    if (this.listening) return;
    this.listening = true;
    window.addEventListener("scroll", this.wake, { passive: true });
    // Keyboard users get the full page as soon as they start tabbing into it,
    // and find-in-page gets everything at full strength.
    document.addEventListener("keydown", (e) => {
      if (e.key === "Tab") this.keyboard = true;
      if (!onHome()) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") this.skip();
    });
    document.addEventListener("pointerdown", () => {
      this.keyboard = false;
    });
    document.addEventListener("focusin", (e) => {
      const el = e.target as Element | null;
      if (!onHome() || !this.keyboard || el?.closest?.("[data-swarm-ui]")) return;
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

  private finish(natural: boolean) {
    if (this.phase !== "running") return;
    this.phase = "finishing";
    this.settled = true;
    const gen = this.gen;
    this.sleeping = false;
    if (!natural) this.revealed = true;
    this.emit(true);
    this.loop();

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // The finale plays below the navbar, which stays undimmed.
    const nav = document.querySelector('a[href="/"]')?.closest(".sticky");
    const top = Math.max(0, nav?.getBoundingClientRect().bottom ?? 0);
    const R = Math.min(vw, vh - top) * 0.36;
    const cx = vw / 2;
    const cy = top + (vh - top) / 2;
    const ringPoint = (a: Agent) => ({
      x: window.scrollX + cx + Math.cos(a.ringAngle ?? 0) * R,
      y: window.scrollY + cy + Math.sin(a.ringAngle ?? 0) * R,
    });

    const outro = async () => {
      if (!natural) {
        for (const a of this.agents) a.targetOpacity = 0;
        this.complete(gen, 450);
        return;
      }
      try {
        // Phones: the rest of the cast flies in, small, for the finale.
        if (this.agents.length < AGENTS.length) {
          const extra = AGENTS.slice(this.agents.length).map((def, k) => {
            const a = this.makeAgent(def, this.agents.length + k, {
              x: window.scrollX + (k % 2 ? vw + 30 : -30),
              y: window.scrollY + rand(top, vh),
            });
            a.mini = true;
            a.active = true;
            return a;
          });
          this.agents = [...this.agents, ...extra];
          this.roster++;
          this.emit(true);
        }
        const n = this.agents.length;
        // The page dims and the whole swarm gathers in a ring...
        this.scrimTarget = 1;
        await Promise.all(
          this.agents.map((a, i) => {
            a.ringAngle = (i / n) * Math.PI * 2 - Math.PI / 2;
            a.docked = false;
            a.leaving = true;
            a.active = true;
            a.targetOpacity = 1;
            a.status = "";
            return this.moveTo(a, () => ringPoint(a), gen, null, 0.9);
          })
        );
        await this.sleep(700, gen, null);
        // ...clicks together: the burst...
        for (const a of this.agents) a.pressed = true;
        this.burst = {
          x: window.scrollX + cx,
          y: window.scrollY + cy,
          t0: now(),
          confetti: Array.from({ length: 120 }, (_, i) => ({
            angle: rand(0, Math.PI * 2),
            speed: rand(0.3, 1) * Math.max(vw, vh) * 0.5,
            color: this.agents[i % n].color,
            w: rand(4, 7),
            h: rand(8, 12),
            spin: rand(-12, 12),
          })),
        };
        this.revealed = true;
        this.emit(true);
        await this.sleep(160, gen, null);
        for (const a of this.agents) a.pressed = false;
        // ...orbits for a moment, then fades away.
        const t0 = now();
        for (;;) {
          await this.step(gen, null);
          const e = now() - t0;
          for (const a of this.agents) {
            a.ringAngle = (a.ringAngle ?? 0) + 0.014;
            const p = ringPoint(a);
            a.x = p.x;
            a.y = p.y;
            if (e > 1500) a.targetOpacity = 0;
          }
          if (e > 1500) this.scrimTarget = 0;
          if (e > 2100) break;
        }
        this.complete(gen, 0);
      } catch {
        // Skipped mid-finale.
      }
    };
    void outro();
  }

  private complete(gen: number, delay: number) {
    window.setTimeout(() => {
      if (gen !== this.gen) return;
      this.phase = "complete";
      this.burst = null;
      this.scrim = 0;
      this.scrimTarget = 0;
      this.revealed = true;
      for (const a of this.agents) a.ringAngle = null;
      // Nothing is pending any more; drop the ghost rules entirely.
      document.documentElement.classList.remove("swarm-on");
      this.emit(true);
    }, delay + 300);
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
    // The opening runs a touch slower so the hero reads as a scene.
    const warm = now() - this.startedAt < 4000 ? 0.75 : 1;
    return this.base * this.boost * warm;
  }

  private tick = async (t: number) => {
    this.raf = 0;
    nextTypingFrame();
    // All reads for this frame happen here, before any cursor writes text.
    const vh = window.innerHeight;
    this.vp = {
      sy: window.scrollY,
      vh,
      atEnd:
        window.scrollY + vh >= document.documentElement.scrollHeight - 2,
    };
    for (const task of this.taskList()) {
      if (task.typing && task.state === "building") task.typing.prime();
    }
    const waiters = this.waiters;
    this.waiters = [];
    for (const w of waiters) w();

    const running = this.phase === "running";
    const vw = window.innerWidth;
    const resting = this.agents.filter((a) => !a.mini).length;
    for (const a of this.agents) {
      if (!a.active && running && a.activateAt && t >= a.activateAt) {
        a.active = true;
        a.targetOpacity = 1;
        a.idleSince = t;
      }
      // Idle cursors wait in a row along the bottom edge, in shot.
      if (a.docked && !a.task) {
        a.x = window.scrollX + ((a.index + 0.5) / resting) * vw;
        a.y = window.scrollY + vh - 26;
      }
      a.opacity += (a.targetOpacity - a.opacity) * 0.14;
      if (a.sel && !a.pressed) {
        a.sel.alpha -= 0.05;
        if (a.sel.alpha <= 0) a.sel = null;
      }
      if (a.ripples.length) a.ripples = a.ripples.filter((r) => t - r.t0 < 520);
    }
    this.scrim += (this.scrimTarget - this.scrim) * 0.12;
    if (this.burst && t - this.burst.t0 > 1600) this.burst = null;

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
    // drawing, so selection boxes and masks stay in lockstep.
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
      this.waiters.length ||
      Math.abs(this.scrim - this.scrimTarget) > 0.01
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

  /** Whether a caret position (page coordinates) is comfortably on screen. */
  private caretOnScreen(c: Rect | null) {
    if (!c) return true;
    const { sy, vh, atEnd } = this.vp;
    const y = c.y - sy;
    // At the very bottom of the page nothing can scroll further up.
    return y > -c.h && y < (atEnd ? vh : vh - 24);
  }

  /** Where a segment's typing would resume, if that's on screen. */
  private segmentOnScreen(task: Task, i: number) {
    const seg = task.typing?.segments[i];
    const typed = task.segs?.[i]?.typed ?? 0;
    return (
      !!seg &&
      this.caretOnScreen(task.typing?.caretAt(seg.start + typed) ?? null)
    );
  }

  /** Hand the next elements to idle cursors: on screen first, top first. */
  private schedule() {
    const eligible: Task[] = [];
    const segJobs: { task: Task; i: number }[] = [];
    let onScreen = 0;
    for (const t of this.taskList()) {
      if (t.removed) continue;
      if (t.state === "pending" && t.inView && this.isReady(t)) {
        // Text waits until it's on screen, so the typing is seen.
        if (t.kind === "text" && !t.visible) continue;
        // The hero photo and logo strip are its closing beats.
        if (
          !t.priority &&
          (t.kind === "image" || t.kind === "block") &&
          t.top < this.heroLine &&
          now() < this.startedAt + 2000
        ) {
          continue;
        }
        eligible.push(t);
        if (t.visible) onScreen++;
      } else if (t.state === "building" && t.segs) {
        t.segs.forEach((s, i) => {
          if (!s.agent && !s.done && this.segmentOnScreen(t, i)) {
            segJobs.push({ task: t, i });
          }
        });
      }
    }
    this.hasEligible = eligible.length > 0 || segJobs.length > 0;
    // A backlog on screen speeds the swarm up (but let the opening breathe).
    this.boost =
      now() - this.startedAt < 3000 ? 1 : clamp(1 + onScreen / 8, 1, 2);

    const idle = this.agents.filter((a) => a.active && !a.task && !a.leaving);
    if (!idle.length || !this.hasEligible) return;

    // Join in on paragraphs already being typed first: many hands at once.
    for (const job of segJobs) {
      if (!idle.length) return;
      const c = job.task.typing?.caretAt(job.task.typing.segments[job.i].start);
      let best = 0;
      let bestD = Infinity;
      idle.forEach((a, k) => {
        const d = c ? Math.hypot(c.x - a.x, c.y - a.y) : 0;
        if (d < bestD) {
          bestD = d;
          best = k;
        }
      });
      const [a] = idle.splice(best, 1);
      void this.runSegment(a, job.task, job.i);
    }

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
    // Keep the whole cast on stage through the opening.
    if (t < this.startedAt + 2000) return;
    const vw = window.innerWidth;
    for (const a of this.agents) {
      if (!a.active || a.task || a.leaving || a.moving || a.docked) continue;
      a.targetOpacity = 0.8;
      if (t < a.idleSince + 450) continue;
      a.moving = true;
      const resting = this.agents.filter((x) => !x.mini).length;
      this.moveTo(
        a,
        () => ({
          x: window.scrollX + ((a.index + 0.5) / resting) * vw,
          y: window.scrollY + window.innerHeight - 26,
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
    if (!onHome()) return;
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
        // Every cursor is busy and this has sat faint on screen: show it.
        const since = Math.max(t.visibleSince, this.startedAt + 2500);
        const limit = t.optional ? 500 : CATCH_UP_MS;
        if (t.visible && t.visibleSince && t0 - since > limit) {
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
      let finished = true;
      if (task.kind === "text") finished = await this.doText(a, task, gen, tag, overshoot);
      else if (task.kind === "block") await this.doBlock(a, task, gen, tag, overshoot);
      else if (task.kind === "image") await this.doImage(a, task, gen, overshoot);
      else await this.doPop(a, task, gen, tag, overshoot);
      if (
        finished &&
        gen === this.gen &&
        !task.removed &&
        (task.state as TaskState) !== "done"
      ) {
        this.finishTask(task);
      }
    } catch (err) {
      this.handleError(err, task, gen);
    } finally {
      if (task.agent === a) task.agent = null;
      if (a.task === task) this.resetAgent(a);
      a.idleSince = now();
    }
  }

  private handleError(err: unknown, task: Task, gen: number) {
    if (err instanceof Rush) {
      task.cleanup?.();
      task.cleanup = undefined;
      if (!task.removed && task.state !== "done") this.finishTask(task);
    } else if (!(err instanceof Aborted)) {
      console.error(err);
      task.cleanup?.();
      task.cleanup = undefined;
      if (gen === this.gen && !task.removed && task.state !== "done") {
        this.finishTask(task);
      }
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
    if (task?.state === "done") throw new Aborted();
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

  /**
   * First cursor on a text element: split it into sentences, type the first,
   * and keep taking free sentences while others join in. Resolves true when
   * this cursor typed the last one.
   */
  private async doText(
    a: Agent,
    task: Task,
    gen: number,
    tag: string,
    overshoot: boolean
  ) {
    const typing = prepareTyping(
      task.el,
      ghostFor(task.kind, task.priority),
      this.segTarget
    );
    typing.measure();
    task.typing = typing;
    task.segs = typing.segments.map(() => ({
      agent: null,
      done: false,
      typed: 0,
    }));
    task.cleanup = once(() => typing.finish());
    task.segs[0].agent = a;
    this.setStatus(a, task.caption ?? `typing <${tag}>`);
    await this.moveTo(
      a,
      () => this.caretTarget(task, 0),
      gen,
      task,
      1,
      overshoot
    );
    // Ghost spans and the element switch levels together: no dip.
    typing.ghostOn();
    this.setState(task, "building");
    return this.typeSegments(a, task, gen, 0);
  }

  /** Another cursor joins a paragraph that's already being typed. */
  private async runSegment(a: Agent, task: Task, i: number) {
    const gen = this.gen;
    const segs = task.segs;
    const typing = task.typing;
    if (!segs || !typing || segs[i].agent || segs[i].done) return;
    segs[i].agent = a;
    a.task = task;
    a.docked = false;
    a.targetOpacity = 1;
    const overshoot = !a.landed;
    a.landed = true;
    try {
      this.setStatus(a, task.caption ?? `typing <${task.el.tagName.toLowerCase()}>`);
      await this.moveTo(
        a,
        () => this.caretTarget(task, i),
        gen,
        task,
        1,
        overshoot
      );
      const last = await this.typeSegments(a, task, gen, i);
      if (last && gen === this.gen && !task.removed && task.state !== "done") {
        this.finishTask(task);
      }
    } catch (err) {
      this.handleError(err, task, gen);
    } finally {
      if (a.task === task) this.resetAgent(a);
      a.idleSince = now();
    }
  }

  /** Where a cursor should fly to pick up segment `i` (live, follows scroll). */
  private caretTarget(task: Task, i: number) {
    const seg = task.typing?.segments[i];
    const typed = task.segs?.[i]?.typed ?? 0;
    const c = seg ? task.typing?.caretAt(seg.start + typed) : null;
    return c ? { x: c.x + 2, y: c.y + c.h } : center(task.el);
  }

  /**
   * Type segment `i`, then any free on-screen ones. If the caret drifts below
   * the fold, the sentence is handed back (progress kept) and the cursor goes
   * to wait with the others. True if this cursor typed the last sentence.
   */
  private async typeSegments(a: Agent, task: Task, gen: number, i: number) {
    const typing = task.typing as Typing;
    const segs = task.segs as SegmentJob[];
    let current: number | null = i;
    while (current !== null) {
      const job: SegmentJob = segs[current];
      const seg = typing.segments[current];
      const len = seg.end - seg.start;
      let dur = clamp(160 + len * 16, 350, 1200) / this.rate();
      // The name is the money shot: type it at a readable pace.
      if (task.priority) dur = Math.max(dur, len * 62);
      let elapsed = (job.typed / len) * dur;
      let last = now();
      for (;;) {
        await this.step(gen, task);
        const t = now();
        if (!this.caretOnScreen(typing.caretAt(seg.start + job.typed))) {
          job.agent = null;
          a.caret = null;
          return false;
        }
        elapsed += t - last;
        last = t;
        const p = Math.min(1, elapsed / dur);
        job.typed = Math.round(len * p);
        typing.type(current, job.typed);
        const caret = typing.caretAt(seg.start + job.typed);
        if (caret) {
          a.caret = caret;
          a.x += (caret.x + 2 - a.x) * 0.45;
          a.y += (caret.y + caret.h - a.y) * 0.45;
        }
        if (p >= 1) break;
      }
      job.done = true;
      a.caret = null;
      // Keep going with the next free sentence that's on screen.
      current = null;
      for (let k = 0; k < segs.length; k++) {
        if (!segs[k].agent && !segs[k].done && this.segmentOnScreen(task, k)) {
          segs[k].agent = a;
          current = k;
          const next = k;
          await this.moveTo(a, () => this.caretTarget(task, next), gen, task);
          break;
        }
      }
    }
    if (segs.every((s) => s.done)) {
      task.cleanup?.();
      task.cleanup = undefined;
      return true;
    }
    return false;
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
    const g = ghostFor(task.kind, task.priority);
    const ghost = `linear-gradient(rgba(0,0,0,${g}),rgba(0,0,0,${g}))`;
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
      // One measurement drives both the selection box and the mask.
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
    const g = ghostFor(task.kind, task.priority);
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
    const s = this.snap;
    if (
      !force &&
      s.phase === this.phase &&
      s.done === done &&
      s.total === total &&
      s.revealed === this.revealed &&
      s.roster === this.roster
    ) {
      return;
    }
    this.snap = {
      phase: this.phase,
      done,
      total,
      agents: this.agents,
      roster: this.roster,
      skipped: this.skipped,
      revealed: this.revealed,
    };
    this.listeners.forEach((fn) => fn());
  }
}

export const swarm = new SwarmEngine();
