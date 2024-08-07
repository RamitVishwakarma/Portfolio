import React from "react";
import Container from "./Container";
import { data } from "./data";

const TechStack = () => {
  return (
    <>
      <div className="py-20">
        <h2 className="text-6xl text-white pb-10 font-Anton text-center">
          Tech Stack I Use Daily
        </h2>
        <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-8 justify-center p-2 ">
          <Container data={data} />
        </div>
      </div>
    </>
  );
};

export default TechStack;
