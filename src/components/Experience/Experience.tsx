import Image from "next/image";
import React from "react";
import { experience } from "./data";

const Experience = () => {
  return (
    <>
      <div className="py-20 EXPERIENCESECTION">
        <h2 className="text-white text-6xl text-center pb-10 font-Anton">
          Experience
        </h2>
        <ol className="flex flex-col gap-6 max-w-4xl mx-auto">
          {experience.map((item) => (
            <li
              key={item.company}
              className="rounded-xl border border-grey-900 p-6 max-sm:p-4 hover:border-green transition duration-200">
              <div className="flex gap-x-5 gap-y-3 items-center max-five:flex-col max-five:items-start">
                {item.logo && (
                  <Image
                    src={item.logo}
                    alt={`${item.company} logo`}
                    width={160}
                    height={56}
                    className={`w-32 h-12 object-contain rounded-lg shrink-0 px-2 ${
                      item.logoOnLight ? "bg-white" : "bg-white/5"
                    }`}
                  />
                )}
                <div className="flex-1 w-full">
                  <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                    <h3 className="text-white text-2xl font-ProductSans font-bold">
                      {item.role}
                    </h3>
                    <span className="text-grey-300 text-sm pt-1">
                      {item.dates}
                    </span>
                  </div>
                  <p className="text-green/80 font-medium">
                    {item.company}
                    <span className="text-grey-300 font-normal">
                      {" "}
                      · {item.place}
                    </span>
                  </p>
                </div>
              </div>
              {item.summary && (
                <p className="text-grey-200 leading-7 pt-4">{item.summary}</p>
              )}
              <ul className="list-disc pl-6 pt-2 text-grey-200 leading-7 space-y-1">
                {item.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              {item.earlier?.map((earlier) => (
                <div
                  key={earlier.role}
                  className="mt-5 pt-4 border-t border-grey-900">
                  <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                    <h4 className="text-white text-lg font-ProductSans font-bold">
                      {earlier.role}
                    </h4>
                    <span className="text-grey-300 text-sm pt-0.5">
                      {earlier.dates}
                    </span>
                  </div>
                  {earlier.highlights.length > 0 && (
                    <ul className="list-disc pl-6 pt-2 text-grey-200 leading-7 space-y-1">
                      {earlier.highlights.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </li>
          ))}
        </ol>
      </div>
    </>
  );
};

export default Experience;
