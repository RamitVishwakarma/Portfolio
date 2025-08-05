"use client";

import React from "react";
import ImageCarousel from "./ImageCarousel";

const MoreAboutMe = () => {
  const images = [
    "/images/moreAboutMe/coding.png",
    "/images/moreAboutMe/codechef.png",
    "/images/moreAboutMe/github.png",
    "/images/moreAboutMe/haccacino.jpg",
    "/images/moreAboutMe/codecubicle.jpg",
  ];

  const casualImages = [
    "/images/moreAboutMe/cooking.jpeg",
    "/images/moreAboutMe/pune.jpeg",
    "/images/moreAboutMe/ascrank.webp",
  ];

  return (
    <>
      <div className="py-20 ABOUTSECTION">
        <h2 className="text-6xl font-Anton text-white text-center pb-4 ">
          More About Me
        </h2>
        <div className="flex flex-col gap-20 pt-20">
          <div className=" gap-10 items-center lg:flex max-md:flex-col">
            <div className="flex flex-col gap-4 min-w-[50%]">
              <h3 className="text-5xl max-md:text-4xl font-light tracking-wide text-white py-4 font-Anton">
                The Techie Inside Me
              </h3>
              <p className="text-lg font-light text-white/80 leading-9 tracking-wider">
                I thrive on solving impactful problems, diving into open-source
                projects, and contributing to codebases. Competitive programming
                excites me; with 2 stars on CodeChef. Recently, I&apos;ve been
                exploring Web 3.0 and blockchain, drawn by their complexities.
                Hackathons fuel my passion for quick, impactful solutions.
                <span className="flex py-2"></span> As a full-stack developer
                focused on the front end, I love creating scalable, web-deployed
                products. Seeing my code in action and generating real-world
                value is incredibly fulfilling. I&apos;m always seeking
                opportunities to work on projects that matter.{" "}
                <span className="flex py-2"></span> If you&apos;re looking for
                someone passionate and dedicated, let&apos;s build something
                amazing together.
              </p>
            </div>
            <ImageCarousel images={images} />
          </div>
          <div className="gap-10 items-center  lg:flex max-md:flex-col">
            <div className="flex flex-col gap-4 min-w-[50%]">
              <h3 className="text-5xl max-md:text-4xl font-light tracking-wide font-Anton text-white py-4">
                Casual Me
              </h3>
              <p className="text-lg font-thin text-balance text-white/75 leading-9 tracking-wider pr-4 ">
                In my free time, I love playing competitive FPS games to
                challenge my reaction time and strategic thinking. Growing up, I
                enjoyed playing football and loved scoring goals and winning
                matches.<span className="flex py-2"></span> Feeling lethargic, I
                unwind by watching web series, cooking, or listening to
                audiobooks. I have a deep interest in finance and enjoy reading
                about how the financial world works.
                <span className="flex py-2"></span> To keep a balance, I make
                sure to get outside and &quot;touch some grass&quot; once a
                week, preventing myself from becoming a complete nerd.
              </p>
            </div>
            <ImageCarousel images={casualImages} />
          </div>
        </div>
      </div>
    </>
  );
};

export default MoreAboutMe;
