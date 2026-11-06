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
  label?: string;
  /** Doesn't hold up "build complete" (e.g. marquee cards scrolled out of view). */
  optional?: boolean;
}

type TaskState = "pending" | "claimed" | "building" | "done";
type Phase = "idle" | "running" | "finishing" | "complete";

export interface Task {
  id: string;
  el: HTMLElement;
  kind: BuildKind;
  label?: string;
  optional: boolean;
  state: TaskState;
  inView: boolean;
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
  leaving: boolean;
  task: Task | null;
  status: string;
  pressed: boolean;
  moveToken: number;
  wandering: boolean;
  nextWander: number;
  sel: (Rect & { alpha: number }) | null;
  caret: Rect | null;
  chip: { label: string; src?: string } | null;
  ripples: { x: number; y: number; t0: number }[];
  dom: AgentDom | null;
}

export interface SwarmSnapshot {
  phase: Phase;
  done: number;
  total: number;
  agents: number;
  roster: number;
  waiting: boolean;
  skipped: boolean;
  seconds: number;
}

const EMPTY: SwarmSnapshot = {
  phase: "idle",
  done: 0,
  total: 0,
  agents: 0,
  roster: 0,
  waiting: false,
  skipped: false,
  seconds: 0,
};

/** Global speed knob for the whole build. */
const SPEED = 1;

const now = () => performance.now();
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

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

class Aborted extends Error {}

class SwarmEngine {
  tasks = new Map<string, Task>();
  agents: Agent[] = [];

