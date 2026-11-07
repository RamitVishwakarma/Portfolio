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
  /** Name of the cursor that should build this when it's free ("Docker"). */
  owner?: string;
  /** How faint it waits (from ghostFor, set by Build). */
  ghost?: number;
  /** On phones, appears together with the element it sits in. */
  pack?: boolean;
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
  owner?: string;
  /** When this first could have started (for owner hand-off). */
  readySince: number;
  /** Opacity it waits at before it's built. */
  ghost: number;
  pack: boolean;
  heading: boolean;
  /** When it was first both on screen and ready to start (catch-up clock). */
  readyAt: number;
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
  /** Label hidden: resting at the screen edge, or flying to its spot. */
  quiet: boolean;
  /** Resting in the right gutter keeps its label on the outer side. */
  parkRight: boolean;
  /** Has hovered near someone else's work since it last had a job. */
  spectated: boolean;
  /** Just left the splash: its first trip is quick, so the hero clears. */
  fresh: boolean;
  /** Its very first flight out of the splash: never a dart. */
  firstLeg: boolean;
  /** Desktop: which of the two in-view gutter spots it waits in (-1: off the edge). */
  slot: number;
  /** When it last settled into its waiting spot. */
  dockedAt: number;
  /** Spot picked while docked, used for the next spectate move. */
  nextSpot: { x: number; y: number } | null;
  /** Last caret while it still holds a text job (labels stay put). */
  lastCaret: Rect | null;
  dom: AgentDom | null;
}

export interface Burst {
  x: number;
  y: number;
  t0: number;
  /** Paper launched up from the ring; positions relative to the centre. */
  confetti: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    w: number;
    h: number;
    spin: number;
  }[];
  /** Top of the area the finale may draw in (below the navbar), viewport px. */
  top: number;
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

/** The hero photo and logo strip wait this long for the first typists. */
const HERO_HOLD = 900;
/** An element left unclaimed on screen this long is shown without a cursor. */
const CATCH_UP_MS = 1500;
/** The splash stays up at least this long after navigation starts. */
const SPLASH_MS = 1900;
/** ...and at least this long after it first paints, but never past SPLASH_MAX. */
const SPLASH_AFTER_PAINT = 1800;
const SPLASH_MAX = 3000;
/** The splash words fade this long before the cursors take over. */
const WORDS_MS = 170;

/**
 * How faint an element is before it's built. Text is kept readable, frames
 * and images sit further back, and containers are brighter because their
 * children's level multiplies with theirs. Build.tsx sets the same value as
 * `--swarm-ghost` so the first paint matches.
 */
