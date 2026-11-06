"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useRef, useState } from "react";
import { projects, type Category, type Project } from "./data";

const filters: ("All" | Category)[] = [
  "All",
  "Full stack",
  "Frontend",
  "Open source",
  "Client work",
];

// Plays the preview on hover with a mouse and on tap with touch.
const Preview = ({ project }: { project: Project }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const play = () => {
    videoRef.current?.play().catch(() => {});
    setPlaying(true);
  };
  const stop = () => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
    setPlaying(false);
  };

  if (!project.poster) {
    return (
      <div
        className={`${project.accent} aspect-video flex items-center justify-center`}>
        <span className="text-black text-3xl font-Anton">{project.name}</span>
      </div>
    );
  }

  return (
    <div
      className="relative aspect-video bg-black overflow-hidden"
      onMouseEnter={project.video ? play : undefined}
      onMouseLeave={project.video ? stop : undefined}
      onClick={project.video ? () => (playing ? stop() : play()) : undefined}>
      <Image
        src={project.poster}
        alt={`${project.name} screenshot`}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        className="object-cover object-top"
      />
      {project.video && (
        <>
          <video
            ref={videoRef}
            src={project.video}
            muted
            loop
            playsInline
            preload="none"
            className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-300 ${
              playing ? "opacity-100" : "opacity-0"
            }`}
          />
          <span
            className={`absolute bottom-3 right-3 rounded-full bg-black/70 text-white text-xs font-medium px-3 py-1 transition-opacity ${
              playing ? "opacity-0" : "opacity-100"
            }`}>
            Hover or tap to play
          </span>
        </>
      )}
    </div>
  );
};

const ProjectGrid = () => {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const shown =
    filter === "All"
      ? projects
      : projects.filter((p) => p.categories.includes(filter));

  return (
    <>
      <div className="flex flex-wrap justify-center gap-3 pb-10">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition duration-200 ${
              filter === f
                ? "bg-green border-green text-black"
                : "border-grey-900 text-grey-200 hover:border-grey-300"
            }`}>
            {f}
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2">
        {shown.map((project) => (
          <article
            key={project.slug}
            id={project.slug}
            className="rounded-xl border border-grey-900 overflow-hidden flex flex-col hover:border-grey-300 transition duration-200">
            <div className={`${project.accent} h-1.5`} />
            <Preview project={project} />
            <div className="p-6 max-sm:p-4 flex flex-col gap-3 flex-1">
              <div className="flex justify-between items-baseline gap-4">
                <h2 className="text-white text-2xl font-ProductSans font-bold">
                  {project.name}
                </h2>
                <span className="text-grey-300 text-sm">{project.year}</span>
              </div>
              <p className="text-grey-200 leading-7 flex-1">
                {project.description}
              </p>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold text-white">
                {project.metrics.map((metric) => (
                  <li key={metric}>{metric}</li>
                ))}
              </ul>
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
                {project.press && (
                  <a
                    href={project.press}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink hover:underline underline-offset-4">
                    In the news
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
};

export default ProjectGrid;