  private byEl = new WeakMap<Element, Task>();
  private phase: Phase = "idle";
  private settled = false;
  private skipped = false;
  private gen = 0;
  private roster = 0;
  private startedAt = 0;
  private finishedAt = 0;
  private raf = 0;
  private waiters: Array<() => void> = [];
  private io: IntersectionObserver | null = null;
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
      label: opts.label,
      optional: !!opts.optional,
      state: "pending",
      inView: false,
      top: 0,
      agent: null,
      removed: false,
    };
    this.tasks.set(id, task);
    this.byEl.set(el, task);
    this.getIO().observe(el);

    if (this.isOn()) this.start();
    else this.finishTask(task);
    this.emit();

    return () => {
      this.io?.unobserve(el);
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
        t.el.style.clipPath = "";
        this.finishTask(t);
      }
    }
    for (const a of this.agents) this.resetAgent(a);
    this.finish();
  };

  rebuild = () => {
    this.gen++;
    this.settled = false;
    this.skipped = false;
    this.phase = "idle";
    document.documentElement.classList.add("swarm-on");
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    const io = this.getIO();
    for (const t of this.taskList()) {
      if (t.removed) continue;
      t.cleanup?.();
      t.cleanup = undefined;
      t.anim?.cancel();
      t.el.style.clipPath = "";
      t.state = "pending";
      t.agent = null;
      t.inView = false;
      this.setAttr(t, "pending");
      // Re-observing makes the observer report fresh positions after the jump.
      io.unobserve(t.el);
      io.observe(t.el);
    }
    this.start();
  };

  // ---- Internals ---------------------------------------------------------

  private isOn() {
    return (
      !this.settled &&
      document.documentElement.classList.contains("swarm-on")
    );
  }

  private getIO() {
    if (!this.io) {
      this.io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            const t = this.byEl.get(e.target);
            if (!t) continue;
            t.inView = e.isIntersecting;
            t.top = e.boundingClientRect.top + window.scrollY;
          }
        },
        { rootMargin: "0px" }
      );
    }
    return this.io;
  }

  private start() {
    if (this.phase === "running") return;
    this.phase = "running";
    this.gen++;
    this.roster++;
    this.startedAt = now();
    this.finishedAt = 0;
    (window as unknown as { __swarmReady?: boolean }).__swarmReady = true;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const sx = window.scrollX;
    const sy = window.scrollY;
    const count = vw < 800 ? MOBILE_AGENTS : AGENTS.length;
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
        activateAt: t + 120 + i * 60,
        active: false,
        leaving: false,
        task: null,
        status: "",
        pressed: false,
        moveToken: 0,
        wandering: false,
        nextWander: 0,
        sel: null,
        caret: null,
        chip: null,
        ripples: [],
        dom: null,
      };
    });
    this.emit(true);
    this.loop();
  }

  private finish() {
    if (this.phase !== "running") return;
    this.phase = "finishing";
    this.settled = true;
    this.finishedAt = now();
    const gen = this.gen;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const exits = this.agents.map((a) => {
      a.leaving = true;
      a.targetOpacity = 1;
      // Leave through the nearest side edge or the bottom.
      const vx = a.x - window.scrollX;
      const vy = a.y - window.scrollY;
      const toLeft = vx;
      const toRight = vw - vx;
      const toBottom = vh - vy;
      const m = Math.min(toLeft, toRight, toBottom);
      const tx = m === toLeft ? -80 : m === toRight ? vw + 80 : vx;
      const ty = m === toBottom ? vh + 80 : vy;
      return this.moveTo(
        a,
        () => ({ x: window.scrollX + tx, y: window.scrollY + ty }),
        gen,
        null,
        0.8
      )
        .catch(() => {})
        .then(() => {
          a.targetOpacity = 0;
        });
    });
    this.emit(true);
    this.loop();

    Promise.all(exits).then(() => {
      window.setTimeout(() => {
        if (gen !== this.gen) return;
        this.phase = "complete";
        this.emit(true);
      }, 300);
    });
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

  private tick = (t: number) => {
    this.raf = 0;
    const waiters = this.waiters;
    this.waiters = [];
    for (const w of waiters) w();

    const running = this.phase === "running";
    for (const a of this.agents) {
      if (!a.active && running && t >= a.activateAt) {
        a.active = true;
        a.targetOpacity = 1;
      }
      a.opacity += (a.targetOpacity - a.opacity) * 0.14;
      if (a.sel && !a.pressed) {
        a.sel.alpha -= 0.05;
        if (a.sel.alpha <= 0) a.sel = null;
      }
      if (a.ripples.length) a.ripples = a.ripples.filter((r) => t - r.t0 < 520);
    }

    if (running) {
      if (t - this.lastSchedule > 100) {
        this.lastSchedule = t;
        this.schedule();
      }
      this.wander(t);
      if (t - this.lastCheck > 300) {
        this.lastCheck = t;
        this.checkComplete();
        this.emit();
      }
    }

    for (const draw of Array.from(this.drawers)) draw(t);

    if (running || this.phase === "finishing" || this.waiters.length) {
      this.loop();
    }
  };

  /** Hand the next elements on screen to idle cursors, top of the page first. */
  private schedule() {
    const eligible: Task[] = [];
    for (const t of this.taskList()) {
      if (t.state === "pending" && !t.removed && t.inView && this.isReady(t)) {
        eligible.push(t);
      }
    }
    this.hasEligible = eligible.length > 0;
    const idle = this.agents.filter((a) => a.active && !a.task && !a.leaving);
    if (!idle.length || !eligible.length) return;

    eligible.sort(
      (a, b) =>
        a.top - b.top ||
        (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING
          ? -1
          : 1)
    );

    for (const a of idle) {
      if (!eligible.length) break;
      // Of the next few jobs in reading order, take the one closest by.
      const pool = Math.min(eligible.length, 4);
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

  /** Idle cursors hang around the bottom of the screen, waiting for work. */
  private wander(t: number) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    for (const a of this.agents) {
      if (!a.active || a.task || a.leaving || a.wandering || t < a.nextWander) {
        continue;
      }
      a.wandering = true;
      a.targetOpacity = 0.4;
      const fx = rand(0.08, 0.92) * vw;
      const fy = rand(0.8, 0.95) * vh;
      this.moveTo(
        a,
        () => ({ x: window.scrollX + fx, y: window.scrollY + fy }),
        this.gen,
        null,
        0.35
      )
        .catch(() => {})
        .finally(() => {
          a.wandering = false;
          a.nextWander = now() + rand(400, 1800);
        });
    }
  }

  private checkComplete() {
    let live = 0;
    let required = 0;
    for (const t of this.taskList()) {
      if (t.removed) continue;
      live++;
      if (t.state === "done") continue;
      if (t.state === "pending" && this.isReady(t)) {
        // Hidden at this breakpoint (display: none) – nothing to build.
        const r = t.el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) {
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
    this.finish();
  }

  private async run(a: Agent, task: Task) {
    const gen = this.gen;
    task.state = "claimed";
    task.agent = a;
    a.task = task;
    a.targetOpacity = 1;
    this.setAttr(task, "claimed");
    const tag = task.el.tagName.toLowerCase();
    try {
      if (task.kind === "text") await this.doText(a, task, gen, tag);
      else if (task.kind === "block") await this.doBlock(a, task, gen, tag);
      else if (task.kind === "image") await this.doImage(a, task, gen);
      else await this.doPop(a, task, gen, tag);
      if (gen === this.gen && !task.removed) this.finishTask(task);
    } catch (err) {
      if (!(err instanceof Aborted)) {
        console.error(err);
        if (gen === this.gen && !task.removed) this.finishTask(task);
      }
    } finally {
      if (task.agent === a) task.agent = null;
      if (a.task === task) this.resetAgent(a);
      a.nextWander = now() + 250;
    }
  }

  private resetAgent(a: Agent) {
    a.task = null;
    a.status = "";
    a.pressed = false;
    a.caret = null;
    a.chip = null;
  }

  private async step(gen: number, task: Task | null) {
    await this.frame();
    if (gen !== this.gen || task?.removed) throw new Aborted();
  }

  private async sleep(ms: number, gen: number, task: Task) {
    const end = now() + ms / SPEED;
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
    speed = 1
  ) {
    const token = ++a.moveToken;
    const fx = a.x;
    const fy = a.y;
    const first = target();
    const dist = Math.hypot(first.x - fx, first.y - fy);
    const dur = clamp(160 + dist * 0.55, 220, 950) / (SPEED * speed);
    const bend = (Math.random() - 0.5) * Math.min(dist * 0.35, 160);
    const start = now();
    for (;;) {
      await this.step(gen, task);
      if (token !== a.moveToken) return false;
      const p = Math.min(1, (now() - start) / dur);
      const e = easeInOut(p);
      const tp = target();
      const dx = tp.x - fx;
      const dy = tp.y - fy;
      const len = Math.hypot(dx, dy) || 1;
      const cx = fx + dx / 2 - (dy / len) * bend;
      const cy = fy + dy / 2 + (dx / len) * bend;
      const u = 1 - e;
      a.x = u * u * fx + 2 * u * e * cx + e * e * tp.x;
      a.y = u * u * fy + 2 * u * e * cy + e * e * tp.y;
      if (p >= 1) return true;
    }
  }

  private caretPoint(typing: Typing, el: HTMLElement) {
    const c = typing.caret();
    if (c) return { x: c.x + 2, y: c.y + c.h };
    const r = pageRect(el);
    return { x: r.x, y: r.y };
  }

  private async doText(a: Agent, task: Task, gen: number, tag: string) {
    const typing = prepareTyping(task.el);
    const cleanup = once(() => typing.finish());
    task.cleanup = cleanup;
    try {
      a.status = task.label ?? `typing <${tag}>`;
      await this.moveTo(a, () => this.caretPoint(typing, task.el), gen, task);
      this.setState(task, "building");
      const total = typing.total;
      const dur = clamp(240 + total * 16, 380, 2600) / SPEED;
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

  private async doBlock(a: Agent, task: Task, gen: number, tag: string) {
    const el = task.el;
    a.status = task.label ?? `drawing <${tag}>`;
    await this.moveTo(
      a,
      () => {
        const r = pageRect(el);
        return { x: r.x, y: r.y };
      },
      gen,
      task
    );
    const cleanup = once(() => {
      el.style.clipPath = "";
    });
    task.cleanup = cleanup;
    try {
      a.pressed = true;
      el.style.clipPath = "inset(0 100% 100% 0)";
      this.setState(task, "building");
      const r0 = pageRect(el);
      const dur = clamp(300 + Math.sqrt(r0.w * r0.h) * 0.9, 420, 1150) / SPEED;
      const t0 = now();
      for (;;) {
        await this.step(gen, task);
        const p = easeInOut(Math.min(1, (now() - t0) / dur));
        const r = pageRect(el);
        a.x = r.x + r.w * p;
        a.y = r.y + r.h * p;
        a.sel = { x: r.x, y: r.y, w: r.w * p, h: r.h * p, alpha: 1 };
        const inset = ((1 - p) * 100).toFixed(2);
        el.style.clipPath = `inset(0 ${inset}% ${inset}% 0)`;
        if (p >= 1) break;
      }
    } finally {
      cleanup();
      if (task.cleanup === cleanup) task.cleanup = undefined;
      a.pressed = false;
    }
  }

  private async doImage(a: Agent, task: Task, gen: number) {
    const media = task.el.querySelector("img, video");
    const src =
      media instanceof HTMLImageElement
        ? media.currentSrc || media.src
        : undefined;
    const label =
      task.label ??
      fileName(src ?? (media as HTMLVideoElement | null)?.src) ??
      "asset";
    a.chip = { label, src };
    a.status = `placing ${label}`;
    await this.moveTo(a, () => center(task.el), gen, task);
    a.pressed = true;
    await this.sleep(90, gen, task);
    a.chip = null;
    a.pressed = false;
    a.ripples.push({ x: a.x, y: a.y, t0: now() });
    this.setState(task, "building");
    this.reveal(task, "image");
    await this.sleep(140, gen, task);
  }

  private async doPop(a: Agent, task: Task, gen: number, tag: string) {
    a.status = task.label ?? `adding <${tag}>`;
    const jx = rand(-0.2, 0.2);
    const jy = rand(-0.15, 0.15);
    await this.moveTo(
      a,
      () => {
        const r = pageRect(task.el);
        return { x: r.x + r.w * (0.5 + jx), y: r.y + r.h * (0.5 + jy) };
      },
      gen,
      task
    );
    a.pressed = true;
    await this.sleep(70, gen, task);
    a.ripples.push({ x: a.x, y: a.y, t0: now() });
    this.setState(task, "building");
    this.reveal(task, "pop");
    a.pressed = false;
    await this.sleep(80, gen, task);
  }

  private reveal(task: Task, style: "image" | "pop") {
    const el = task.el;
    if (typeof el.animate !== "function") return;
    const opacity = getComputedStyle(el).opacity || "1";
    task.anim =
      style === "pop"
        ? el.animate(
            [
              { opacity: 0, scale: "0.6" },
              { opacity, scale: "1" },
            ],
            { duration: 380, easing: "cubic-bezier(.34,1.56,.64,1)" }
          )
        : el.animate(
            [
              { opacity: 0, scale: "0.94", filter: "blur(10px)" },
              { opacity, scale: "1", filter: "blur(0px)" },
            ],
            { duration: 520, easing: "cubic-bezier(.2,.8,.2,1)" }
          );
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
    // Only nudge to scroll once the swarm has had a moment to arrive.
    const waiting =
      this.phase === "running" &&
      now() - this.startedAt > 2000 &&
      !busy &&
      !this.hasEligible &&
      done < total;
    const seconds = this.finishedAt
      ? (this.finishedAt - this.startedAt) / 1000
      : 0;
    const s = this.snap;
    if (
      !force &&
      s.phase === this.phase &&
      s.done === done &&
      s.total === total &&
      s.waiting === waiting &&
      s.roster === this.roster
    ) {
      return;
    }
    this.snap = {
      phase: this.phase,
      done,
      total,
      agents: this.agents.length,
      roster: this.roster,
      waiting,
      skipped: this.skipped,
      seconds,
    };
    this.listeners.forEach((fn) => fn());
  }
}

export const swarm = new SwarmEngine();
