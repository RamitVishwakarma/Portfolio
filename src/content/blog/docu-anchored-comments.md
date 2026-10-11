In docU, AI agents draft documentation through an API and one human reviews it in the margin. The review only works if a comment stays attached to the sentence it was about, even after an agent rewrites the section around it. A comment that quietly disappears is the worst failure a review tool can have, because nobody notices it is gone. This post is about how docU keeps those comments attached.

## The problem

Agents edit docU documents section by section. They fetch a section's HTML, change it and send it back. A reviewer's comment points at a range of text inside that section. When an agent rewrites the paragraph, the text moves, splits or disappears, and a comment that only stored character offsets now points at the wrong words.

TipTap has a Comments extension that handles some of this, but it is part of the commercial offering. docU uses only the MIT core of TipTap 3 and builds the review layer itself: a custom mark for anchors, its own `comments` table and its own section revisions. Marks are a core ProseMirror feature, so nothing about this needs a paid extension.

## A mark that travels as HTML

The anchor is a ProseMirror mark that serializes to an HTML attribute:

```ts
export const CommentMark = Mark.create({
  name: "comment",
  // Typing at either edge must not extend the marked range.
  inclusive: false,
  excludes: "",
  // parseHTML and renderHTML map commentId to data-comment-id
});
```

In the HTML an agent receives, a commented phrase looks like `<span data-comment-id="c_42">the retry limit</span>`. An agent that edits around that span and sends the HTML back keeps the anchor without knowing what the span means. That is why docU uses HTML as the wire format for agents and not Markdown, which has nowhere to put the attribute.

`inclusive: false` stops the mark from growing when someone types at either edge of the commented text, and `excludes: ""` lets comments overlap.

## When the agent drops the span

Sometimes an agent rewrites a sentence from scratch and the span is gone. For that case every comment also stores a text-quote anchor, the same idea as the W3C TextQuoteSelector:

| Field | What it holds |
| --- | --- |
| `exact` | The commented text |
| `prefix` | Up to 32 characters before it |
| `suffix` | Up to 32 characters after it |
| `approxOffset` | Where it used to start |

When a section changes and a comment's mark is missing, docU tries to find the text again, in this order:

1. **Exact.** The commented text appears with its prefix and suffix around it. If it appears more than once, the match nearest the old offset wins.
2. **Fuzzy.** The commented text appears without matching context. The match nearest the old offset wins.
3. **Not found.** The comment is marked orphaned and stays in the margin with its original quote. It is never deleted.

These are pure functions with no database and no DOM, and they are the most heavily tested module in the codebase. A bug there loses a reviewer's comment without anyone seeing it, so it gets the most tests.

## The review loop

With anchors that survive edits, the loop is simple. A human leaves comments. An agent fetches the open threads, patches the sections, replies and resolves each thread. The document's status flips back to review, and every step lands in an append-only audit log.

## The rest of docU

docU runs on free tiers, with Next.js 16 on Vercel and Postgres on Neon:

- **A 12-table schema** behind route, service and repository layers. Route handlers stay thin, services hold the logic and repositories are the only code that queries Postgres.
- **Search** through a Postgres `tsvector` generated column and one GIN index, with no separate search service.
- **An append-only audit log** enforced by a database trigger, so even a bug in the app cannot rewrite history.
- **Diagrams by reference.** Inline React Flow diagrams and Excalidraw sketches are stored separately, so a 2 MB sketch never lands in a section revision.
- **Its own auth** with jose and argon2, and tests in Vitest, Testing Library and MSW.

## What I would tell someone building this

- **Pick a wire format that can carry your metadata.** HTML attributes survived agent edits that Markdown would have stripped.
- **Plan for the anchor being lost.** The text-quote fallback catches what the mark cannot.
- **Never delete a comment automatically.** An orphaned comment with its quote is still useful; a missing one is a silent bug.
- **Spend your tests where silent failure lives.** Anchoring got the most tests because its failures are invisible.

docU is live at [docu-silk.vercel.app](https://docu-silk.vercel.app).
