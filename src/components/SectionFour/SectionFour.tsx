import Image from "next/image";
import React from "react";

const SectionFour = () => {
  return (
    <>
      <div className="text-5xl text-white py-10">Tech Stack I use Daily</div>
      <div className=" grid grid-cols-3  gap-8 justify-center p-2 ">
        <div className="w-full bg-blue p-2 ">
          <Image
            width={64}
            height={64}
            className="rounded-xl border border-white bg-pink"
            src="/images/Figma.png"
            alt="Tech Stack"
          />
        </div>
        <div className="w-full bg-blue p-2">
          <Image
            width={64}
            height={64}
            className="rounded-xl border border-white bg-pink"
            src="/images/Figma.png"
            alt="Tech Stack"
          />
        </div>
        <div className="w-full bg-blue p-2">
          <Image
            width={64}
            height={64}
            className="rounded-xl border border-white bg-pink"
            src="/images/Figma.png"
            alt="Tech Stack"
          />
        </div>
        <div className="w-full bg-blue p-2">
          <Image
            width={64}
            height={64}
            className="rounded-xl border border-white bg-pink"
            src="/images/Figma.png"
            alt="Tech Stack"
          />
        </div>
        <div className="w-full bg-blue p-2">
          <Image
            width={64}
            height={64}
            className="rounded-xl border border-white bg-pink"
            src="/images/Figma.png"
            alt="Tech Stack"
          />
        </div>
        <div className="w-full bg-blue p-2">
          <Image
            width={64}
            height={64}
            className="rounded-xl border border-white bg-pink"
            src="/images/Figma.png"
            alt="Tech Stack"
          />
        </div>
      </div>
    </>
  );
};

export default SectionFour;
