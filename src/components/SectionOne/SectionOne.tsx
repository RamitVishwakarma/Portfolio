import Image from "next/image";
import Ramit from "../../..//public/images/Ramit.jpg";
import InfiniteCarousel from "./InfiniteCarousel/InfiniteCarousel";
import { logos } from "./InfiniteCarousel/data";

const SectionOne = () => {
  return (
    <>
      <div className="text-white py-40 flex items-center justify-between">
        <div className="w-[60%] flex flex-col gap-2">
          <div className="text-sm flex gap-4">
            <span className="text-green/70"> OPEN TO WORK </span>
            <span>|</span>
            <span className="text-purple/70">Full Stack Web Developer</span>
          </div>
          <div className="tracking-wide font-Anton text-5xl py-3w ">
            Ramit Vishwakarma
          </div>
          <div className="text-sm text-white/75">SDE 1 @ Google</div>
          <p className="text-white/75  py-2 text-balance">
            Hello its <span className="text-white font-medium">Ramit</span>{" "}
            based in Noida with 1 year of work ex. I aim to Lorem ipsum dolor,
            sit amet consectetur adipisicing elit. Ea tenetur temporibus omnis
            sapiente numquam beatae, minima, earum fuga cupiditate cumque,
            magnam ducimus voluptatibus! Culpa soluta dolores earum consectetur
            natus rem.
            <br />I love creating...
          </p>
          <div className="text-light-blue/70">I have worked with...</div>
          <div className="w-96">
            <InfiniteCarousel logos={logos as string[]} />
          </div>
        </div>
        <div className="w-[50%]">
          <div className="relative flex justify-center items-center overflow-visible p-6">
            <div className="rainbow-shadow w-full h-full left-1/2 top-1/2 rounded-full blur-3xl absolute opacity-30"></div>
            <Image
              className="z-10 shadow-2xl border-4 border-blue/20 rounded-full w-10/12 "
              src={Ramit}
              alt="ProfilePic"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default SectionOne;
