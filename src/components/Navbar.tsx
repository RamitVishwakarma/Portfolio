"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Build from "./Swarm/Build";

const Navbar = () => {
  const router = useRouter();

  const scrollToContact = () => {
    const projectsSection = document.querySelector(".CONTACTSECTION");
    if (!projectsSection) return router.push("/");
    projectsSection.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToAbout = () => {
    const aboutSection = document.querySelector(".ABOUTSECTION");
    if (!aboutSection) return router.push("/");
    aboutSection.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <Build
      kind="block"
      label="drawing <nav>"
      className="max-w-[90rem] lg:px-[7.5rem] md:px-20 px-10 mx-auto sticky top-0 z-20 backdrop-blur-xl m-auto bg-black/60">
      <div className="w-full py-4 text-white text-md content-center flex items-center justify-between">
        <Link
          href="/"
          className=" w-fit cursor-pointer leading-5 hover:text-green font-ProductSans font-bold">
          <Build kind="text" className="font-ProductSans text-xl">
            RV
          </Build>
        </Link>
        <ul className="flex gap-6 font-medium">
          <Build
            as="li"
            kind="text"
            onClick={scrollToContact}
            className="hover:text-green cursor-pointer">
            Contact
          </Build>
          <Build
            as="li"
            kind="text"
            onClick={scrollToAbout}
            className="hover:text-green cursor-pointer">
            About
          </Build>
          <Link href="/blog" className="hover:text-green cursor-pointer">
            <Build as="span" kind="text">
              Blog
            </Build>
          </Link>
          <Build
            as="a"
            kind="text"
            target="_blank"
            href="https://drive.google.com/file/d/1sY-s29YtqxV-ZEI2bRugIjY_wEE4e4HY/view?usp=sharing"
            className="hover:text-green cursor-pointer">
            Resume
          </Build>
        </ul>
      </div>
    </Build>
  );
};

export default Navbar;
