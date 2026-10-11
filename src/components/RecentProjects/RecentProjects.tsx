import Link from "next/link";
import React from "react";
import { recentProjects } from "./data";

const RecentProjects = () => {
  return (
    <>
      <div className="py-20">
        <h2 className="text-white text-6xl text-center pb-4 font-Anton">
          Recent Projects
        </h2>
        <p className="text-grey-300 text-center pb-10">
          What I have built since 2024, newest first.
        </p>
        <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2">
          {recentProjects.map((project) => (
            <article
              key={project.name}
              className="rounded-xl border border-grey-900 overflow-hidden flex flex-col hover:border-grey-300 transition duration-200">
              <div className={`${project.accent} h-1.5`} />
              <div className="p-6 max-sm:p-4 flex flex-col gap-3 flex-1">
                <div className="flex justify-between items-baseline gap-4">
                  <h3 className="text-white text-2xl font-ProductSans font-bold">
                    {project.name}
                  </h3>
                  <span className="text-grey-300 text-sm">{project.year}</span>
                </div>
                <p className="text-grey-200 leading-7 flex-1">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 text-xs font-medium">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="border border-grey-900 text-grey-200 rounded-full px-3 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4 pt-2 text-sm font-medium">
                  {project.live && (
                    <a
                      href={project.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green hover:underline underline-offset-4">
                      Live site
                    </a>
                  )}
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-light-blue hover:underline underline-offset-4">
                      GitHub
                    </a>
                  )}
                  {project.story && (
                    <Link
                      href={project.story}
                      className="text-orange hover:underline underline-offset-4">
                      Read the story
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
};

export default RecentProjects;
