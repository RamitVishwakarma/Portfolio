export type Category = "Full stack" | "Frontend" | "Open source" | "Client work";

export type Theme = "rose" | "blue" | "stone" | "teal";

export interface Project {
  slug: string;
  name: string;
  year: string;
  categories: Category[];
  description: string;
  metrics: string[];
  tags: string[];
  // accent is a Tailwind background class from the theme palette.
  accent: string;
  // A still image for the card. A video plays on top of it when set.
  poster?: string;
  video?: string;
  live?: string;
  github?: string;
  story?: string;
  // Featured projects show on the home page, in this order, with this theme.
  featured?: Theme;
}

export const projects: Project[] = [
  {
    slug: "recruitment-platform-v2",
    name: "Recruitment Platform V2",
    year: "2025",
    categories: ["Full stack"],
    description:
      "The platform GDSC JSSATEN ran its 2025 recruitment on. About 500 students went from sign-up through an aptitude quiz, a domain task and a live coding contest judged by Judge0, and the core team ran every round from one admin dashboard.",
    metrics: ["1,433 visitors in 5 days", "12,067 page views", "Speed score 100"],
    tags: ["Next.js 15", "TypeScript", "Express", "PostgreSQL", "Prisma", "Judge0", "AWS"],
    accent: "bg-pink",
    poster: "/images/projects/recruitment-platform-v2.webp",
    video: "/videos/projects/recruitment-platform-v2.mp4",
    live: "https://recruitments2025.ramitvishwakarma.in",
    github: "https://github.com/RamitVishwakarma/RecruitmentPlatformV2Frontend",
    story: "/blog/recruitment-platform-v2",
    featured: "rose",
  },
  {
    slug: "janus",
    name: "Janus",
    year: "2026",
    categories: ["Open source"],
    description:
      "An open-source macOS menu-bar app that switches Claude Code and Codex accounts and clears developer caches. One git tag builds a universal binary, a DMG and a Homebrew cask update.",
    metrics: ["123 GitHub stars", "5 releases", "145 tests"],
    tags: ["Swift", "SwiftUI", "XCTest", "GitHub Actions", "Next.js"],
    accent: "bg-green",
    poster: "/images/projects/janus.webp",
    video: "/videos/projects/janus.mp4",
    live: "https://janus.ramitvishwakarma.in",
    github: "https://github.com/RamitVishwakarma/Janus",
    story: "/blog/janus-macos-account-switcher",
    featured: "blue",
  },
  {
    slug: "twin-crown",
    name: "Twin Crown",
    year: "2026",
    categories: ["Full stack", "Client work"],
    description:
      "The sales site for a residential project, with 3D models of all 11 floor plans, a text and voice sales chat, and automated follow-up on abandoned chats through a Cloudflare cron.",
    metrics: ["11 floor plans in 3D", "Voice sales chat", "104 test files"],
    tags: ["Next.js 16", "three.js", "Tailwind 4", "MongoDB", "Cloudflare Workers"],
    accent: "bg-orange",
    poster: "/images/projects/twin-crown.webp",
    video: "/videos/projects/twin-crown.mp4",
    live: "https://twincrown.co",
    story: "/blog/twin-crown-floor-plans",
    featured: "stone",
  },
  {
    slug: "zealicon-2025",
    name: "Zealicon 2025",
    year: "2025",
    categories: ["Full stack"],
    description:
      "The platform behind JSSATEN's college fest: paid Zeal IDs through Razorpay, event enrollment, a merch store and admin tools, with an Express API that GitHub Actions deployed to AWS EC2 on every merge.",
    metrics: ["4,971 visitors in a week", "14,010 page views", "58 GB served in 12 hours"],
    tags: ["Next.js", "Redux Toolkit", "Express", "MongoDB", "Razorpay", "Docker", "AWS EC2"],
    accent: "bg-red",
    poster: "/images/projects/zealicon-2025.webp",
    video: "/videos/projects/zealicon-2025.mp4",
    story: "/blog/zealicon-2025",
    featured: "teal",
  },
  {
    slug: "docu",
    name: "docU",
    year: "2026",
    categories: ["Full stack"],
    description:
      "Agent-first documentation. AI agents draft through an API, one person reviews in the margin, and every revision is attributed and diffable. Comments stay anchored even when an agent rewrites the page.",
    metrics: ["12-table schema", "17 API routes", "Full-text search"],
    tags: ["Next.js 16", "React 19", "PostgreSQL", "Drizzle", "TipTap", "React Flow"],
    accent: "bg-light-blue",
    poster: "/images/projects/docu.webp",
    live: "https://docu-silk.vercel.app",
    story: "/blog/docu-anchored-comments",
  },
  {
    slug: "sagesearch",
    name: "SageSearch",
    year: "2026",
    categories: ["Full stack"],
    description:
      "My final-year research. Persona-based answers from two books, comparing retrieval-augmented generation with cache-augmented generation on a 30-question evaluation set.",
    metrics: ["Presented at ICMCE 2026", "RAG vs CAG evaluation"],
    tags: ["Express 5", "OpenAI", "Pinecone", "Next.js", "Framer Motion"],
    accent: "bg-purple",
    poster: "/images/projects/sagesearch.webp",
    video: "/videos/projects/sagesearch.mp4",
    live: "https://sage-search.vercel.app",
    story: "/blog/rag-vs-cag-sagesearch",
  },
  {
    slug: "knowledge-capsule",
    name: "Knowledge Capsule",
    year: "2026",
    categories: ["Full stack"],
    description:
      "A vault for what you learn on YouTube. It pulls the transcript, summarizes it with Groq and lets you edit the summary inline.",
    metrics: ["Google sign-in", "AI summaries"],
    tags: ["Next.js", "NextAuth", "MongoDB", "Groq", "TipTap"],
    accent: "bg-blue",
    poster: "/images/projects/knowledge-capsule.webp",
    video: "/videos/projects/knowledge-capsule.mp4",
    live: "https://knowledge-capsule.vercel.app",
    github: "https://github.com/RamitVishwakarma/knowledgeCapsule",
  },
  {
    slug: "worklink",
    name: "WorkLink",
    year: "2025",
    categories: ["Full stack"],
    description:
      "A three-sided marketplace that matches workers, startups and manufacturers to gigs and machine rentals, with a dashboard for each role.",
    metrics: ["3 user roles", "28 API routes", "6 data models"],
    tags: ["Next.js 15", "TypeScript", "MongoDB", "shadcn/ui", "Zustand"],
    accent: "bg-yellow",
    poster: "/images/projects/worklink.webp",
    video: "/videos/projects/worklink.mp4",
    live: "https://worklink.ramitvishwakarma.in",
    github: "https://github.com/RamitVishwakarma/Worklink",
  },
  {
    slug: "recruitment-2k24",
    name: "Recruitment 2k24",
    year: "2024",
    categories: ["Full stack", "Frontend"],
    description:
      "The first version of the GDSC recruitment platform: registration, domain quizzes, project submissions and an admin panel that took over 500 applicants through the 2024 season.",
    metrics: ["500+ applicants", "5 domains"],
    tags: ["React", "Vite", "Tailwind", "GSAP", "Express", "MongoDB", "Firebase"],
    accent: "bg-pink",
    poster: "/videos/recruitmentPlatform2024.webp",
    video: "/videos/recruitmentPlatform2024.mp4",
    github: "https://github.com/RamitVishwakarma/Recruitment-Platform",
    story: "/blog/recruitment-2k24",
  },
  {
    slug: "hackhive",
    name: "HackHive",
    year: "2024",
    categories: ["Open source", "Frontend"],
    description:
      "GDSC JSS Noida's GSSoC 2024 project, a hackathon finder. I led it, built its React and Vite frontend and reviewed pull requests from 22 contributors.",
    metrics: ["22 contributors", "GSSoC 2024"],
    tags: ["React", "Vite", "Tailwind"],
    accent: "bg-green",
    poster: "/images/projects/hackhive.webp",
    video: "/videos/projects/hackhive.mp4",
    live: "https://hackhive-gssoc.netlify.app",
    github: "https://github.com/DSC-JSS-NOIDA/HackHive",
  },
  {
    slug: "course21",
    name: "Course21",
    year: "2024",
    categories: ["Frontend", "Client work"],
    description:
      "An admin panel for course creators, with drag-and-drop ordering of courses, modules and lectures, roles and permissions, and HLS playback with transcoding status for every lecture.",
    metrics: ["Drag and drop", "Role management"],
    tags: ["React", "TypeScript", "Tailwind", "dnd-kit"],
    accent: "bg-blue",
    poster: "/images/showcases/course21.png",
    video: "/videos/projects/course21.mp4",
    live: "https://course21.ramitvishwakarma.in",
    github: "https://github.com/RamitVishwakarma/Course21-Admin-Panel",
  },
  {
    slug: "maskify",
    name: "Maskify",
    year: "2024",
    categories: ["Full stack"],
    description:
      "Built for Smart India Hackathon 2024. It finds Aadhaar numbers in PDFs and images with Tesseract OCR, checks each one with the Verhoeff checksum and masks the digits.",
    metrics: ["SIH 2024", "OCR pipeline"],
    tags: ["Node.js", "Express", "Python", "Tesseract", "OpenCV", "Docker"],
    accent: "bg-yellow",
    github: "https://github.com/RamitVishwakarma/Re-dact",
  },
  {
    slug: "industrial-ai",
    name: "IndustrialAI Landing",
    year: "2024",
    categories: ["Frontend", "Client work"],
    description:
      "A pixel-perfect, fully responsive landing page for an enterprise AI client, built to the client's design.",
    metrics: ["Client work", "Responsive"],
    tags: ["Next.js", "Tailwind"],
    accent: "bg-orange",
    poster: "/images/showcases/endeavor.png",
    video: "/videos/projects/industrial-ai.mp4",
    live: "https://industrial-ai.ramitvishwakarma.in",
    github: "https://github.com/RamitVishwakarma/IndustrialAI-Landing",
  },
  {
    slug: "echo-talk",
    name: "Echo Talk",
    year: "2024",
    categories: ["Full stack"],
    description:
      "A dictation tool that reads your text aloud with Amazon Polly, one word at a time with a delay you set, so you can write assignments on paper.",
    metrics: ["Amazon Polly"],
    tags: ["React", "Tailwind", "Node.js", "Express", "AWS Polly"],
    accent: "bg-light-blue",
    poster: "/images/showcases/echoTalk.png",
    video: "/videos/projects/echo-talk.mp4",
    live: "https://echotalk.ramitvishwakarma.in",
    github: "https://github.com/RamitVishwakarma/EchoTalk",
  },
];

export const featuredProjects = projects.filter((p) => p.featured);
