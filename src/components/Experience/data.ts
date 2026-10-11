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
    role: "Full Stack Developer",
    dates: "Aug 2025 to present",
    place: "Noida",
    logo: "/images/logos/weya.avif",
    summary:
      "Weya builds voice, WhatsApp and video AI agents for businesses. I joined as a software developer intern in August 2025 and have been a full stack developer since March 2026, across the Next.js dashboard, the Node.js API, Postgres, the Go services and Avalok, the video agent app I built.",
    highlights: [
      "Built Avalok, the LiveKit video agent app behind Dharavi Didi, the AI assistant the Adani Group's Dharavi redevelopment company launched in July 2026. It handled 15,163 video sessions from 4,287 people in its first 10 weeks.",
      "Shipped a React Flow builder for multi-stage voice agents, and Call Journey, a Sankey view of how calls move through an agent's stages.",
      "Shipped agent versioning with auto-save across the dashboard, the API and the database.",
      "Moved the backend of the embeddable chat and voice widget to serverless functions.",
      "Fixed production problems end to end, including a 27-minute database query and pod restarts caused by a CSV export.",
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
      "Built cloudX, KonnectBox's multi-tenant platform for hands-on cloud labs, in Next.js 14 and TypeScript, from the screens to the server controllers behind them.",
    highlights: [
      "Built the cohorts, tenant management, catalogue, cloud resources, my-labs and lab template modules.",
      "Added Azure as a second cloud provider next to AWS, with VM templates for AWS, Azure and vCenter.",
      "Built role management inside tenants on top of Keycloak single sign-on.",
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
    summary:
      "Built and ran the club's recruitment platform for two seasons, and led HackHive, the club's GSSoC 2024 open-source project.",
    highlights: [
      "Over 500 students applied through Recruitment 2k24 in 2024.",
      "Recruitment Platform V2 had 1,433 visitors and 12,067 page views in five days of April 2025, with a live coding round judged by Judge0.",
    ],
  },
];
