import Link from "next/link";
import React from "react";
import { formatDate, posts } from "@/content/blog/posts";
import { readPost, readingMinutes } from "@/content/blog/read";

const LatestPosts = () => {
  const latest = posts.slice(0, 3);
  return (
    <>
      <div className="py-20">
        <h2 className="text-white text-6xl text-center pb-10 font-Anton">
          From the Blog
        </h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {latest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block rounded-xl border border-grey-900 p-6 hover:border-green group">
              <p className="text-grey-300 text-sm pb-2">
                {formatDate(post.date)} · {readingMinutes(readPost(post.slug))}{" "}
                min read
              </p>
              <h3 className="text-white text-xl font-ProductSans font-bold pb-2 group-hover:text-green">
                {post.title}
              </h3>
              <p className="text-grey-200 leading-7">{post.summary}</p>
            </Link>
          ))}
        </div>
        <div className="text-center pt-8">
          <Link
            href="/blog"
            className="text-green font-medium hover:underline underline-offset-4">
            All {posts.length} posts
          </Link>
        </div>
      </div>
    </>
  );
};

export default LatestPosts;
