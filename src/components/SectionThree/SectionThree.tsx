import React from "react";
import TestimonialContainer from "./TestimonialContainer";

const SectionThree = () => {
  return (
    <>
      <div className="text-white text-6xl text-left py-10">
        Kind words from Kind souls
      </div>
      {/* whole wrapper */}
      <div className="flex  gap-8 overflow-x-hidden ">
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
