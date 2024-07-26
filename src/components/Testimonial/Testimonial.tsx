import React from "react";
import TestimonialContainer from "./TestimonialContainer";
import { testimonialData } from "./data";

const Testimonials = () => {
  return (
    <>
      <div className="py-20">
        <div className="text-white pb-10 text-6xl font-Anton text-center">
          Kind Words From Kind Souls
        </div>
        {/* whole wrapper */}
        <div className="flex gap-12 overflow-hidden relative py-10">
          <div className="absolute right-0 top-0 w-[12%] h-[32rem] z-[2] gradient-right"></div>
          <div className="absolute left-0 top-0 w-[12%] h-[32rem ] z-[2] gradient-left"></div>
          <TestimonialContainer data={testimonialData} />
        </div>
      </div>
    </>
  );
};

export default Testimonials;
