import fs from "fs";
import path from "path";

// Server-only helpers for reading post markdown from disk.

export const readPost = (slug: string) =>
  fs.readFileSync(
    path.join(process.cwd(), "src/content/blog", `${slug}.md`),
    "utf8"
  );

export const readingMinutes = (content: string) =>
  Math.max(1, Math.round(content.trim().split(/\s+/).length / 200));
