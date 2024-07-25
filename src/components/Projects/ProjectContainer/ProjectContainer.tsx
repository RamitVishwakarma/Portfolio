import React from "react";

const ProjectContainer = () => {
  return (
    <>
      <div>
        <div className="flex flex-col gap-10 items-center px-20">
          {/* P1 */}
          <div className="bg-purple/40 backdrop-blur-3xl relative flex overflow-visible">
            <div className="radial-gradient-purple absolute -top-20 -right-16 w-[80rem] h-[34rem]"></div>
            <div className="z-10 p-10 w-8/12 flex">
              <video
                controls
                className=""
                src="https://res.cloudinary.com/dhkxbgwmt/video/upload/v1721816617/Portfolio/Recruitment-Platform_compressed_uoerwn.mp4"></video>
            </div>
            <div className="text-white py-10 pr-10 text-3xl font-bold">
              Recruitment-Platform
            </div>
          </div>
          {/* P2 */}
          <div className=" bg-green/40 backdrop-blur-3xl relative flex">
            <div className="radial-gradient-green absolute -top-20 -right-16 w-[80rem] h-[34rem]"></div>
            <div className="z-10 p-10 w-8/12">
              <video
                controls
                className=""
                src="https://res.cloudinary.com/dhkxbgwmt/video/upload/v1721816617/Portfolio/Recruitment-Platform_compressed_uoerwn.mp4"></video>
            </div>
          </div>
          {/* P3 */}
          <div className=" bg-blue/40 backdrop-blur-3xl relative flex">
            <div className="radial-gradient-light-blue absolute -top-20 -right-16 w-[80rem] h-[34rem]"></div>
            <div className="z-10 p-10 w-8/12">
              <video
                controls
                className=""
                src="https://res.cloudinary.com/dhkxbgwmt/video/upload/v1721816617/Portfolio/Recruitment-Platform_compressed_uoerwn.mp4"></video>
            </div>
          </div>
          {/* P4 */}
          <div className=" bg-orange/40 backdrop-blur-3xl relative flex ">
            <div className="radial-gradient-yellow absolute -top-20 -right-16 w-[80rem] h-[34rem]"></div>
            <div className="z-10 p-10 w-8/12">
              <video
                controls
                className=""
                src="https://res.cloudinary.com/dhkxbgwmt/video/upload/v1721816617/Portfolio/Recruitment-Platform_compressed_uoerwn.mp4"></video>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectContainer;
