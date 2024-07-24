import React from "react";
import Image from "next/image";

const InfiniteCarousel = ({ logos }: { logos: string[] }) => {
  return (
    <div className="overflow-hidden relative">
      <div className="absolute right-0 top-0 w-2/12 h-40 z-[2] gradient-right"></div>
      <div className="absolute left-0 top-0 w-2/12 h-40 z-[2] gradient-left"></div>
      <div className="infinite-carousel">
        {logos.concat(logos).map((logo, index) => (
          <div key={index} className="flex-none w-1/5 p-4">
            <Image
              src={logo}
              alt={`Logo ${index}`}
              width={190}
              height={64}
              className="w-full h-auto object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfiniteCarousel;
