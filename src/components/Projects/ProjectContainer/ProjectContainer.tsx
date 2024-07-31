import Image from "next/image";
import React from "react";

const ProjectContainer = () => {
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
            <div className="w-[60%] p-10 bg-[#ea546c]/20  z-10">
              <video src="https://res.cloudinary.com/dhkxbgwmt/video/upload/v1722428111/Portfolio/Projects/Recruitment-Platform-Compressed_qmtqw4.mp4"></video>
            </div>
            <div className="w-[40%] py-10 pr-10 z-10 relative bg-[#ea546c]/20 flex flex-col justify-between ">
              <div className="flex gap-4 flex-col">
                <div className="text-white text-4xl font-bold">
                  Recruitment-Platform
                </div>
                <div className="text-sm flex gap-2">
                  <div className="border-white/70 border text-white/80  py-0.5 px-3 rounded-full ">
                    React
                  </div>
                  <div className="border-white/70 border text-white/80 -blue py-0.5 px-3 rounded-full ">
                    Tailwind
                  </div>
                  <div className="border-white/70 border text-white/80  py-0.5 px-3 rounded-full ">
                    Node
                  </div>
                  <div className="border-white/70 border text-white/80  py-0.5 px-3 rounded-full ">
                    Express
                  </div>
                </div>
                <div className="text-base leading-8 tracking-wide text-balance text-white/70 py-2">
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Facere eum voluptas consequuntur incidunt dignissimos, omnis
                  repellendus iure exercitationem illum sequi tenetur quidem
                  quibusdam magnam deleniti eos. Eaque inventore dicta debitis!
                </div>
              </div>
              <div className="flex gap-4 text-2xl mt-2 ">
                <button className="bg-blue/30 px-6 py-1.5 rounded-md">
                  Github
                </button>
                <button className="bg-blue/40 px-6 py-1.5 rounded-md">
                  Live Link
                </button>
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
            <div className="w-[60%] p-10 bg-black/30  z-10">
              <Image
                src="https://res.cloudinary.com/dhkxbgwmt/image/upload/v1722428146/Portfolio/Projects/Course21_showcase_ihawc3.png"
                width={640}
                height={360}
                alt="course-21"
                className="rounded-lg"
              />
            </div>

            <div className="w-[40%] py-10 pr-10 z-10 relative bg-black/30 flex flex-col justify-between ">
              <div className="flex gap-4 flex-col">
                <div className="text-white text-4xl font-bold">Course-21</div>
                <div className="text-sm flex gap-2 font-medium">
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
                <div className="text-lg tracking-[-4%] font-semibold leading-8  text-balance text-white/70 py-2">
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Facere eum voluptas consequuntur incidunt dignissimos, omnis
                  repellendus iure exercitationem illum sequi tenetur quidem
                  quibusdam magnam deleniti eos. Eaque inventore dicta debitis!
                </div>
              </div>
              <div className="flex gap-4 text-2xl mt-2 ">
                <button className="bg-blue/30 px-6 py-1.5 rounded-md">
                  Github
                </button>
                <button className="bg-blue/40 px-6 py-1.5 rounded-md">
                  Live Link
                </button>
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
            <div className="w-[60%] p-10 bg-black/10  z-10">
              <Image
                src="https://res.cloudinary.com/dhkxbgwmt/image/upload/v1722428137/Portfolio/Projects/IndustrialAI_showcase_g0d4fw.png"
                width={640}
                height={360}
                alt="echo-talk"
                className="rounded-lg"
              />
            </div>

            <div className="w-[40%] py-10 pr-10 z-10 relative bg-black/10 flex flex-col justify-between ">
              <div className="flex gap-4 flex-col">
                <div className="text-[#5b5751] text-4xl font-bold">
                  IndustrialAI Landing
                </div>
                <div className="text-sm flex gap-2">
                  <div className="border-[#8f8b80] font-medium bg-[#837e73] text-[#f7f7f5] border-2  py-1 px-3 rounded-full">
                    NextJS
                  </div>
                  <div className="border-[#8f8b80] font-medium bg-[#837e73] text-[#f7f7f5] border-2  py-1 px-3 rounded-full ">
                    Tailwind
                  </div>
                </div>
                <div className="text-lg tracking-[-4%] font-semibold leading-8 text-balance text-[#5b5751] py-2">
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Facere eum voluptas consequuntur incidunt dignissimos, omnis
                  repellendus iure exercitationem illum sequi tenetur quidem
                  quibusdam magnam deleniti eos. Eaque inventore dicta debitis!
                </div>
              </div>
              <div className="flex gap-4 text-2xl mt-2 ">
                <button className="bg-blue/30 px-6 py-1.5 rounded-md">
                  Github
                </button>
                <button className="bg-blue/40 px-6 py-1.5 rounded-md">
                  Live Link
                </button>
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
            <div className="w-[60%] p-10 bg-[#438e96]/10 z-10">
              <Image
                src="https://res.cloudinary.com/dhkxbgwmt/image/upload/v1722428142/Portfolio/Projects/Echo-Talk-Showcase_qo0o1t.png"
                width={640}
                height={360}
                alt="echo-talk"
                className="rounded-lg"
              />
            </div>
            <div className="w-[40%] py-10 pr-10 z-10 relative bg-[#438e96]/10 flex flex-col justify-between ">
              <div className="flex gap-4 flex-col">
                <div className="text-white text-4xl font-bold">Echo-Talk</div>
                <div className="text-sm flex gap-2">
                  <div className="border-white/70 bg-[#ebebe9] text-[] border-2  py-1 px-3 rounded-full ">
                    React
                  </div>
                  <div className="border-white/70 bg-[#ebebe9] text-[] border-2  py-1 px-3 rounded-full ">
                    Tailwind
                  </div>
                  <div className="border-white/70 bg-[#ebebe9] text-[] border-2  py-1 px-3 rounded-full ">
                    Node
                  </div>
                  <div className="border-white/70 bg-[#ebebe9] text-[] border-2  py-1 px-3 rounded-full ">
                    Express
                  </div>
                  <div className="border-white/70 bg-[#ebebe9] text-[] border  py-1 px-3 rounded-full ">
                    AWS Polly
                  </div>
                </div>
                <div className="text-base leading-8 tracking-wide text-balance text-white/70 py-2">
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Facere eum voluptas consequuntur incidunt dignissimos, omnis
                  repellendus iure exercitationem illum sequi tenetur quidem
                  quibusdam magnam deleniti eos. Eaque inventore dicta debitis!
                </div>
              </div>
              <div className="flex gap-4 text-2xl mt-2 ">
                <button className="bg-blue/30 px-6 py-1.5 rounded-md">
                  Github
                </button>
                <button className="bg-blue/40 px-6 py-1.5 rounded-md">
                  Live Link
                </button>
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
