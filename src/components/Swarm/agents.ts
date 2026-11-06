// The swarm is named after the stack the site is built with. The first eight
// wear the site's rainbow palette (tailwind.config.ts); the other eight are
// deep shades spaced at least 30° apart in hue, so no two read as the same.
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
  { name: "Postgres", color: "#1d4ed8" },
  { name: "Prisma", color: "#0b5e6b" },
  { name: "MongoDB", color: "#0f7a52" },
  { name: "Docker", color: "#6d28d9" },
  { name: "AWS", color: "#b91c1c" },
  { name: "Git", color: "#a35a00" },
  { name: "Vercel", color: "#a21caf" },
  { name: "shadcn", color: "#be185d" },
];

// Fewer, faster cursors on phones so the page stays readable while it builds.
export const MOBILE_AGENTS = 5;
