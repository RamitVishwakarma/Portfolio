import React from "react";
import Container from "./Container";
import { data } from "./data";
import Build from "../Swarm/Build";

const TechStack = () => {
  return (
    <>
      <div className="py-20">
        <Build as="h2" kind="text" className="text-6xl text-white pb-10 font-Anton text-center">
          Tech Stack I Use Daily
        </Build>
        <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-8 justify-center p-2 ">
          <Container data={data} />
        </div>
      </div>
    </>
  );
};

export default TechStack;
