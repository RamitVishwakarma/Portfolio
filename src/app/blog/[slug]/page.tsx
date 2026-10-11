import fs from "fs";
import path from "path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Wrapper from "@/components/Wrapper";
import Markdown from "@/components/Blog/Markdown";
import { formatDate, getPost, posts } from "@/content/blog/posts";

type Props = { params: { slug: string } };

export const dynamicParams = false;

export const generateStaticParams = () =>
  posts.map((post) => ({ slug: post.slug }));

export const generateMetadata = ({ params }: Props): Metadata => {
  const post = getPost(params.slug);
  if (!post) return {};
  return {
    title: `${post.title} | Ramit Vishwakarma`,
    description: post.summary,
  };
};

const page = ({ params }: Props) => {
  const post = getPost(params.slug);
  if (!post) notFound();

  const content = fs.readFileSync(
    path.join(process.cwd(), "src/content/blog", `${post.slug}.md`),
    "utf8"
  );

  return (
    <Wrapper>
      <article className="py-20 max-w-3xl mx-auto">
        <Link href="/blog" className="text-grey-300 hover:text-green">
          ← All posts
        </Link>
        <h1 className="text-white text-4xl md:text-5xl font-ProductSans font-bold pt-6 pb-4">
          {post.title}
        </h1>
        <p className="text-grey-300 pb-10">{formatDate(post.date)}</p>
        <Markdown content={content} />
      </article>
    </Wrapper>
  );
};

export default page;
