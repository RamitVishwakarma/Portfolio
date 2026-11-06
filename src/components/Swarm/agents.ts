// The swarm is named after the stack the site is built with, and coloured from
// the site's own palette (tailwind.config.ts): the rainbow for the first eight
// and the deep testimonial shades for the rest, so each pair reads apart.
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
  { name: "Postgres", color: "#3045c5" },
  { name: "Prisma", color: "#23723c" },
  { name: "MongoDB", color: "#b73e06" },
  { name: "Docker", color: "#708090" },
  { name: "AWS", color: "#c8290d" },
  { name: "Git", color: "#ca0c47" },
  { name: "Vercel", color: "#8315db" },
  { name: "shadcn", color: "#b62084" },
];

// Fewer, faster cursors on phones so the page stays readable while it builds.
export const MOBILE_AGENTS = 5;
