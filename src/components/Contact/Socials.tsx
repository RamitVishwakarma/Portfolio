"use client";
import { useState } from "react";
import Image from "next/image";
import React from "react";
import Link from "next/link";

interface items {
  image: string;
  link: string;
}

const images: items[] = [
  {
    image: "/images/socials/linkedin.png",
    link: "https://www.linkedin.com/in/vishwakarmaramit/",
  },
  {
    image: "/images/socials/x.png",
    link: "https://x.com/RamitWasTaken",
  },
  {
    image: "/images/socials/instagram.png",
    link: "https://www.instagram.com/ramit_vishw/",
  },
  {
    image: "/images/socials/github.png",
    link: "https://github.com/RamitVishwakarma",
  },
  {
    image: "/images/socials/gmail.png",
    link: "mailto:example@example.com",
  },
];

const Socials = () => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  return (
    <>
      <div
        className={`flex justify-center gap-4 w-fit mx-auto p-4 rounded-3xl `}>
        {images.map((item, index) => (
          <Link target="_blank" href={item.link} key={index}>
            <Image
              key={index}
              src={item.image}
              width={64}
              height={64}
              alt="socials"
              className={`h-14 w-14 z-10 object-contain bg-white rounded-xl p-1 transition-transform ease-in-out duration-300 ${
                hoverIndex === index
                  ? "scale-[135%]"
                  : hoverIndex === index - 1 || hoverIndex === index + 1
                  ? "scale-110"
                  : "scale-100"
              } `}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
            />
          </Link>
        ))}
      </div>
    </>
  );
};

export default Socials;
