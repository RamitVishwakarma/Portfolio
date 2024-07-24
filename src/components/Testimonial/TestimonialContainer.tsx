import React from "react";

const TestimonialContainer = () => {
  return (
    <div className="infinite-carousel">
      <div className="border-2 border-red relative p-2 rounded-2xl">
        <div className="absolute top-0 left-4 text-white text-9xl">&quot;</div>
        <div className="bg-orange min-w-[22rem] py-20 text-white p-4 text-balance rounded-xl">
          Ramit is an exceptional full-stack developer whom I&apos;ve had the
          pleasure of collaborating with on numerous projects and hackathons.
          His technical prowess, creativity, and dedication consistently shine
          through in every task he undertakes. Ramit&apos;s ability to navigate
          complex challenges with ease and deliver innovative solutions makes
          him a valuable asset to any team.
        </div>
        <div className="flex p-4 gap-4">
          <div className="w-16 h-16 rounded-full text-white bg-green"></div>
          <div className="flex flex-col">
            <div className="text-xl text-white">Ramit Vishwakarma</div>
            <div className="text-sm text-white">SDE1 @ Google</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialContainer;
