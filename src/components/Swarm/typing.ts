export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Segment {
  /** Global character range [start, end). */
  start: number;
  end: number;
}

export interface Typing {
  total: number;
  /** Sentence-sized slices that different cursors can type in parallel. */
  segments: Segment[];
  /** Measure every caret position, so typing never forces a reflow. */
  measure(): void;
  /** Read the element's position for this frame (batched before writes). */
  prime(): void;
  /** Fade the untyped text to the ghost level (when typing starts). */
  ghostOn(): void;
  /** Show the first `n` characters of segment `i`. */
  type(i: number, n: number): void;
  /** Caret before global character `index`, in page coordinates. */
  caretAt(index: number): Rect | null;
  /** Put every text node back exactly as React rendered it. */
  finish(): void;
}

let frameNo = 0;
/** Called once per animation frame; element origins are re-read at most once per frame. */
export function nextTypingFrame() {
  frameNo++;
}

interface Unit {
  /** Typed part of this slice; the first unit of a text node is React's own node. */
  node: Text;
  full: string;
  ghost: HTMLSpanElement;
  start: number;
  created: boolean;
}

interface Piece {
  node: Text;
  full: string;
  wrap: HTMLSpanElement | null;
  units: Unit[];
}

/** Split text into segments at sentence ends, roughly `target` chars long. */
function split(text: string, target: number): Segment[] {
  const out: Segment[] = [];
  let start = 0;
  const min = Math.round(target * 0.4);
  const max = Math.round(target * 1.4);
  for (let i = 0; i < text.length; i++) {
    const len = i - start;
    const sentenceEnd = /[.!?]/.test(text[i]) && text[i + 1] === " ";
    if ((sentenceEnd && len >= min) || (len >= max && text[i] === " ")) {
      out.push({ start, end: i + 1 });
      start = i + 1;
    }
  }
  if (start < text.length) {
    // Fold a short tail into the previous segment.
    if (out.length && text.length - start < min) out[out.length - 1].end = text.length;
    else out.push({ start, end: text.length });
  }
  return out;
}

/**
 * Lets cursors "type" an element's existing text in place, several at once.
 *
 * Text nodes keep their React identity: each is emptied, and its untyped text
 * sits in a faint sibling span. Where a segment boundary falls inside a text
 * node, extra text nodes are added for the later slices and removed again in
 * finish(). The full text is always laid out, so nothing moves while typing.
 */
