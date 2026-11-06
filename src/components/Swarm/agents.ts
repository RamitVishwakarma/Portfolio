// The swarm is named after the stack the site is built with, and coloured from
// the site's own palette (tailwind.config.ts): the rainbow for the first eight
// and the deeper testimonial shades for the rest, so no two cursors look alike.
export interface AgentDef {
  name: string;
  color: string;
}

export const AGENTS: AgentDef[] = [
  { name: "React", color: "#77effd" },
  { name: "Next.js", color: "#fafe8e" },
  { name: "Tailwind", color: "#7caafd" },
  { name: "TypeScript", color: "#9e8bfd" },
  { name: "Node", color: "#a8fe96" },
  { name: "Figma", color: "#ff9dfb" },
  { name: "Framer", color: "#ffc67e" },
  { name: "Express", color: "#ff8885" },
  { name: "Postgres", color: "#4e74e3" },
  { name: "Prisma", color: "#38af5c" },
  { name: "MongoDB", color: "#f98207" },
  { name: "Docker", color: "#9bacb9" },
  { name: "AWS", color: "#ff6347" },
  { name: "Git", color: "#f83c86" },
  { name: "Vercel", color: "#ab49ff" },
  { name: "shadcn", color: "#e450be" },
];

// Fewer, faster cursors on phones so the page stays readable while it builds.
export const MOBILE_AGENTS = 5;
