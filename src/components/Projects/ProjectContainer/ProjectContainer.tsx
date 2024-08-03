"use client";
import Image from "next/image";
import React from "react";
import Buttons from "./Buttons";
import { useRef, useState } from "react";
import { Play, Pause } from "../../../app/assets/icons";

const ProjectContainer = () => {
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
    <>
      <div>
        <div className="flex flex-col gap-10 items-center w-full">
          {/* P1 */}
          <div className="rounded-xl w-full relative flex overflow-hidden z-10 border border-grey-900">
            <Image
              src="https://res.cloudinary.com/dhkxbgwmt/image/upload/v1722455126/Portfolio/Projects/Backgrounds/BG_creme_sdkzym.png"
              width={1920}
              height={1080}
              className="absolute top-0 left-0 w-full h-full object-cover z-10"
              alt="bg"
            />
            <div className="z-10 lg:flex max-lg:flex-col ">
              <div className="lg:w-[60%] p-10 max-md:p-4 max-sm:p-2 bg-[#ea546c]/20  z-10">
                <div className="relative">
                  <video
                    ref={videoRef}
                    onClick={handleVideoPlayback}
                    src="https://res.cloudinary.com/dhkxbgwmt/video/upload/v1722428111/Portfolio/Projects/Recruitment-Platform-Compressed_qmtqw4.mp4">
                    Your browser does not support video tags
                  </video>
                  <div className="absolute inset-0 flex items-center justify-center cursor-pointer">
                    <button
                      className={`w-24 h-24 shadow-lg bg-[#753f41] opacity-50 hover:opacity-100 transition duration-200 rounded-full p-8 ${
                        playing ? "hidden" : "flex"
                      } items-center justify-center`}
                      onClick={handleVideoPlayback}>
                      <Play />
                    </button>
                    <button
                      className={`absolute bottom-3 right-3 bg-[#753f41] opacity-50 hover:opacity-100 text-white text-2xl rounded-full p-6 shadow-lg transition duration-200 ${
                        playing ? "flex" : "hidden"
                      } items-center justify-center`}
                      onClick={handleVideoPlayback}>
                      <Pause />
                    </button>
                  </div>
                </div>
              </div>
              <div className="lg:w-[40%] max-lg:p-10 max-md:p-4 max-sm:p-2 py-10 pr-10 z-10 relative bg-[#ea546c]/20 flex flex-col justify-between ">
                <div className="flex gap-4 flex-col">
                  <h3 className="text-[#753f41] text-4xl font-bold">
                    Recruitment-Platform
                  </h3>
                  <div className="text-sm flex gap-2 font-medium flex-wrap">
                    <div className="border-[#753f41] border-2 text-[#f6eaea] bg-[#63393a]  py-0.5 px-3 rounded-full ">
                      React
                    </div>
                    <div className="border-[#753f41] border-2 text-[#f6eaea] bg-[#63393a] -blue py-0.5 px-3 rounded-full ">
                      Tailwind
                    </div>
                    <div className="border-[#753f41] border-2 text-[#f6eaea]  bg-[#63393a] py-0.5 px-3 rounded-full ">
                      Node
                    </div>
                    <div className="border-[#753f41] border-2 text-[#f6eaea] bg-[#63393a]  py-0.5 px-3 rounded-full ">
                      Express
                    </div>
                  </div>
                  <p className="text-lg tracking-[-4%] font-semibold leading-8 text-balance text-[#8d484a] py-2">
                    Recruitment-Platform facilitated the onboarding of over 500
                    applicants and streamlined task completion, project
                    submission, and aptitude rounds significantly speeding up
                    the recruitment process for the GDSC team.
                  </p>
                </div>
                <div className="flex gap-4 lg:text-2xl md:text-xl sm:text-lg text-base  mt-2 ">
                  <Buttons
                    github="https://github.com/RamitVishwakarma/Recruitment-Platform"
                    live="https://recplatform.ramitvishwakarma.in/"
                    color="#e3bebf"
                    classname="bg-[#753f40] hover:bg-[#8c494b] text-[#e3bebf]"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* P2 */}
          <div className="bg-purple/30 backdrop-blur-3xl rounded-xl w-full relative flex overflow-hidden z-10">
            <Image
              src="https://res.cloudinary.com/dhkxbgwmt/image/upload/v1722455126/Portfolio/Projects/Backgrounds/Bg-blue_rznahj.png"
              width={1920}
              height={1080}
              className="absolute top-0 left-0 w-full h-full object-cover z-10"
              alt="bg"
            />
            <div className="z-10 lg:flex max-lg:flex-col ">
              <div className="lg:w-[60%] p-10 max-md:p-4 max-sm:p-2 bg-black/30  z-10">
                <Image
                  src="https://res.cloudinary.com/dhkxbgwmt/image/upload/v1722428146/Portfolio/Projects/Course21_showcase_ihawc3.png"
                  width={640}
                  height={360}
                  alt="course-21"
                  className="rounded-lg max-lg:w-full"
                />
              </div>

              <div className="lg:w-[40%] max-lg:p-10 max-md:p-4 max-sm:p-2 py-10 pr-10 z-10 relative bg-black/30 flex flex-col justify-between ">
                <div className="flex gap-4 flex-col">
                  <h3 className="text-[#daf3f3] text-4xl font-bold">
                    Course-21
                  </h3>
                  <div className="text-sm flex gap-2 font-medium flex-wrap">
                    <div className="border-[#ceefff] bg-[#e9f8ff] border-2 text-[#000e25] py-1 px-3 rounded-full ">
                      React
                    </div>
                    <div className="border-[#ceefff] bg-[#e9f8ff] border-2 text-[#000e25] py-1 px-3 rounded-full ">
                      Tailwind
                    </div>
                    <div className="border-[#ceefff] bg-[#e9f8ff] border-2 text-[#000e25] py-1 px-3 rounded-full ">
                      Typescript
                    </div>
                    <div className="border-[#ceefff] bg-[#e9f8ff] border-2 text-[#000e25] py-1 px-3 rounded-full ">
                      Dnd-kit
                    </div>
                  </div>
                  <p className="text-lg tracking-[-4%] font-semibold leading-8  text-balance text-white/70 py-2">
                    Course21 is a platform designed to make the workflow of
                    course creators smoother. It allows for easy course
                    addition, module, and lecture organization through
                    drag-and-drop functionality, with user and role management.
                    Moreover, it handles video processing and transcoding.
                  </p>
                </div>
                <div className="flex gap-4 lg:text-2xl md:text-xl sm:text-lg text-base  mt-2 ">
                  <Buttons
                    github="https://github.com/RamitVishwakarma/Course21-Admin-Panel"
                    live="/course21"
                    color="#acebff"
                    classname="bg-[#004fab] hover:bg-[#0057db] text-[#acebff]"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* P3 */}
          <div className=" backdrop-blur-3xl rounded-xl w-full relative flex overflow-hidden z-10">
            <Image
              src="https://res.cloudinary.com/dhkxbgwmt/image/upload/v1722455126/Portfolio/Projects/Backgrounds/BG_creme_sdkzym.png"
              width={1920}
              height={1080}
              className="absolute top-0 left-0 w-full h-full object-cover z-10"
              alt="bg"
            />
            <div className="z-10 lg:flex max-lg:flex-col ">
              <div className="lg:w-[60%] p-10 max-md:p-4 max-sm:p-2 bg-black/10  z-10">
                <Image
                  src="https://res.cloudinary.com/dhkxbgwmt/image/upload/v1722428137/Portfolio/Projects/IndustrialAI_showcase_g0d4fw.png"
                  width={640}
                  height={360}
                  alt="echo-talk"
                  className="rounded-lg max-lg:w-full"
                />
              </div>

              <div className="lg:w-[40%] max-lg:p-10 max-md:p-4 max-sm:p-2 py-10 pr-10 z-10 relative bg-black/10 flex flex-col justify-between ">
                <div className="flex gap-4 flex-col">
                  <h3 className="text-[#5b5751] text-4xl font-bold">
                    IndustrialAI Landing
                  </h3>
                  <div className="text-sm flex gap-2 font-medium flex-wrap">
                    <div className="border-[#8f8b80]  bg-[#837e73] text-[#f7f7f5] border-2  py-1 px-3 rounded-full">
                      NextJS
                    </div>
                    <div className="border-[#8f8b80]  bg-[#837e73] text-[#f7f7f5] border-2  py-1 px-3 rounded-full ">
                      Tailwind
                    </div>
                  </div>
                  <p className="text-lg tracking-[-4%] font-semibold leading-8 text-balance text-[#5b5751] py-2">
                    I built the IndustrialAI landing page for a client. I
                    ensured it was completely responsive and pixel-perfect,
                    delivering a professional and visually appealing online
                    presence that met all the client&apos;s specifications.
                  </p>
                </div>
                <div className="flex gap-4 lg:text-2xl md:text-xl sm:text-lg text-base  mt-2 ">
                  <Buttons
                    github="https://github.com/RamitVishwakarma/IndustrialAI-Landing"
                    live="https://industrialai.ramitvishwakarma.in/"
                    color="#f7f7f5"
                    classname="bg-[#837e73] hover:bg-[#8f8b80] text-[#f7f7f5]"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* P4 */}
          <div className="rounded-xl w-full relative flex overflow-hidden z-10">
            <Image
              src="https://res.cloudinary.com/dhkxbgwmt/image/upload/v1722455125/Portfolio/Projects/Backgrounds/bg-green_ouc293.png"
              width={1920}
              height={1080}
              className="absolute top-0 left-0 w-full h-full object-cover z-10"
              alt="bg"
            />
            <div className="z-10 lg:flex max-lg:flex-col ">
              <div className="lg:w-[60%] p-10 max-md:p-4 max-sm:p-2 bg-[#438e96]/10 z-10">
                <Image
                  src="https://res.cloudinary.com/dhkxbgwmt/image/upload/v1722428142/Portfolio/Projects/Echo-Talk-Showcase_qo0o1t.png"
                  width={640}
                  height={360}
                  alt="echo-talk"
                  className="rounded-lg max-lg:w-full"
                />
              </div>
              <div className="lg:w-[40%] max-lg:p-10 max-md:p-4 max-sm:p-2 py-10 pr-10 z-10 relative bg-[#438e96]/10 flex flex-col justify-between ">
                <div className="flex gap-4 flex-col">
                  <h4 className="text-[#b9e7e8] text-4xl font-bold">
                    Echo-Talk
                  </h4>
                  <div className="text-sm flex gap-2 font-medium flex-wrap">
                    <div className="border-[#b9e7e8]  bg-[#daf3f3] text-[#284a51] border-2  py-1 px-3 rounded-full ">
                      React
                    </div>
                    <div className="border-[#b9e7e8] bg-[#daf3f3] text-[#284a51] border-2  py-1 px-3 rounded-full ">
                      Tailwind
                    </div>
                    <div className="border-[#b9e7e8] bg-[#daf3f3] text-[#284a51] border-2  py-1 px-3 rounded-full ">
                      Node
                    </div>
                    <div className="border-[#b9e7e8] bg-[#daf3f3] text-[#284a51] border-2  py-1 px-3 rounded-full ">
                      Express
                    </div>
                    <div className="border-[#b9e7e8] bg-[#daf3f3] text-[#284a51] border-2 py-1 px-3 rounded-full ">
                      AWS Polly
                    </div>
                  </div>
                  <p className="text-lg tracking-[-4%] font-semibold leading-8 text-balance text-[#b9e7e8] py-2">
                    Echo-talk is a dictation platform that leverages Amazon
                    Polly. This tool assists users in writing assignments on
                    paper, making the task more manageable and efficient by
                    converting speech to text seamlessly.
                  </p>
                </div>
                <div className="flex gap-4 lg:text-2xl md:text-xl sm:text-lg text-base  mt-2 ">
                  <Buttons
                    github="https://github.com/RamitVishwakarma/EchoTalk"
                    live="https://echotalk.ramitvishwakarma.in/"
                    color="#284a51"
                    classname="bg-[#b9e7e8] hover:bg-[#daf3f3] text-[#284a51]"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* p4 end */}
        </div>
      </div>
    </>
  );
};

export default ProjectContainer;