export function ghostFor(kind: BuildKind, priority: boolean, light = false) {
  // On light cards the card waits as a dim grey (globals.css adds greyscale)
  // and its text at half, so typing on it still reads as typing.
  if (light) return kind === "block" ? 0.6 : 0.5;
  if (priority || kind === "block") return 0.6;
  return kind === "text" ? 0.5 : 0.3;
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

/**
 * The splash's step ("words", "out", "done") is kept on the splash element
 * itself, so changing it restyles only the splash, not the whole page.
 */
function splashState() {
  const el = document.querySelector<HTMLElement>(".swarm-splash");
  return el ? el.dataset.state : "done";
}
function setSplashState(state: string | undefined) {
  const el = document.querySelector<HTMLElement>(".swarm-splash");
  if (!el) return;
  if (state === undefined) delete el.dataset.state;
  else el.dataset.state = state;
}

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
  /** Finale ring (viewport coordinates) and how strongly to outline it. */
  ring: { x: number; y: number; r: number; alpha: number } | null = null;

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
  private vp = { sx: 0, sy: 0, vw: 0, vh: 0, atEnd: false };

  /** This frame's scroll and viewport size, for drawing without re-reading. */
  get viewport() {
    return this.vp;
  }

  /** When the cursors took over from the splash. */
  get handoffAt() {
    return this.handoff || this.startedAt;
  }
  private handoff = 0;
  /** When the cursors took over from the splash pills (0: no splash). */
  get flightFrom() {
    return this.pillsAt;
  }
  private pillsAt = 0;

  /** Visible text and buttons this frame (labels keep off them). */
  obstacles: Rect[] = [];
  private obstaclesAt = -1e9;
  private obstaclesSy = -1;
  private lastScroll = 0;
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
      owner: opts.owner,
      readySince: 0,
      ghost: opts.ghost ?? ghostFor(opts.kind, !!opts.priority),
      pack: !!opts.pack,
      heading: el.tagName === "H2" || el.tagName === "H3",
      readyAt: 0,
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
      this.finaleLive = false;
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
    this.finaleLive = false;
    this.gen++;
    this.skipped = true;
    setSplashState("done");
    this.startedAt = Math.min(this.startedAt, now());
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
        { rootMargin: "0px 0px 10% 0px" }
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
    // The cursors start as the splash fades out. A tab opened in the
    // background keeps its splash until it is actually looked at.
    const hiddenAtStart = document.hidden;
    this.startedAt = hiddenAtStart ? now() + 1e9 : now() + this.endSplash(false);
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
    // Short sentences, so many cursors can share one paragraph.
    this.segTarget = mobile ? 50 : 80;
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
    if (hiddenAtStart) {
      const onShow = () => {
        if (document.hidden) return;
        document.removeEventListener("visibilitychange", onShow);
        this.startedAt = now() + this.endSplash(true);
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
      quiet: false,
      parkRight: false,
      spectated: false,
      fresh: false,
      firstLeg: false,
      slot: -1,
      dockedAt: 0,
      nextSpot: null,
      lastCaret: null,
      dom: null,
    };
  }

  /** The swarm streams in as a quick wave: all of it within about a second. */
  private stagger() {
    const t = Math.max(now(), this.startedAt);
    // Everyone leaves the splash within about half a second.
    const step = this.agents.length > 8 ? 25 : 60;
    for (const a of this.agents) a.activateAt = t + 40 + a.index * step;
  }

  /**
   * Fade the splash out: at least SPLASH_MS after navigation and
   * SPLASH_AFTER_PAINT after it first painted (or after the tab was first
   * shown), capped at SPLASH_MAX. Its text leaves first, then the cursors
   * take over from the pills and the backdrop fades. Returns how long until
   * the cursors may start moving.
   */
  private endSplash(fromShow: boolean) {
    if (splashState() === "done") return 0;
    const t = performance.now();
    let wait: number;
    if (fromShow) {
      wait = SPLASH_AFTER_PAINT;
    } else {
      const paint = performance
        .getEntriesByType("paint")
        .find((e) => e.name === "first-contentful-paint");
      const end = Math.min(
        Math.max(SPLASH_MS, (paint?.startTime ?? t) + SPLASH_AFTER_PAINT),
        SPLASH_MAX
      );
      wait = Math.max(0, end - t);
    }
    const gen = this.gen;
    window.setTimeout(() => this.liftSplash(gen), wait);
    return wait + WORDS_MS;
  }

  /**
   * The hand-off, in order: the words fade; then the pills turn into the
   * real cursors where they stand and the backdrop fades; then it's gone.
   */
  private liftSplash(gen: number) {
    if (gen !== this.gen || splashState() === "done") return;
    if (document.hidden) {
      // Hidden mid-splash: give the visitor the splash again on return.
      const onShow = () => {
        if (document.hidden) return;
        document.removeEventListener("visibilitychange", onShow);
        this.startedAt = now() + this.endSplash(true);
        this.stagger();
      };
      document.addEventListener("visibilitychange", onShow);
      this.startedAt = now() + 1e9;
      return;
    }
    setSplashState("words");
    window.setTimeout(() => {
      if (gen !== this.gen || splashState() === "done") return;
      if (document.hidden) {
        setSplashState(undefined);
        this.liftSplash(gen);
        return;
      }
      this.fromSplash();
      this.pillsAt = now();
      // Show the cursors at the pills first, flip the splash once they have
      // painted, then set them flying a frame later, so the hand-off reads
      // as a flight rather than a cut.
      for (const a of this.agents) {
        a.opacity = 1;
        a.targetOpacity = 1;
      }
      this.startedAt = Math.min(this.startedAt, now());
      this.wake();
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (gen !== this.gen) return;
          setSplashState("out");
          this.heroLine = window.scrollY + window.innerHeight;
          requestAnimationFrame(() => {
            if (gen !== this.gen) return;
            const t0 = now();
            this.handoff = t0;
            // Held hero work becomes claimable then; make sure the loop is up.
            window.setTimeout(() => {
              if (gen === this.gen) {
                this.lastSchedule = 0;
                this.wake();
              }
            }, Math.max(0, this.startedAt + HERO_HOLD - t0) + 30);
            const phone = this.vp.vw < 640;
            for (const a of this.agents) {
              a.activateAt = t0 + (phone ? a.index * 40 : 0) + rand(0, phone ? 20 : 80);
              a.firstLeg = true;
            }
            this.lastSchedule = 0;
            this.wake();
          });
          window.setTimeout(() => {
            if (gen === this.gen) setSplashState("done");
          }, 650);
        })
      );
    }, WORDS_MS);
  }

  /** Start each cursor exactly where its pill's arrow sits on the splash. */
  private fromSplash() {
    const arrows = document.querySelectorAll<HTMLElement>(
      ".swarm-splash li svg"
    );
    for (const a of this.agents) {
      const r = arrows[a.index]?.getBoundingClientRect();
      if (!r || !r.width) continue;
      a.x = r.left + window.scrollX;
      a.y = r.top + window.scrollY;
    }
  }

  private listen() {
    if (this.listening) return;
    this.listening = true;
    window.addEventListener("scroll", this.wake, { passive: true });
    window.addEventListener(
      "scroll",
      () => {
        this.lastScroll = now();
        // Reading back up during the finale: go straight to the end.
        if (this.phase === "finishing" && this.finaleLive) this.endFinale();
      },
      { passive: true }
    );
    window.addEventListener("resize", this.wake, { passive: true });
    // Time spent in another tab doesn't count towards catch-up or pacing.
    let hiddenAt = 0;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        hiddenAt = now();
        return;
      }
      if (!hiddenAt) return;
      const away = now() - hiddenAt;
      hiddenAt = 0;
      if (this.phase !== "running") return;
      if (this.startedAt < 1e8) this.startedAt += away;
      for (const t of this.taskList()) {
        if (t.visibleSince) t.visibleSince += away;
        if (t.readySince) t.readySince += away;
        if (t.readyAt) t.readyAt += away;
      }
      this.wake();
    });
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

  private finaleLive = false;

  private endFinale() {
    this.finaleLive = false;
    this.gen++;
    this.revealed = true;
    this.burst = null;
    this.scrimTarget = 0;
    this.ring = null;
    for (const a of this.agents) {
      a.targetOpacity = 0;
      // Back to page coordinates, so the fading cursors scroll natively.
      a.ringAngle = null;
    }
    this.complete(this.gen, 300);
    this.emit(true);
  }

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
    const phone = vw < 640;
    const R = phone ? Math.min(vw, vh) * 0.38 : Math.min(vw, vh - top) * 0.36;
    // The ring is pinned to the viewport (the overlay draws ring cursors as
    // fixed), so its points need no scroll offset beyond the page origin.
    const cx = vw / 2;
    const cy = top + (vh - top) / 2;
    let rScale = 1;
    const ringPoint = (a: Agent) => ({
      x: window.scrollX + cx + Math.cos(a.ringAngle ?? 0) * R * rScale,
      y: window.scrollY + cy + Math.sin(a.ringAngle ?? 0) * R * rScale,
    });
    const ease = (x: number) =>
      x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

    const outro = async () => {
      if (!natural) {
        for (const a of this.agents) a.targetOpacity = 0;
        this.complete(gen, 450);
        return;
      }
      try {
        // Let a scroll settle before the show starts.
        while (now() - this.lastScroll < 150) await this.step(gen, null);
        this.finaleLive = true;
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
        // Labelled cursors spread evenly round the ring; the small ones fill
        // the gaps between them.
        const full = this.agents.filter((a) => !a.mini);
        const minis = this.agents.filter((a) => a.mini);
        const step = (Math.PI * 2) / full.length;
        full.forEach((a, k) => {
          a.ringAngle = k * step - Math.PI / 2;
        });
        minis.forEach((a, k) => {
          const gap = k % full.length;
          const slot = Math.floor(k / full.length) + 1;
          const per = Math.ceil(minis.length / full.length) + 1;
          a.ringAngle = gap * step - Math.PI / 2 + (step * slot) / per;
        });
        // The page dims (not on phones) and the whole swarm gathers in a
        // ring that is already turning, so the gather never sits still...
        this.scrimTarget = phone ? 0 : 1;
        let spin = 1.05;
        let gathering = true;
        const arrived = new Set<Agent>();
        const spinner = (async () => {
          let last = now();
          while (gathering) {
            await this.step(gen, null);
            const t = now();
            const dt = (t - last) / 1000;
            last = t;
            for (const a of this.agents) {
              a.ringAngle = (a.ringAngle ?? 0) + spin * dt;
              // Cursors that have landed ride the turning ring.
              if (arrived.has(a)) {
                const p = ringPoint(a);
                a.x = p.x;
                a.y = p.y;
              }
            }
          }
        })().catch(() => {});
        await Promise.all(
          this.agents.map((a) => {
            a.docked = false;
            a.quiet = false;
            a.leaving = true;
            a.active = true;
            a.targetOpacity = 1;
            a.status = "";
            return this.moveTo(a, () => ringPoint(a), gen, null, 0.9, false, true).then(
              () => {
                arrived.add(a);
              }
            );
          })
        );
        gathering = false;
        await spinner;
        // Phones (no dimming): a faint outline so the ring reads as a ring.
        if (phone) this.ring = { x: cx, y: cy, r: R, alpha: 1 };
        // Ease any straggler onto its slot before the wind-up.
        {
          const t0 = now();
          let last = t0;
          for (;;) {
            await this.step(gen, null);
            const t = now();
            const dt = (t - last) / 1000;
            last = t;
            const k = Math.min(1, (t - t0) / 350);
            for (const a of this.agents) {
              a.ringAngle = (a.ringAngle ?? 0) + spin * dt;
              const p = ringPoint(a);
              a.x += (p.x - a.x) * Math.max(0.25, k);
              a.y += (p.y - a.y) * Math.max(0.25, k);
            }
            if (k >= 1) break;
          }
        }
        // ...winds up: the ring tightens and speeds up...
        const follow = async (ms: number, at: (k: number) => void) => {
          const t0 = now();
          let last = t0;
          for (;;) {
            await this.step(gen, null);
            const t = now();
            const dt = (t - last) / 1000;
            last = t;
            const k = Math.min(1, (t - t0) / ms);
            at(k);
            if (this.ring) this.ring.r = R * rScale;
            for (const a of this.agents) {
              a.ringAngle = (a.ringAngle ?? 0) + spin * dt;
              const p = ringPoint(a);
              a.x = p.x;
              a.y = p.y;
            }
            if (k >= 1) return;
          }
        };
        await follow(phone ? 300 : 150, () => {});
        await follow(320, (k) => {
          rScale = 1 - 0.15 * ease(k);
          spin = 1.05 + (Math.PI - 1.05) * k;
        });
        // ...clicks together: the burst, confetti thrown up off the ring...
        for (const a of this.agents) a.pressed = true;
        const pieces = phone ? 130 : 220;
        this.burst = {
          x: window.scrollX + cx,
          y: window.scrollY + cy,
          t0: now(),
          top,
          confetti: Array.from({ length: pieces }, (_, i) => {
            const ang = rand(0, Math.PI * 2);
            const v = rand(380, 820);
            return {
              x: Math.cos(ang) * R * rScale,
              y: Math.sin(ang) * R * rScale,

              vx: Math.cos(ang) * v * 0.45 + rand(-60, 60),
              vy: -v * rand(0.55, 1),
              color: this.agents[i % this.agents.length].color,
              w: rand(6, 10),
              h: rand(10, 16),
              spin: rand(-14, 14),
            };
          }),
        };
        this.revealed = true;
        this.emit(true);
        // ...springs back out, settles and fades away with the dimming.
        await follow(220, (k) => {
          // Spring back out just past the ring...
          rScale = 0.85 + 0.18 * Math.sin((Math.PI / 2) * k);
          if (k >= 1) for (const a of this.agents) a.pressed = false;
        });
        await follow(1400, (k) => {
          const e = k * 1400;
          // ...and settle back onto it.
          rScale = 1.03 - 0.03 * ease(Math.min(1, e / 260));
          spin = Math.PI - (Math.PI - 0.7) * Math.min(1, e / 700);
          const fade = ease(Math.min(1, Math.max(0, (e - 900) / 500)));
          for (const a of this.agents) a.opacity = a.targetOpacity = 1 - fade;
          if (this.ring) this.ring.alpha = 1 - fade;
          this.scrim = this.scrimTarget = phone ? 0 : 1 - fade;
        });
        this.finaleLive = false;
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
      this.ring = null;
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
    const root = document.documentElement;
    this.vp = {
      sx: window.scrollX,
      sy: window.scrollY,
      vw: root.clientWidth,
      vh,
      atEnd: window.scrollY + vh >= root.scrollHeight - 2,
    };
    for (const task of this.taskList()) {
      if (task.typing && task.state !== "done") task.typing.prime();
    }
    if (t - this.obstaclesAt > 100 || this.vp.sy !== this.obstaclesSy) {
      this.obstaclesAt = t;
      this.obstaclesSy = this.vp.sy;
      const out: Rect[] = [];
      for (const task of this.taskList()) {
        if (task.removed || !task.visible) continue;
        if (task.kind !== "text" && task.kind !== "pop") continue;
        const r = task.el.getBoundingClientRect();
        if (r.width && r.height) {
          out.push({ x: r.left, y: r.top, w: r.width, h: r.height });
        }
      }
      this.obstacles = out;
    }
    const waiters = this.waiters;
    this.waiters = [];
    for (const w of waiters) w();

    const running = this.phase === "running";
    const splash = splashState();
    const splashUp = splash === undefined || splash === "words";
    for (const a of this.agents) {
      if (
        !a.active &&
        running &&
        !splashUp &&
        a.activateAt &&
        t >= a.activateAt
      ) {
        a.active = true;
        a.targetOpacity = 1;
        a.idleSince = t - 2000;
        // Pour into the hero beside the typists before settling.
        a.spectated = false;
        a.fresh = true;
        // Hand out jobs this frame, before anyone heads for a gutter.
        this.lastSchedule = 0;
      }
      // Waiting cursors stay put on screen as the page scrolls.
      if (a.docked && !a.task) {
        const spot = this.parkSpot(a);
        a.x = window.scrollX + spot.x;
        a.y = window.scrollY + spot.y;
        a.quiet = spot.quiet;
        a.parkRight = spot.right;
      }
      a.opacity += (a.targetOpacity - a.opacity) * 0.14;
      if (a.sel && !a.pressed) {
        a.sel.alpha -= 0.05;
        if (a.sel.alpha <= 0) a.sel = null;
      }
      if (a.ripples.length) a.ripples = a.ripples.filter((r) => t - r.t0 < 520);
    }
    this.scrim += (this.scrimTarget - this.scrim) * 0.12;
    if (this.burst && t - this.burst.t0 > 2200) this.burst = null;
    // Idle cursors in view keep a little personal space.
    if (running) {
      const free = this.agents.filter(
        (a) =>
          a.active && !a.task && !a.docked && !a.moving && a.ringAngle === null
      );
      for (let i = 0; i < free.length; i++) {
        for (let k = i + 1; k < free.length; k++) {
          const p = free[i];
          const q = free[k];
          const dx = q.x - p.x;
          const dy = q.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d > 0 && d < 36) {
            const push = (36 - d) * 0.15;
            p.x -= (dx / d) * push;
            p.y -= (dy / d) * push;
            q.x += (dx / d) * push;
            q.y += (dy / d) * push;
          }
        }
      }
    }

    if (running && t >= this.startedAt) {
      if (t - this.lastSchedule > 150) {
        this.lastSchedule = t;
        this.schedule();
      }
      this.dock(t);
      if (t - this.lastCheck > 600) {
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
    if (this.waiters.length) return false;
    // Nothing to do until the splash lifts (liftSplash wakes the loop).
    const splash = splashState();
    if (
      (splash === undefined || splash === "words") &&
      this.agents.every((a) => !a.active)
    ) {
      return true;
    }
    if (this.hasEligible || this.burst) return false;
    const resting = this.agents.every(
      (a) =>
        a.active &&
        a.docked &&
        !a.task &&
        !a.moving &&
        !a.sel &&
        !a.ripples.length &&
        // Let fades finish before resting.
        Math.abs(a.opacity - a.targetOpacity) < 0.01
    );
    if (!resting) return false;
    for (const t of this.taskList()) {
      if (
        t.state === "pending" &&
        t.visible &&
        !t.optional &&
        !t.removed &&
        this.isReady(t) &&
        !this.held(t)
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * Work that is on screen but deliberately waiting (phone text until it's
   * well into view, the hero photo until its beat): no cursor may take it
   * yet, so it mustn't keep the loop awake or hold up catch-up.
   */
  private held(t: Task) {
    if (
      t.kind === "text" &&
      !t.heading &&
      !this.vp.atEnd &&
      this.vp.vw < 640 &&
      t.top < document.documentElement.scrollHeight - this.vp.vh * 0.45 &&
      t.el.getBoundingClientRect().top > this.vp.vh - 72
    ) {
      return true;
    }
    return (
      !t.priority &&
      (t.kind === "image" || t.kind === "block") &&
      t.top < this.heroLine &&
      now() < this.startedAt + HERO_HOLD
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

  private caretAbove(c: Rect | null) {
    return !!c && c.y - this.vp.sy <= -c.h;
  }

  /**
   * Sentences the visitor has already scrolled past are finished at once,
   * so nothing above the viewport stays faint. True if the task is now done.
   */
  private flushAbove(task: Task) {
    const typing = task.typing;
    const segs = task.segs;
    if (!typing || !segs) return false;
    segs.forEach((job, k) => {
      if (job.done || job.agent) return;
      const seg = typing.segments[k];
      if (this.caretAbove(typing.caretAt(seg.start + job.typed))) {
        job.typed = seg.end - seg.start;
        typing.type(k, job.typed);
        job.done = true;
      }
    });
    if (segs.every((j) => j.done) && task.state !== "done") {
      task.cleanup?.();
      task.cleanup = undefined;
      this.finishTask(task);
      return true;
    }
    return false;
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
      if (t.state === "pending" && t.pack && this.vp.vw < 640 && this.isReady(t)) {
        this.setAttr(t, "building");
        this.reveal(t, "fade");
        this.finishTask(t);
        continue;
      }
      if (t.state === "pending" && t.inView && this.isReady(t)) {
        // Work starts once it's on screen, so it's seen (and cursors don't
        // queue at the edge for things below the fold); on phones text waits
        // until it's 40% of the way up, headings excepted.
        if (!t.visible) continue;
        // Phones: text starts once its first line is clear of the bottom
        // edge; the hero photo and logo strip are the hero's closing beats.
        if (this.held(t)) continue;
        eligible.push(t);
        if (t.visible) onScreen++;
      } else if (t.state === "building" && t.segs) {
        if (this.flushAbove(t)) continue;
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
    // Through the opening, at most five cursors type the hero at once; the
    // rest take the navbar, the photo and the logo strip.
    const opening = now() < this.startedAt + 3500;
    let typists = this.agents.filter((a) => a.task?.kind === "text").length;

    // Join in on paragraphs already being typed first: many hands at once.
    for (const job of segJobs) {
      if (!idle.length) return;
      if (opening && typists >= 5) break;
      typists++;
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
        Number(b.heading) - Number(a.heading) ||
        a.top - b.top ||
        (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING
          ? -1
          : 1)
    );

    const tNow = now();
    for (const t of eligible) if (!t.readySince) t.readySince = tNow;
    const names = new Set(this.agents.map((a) => a.name));
    for (const a of idle) {
      if (!eligible.length) break;
      // Its own card first: Docker draws the Docker card.
      const mine = eligible.findIndex((t) => t.owner === a.name);
      if (mine >= 0) {
        const [task] = eligible.splice(mine, 1);
        void this.run(a, task);
        continue;
      }
      // Leave a card for its owner for a moment, if that cursor exists.
      const pickable = eligible.filter(
        (t) =>
          !t.owner || !names.has(t.owner) || tNow - t.readySince > 1500
      );
      if (!pickable.length) continue;
      // Of the next few jobs in reading order, take the one closest by.
      const pool = pickable[0].priority ? 1 : Math.min(pickable.length, 4);
      let best = 0;
      let bestScore = Infinity;
      for (let i = 0; i < pool; i++) {
        const c = center(pickable[i].el);
        const score = Math.hypot(c.x - a.x, c.y - a.y) + i * 140;
        if (score < bestScore) {
          bestScore = score;
          best = i;
        }
      }
      let task = pickable[best];
      if (opening && task.kind === "text" && typists >= 5) {
        const other = pickable.find((t) => t.kind !== "text");
        if (!other) continue;
        task = other;
      }
      if (task.kind === "text") typists++;
      eligible.splice(eligible.indexOf(task), 1);
      void this.run(a, task);
    }
  }

  /**
   * Where an idle cursor waits, in viewport px. Wide screens: loosely in the
   * side gutters, labels showing. Narrow screens: a quiet cluster in the
   * bottom corners, arrows only, so no copy is covered.
   */
  private parkSpot(a: Agent) {
    // clientWidth leaves out a classic scrollbar.
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const pad = vw >= 1200 ? 120 : vw >= 800 ? 80 : 40;
    const gutter = Math.max(0, (vw - 1440) / 2) + pad;
    const resting = this.agents.filter((x) => !x.mini).length;
    const side = a.index % 2;
    const rows = Math.ceil(resting / 2);
    // Rows shuffled per side and offsets fixed per cursor: a loose scatter
    // rather than a ladder or a legend.
    const row = (Math.floor(a.index / 2) * 5 + side * 3) % rows;
    const j = ((a.index * 37) % 11) / 11;
    const k = ((a.index * 61) % 13) / 13;
    const y = vh * (0.16 + 0.7 * ((row + k) / rows));
    if (gutter >= 60) {
      // Two wait in view, one in each gutter at different heights; the rest
      // wait just off the side edges, ready to come back.
      if (a.slot >= 0) {
        const span = gutter - 44;
        const right = a.slot === 1;
        const x = right ? vw - gutter + 10 + j * span : 8 + j * span;
        return { quiet: true, right, x, y: vh * (right ? 0.65 : 0.35) };
      }
      return { quiet: true, right: !!side, x: side ? vw + 40 : -40, y };
    }
    // Phones: just below the bottom edge, towards what's still unbuilt; they
    // come back up from there when there's work.
    return {
      quiet: true,
      right: !!side,
      x: 30 + (j * 0.8 + 0.1) * (vw - 60),
      y: vh + 60,
    };
  }

  /** Onlooker spots in use (page coordinates), so they don't pile up. */
  private watching = new Map<Agent, { x: number; y: number; host: Task | null }>();

  /** A spot beside a block being typed: in its margin or just below it. */
  private spectateSpot(a: Agent, working: Agent[]) {
    const vw = this.vp.vw;
    const vh = this.vp.vh;
    const host = working[a.index % working.length];
    const r = host.task ? pageRect(host.task.el) : null;
    const sx = window.scrollX;
    const sy = window.scrollY;
    const cy = host.caret?.y ?? r?.y ?? host.y;
    // Offsets fixed per cursor, so the same question gets the same answer.
    const j = ((a.index * 37) % 11) / 11;
    const k = ((a.index * 61) % 13) / 13;
    const options = r
      ? [
          { x: r.x - 70 - j * 40, y: cy - 20 + k * 50 },
          { x: r.x + r.w + 30 + j * 40, y: cy - 20 + k * 50 },
          { x: r.x + k * r.w, y: r.y + r.h + 28 },
        ]
      : [{ x: host.x + 80, y: host.y + 60 }];
    const host2 = host.task ?? null;
    const others = Array.from(this.watching.entries()).filter(
      ([who]) => who !== a && !who.task && !who.docked
    );
    // At most two onlookers per block, and never on top of each other.
    if (others.filter(([, w]) => w.host === host2).length >= 2) return null;
    const fits = options.filter(
      (p) =>
        p.x - sx > 24 &&
        p.x - sx < vw - 120 &&
        p.y - sy > 70 &&
        p.y - sy < vh - 40 &&
        others.every(([, w]) => Math.hypot(w.x - p.x, w.y - p.y) >= 60)
    );
    const spot = fits.length ? fits[a.index % fits.length] : null;
    if (spot) this.watching.set(a, { ...spot, host: host2 });
    return spot;
  }

  private dock(t: number) {
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const desktop = vw >= 800;
    // Anyone at work on screen, including a job just claimed whose caret
    // isn't placed yet (so the opening pours in beside the first typists).
    const working = desktop
      ? this.agents.filter(
          (x) =>
            x.task &&
            (x.caret ? this.caretOnScreen(x.caret) : x.task.visible)
        )
      : [];
    // Phones: the last one or two to finish stay in view a little longer,
    // so the screen isn't left empty between jobs.
    const lingering = desktop
      ? []
      : this.agents
          .filter((x) => x.active && !x.task && !x.docked && !x.leaving)
          .sort((p, q) => q.idleSince - p.idleSince)
          .slice(0, 2);
    for (const a of this.agents) {
      if (!a.active || a.task || a.leaving || a.moving) continue;
      if (a.docked) {
        // Rested a while and there's typing to watch: go and look, but only
        // if there's a free spot beside it (otherwise rest a while longer).
        if (working.length && t - a.dockedAt > 1800 + ((a.index * 523) % 1200)) {
          const spot = this.spectateSpot(a, working);
          if (!spot) {
            a.dockedAt = t;
            continue;
          }
          a.nextSpot = spot;
          a.docked = false;
          a.slot = -1;
          a.spectated = false;
          a.targetOpacity = 1;
        } else {
          continue;
        }
      }
      if (!a.spectated && working.length) {
        a.spectated = true;
        const spot = a.nextSpot ?? this.spectateSpot(a, working);
        a.nextSpot = null;
        if (!spot) continue;
        a.moving = true;
        this.moveTo(a, () => spot, this.gen, null, 0.9)
          .catch(() => {})
          .finally(() => {
            a.moving = false;
            a.idleSince = now();
          });
        continue;
      }
      const linger = desktop ? 1300 : lingering.includes(a) ? 1800 : 300;
      if (t < a.idleSince + linger) continue;
      a.moving = true;
      this.watching.delete(a);
      const speed = a.fresh ? 1.1 : desktop ? 0.8 : 1.4;
      a.fresh = false;
      // Claim a free in-view gutter spot, if there is one.
      if (desktop && a.slot < 0) {
        const held = this.agents.filter((x) => x !== a).map((x) => x.slot);
        a.slot = held.includes(0) ? (held.includes(1) ? -1 : 1) : 0;
      }
      this.moveTo(
        a,
        () => {
          const s = this.parkSpot(a);
          return { x: window.scrollX + s.x, y: window.scrollY + s.y };
        },
        this.gen,
        null,
        speed
      )
        .then((arrived) => {
          if (arrived && !a.task) {
            const spot = this.parkSpot(a);
            a.docked = true;
            a.dockedAt = now();
            a.quiet = true;
            a.parkRight = spot.right;
            a.targetOpacity = desktop ? 0.3 + ((a.index * 7) % 5) * 0.04 : 0;
          }
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
        if (t.visible && !t.readyAt) t.readyAt = t0;
        const since = Math.max(t.visibleSince, t.readyAt, this.startedAt + 2500);
        const phone = this.vp.vw < 640;
        const limit = t.optional ? 500 : phone ? 3000 : CATCH_UP_MS;
        const someoneFree = this.agents.some(
          (a) => a.active && !a.task && !a.leaving
        );
        if (
          t.visible &&
          t.visibleSince &&
          t0 - since > limit &&
          !(phone && someoneFree && !t.optional && !this.held(t))
        ) {
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
    a.slot = -1;
    this.watching.delete(a);
    a.quiet = false;
    a.spectated = false;
    a.targetOpacity = 1;
    task.el.style.setProperty("--swarm-claim", a.color);
    this.setAttr(task, "claimed");
    const overshoot = !a.landed;
    a.landed = true;
    a.fresh = false;
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
    a.lastCaret = null;
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
    overshoot = false,
    live = false
  ) {
    const token = ++a.moveToken;
    const fx = a.x;
    const fy = a.y;
    let tp = target();
    const dist = Math.hypot(tp.x - fx, tp.y - fy);
    const first = a.firstLeg;
    a.firstLeg = false;
    let dur = clamp(180 + dist * 0.55, 240, 1000) / (this.rate() * speed);
    // Out of the splash the cursors pour into the page rather than dart.
    if (first) dur = Math.max(dur, 420);
    const bend = (Math.random() - 0.5) * Math.min(dist * 0.35, 160);
    const start = now();
    let frames = 0;
    for (;;) {
      await this.step(gen, task);
      if (token !== a.moveToken) return false;
      const p = Math.min(1, (now() - start) / dur);
      // Re-aim every few frames (targets can drift, e.g. the marquee).
      if (live || ++frames % 5 === 0 || p >= 1) tp = target();
      const e = overshoot
        ? easeOutBack(p)
        : first
        ? 1 - Math.pow(1 - p, 3)
        : easeInOut(p);
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
      task.ghost,
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
    a.slot = -1;
    this.watching.delete(a);
    a.quiet = false;
    a.spectated = false;
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
        const at = typing.caretAt(seg.start + job.typed);
        if (this.caretAbove(at)) {
          // Scrolled past mid-sentence: finish it now.
          job.typed = len;
          typing.type(current, len);
          break;
        }
        if (!this.caretOnScreen(at)) {
          // Below the fold: hand it back, progress kept, and go wait.
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
          a.lastCaret = caret;
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
    // Keep the cursor on screen (the navbar starts at the very top and runs
    // edge to edge on smaller screens).
    const onScreen = (x: number, y: number) => ({
      x: clamp(x, window.scrollX + 6, window.scrollX + this.vp.vw - 28),
      y: clamp(y, window.scrollY + 6, window.scrollY + this.vp.vh - 30),
    });
    const r0 = pageRect(el);
    const far = onScreen(r0.x + r0.w, r0.y + r0.h);
    // Every other cursor drags from the opposite corner, so a row of boxes
    // doesn't draw in lockstep, but only when that corner is in view.
    const reverse =
      a.index % 2 === 1 &&
      Math.abs(far.x - (r0.x + r0.w)) < 1 &&
      Math.abs(far.y - (r0.y + r0.h)) < 1;
    const corner = () => {
      const r = pageRect(el);
      return reverse ? onScreen(r.x + r.w, r.y + r.h) : onScreen(r.x, r.y);
    };
    await this.moveTo(a, corner, gen, task, 1, overshoot);
    if (this.vp.vw < 640) await this.sleep(rand(150, 300), gen, task);
    const g = task.ghost;
    const ghost = `linear-gradient(rgba(0,0,0,${g}),rgba(0,0,0,${g}))`;
    const anchor = reverse ? "100% 100%" : "0 0";
    const draw = (p: number) =>
      setMask(
        el,
        `linear-gradient(#000,#000) ${anchor} / ${(p * 100).toFixed(2)}% ${(
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
      // The cursor drags from where it stands to the (clamped) far corner;
      // the mask and selection follow the real box.
      const from = { x: a.x, y: a.y };
      const to = reverse ? onScreen(r.x, r.y) : onScreen(r.x + r.w, r.y + r.h);
      const t0 = now();
      for (;;) {
        await this.step(gen, task);
        const p = easeInOut(Math.min(1, (now() - t0) / dur));
        a.x = from.x + (to.x - from.x) * p;
        a.y = from.y + (to.y - from.y) * p;
        if (reverse) {
          a.sel = {
            x: r.x + r.w * (1 - p),
            y: r.y + r.h * (1 - p),
            w: r.w * p,
            h: r.h * p,
            alpha: 1,
          };
        } else {
          a.sel = { x: r.x, y: r.y, w: r.w * p, h: r.h * p, alpha: 1 };
        }
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
    const g = task.ghost;
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
      duration: style === "pop" ? 360 : style === "image" ? 560 : 420,
      easing: style === "fade" ? "ease-in-out" : "cubic-bezier(.2,.8,.2,1)",
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
