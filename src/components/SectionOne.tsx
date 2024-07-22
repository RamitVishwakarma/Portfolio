import Image from "next/image";
import Ramit from "../../public/images/Ramit.jpg";
import InfiniteCarousel from "./InfiniteCarousel/InfiniteCarousel";
import { logos } from "./InfiniteCarousel/data";

const SectionOne = () => {
  return (
    <>
      <div className="text-white py-40 flex items-center justify-between">
        <div className="w-[60%]">
          <div>OPEN TO WORK | Full STack Web Developer</div>
          <div>Ramit Vishwakarma</div>
          <div>Developer at Lorem Ipsum</div>
          <p>
            Hello its Ramit Vishwakarma based in Noida with 1 year of experience
            of work ex. I aim to Lorem ipsum dolor, sit amet consectetur
            adipisicing elit. Ea tenetur temporibus omnis sapiente numquam
            beatae, minima, earum fuga cupiditate cumque, magnam ducimus
            voluptatibus! Culpa soluta dolores earum consectetur natus rem.
            <br />I love creating...
          </p>
          <div>I worked with...</div>
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
