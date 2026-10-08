export type Post = {
  slug: string;
  title: string;
  summary: string;
  date: string;
};

export const posts: Post[] = [
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
