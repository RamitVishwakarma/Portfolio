export interface ExperienceItem {
  company: string;
  role: string;
  dates: string;
  place: string;
  logo?: string;
  // Dark logos need a light backing to show on the black page.
  logoOnLight?: boolean;
  summary: string;
  highlights: string[];
}

export const experience: ExperienceItem[] = [
  {
    company: "Weya AI",
    role: "Frontend Developer",
    dates: "Aug 2025 to present",
    place: "Noida",
    logo: "/images/logos/weya.avif",
    summary:
      "Weya builds voice, WhatsApp and video AI agents for businesses. I joined as a frontend intern and moved to full time in March 2026. My work covers the Next.js dashboard, the Node.js API, Postgres and the Go services.",
    highlights: [
      "Built a React Flow builder for multi-stage voice agents, and Call Journey, a Sankey view of how calls move through an agent's stages.",
      "Designed agent versioning with auto-save across three repositories.",
      "Moved the backend of the embeddable chat and voice widget to serverless functions.",
      "Tracked down production problems, including a 27-minute database query and pod restarts caused by a CSV export.",
    ],
  },
  {
    company: "KonnectYari Technologies",
    role: "Software Engineer Intern, Frontend",
    dates: "Sep 2024 to Feb 2025",
    place: "Remote",
    logo: "/images/logos/konnectyari.png",
    logoOnLight: true,
    summary:
      "Worked on cloudX, KonnectBox's multi-tenant platform for hands-on cloud labs, in Next.js 14 and TypeScript.",
    highlights: [
      "Built the cohorts, tenant management, catalogue and lab template modules.",
      "Added Azure as a second cloud provider next to AWS.",
    ],
  },
  {
    company: "Freelance",
    role: "Web Developer",
    dates: "2024 to present",
    place: "Remote",
    summary: "Sites and admin panels for clients.",
    highlights: [
      "Twin Crown, a real-estate sales site with 3D floor plans and a voice sales chat.",
      "Course21, the admin panel for a course-selling platform.",
      "IndustrialAI, a responsive landing page delivered in three days.",
    ],
  },
  {
    company: "GDG On Campus JSSATEN",
    role: "Core Team Member",
    dates: "2023 to 2025",
    place: "Noida",
    logo: "/images/logos/gdsc.png",
    summary: "Built and ran the club's recruitment platform for two seasons.",
    highlights: [
      "About 500 students applied through Recruitment Platform V2 in April 2025, including a live coding round judged by Judge0.",
    ],
  },
];
