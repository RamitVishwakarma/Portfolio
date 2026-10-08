import type { Metadata } from "next";
import Link from "next/link";
import Wrapper from "@/components/Wrapper";
import { formatDate, posts } from "@/content/blog/posts";

export const metadata: Metadata = {
  title: "Blog | Ramit Vishwakarma",
  description: "Notes on the things Ramit Vishwakarma has built and shipped",
};

const page = () => {
  return (
    <Wrapper>
      <main className="py-20 max-w-3xl mx-auto">
        <h1 className="text-white text-6xl text-center pb-10 font-Anton">
          Blog
        </h1>
        <ul className="flex flex-col gap-6">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="block rounded-xl border border-grey-900 p-6 hover:border-green group">
                <p className="text-grey-300 text-sm pb-2">
                  {formatDate(post.date)}
                </p>
                <h2 className="text-white text-2xl font-ProductSans font-bold pb-2 group-hover:text-green">
                  {post.title}
                </h2>
                <p className="text-grey-200">{post.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </Wrapper>
  );
};

export default page;
