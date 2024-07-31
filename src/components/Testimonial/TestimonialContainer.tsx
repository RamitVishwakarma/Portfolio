import React from "react";
import { testimonialDataInterface } from "./data";
import Image from "next/image";

const TestimonialContainer = ({ data }: { data: testimonialDataInterface }) => {
  return (
    <>
      <div
        className={` relative border-4 ${data.bordercolor} p-2 rounded-2xl z-10 ${data.hoverbordercolor} hover:scale-110 hover:rotate-3 hover:cursor-pointer transition-transform duration-200 ease-in-out ${data.shadowcolor} shadow-lg`}>
        <div className="relative bg-black min-w-[22rem] h-80 text-white p-4 text-balance rounded-xl overflow-hidden ">
          {/* Background circles */}
          <div
            className={`absolute -top-[50%] w-full h-full ${data.circlecolor1} rounded-full z-0 blur-3xl`}></div>
          <div
            className={`absolute -bottom-[60%] -left-12 w-full h-full ${data.circlecolor2}  rounded-full z-0 blur-3xl`}></div>
          {/* Text content */}
          <div className="relative z-10 flex flex-col gap-4">
            <div className={`text-2xl font-bold ${data.textcolor}`}>
              {data.title}
            </div>
            <div className="absolute right-0 top-8 ">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24">
                <path
                  fill={data.color}
                  d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z"
                />
              </svg>
            </div>
            <div
              className={`h-[4px] w-[88%] bg-gradient-to-r ${data.gradientcolor1} ${data.gradientcolor2} ${data.gradientcolor3} rounded-full`}></div>
            <div className={`${data.textcolor100} font-medium`}>
              {data.content}
            </div>
          </div>
        </div>
        <div className="flex p-4 gap-4 items-center">
          <Image
            src={data.image}
            alt="testimonial"
            width={64}
            height={64}
            className={`object-cover w-16 h-16 rounded-full`}
          />

          <div className="flex flex-col">
            <div className={`text-xl ${data.textcolorname} font-bold`}>
              {data.name}
            </div>
            <div
              className={`text-sm text-balance font-semibold ${data.textcolordesig}`}>
              {data.designation}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TestimonialContainer;
