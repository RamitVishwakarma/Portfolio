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
    image:
      "https://res.cloudinary.com/dhkxbgwmt/image/upload/v1722261669/Portfolio/Socials/LinkedIn_u3wbfd.png",
    link: "https://www.linkedin.com/in/ramitvishwakarma/",
  },
  {
    image:
      "https://res.cloudinary.com/dhkxbgwmt/image/upload/v1722261670/Portfolio/Socials/X_yb1mq4.png",
    link: "https://x.com/RamitWasTaken",
  },
  {
    image:
      "https://res.cloudinary.com/dhkxbgwmt/image/upload/v1722261671/Portfolio/Socials/Instagram_d4xlye.png",
    link: "https://www.instagram.com/rishu_9305/",
  },
  {
    image:
      "https://res.cloudinary.com/dhkxbgwmt/image/upload/v1722261670/Portfolio/Socials/Github_j397te.png",
    link: "https://github.com/RamitVishwakarma",
  },
  {
    image:
      "https://res.cloudinary.com/dhkxbgwmt/image/upload/v1722261669/Portfolio/Socials/Gmail_lfw6is.png",
    link: "https://mail.google.com/mail/u/0/#inbox?compose=CllgCJZXhMRKmDJTJmJxVSnMjSbwLRfcspRRJDpDdVkVDlhDKvXbkhNXBSmvTpPxPRQvzRkqxxq",
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