export function prepareTyping(
  root: HTMLElement,
  ghostOpacity: number,
  target: number
): Typing {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n as Text;
    if (!text.data.trim()) continue;
    // Text inside a nested <Build> belongs to that element's own task.
    if (text.parentElement?.closest("[data-swarm-id]") !== root) continue;
    nodes.push(text);
  }

  const fullText = nodes.map((n) => n.data).join("");
  const segments = split(fullText, target);
  const cuts = new Set(segments.map((s) => s.start));

  let offset = 0;
  const pieces: Piece[] = nodes.map((node) => {
    const parent = node.parentElement as HTMLElement;
    let wrap: HTMLSpanElement | null = null;
    // In a flex/grid parent a loose text node is its own item; keep the typed
    // and untyped halves together so the gap doesn't open up between them.
    if (/flex|grid/.test(getComputedStyle(parent).display)) {
      wrap = document.createElement("span");
      parent.insertBefore(wrap, node);
      wrap.appendChild(node);
    }
    const full = node.data;
    const units: Unit[] = [];
    let from = 0;
    let after: Node = node;
    for (let i = 1; i <= full.length; i++) {
      if (i < full.length && !cuts.has(offset + i)) continue;
      const slice = full.slice(from, i);
      const unitNode = units.length ? document.createTextNode("") : node;
      if (units.length) {
        after.parentNode?.insertBefore(unitNode, after.nextSibling);
      }
      const ghost = document.createElement("span");
      ghost.textContent = slice;
      unitNode.parentNode?.insertBefore(ghost, unitNode.nextSibling);
      units.push({
        node: unitNode,
        full: slice,
        ghost,
        start: offset + from,
        created: units.length > 0,
      });
      after = ghost;
      from = i;
    }
    node.data = "";
    offset += full.length;
    return { node, full, wrap, units };
  });

  const allUnits = pieces.flatMap((p) => p.units);
  const total = fullText.length;
  // Caret positions are kept relative to the element, so they stay right if
  // it moves (sticky navbar, layout shifts above it).
  let positions: Rect[] = [];
  let finished = false;
  // The element's top-left in page coordinates, read once per frame.
  let cache = { frame: -1, x: 0, y: 0 };
  const origin = () => {
    if (cache.frame !== frameNo) {
      const r = root.getBoundingClientRect();
      cache = {
        frame: frameNo,
        x: r.left + window.scrollX,
        y: r.top + window.scrollY,
      };
    }
    return cache;
  };

  const toRel = (r: DOMRect, x: number, o: { x: number; y: number }): Rect => ({
    x: x + window.scrollX - o.x,
    y: r.top + window.scrollY - o.y,
    w: 0,
    h: r.height,
  });

  // Re-measure carets when the element resizes or a web font swaps in.
  let ro: ResizeObserver | null = null;
  const remeasure = () => api.measure();

  const api: Typing = {
    total,
    segments,
    prime() {
      origin();
    },
    measure() {
      if (finished) return;
      cache.frame = -1;
      const o = origin();
      const out: Rect[] = [];
      const range = document.createRange();
      let prev: Rect = { x: 0, y: 0, w: 0, h: 0 };
      for (const u of allUnits) {
        const typed = u.node.data.length;
        for (let i = 0; i < u.full.length; i++) {
          const inTyped = i < typed;
          const node = inTyped ? u.node : u.ghost.firstChild;
          const at = inTyped ? i : i - typed;
          let rect = prev;
          if (node) {
            range.setStart(node, at);
            range.setEnd(node, at + 1);
            const r = range.getClientRects()[0];
            if (r && r.height > 0) rect = toRel(r, r.left, o);
          }
          out.push(rect);
          prev = rect;
        }
      }
      const last = allUnits[allUnits.length - 1];
      if (last) {
        const typed = last.node.data.length;
        const node = typed === last.full.length ? last.node : last.ghost.firstChild;
        const len = node?.textContent?.length ?? 0;
        if (node && len) {
          range.setStart(node, len - 1);
          range.setEnd(node, len);
          const r = range.getClientRects()[0];
          out.push(r ? toRel(r, r.right, o) : prev);
        } else out.push(prev);
      }
      positions = out;
    },
    ghostOn() {
      for (const u of allUnits) u.ghost.style.opacity = String(ghostOpacity);
    },
    type(i, n) {
      const seg = segments[i];
      if (!seg) return;
      for (const u of allUnits) {
        if (u.start + u.full.length <= seg.start || u.start >= seg.end) continue;
        const k = Math.max(0, Math.min(u.full.length, seg.start + n - u.start));
        if (u.node.data.length !== k) {
          u.node.data = u.full.slice(0, k);
          u.ghost.textContent = u.full.slice(k);
        }
      }
    },
    caretAt(index) {
      const rel = positions[Math.max(0, Math.min(index, positions.length - 1))];
      if (!rel) return null;
      // No live layout or scroll reads here: origin() is primed per frame.
      const o = origin();
      return { x: rel.x + o.x, y: rel.y + o.y, w: 0, h: rel.h };
    },
    finish() {
      if (finished) return;
      finished = true;
      ro?.disconnect();
      document.fonts?.removeEventListener("loadingdone", remeasure);
      for (const p of pieces) {
        for (const u of p.units) {
          u.ghost.remove();
          if (u.created) u.node.remove();
        }
        p.node.data = p.full;
        if (p.wrap) p.wrap.replaceWith(p.node);
      }
    },
  };
  if (typeof ResizeObserver !== "undefined") {
    let first = true;
    ro = new ResizeObserver(() => {
      // The initial callback fires on observe; carets are measured by the caller.
      if (first) {
        first = false;
        return;
      }
      remeasure();
    });
    ro.observe(root);
  }
  document.fonts?.addEventListener("loadingdone", remeasure);
  return api;
}
