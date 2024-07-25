import React from "react";
import Container from "./Container";
import { data } from "./data";

const TechStack = () => {
  return (
    <>
      <div className="py-10">
        <div className="text-5xl text-white py-10">Tech Stack I use Daily</div>
        <div className=" grid grid-cols-3  gap-8 justify-center p-2 ">
          <Container data={data} />
        </div>
      </div>
    </>
  );
};

export default TechStack;
