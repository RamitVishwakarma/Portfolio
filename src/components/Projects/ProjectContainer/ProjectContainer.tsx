import React from "react";

const ProjectContainer = () => {
  return (
    <>
      <div>
        <div className="text-white text-5xl text-center py-10">
          Featured Projects
        </div>
        <div className="flex flex-col gap-10 items-center">
          <div className="w-[70rem] h-[30rem] bg-purple/40 backdrop-blur-3xl relative">
            <div className="radial-gradient-purple absolute -top-20 -right-16  w-[95rem] h-[44rem]"></div>
          </div>
          <div className="w-[70rem] h-[30rem] bg-green/40 backdrop-blur-3xl relative">
            <div className="radial-gradient-green absolute top-0 w-[65rem] h-[44rem]"></div>
          </div>
          <div className="w-[70rem] h-[30rem] bg-blue/40 backdrop-blur-3xl relative ">
            <div className="radial-gradient-light-blue absolute top-0 w-[65rem] h-[44rem]"></div>
          </div>
          <div className="w-[70rem] h-[30rem] bg-orange/40 backdrop-blur-3xl relative ">
            <div className="radial-gradient-yellow absolute top-0 w-[65rem] h-[44rem]"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectContainer;
