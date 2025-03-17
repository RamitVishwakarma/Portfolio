"use client";

import React from "react";

const Navbar = () => {
  const scrollToContact = () => {
    const projectsSection = document.querySelector(".CONTACTSECTION");
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
            onClick={scrollToContact}
            className="hover:text-green cursor-pointer">
            Contact
          </li>
          <li
            onClick={scrollToAbout}
            className="hover:text-green cursor-pointer">
            About
          </li>
          <a
            target="_blank"
            href="https://docs.google.com/document/d/1K9fCd5mHKVKd0_kOI8H9YsXCUrvcL4hYSyI4L4BcYqE/edit?usp=sharing"
            className="hover:text-green cursor-pointer">
            Resume
          </a>
        </ul>
      </div>
    </div>
  );
};

export default Navbar;
