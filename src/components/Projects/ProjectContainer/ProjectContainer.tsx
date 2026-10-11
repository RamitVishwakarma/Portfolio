"use client";
import Image from "next/image";
import React from "react";
import Buttons from "./Buttons";
import { useRef, useState } from "react";
import { Play, Pause } from "../../../app/assets/icons";
import { featuredProjects, type Project } from "../data";
import { themes } from "../themes";

const FeaturedCard = ({ project }: { project: Project }) => {
  const theme = themes[project.featured ?? "rose"];
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState<boolean>(false);
  const handleVideoPlayback = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
    }
  };
  return (
    <div className="rounded-xl w-full relative flex overflow-hidden z-10 border border-grey-900">
      <Image
        src={theme.background}
        width={1920}
        height={1080}
        className="absolute top-0 left-0 w-full h-full object-cover z-10"
        alt=""
      />
      <div className="z-10 lg:flex max-lg:flex-col w-full">
        <div
          className={`lg:w-[60%] p-10 max-md:p-4 max-sm:p-2 ${theme.overlay} z-10`}>
          {project.video ? (
            <div className="relative">
              <video
                ref={videoRef}
                onClick={handleVideoPlayback}
                onEnded={() => setPlaying(false)}
                className="rounded-lg w-full aspect-video object-cover bg-black"
                poster={project.poster}
                preload="none"
                playsInline
                src={project.video}>
                Your browser does not support video tags
              </video>
              <div className="absolute inset-0 flex items-center justify-center cursor-pointer pointer-events-none">
                <button
                  aria-label={`Play the ${project.name} video`}
                  className={`pointer-events-auto w-24 h-24 shadow-lg ${theme.play} opacity-50 hover:opacity-100 transition duration-200 rounded-full p-8 ${
                    playing ? "hidden" : "flex"
                  } items-center justify-center`}
                  onClick={handleVideoPlayback}>
                  <Play />
                </button>
                <button
                  aria-label={`Pause the ${project.name} video`}
                  className={`pointer-events-auto absolute bottom-3 right-3 ${theme.play} opacity-50 hover:opacity-100 text-white text-2xl rounded-full p-6 shadow-lg transition duration-200 ${
                    playing ? "flex" : "hidden"
                  } items-center justify-center`}
                  onClick={handleVideoPlayback}>
                  <Pause />
                </button>
              </div>
            </div>
          ) : (
            project.poster && (
              <Image
                src={project.poster}
                width={1280}
                height={800}
                alt={project.name}
                className="rounded-lg w-full aspect-video object-cover"
              />
            )
          )}
        </div>
        <div
          className={`lg:w-[40%] max-lg:p-10 max-md:p-4 max-sm:p-2 py-10 pr-10 z-10 relative ${theme.overlay} flex flex-col justify-between`}>
          <div className="flex gap-4 flex-col">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className={`${theme.title} text-4xl font-bold`}>
                {project.name}
              </h3>
              <span className={`${theme.text} font-semibold`}>
                {project.year}
              </span>
            </div>
            <div className="text-sm flex gap-2 font-medium flex-wrap">
              {project.tags.map((tag) => (
                <div key={tag} className={`${theme.tag} py-0.5 px-3 rounded-full`}>
                  {tag}
                </div>
              ))}
            </div>
            <p
              className={`text-lg tracking-[-4%] font-semibold leading-8 text-balance ${theme.text} py-2`}>
              {project.description}
            </p>
            <ul className={`flex flex-wrap gap-x-4 gap-y-1 ${theme.title} font-bold`}>
              {project.metrics.map((metric) => (
                <li key={metric}>{metric}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-4 lg:text-2xl md:text-xl sm:text-lg text-base mt-6">
            <Buttons
              github={project.github}
              live={project.live}
              story={project.story}
              color={theme.buttonIcon}
              classname={theme.button}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectContainer = () => {
  return (
    <div className="flex flex-col gap-10 items-center w-full">
      {featuredProjects.map((project) => (
        <FeaturedCard key={project.slug} project={project} />
      ))}
    </div>
  );
};

export default ProjectContainer;
