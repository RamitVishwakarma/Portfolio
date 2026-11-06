export interface EarlierRole {
  role: string;
  dates: string;
  highlights: string[];
}

export interface ExperienceItem {
  company: string;
  role: string;
  dates: string;
  place: string;
  logo?: string;
  // Dark logos need a light backing to show on the black page.
  logoOnLight?: boolean;
  summary?: string;
  highlights: string[];
  // Earlier positions at the same company, newest first.
  earlier?: EarlierRole[];
}

export const experience: ExperienceItem[] = [
  {
    company: "Weya AI",
    role: "Full Stack Developer",
    dates: "Mar 2026 to present",
    place: "Noida",
    logo: "/images/logos/weya.avif",
    summary:
      "Weya builds voice, WhatsApp and video AI agents for businesses. I work across the Next.js dashboard, the Node.js API, PostgreSQL, the Go services and Avalok, the video agent app I built.",
    highlights: [
      "Built Avalok, the LiveKit video agent app behind Dharavi Didi, the Adani Group's 24x7 AI assistant for the Dharavi redevelopment. It handled 15,163 video sessions from 4,287 people in its first 10 weeks.",
      "Built Avalok in Next.js 16 with signed campaign links, a Redis concurrency cap per organization, per-IP rate limits, LiveKit recordings to S3 and OpenTelemetry, autoscaling on GKE from 1 to 10 pods.",
      "Shipped Call Journey across the API, Postgres and the dashboard. Teams define ordered stages on an agent, a rollup counts every dial against them, and campaign analytics draws the flow as a Sankey chart.",
      "Shipped agent versioning with auto-save across 3 repositories.",
      "Root-caused a production Postgres outage at 100% CPU, and rewrote a query that averaged 27 minutes per call as a LATERAL join on existing indexes.",
      "Built a Go service that streams log exports from Postgres as gzip, 4.8x smaller on a 301,000-row export, running as a Cloud Run function that costs nothing when idle.",
      "Traced random API pod restarts to in-memory CSV exports that peaked at 663 MB, and replaced them with streamed exports.",
      "Run production releases on a Postgres database with 2 million calls and 4.8 million call logs.",
    ],
    earlier: [
      {
        role: "Software Developer Intern, Frontend",
        dates: "Aug 2025 to Mar 2026",
        highlights: [
          "Moved the dashboard's server state to TanStack Query and lazy-loaded heavy routes, taking Largest Contentful Paint from 3 to 4 seconds down to under 1 second.",
          "Built a React Flow builder for multi-stage voice agents, where each conversation stage is a node, with client validation that mirrors the API's rules.",
          "Built CSV lead upload with in-browser validation that checks 100,000+ rows in under 2 seconds before anything reaches the API.",
          "Built the live agent testing screen, where teams try a voice agent from the browser before they launch a campaign.",
        ],
      },
    ],
  },
  {
    company: "KonnectYari Technologies",
    role: "Software Engineer Intern, Frontend",
    dates: "Sep 2024 to Feb 2025",
    place: "Remote",
    logo: "/images/logos/konnectyari.png",
    logoOnLight: true,
    summary: "KonnectBox's cloudX is a multi-tenant platform for hands-on cloud labs.",
    highlights: [
      "Built cloudX in Next.js 14 and TypeScript, including its cohorts, tenant management, catalogue, cloud resources and lab template modules.",
      "Added Azure as a second cloud provider next to AWS, with Azure lab templates, catalogue integration and an explore-lab flow.",
      "Built the create and edit flows for AWS, Azure and vCenter VM templates with React Hook Form, Zod and shadcn/ui.",
      "Built role management inside tenants on top of Keycloak single sign-on.",
      "Wrote the Next.js server controllers and services behind those screens, with 95 merged commits in 5 months.",
    ],
  },
  {
    company: "Freelance",
    role: "Web Developer",
    dates: "Apr 2024 to present",
    place: "Remote",
    summary: "Sites and admin panels for clients.",
    highlights: [
      "Twin Crown: the sales site for a residential project at twincrown.co, with 3D models of all 11 floor plans in three.js, a text and voice sales chat, and automated follow-up on abandoned chats.",
      "Course21: an admin panel for course creators, with drag-and-drop ordering of courses, modules and lectures, roles and permissions, and HLS playback for every lecture.",
      "IndustrialAI: a pixel-perfect, responsive landing page in Next.js, delivered in 3 days against a 1-week deadline.",
    ],
  },
  {
    company: "GDG On Campus JSSATEN",
    role: "GDG Lead",
    dates: "2025 to 2026",
    place: "Noida",
    logo: "/images/logos/gdsc.png",
    summary:
      "Three years with the chapter: a member, then Web Lead, then lead of the whole chapter.",
    highlights: [
      "Led the chapter and led development of the Zealicon 2025 platform, with paid Zeal IDs through Razorpay, event enrollment and a merch store. It had 4,971 visitors and 14,010 page views in fest week.",
      "Led the next recruitment season on Recruitment Platform V2, which the chapter has run every year since 2025, guiding the new Web Lead and web team.",
      "Built Zephyr, the chapter's AI assistant that answers students' questions about GDG, its team and its events, in Next.js 15 with chat sessions and Markdown answers.",
    ],
    earlier: [
      {
        role: "Web Lead",
        dates: "2024 to 2025",
        highlights: [
          "Led development of Recruitment Platform V2, which ran the chapter's 2025 recruitment and had 1,433 visitors and 12,067 page views in five days of April 2025.",
          "Built the platform's live coding round end to end, with submissions judged by a self-hosted Judge0 server.",
          "Led HackHive, the chapter's GSSoC 2024 open-source project, building its React and Vite frontend and reviewing pull requests from 22 contributors.",
        ],
      },
      {
        role: "Member",
        dates: "2023 to 2024",
        highlights: [
          "Built Recruitment 2k24, my first production project, which took over 500 applicants through the 2024 season.",
        ],
      },
    ],
  },
];
