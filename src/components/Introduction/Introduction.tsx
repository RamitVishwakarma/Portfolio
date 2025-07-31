import Image from "next/image";
import Ramit from "../../../public/images/Ramit.jpg";
import InfiniteCarousel from "./InfiniteCarousel/InfiniteCarousel";
import { logos } from "./InfiniteCarousel/data";

const Introduction = () => {
  return (
    <>
      <div className="text-white pt-24 pb-40 m-auto flex items-center justify-between max-md:flex-col">
        <div className="md:w-[60%] flex flex-col gap-2">
          <div className="text-sm flex gap-4 items-center">
            <span className="text-green/70 font-medium tracking-wide py-4">
              {" "}
              OPEN TO WORK{" "}
            </span>
            <span>|</span>
            <span className="text-grey-300/80">Full Stack Web Developer</span>
          </div>
          <h1 className="tracking-wide font-Anton text-5xl py-3">
            Ramit Vishwakarma
          </h1>
          <div className="text-sm text-white/80 pt-3 pb-1">
            Full Stack Web Developer @{" "}
            <span className="text-blue">KonnectYari</span>
          </div>
          <p className="text-white/75  py-2 text-balance leading-8 tracking-wide">
            Hello, I&apos;m Ramit, a Full Stack Web Developer based in
            <span className="text-white font-bold"> Noida, India</span> having a
            year of experience. I like to{" "}
            <span className="text-white font-bold">build scalable</span> and
            interactive web apps focusing on writing clean, efficient and
            <span className="text-white font-bold"> maintainable</span> code. I
            take pride in transforming ideas into reality, always striving for
            excellence and creativity in everything I do. I am passionate about
            learning <span className="text-white font-bold">new</span>{" "}
            technologies and frameworks.
            <span className="pt-4 text-white/75 block">
              <span className="text-white font-bold">TLDR</span> I love to code
              and turn ideas into reality.
            </span>
          </p>
          <div className="text-grey-300/70 ">I have worked with...</div>
          <div className="max-w-96 -mt-4">
            <InfiniteCarousel logos={logos as string[]} />
          </div>
        </div>
        <div className="md:w-[50%] sm:w-[80%] w-full">
          <div className="relative flex justify-center items-center overflow-visible p-6">
            <div className="rainbow-shadow w-full h-full left-1/2 top-1/2 rounded-full blur-3xl absolute opacity-30"></div>
            <Image
              className="z-10 shadow-2xl border-4 border-blue/20 rounded-full md:w-10/12"
              src={Ramit}
              alt="ProfilePic"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Introduction;
