import React from "react";

const InfiniteCarousel = ({ logos }: { logos: string[] }) => {
  return (
    <div className="overflow-hidden relative">
      <div className="absolute right-0 top-0 w-2/12 h-40 z-[2] gradient-right"></div>
      <div className="absolute left-0 top-0 w-2/12 h-40 z-[2] gradient-left"></div>
      <div className="infinite-carousel">
        {logos.concat(logos).map((logo, index) => (
          <div key={index} className="flex-none w-1/5 p-4">
            <img src={logo} alt={`Logo ${index}`} className="w-full h-auto" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfiniteCarousel;
