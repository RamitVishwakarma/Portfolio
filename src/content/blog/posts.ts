export type Post = {
  slug: string;
  title: string;
  summary: string;
  date: string;
};

export const posts: Post[] = [
  {
    slug: "postgres-cpu-webhook-sweep",
    title: "Production Postgres at 100% CPU, and the sweep that grew with the square of a campaign",
    summary:
      "When calling hours opened, the database sat at 99.8% CPU for four hours. Sampling pg_stat_activity found one Go query on 94% of busy backends, and its cost grew with the square of campaign size.",
    date: "2026-09-15",
  },
  {
    slug: "recruitment-platform-v2",
    title: "Recruitment Platform V2 and the Postgres evening before launch",
    summary:
      "How I built the platform 500 students used to apply to GDSC JSSATEN, and how I fixed its production database six hours before launch.",
    date: "2025-09-06",
  },
];

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);

export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
