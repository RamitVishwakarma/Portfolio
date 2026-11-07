import React from "react";
import ProjectContainer from "./ProjectContainer/ProjectContainer";
import Build from "../Swarm/Build";

const Projects = () => {
  return (
    <>
      <div className="py-20">
        <Build as="h2" kind="text" className="text-white text-6xl text-center pb-10 font-Anton">
          Featured Projects
        </Build>
        <ProjectContainer />
      </div>
    </>
  );
};

export default Projects;
