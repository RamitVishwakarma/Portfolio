import Image from "next/image";
import React from "react";

const colors = {
  red: "#b31d3f",
  blue: "#6a7fc1",
  brown: "#c4544a",
  green: "#0fa968",
};
const ProjectContainer = () => {
  return (
    <>
      <div>
        <div className="flex flex-col gap-10 items-center w-full">
          {/* P1 */}
          <div className="bg-/30 backdrop-blur-3xl rounded-xl w-full  relative flex overflow-hidden z-10 border border-grey-900">
            <div className="w-[40rem] h-[40rem] bg-green/50 rounded-full absolute -bottom-[27rem] -right-[10rem] z-1 blur-3xl "></div>
            <div className="w-[40rem] h-[40rem] bg-purple/50 rounded-full absolute -top-[10rem] -left-40 z-1  blur-3xl "></div>
            {/* <div className="w-[34rem] h-[34rem] bg-blue rounded-full absolute  -top-[24rem] -right-10 z-1  blur-3xl "></div> */}
            {/* <div className="w-[26rem] h-[26rem] bg-red rounded-full absolute -bottom-60 left-[15rem] z-1  blur-3xl "></div> */}

            <div className="w-[60%] p-10 bg-black/30  z-10">
              <video src="https://res.cloudinary.com/dhkxbgwmt/video/upload/v1722428111/Portfolio/Projects/Recruitment-Platform-Compressed_qmtqw4.mp4"></video>
            </div>

            <div className="w-[40%] py-10 pr-10 z-10 relative bg-black/30 flex flex-col justify-between ">
              <div className="flex gap-4 flex-col">
                <div className="text-white text-4xl font-bold">
                  Recruitment-Platform
                </div>
                <div className="text-sm flex gap-2">
                  <div className="border-white/70 border text-blue py-0.5 px-3 rounded-full ">
                    React
                  </div>
                  <div className="border-white/70 border text-light-blue py-0.5 px-3 rounded-full ">
                    Tailwind
                  </div>
                  <div className="border-white/70 border text-green py-0.5 px-3 rounded-full ">
                    Node
                  </div>
                  <div className="border-white/70 border text-yellow py-0.5 px-3 rounded-full ">
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
            <div className="w-[40rem] h-[40rem] bg-red rounded-full absolute -top-[10rem] -left-40 z-1 blur-3xl "></div>
            <div className="w-[40rem] h-[40rem] bg-green rounded-full absolute  -bottom-[27rem] -right-[10rem] z-1  blur-3xl "></div>
            <div className="w-[34rem] h-[34rem] bg-blue rounded-full absolute -top-[24rem] -right-10 z-1  blur-3xl "></div>
            <div className="w-[26rem] h-[26rem] bg-purple rounded-full absolute -bottom-60 left-[15rem] z-1  blur-3xl "></div>

            <div className="w-[60%] p-10 bg-white/30  z-10">
              <video src="https://res.cloudinary.com/dhkxbgwmt/video/upload/v1722428111/Portfolio/Projects/Recruitment-Platform-Compressed_qmtqw4.mp4"></video>
            </div>

            <div className="w-[40%] py-10 pr-10 z-10 relative bg-white/30 flex flex-col justify-between ">
              <div className="flex gap-4 flex-col">
                <div className="text-white text-4xl font-bold">Course-21</div>
                <div className="text-sm flex gap-2">
                  <div className="border-white/70 border text-blue py-0.5 px-3 rounded-full ">
                    React
                  </div>
                  <div className="border-white/70 border text-light-blue py-0.5 px-3 rounded-full ">
                    Tailwind
                  </div>
                  <div className="border-white/70 border text-green py-0.5 px-3 rounded-full ">
                    Typescript
                  </div>
                  <div className="border-white/70 border text-yellow py-0.5 px-3 rounded-full ">
                    Dnd-kit
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
          {/* P3 */}
          <div className="bg-purple/30 backdrop-blur-3xl rounded-xl w-full relative flex overflow-hidden z-10">
            <div className="w-[40rem] h-[40rem] bg-red rounded-full absolute -bottom-[27rem] -right-[10rem] z-1 blur-3xl "></div>
            <div className="w-[40rem] h-[40rem] bg-green rounded-full absolute -top-[10rem] -left-40   z-1  blur-3xl "></div>
            <div className="w-[34rem] h-[34rem] bg-blue rounded-full absolute  -top-[24rem] -right-10 z-1  blur-3xl "></div>
            <div className="w-[26rem] h-[26rem] bg-purple rounded-full absolute -bottom-60 left-[15rem] z-1  blur-3xl "></div>

            <div className="w-[60%] p-10 bg-white/30  z-10">
              <Image
                src="https://res.cloudinary.com/dhkxbgwmt/image/upload/v1722428137/Portfolio/Projects/IndustrialAI_showcase_g0d4fw.png"
                width={640}
                height={360}
                alt="echo-talk"
                className="rounded-lg"
              />
              {/* <video src="https://res.cloudinary.com/dhkxbgwmt/video/upload/v1722428111/Portfolio/Projects/Recruitment-Platform-Compressed_qmtqw4.mp4"></video> */}
            </div>

            <div className="w-[40%] py-10 pr-10 z-10 relative bg-white/30 flex flex-col justify-between ">
              <div className="flex gap-4 flex-col">
                <div className="text-white text-4xl font-bold">
                  IndustrialAI Landing
                </div>
                <div className="text-sm flex gap-2">
                  <div className="border-white/70 border text-black/60 py-0.5 px-3 rounded-full ">
                    NextJS
                  </div>
                  <div className="border-white/70 border text-light-blue py-0.5 px-3 rounded-full ">
                    Tailwind
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
          {/* P4 */}
          <div className="bg-green/10 backdrop-blur-3xl rounded-xl w-full relative flex overflow-hidden z-10">
            <div className="w-[40rem] h-[40rem] bg-blue rounded-full absolute -top-[10rem] -left-40 z-1 blur-3xl "></div>
            <div className="w-[40rem] h-[40rem] bg-red rounded-full absolute  -bottom-[27rem] -right-[10rem] z-1  blur-3xl "></div>
            <div className="w-[34rem] h-[34rem] bg-purple rounded-full absolute -top-[24rem] -right-10 z-1  blur-3xl "></div>
            <div className="w-[26rem] h-[26rem] bg-green rounded-full absolute -bottom-60 left-[15rem] z-1  blur-3xl "></div>

            <div className="w-[60%] p-10 bg-green/10 z-10">
              <Image
                src="https://res.cloudinary.com/dhkxbgwmt/image/upload/v1722428142/Portfolio/Projects/Echo-Talk-Showcase_qo0o1t.png"
                width={640}
                height={360}
                alt="echo-talk"
                className="rounded-lg"
              />
              {/* <video src="https://res.cloudinary.com/dhkxbgwmt/video/upload/v1722428111/Portfolio/Projects/Recruitment-Platform-Compressed_qmtqw4.mp4"></video> */}
            </div>

            <div className="w-[40%] py-10 pr-10 z-10 relative bg-green/10 flex flex-col justify-between ">
              <div className="flex gap-4 flex-col">
                <div className="text-white text-4xl font-bold">Echo-Talk</div>
                <div className="text-sm flex gap-2">
                  <div className="border-white/70 border text-blue py-0.5 px-3 rounded-full ">
                    React
                  </div>
                  <div className="border-white/70 border text-light-blue py-0.5 px-3 rounded-full ">
                    Tailwind
                  </div>
                  <div className="border-white/70 border text-green py-0.5 px-3 rounded-full ">
                    Node
                  </div>
                  <div className="border-white/70 border text-yellow py-0.5 px-3 rounded-full ">
                    Express
                  </div>
                  <div className="border-white/70 border text-yellow py-0.5 px-3 rounded-full ">
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
