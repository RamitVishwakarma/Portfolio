import React from "react";
import TestimonialContainer from "./TestimonialContainer";

const SectionThree = () => {
  return (
    <>
      <div className="text-white text-6xl text-left py-10">
        Kind words from Kind souls
      </div>
      {/* whole wrapper */}
      <div className="flex gap-8 overflow-hidden relative">
        <div className="absolute right-0 top-0 w-2/12 h-[44rem] z-[2] gradient-right"></div>
        <div className="absolute left-0 top-0 w-2/12 h-[44rem] z-[2] gradient-left"></div>
        <TestimonialContainer />
        <TestimonialContainer />
        <TestimonialContainer />
        <TestimonialContainer />
        <TestimonialContainer />
      </div>
    </>
  );
};

export default SectionThree;
