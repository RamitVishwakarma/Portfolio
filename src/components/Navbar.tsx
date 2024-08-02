"use client";

import React from "react";

const Navbar = () => {
  const scrollToProjects = () => {
    const projectsSection = document.querySelector(".PROJECTSECTION");
    projectsSection?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToAbout = () => {
    const aboutSection = document.querySelector(".ABOUTSECTION");
    aboutSection?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <div className="max-w-[90rem] lg:px-[7.5rem] md:px-20 px-10 mx-auto sticky top-0 z-20 backdrop-blur-xl m-auto bg-black/60">
      <div className="w-full py-4 text-white text-md content-center flex items-center justify-between">
        <div className=" w-fit cursor-pointer leading-5 hover:text-green font-ProductSans font-bold">
          <div className="font-ProductSans text-xl">RV</div>
        </div>
        <ul className="flex gap-6 font-medium">
          <li
            onClick={scrollToProjects}
            className="hover:text-green cursor-pointer">
            Projects
          </li>
          <li
            onClick={scrollToAbout}
            className="hover:text-green cursor-pointer">
            About
          </li>
          <li className="hover:text-green cursor-pointer">Resume</li>
        </ul>
      </div>
    </div>
  );
};

export default Navbar;
