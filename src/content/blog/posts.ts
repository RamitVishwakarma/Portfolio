export type Post = {
  slug: string;
  title: string;
  summary: string;
  date: string;
};

export const posts: Post[] = [
  {
    slug: "janus-macos-account-switcher",
    title: "Janus: a macOS app that reached 123 GitHub stars in two weeks",
    summary:
      "Why I built a menu-bar app for switching Claude Code and Codex accounts, the keychain bug that nearly sank the first release, and how one git tag ships a release.",
    date: "2026-10-09",
  },
  {
    slug: "twin-crown-floor-plans",
    title: "Eleven floor plans in three.js for a real-estate launch",
    summary:
      "How I turned a residential project's drawings into furnished 3D models and 2D plans, and kept the page fast with a WebGL scene on it.",
    date: "2026-09-30",
  },
  {
    slug: "docu-anchored-comments",
    title: "Comments that survive an AI agent rewriting the page",
    summary:
      "How docU keeps review comments attached when an agent edits a document, with a ProseMirror mark and a text-quote fallback on TipTap's free core.",
    date: "2026-09-12",
  },
  {
    slug: "pg-cron-silent-failures",
    title: "pg_cron said succeeded for four days",
    summary:
      "A nightly billing rollup failed every night while pg_cron logged success. How the error was swallowed, how I found it and the two rules I follow now.",
    date: "2026-09-08",
  },
  {
    slug: "streaming-csv-exports",
    title: "The CSV export that kept restarting our API",
    summary:
      "Pod restarts that looked random came from one export holding 663 MB in memory. What I measured, why the liveness probe fired and how streaming fixed it.",
    date: "2026-07-30",
  },
  {
    slug: "rag-vs-cag-sagesearch",
    title: "RAG versus CAG on 30 questions, and why SageSearch uses CAG anyway",
    summary:
      "My final-year project compared retrieval with putting the whole book in the prompt. RAG won on most scores. Here is what the numbers showed.",
    date: "2026-06-02",
  },
  {
    slug: "recruitment-platform-v2",
    title: "Recruitment Platform V2 and the Postgres evening before launch",
    summary:
      "How I built the platform 500 students used to apply to GDSC JSSATEN, and how I fixed its production database six hours before launch.",
    date: "2025-09-06",
  },
  {
    slug: "zealicon-2025",
    title: "Zealicon 2025: 4,971 visitors in a week and a Vercel team paused",
    summary:
      "I built the platform behind JSSATEN's college fest, from Razorpay passes and Zeal IDs to the site and its deploys. What the fest week looked like from the dashboards.",
    date: "2025-05-24",
  },
  {
    slug: "recruitment-2k24",
    title: "Recruitment 2k24, my first production project",
    summary:
      "The GDSC JSSATEN recruitment platform I built in 2024: registration, domain quizzes, project submissions and an admin panel that took 500+ applicants through one season.",
    date: "2024-07-22",
  },
];

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);

export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
