// The swarm is named after the stack the site is built with, and coloured with
// the same rainbow palette the rest of the site uses (see tailwind.config.ts).
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
  { name: "Postgres", color: "#7caafd" },
  { name: "Prisma", color: "#a8fe96" },
  { name: "MongoDB", color: "#fafe8e" },
  { name: "Docker", color: "#77effd" },
  { name: "AWS", color: "#ffc67e" },
  { name: "Git", color: "#ff8885" },
  { name: "Vercel", color: "#9e8bfd" },
  { name: "shadcn", color: "#ff9dfb" },
];

// Fewer cursors on small screens so the page stays readable while it builds.
export const MOBILE_AGENTS = 8;
