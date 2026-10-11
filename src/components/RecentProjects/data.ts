export interface RecentProject {
  name: string;
  year: string;
  description: string;
  tags: string[];
  accent: string;
  live?: string;
  github?: string;
  story?: string;
}

// accent is a Tailwind background class from the theme palette.
export const recentProjects: RecentProject[] = [
  {
    name: "Janus",
    year: "2026",
    description:
      "An open-source macOS menu-bar app that switches Claude Code and Codex accounts and clears developer caches. 123 GitHub stars and 11 forks in its first two weeks.",
    tags: ["Swift", "SwiftUI", "XCTest", "GitHub Actions"],
    accent: "bg-green",
    live: "https://janus.ramitvishwakarma.in",
    github: "https://github.com/RamitVishwakarma/Janus",
    story: "/blog/janus-macos-account-switcher",
  },
  {
    name: "docU",
    year: "2026",
    description:
      "Agent-first documentation. AI agents draft through an API, one person reviews in the margin, and every revision is attributed and diffable.",
    tags: ["Next.js 16", "PostgreSQL", "Drizzle", "TipTap", "React Flow"],
    accent: "bg-light-blue",
    live: "https://docu-silk.vercel.app",
    story: "/blog/docu-anchored-comments",
  },
  {
    name: "Twin Crown",
    year: "2026",
    description:
      "The sales site for a residential project, with 3D models of all 11 floor plans, a text and voice sales chat, and automated follow-up on abandoned chats.",
    tags: ["Next.js 16", "three.js", "Tailwind 4", "MongoDB"],
    accent: "bg-orange",
    live: "https://twincrown.co",
    story: "/blog/twin-crown-floor-plans",
  },
  {
    name: "Recruitment Platform V2",
    year: "2025",
    description:
      "The platform about 500 students used to apply to GDSC JSSATEN in April 2025, from the aptitude quiz to a coding round judged by Judge0.",
    tags: ["Next.js 15", "Express", "PostgreSQL", "Prisma", "Judge0"],
    accent: "bg-pink",
    live: "https://recruitments2025.ramitvishwakarma.in",
    github: "https://github.com/RamitVishwakarma/RecruitmentPlatformV2Frontend",
    story: "/blog/recruitment-platform-v2",
  },
  {
    name: "SageSearch",
    year: "2026",
    description:
      "My final-year research. Persona-based answers from two books, comparing RAG with cache-augmented generation. Presented at ICMCE 2026.",
    tags: ["Express 5", "OpenAI", "Pinecone", "Next.js"],
    accent: "bg-purple",
    live: "https://sage-search.vercel.app",
    story: "/blog/rag-vs-cag-sagesearch",
  },
  {
    name: "WorkLink",
    year: "2025",
    description:
      "A three-sided marketplace that matches workers, startups and manufacturers to gigs and machine rentals, with a dashboard for each role.",
    tags: ["Next.js 15", "MongoDB", "shadcn/ui", "Zustand"],
    accent: "bg-yellow",
    live: "https://worklink.ramitvishwakarma.in",
    github: "https://github.com/RamitVishwakarma/Worklink",
  },
  {
    name: "Knowledge Capsule",
    year: "2026",
    description:
      "A vault for what you learn on YouTube. It pulls the transcript, summarizes it with Groq and lets you edit the summary inline.",
    tags: ["Next.js", "NextAuth", "MongoDB", "Groq", "TipTap"],
    accent: "bg-blue",
    live: "https://knowledge-capsule.vercel.app",
    github: "https://github.com/RamitVishwakarma/knowledgeCapsule",
  },
  {
    name: "Zealicon 2025",
    year: "2025",
    description:
      "Pass payments for a college fest with 2,000+ visitors, with Razorpay checkout, payment webhooks and digital IDs, deployed to AWS EC2 by GitHub Actions.",
    tags: ["Express", "MongoDB", "Razorpay", "Docker", "AWS EC2"],
    accent: "bg-red",
  },
  {
    name: "HackHive",
    year: "2024",
    description:
      "GDSC JSS Noida's GSSoC 2024 project, a hackathon finder. I set up its React and Vite frontend and reviewed pull requests from 22 contributors.",
    tags: ["React", "Vite", "Tailwind", "Open source"],
    accent: "bg-green",
    live: "https://hackhive-gssoc.netlify.app",
    github: "https://github.com/DSC-JSS-NOIDA/HackHive",
  },
];
