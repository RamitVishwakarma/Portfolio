import React from "react";
import Container from "./Container";
import { data } from "./data";

const TechStack = () => {
  return (
    <>
      <div className="py-20">
        <div className="text-6xl text-white pb-10 font-Anton text-center">
          Tech Stack I Use Daily
        </div>
        <div className="grid grid-cols-3 gap-8 justify-center p-2 ">
          <Container data={data} />
        </div>
      </div>
    </>
  );
};

export default TechStack;
