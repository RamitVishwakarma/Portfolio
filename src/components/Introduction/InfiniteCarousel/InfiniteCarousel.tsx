import React from "react";
import Image from "next/image";

const InfiniteCarousel = ({ logos }: { logos: string[] }) => {
  return (
    <div className="overflow-hidden relative">
      <div className="absolute right-0 top-4 w-2/12 h-20 z-[2] gradient-right"></div>
      <div className="absolute left-0 top-4 w-2/12 h-20 z-[2] gradient-left"></div>
      <div className="infinite-carousel">
        {[...logos, ...logos].map((logo, index) => (
          <div key={index} className="flex-none w-1/5 p-4">
            <Image
              src={logo}
              alt={`Logo ${index}`}
              width={500}
              height={500}
              className="w-full h-20 object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfiniteCarousel;
