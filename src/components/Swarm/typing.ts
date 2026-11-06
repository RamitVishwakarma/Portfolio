export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Typing {
  /** Number of characters to type. */
  total: number;
  /** Show the first `n` characters. */
  set(n: number): void;
  /** Where the caret is, in page coordinates. */
  caret(): Rect | null;
  /** Put every text node back exactly as React rendered it. */
  finish(): void;
}

interface Piece {
  node: Text;
  full: string;
  ghost: HTMLSpanElement;
  wrap: HTMLSpanElement | null;
}

/**
 * Lets a cursor "type" an element's existing text in place.
 *
 * Each text node keeps its React identity: it is emptied and the untyped rest
 * of its text sits in an invisible sibling span. The full text is always laid
 * out, so the element never changes size while it is being typed.
 */
export function prepareTyping(root: HTMLElement): Typing {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n as Text;
    if (!text.data.trim()) continue;
    // Text inside a nested <Build> belongs to that element's own task.
    if (text.parentElement?.closest("[data-swarm-id]") !== root) continue;
    nodes.push(text);
  }

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
    const ghost = document.createElement("span");
    ghost.style.visibility = "hidden";
    ghost.textContent = full;
    node.data = "";
    node.after(ghost);
    return { node, full, ghost, wrap };
  });

  const total = pieces.reduce((sum, p) => sum + p.full.length, 0);
  let typed = 0;
  let finished = false;

  return {
    total,
    set(n) {
      typed = n;
      let offset = 0;
      for (const p of pieces) {
        const k = Math.max(0, Math.min(p.full.length, n - offset));
        if (p.node.data.length !== k) {
          p.node.data = p.full.slice(0, k);
          p.ghost.textContent = p.full.slice(k);
        }
        offset += p.full.length;
      }
    },
    caret() {
      let offset = 0;
      for (const p of pieces) {
        if (typed < offset + p.full.length) {
          const r = p.ghost.getClientRects()[0];
          if (r) {
            return {
              x: r.left + window.scrollX,
              y: r.top + window.scrollY,
              w: 0,
              h: r.height,
            };
          }
          break;
        }
        offset += p.full.length;
      }
      const last = pieces[pieces.length - 1];
      if (!last) return null;
      const range = document.createRange();
      range.selectNodeContents(last.node);
      const rects = range.getClientRects();
      const r = rects[rects.length - 1];
      return r
        ? {
            x: r.right + window.scrollX,
            y: r.top + window.scrollY,
            w: 0,
            h: r.height,
          }
        : null;
    },
    finish() {
      if (finished) return;
      finished = true;
      for (const p of pieces) {
        p.node.data = p.full;
        p.ghost.remove();
        if (p.wrap) p.wrap.replaceWith(p.node);
      }
    },
  };
}
