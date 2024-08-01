"use client";

import React from "react";
import ImageCarousel from "./ImageCarousel";

const MoreAboutMe = () => {
  const images = [
    "https://res.cloudinary.com/dhkxbgwmt/image/upload/v1722455126/Portfolio/Projects/Backgrounds/BG_creme_sdkzym.png",
    "https://res.cloudinary.com/dhkxbgwmt/image/upload/v1722455126/Portfolio/Projects/Backgrounds/BG_creme_sdkzym.png",
    "https://res.cloudinary.com/dhkxbgwmt/image/upload/v1722455126/Portfolio/Projects/Backgrounds/BG_creme_sdkzym.png",
    "https://res.cloudinary.com/dhkxbgwmt/image/upload/v1722455126/Portfolio/Projects/Backgrounds/BG_creme_sdkzym.png",
  ];

  return (
    <>
      <div className="py-20">
        <div className="text-6xl font-Anton text-white text-center pb-10">
          More About Me
        </div>
        <div className="flex flex-col gap-20 pt-20">
          <div className="flex gap-10 items-center">
            <div className="flex flex-col gap-4 min-w-[50%]">
              <h2 className="text-5xl font-light tracking-wide text-white py-4">
                The Techie Inside Me
              </h2>
              <p className="text-lg font-light text- text-white/80 leading-9 tracking-wider">
                I thrive on solving impactful problems, diving into open-source
                projects, and contributing to codebases. Competitive programming
                excites me; with 2 stars on CodeChef, I aim for 5 by my senior
                year. Recently, I've been exploring Web 3.0 and blockchain,
                drawn by their complexities. Hackathons fuel my passion for
                quick, impactful solutions.
                <p className="py-2"></p> As a full-stack developer focused on
                the front end, I love creating scalable, web-deployed products.
                Seeing my code in action and generating real-world value is
                incredibly fulfilling. I'm always seeking opportunities to work
                on projects that matter. <p className="py-2"></p> If you're
                looking for someone passionate and dedicated, let's build
                something amazing together.
              </p>
            </div>
            <ImageCarousel images={images} />
          </div>
          <div className="flex gap-10 items-center">
            <div className="flex flex-col gap-4 min-w-[50%]">
              <h2 className="text-5xl font-light tracking-wide text-white py-4">
                Casual Me
              </h2>
              <p className="text-lg font-thin text-balance text-white/75 leading-9 tracking-wider pr-4 ">
                Well I only have two parts of me and both of them want to be
                competitive In my free time, I love to play FPS games to
                challenge my reaction time and the strategic part of my brain
                Growing up I loved playing football and I still do, I love the
                the feeling of scoring a goal and the feeling of winning a match
                When I feel lethargic I watch web series, and movies and listen
                to audiobooks. I have a deep interest in finances and like to
                read about how the world of finance works. At last, I try to
                touch some grass too once a week to keep myself from being a
                complete nerd
              </p>
            </div>
            <ImageCarousel images={images} />
          </div>
        </div>
      </div>
    </>
  );
};

export default MoreAboutMe;
