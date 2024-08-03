import React from "react";
import ProjectContainer from "./ProjectContainer/ProjectContainer";

const Projects = () => {
  return (
    <>
      <div className="py-20">
        <h2 className="text-white text-6xl text-center pb-10 font-Anton">
          Featured Projects
        </h2>
        <ProjectContainer />
      </div>
    </>
  );
};

export default Projects;
