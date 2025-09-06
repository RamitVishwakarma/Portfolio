import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  h2: ({ children }) => (
    <h2 className="text-white text-3xl font-ProductSans font-bold pt-10 pb-4">
      {children}
    </h2>
  ),
  p: ({ children }) => (
    <p className="text-grey-200 text-lg leading-8 pb-5">{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-green underline underline-offset-4 hover:text-light-blue">
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="text-white font-bold">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 pb-5 text-grey-200 text-lg leading-8 space-y-2">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 pb-5 text-grey-200 text-lg leading-8 space-y-2">
      {children}
    </ol>
  ),
  code: ({ children }) => (
    <code className="text-orange bg-grey-900 rounded px-1.5 py-0.5 text-base">
      {children}
    </code>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-green pl-4 my-6 italic [&>p]:pb-0">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto pb-6">
      <table className="w-full text-left text-grey-200 border-collapse">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="text-white font-bold border-b border-grey-300 py-2 pr-4">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-grey-900 py-2 pr-4 align-top">
      {children}
    </td>
  ),
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="w-full rounded-xl my-4" />
  ),
};

const Markdown = ({ content }: { content: string }) => {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
};

export default Markdown;
