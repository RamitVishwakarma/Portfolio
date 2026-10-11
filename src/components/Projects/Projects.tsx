import React from "react";
import Link from "next/link";
import ProjectContainer from "./ProjectContainer/ProjectContainer";
import { projects } from "./data";

const Projects = () => {
  return (
    <>
      <div className="py-20">
        <h2 className="text-white text-6xl text-center pb-10 font-Anton">
          Featured Projects
        </h2>
        <ProjectContainer />
        <div className="text-center pt-12">
          <Link
            href="/projects"
            className="inline-block border-2 border-green text-green hover:bg-green hover:text-black font-ProductSans font-bold text-xl rounded-full px-8 py-3 transition duration-200">
            View all {projects.length} projects
          </Link>
        </div>
      </div>
    </>
  );
};

export default Projects;
