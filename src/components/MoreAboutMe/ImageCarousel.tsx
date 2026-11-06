import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Build from "../Swarm/Build";

/**
 * Photo carousel. Same motion as before (slide in from the side, the old
 * slide fades and shrinks out, springy dots), done with CSS animations so no
 * animation library ships with the page.
 */
const ImageCarousel = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [direction, setDirection] = useState<string | null>(null);
  const [previous, setPrevious] = useState<number | null>(null);
  // Bumped on every change so a slide re-mounts and replays its animation.
  const [turn, setTurn] = useState(0);
  const currentRef = useRef<HTMLDivElement>(null);
  const [exitFrom, setExitFrom] = useState<CSSProperties>({});

  useEffect(() => {
    if (previous === null) return;
    const id = window.setTimeout(() => setPrevious(null), 500);
    return () => window.clearTimeout(id);
  }, [previous, turn]);

  const go = (index: number, dir: string) => {
    // Clicked mid-slide: the leaving slide fades out from where it is now.
    const el = currentRef.current;
    if (el) {
      const cs = getComputedStyle(el);
      setExitFrom({
        ["--from-transform" as string]: cs.transform === "none" ? "none" : cs.transform,
        ["--from-opacity" as string]: cs.opacity,
      });
    }
    setDirection(dir);
    setPrevious(currentIndex);
    setCurrentIndex(index);
    setTurn((n) => n + 1);
  };

  const handleNext = () =>
    go(currentIndex + 1 === images.length ? 0 : currentIndex + 1, "right");

  const handlePrevious = () =>
    go(currentIndex - 1 < 0 ? images.length - 1 : currentIndex - 1, "left");

  const handleDotClick = (index: number) => {
    if (index === currentIndex) return;
    go(index, index > currentIndex ? "right" : "left");
  };

  const slide = (index: number) => (
    <Image
      src={images[index]}
      alt={`Slide ${index}`}
      width={576}
      height={432}
      className="rounded-lg border-2 object-contain border-[#4c8435]/75"
    />
  );

  return (
    <Build kind="image" className="flex flex-col items-center mt-20">
      <div className="relative w-[36rem] h-[27rem] max-five:w-[25rem] max-five:h-[20rem] max-sm:w-[20rem] max-sm:h-[18rem] overflow-hidden rounded-lg">
        {previous !== null && (
          <div key={`out-${turn}`} className="absolute carousel-exit" style={exitFrom}>
            {slide(previous)}
          </div>
        )}
        <div
          key={`in-${turn}`}
          ref={currentRef}
          className={`absolute ${
            direction === "right" ? "carousel-in-right" : "carousel-in-left"
          }`}>
          {slide(currentIndex)}
        </div>
        <div className="absolute top-[37%] bottom-0 left-0 right-0 flex justify-between px-4">
          <div
            className="carousel-arrow flex h-7 w-7 items-center justify-center rounded-full bg-[#4c8435]/40 text-white cursor-pointer"
            onClick={handlePrevious}>
            <svg
              className="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 320 512">
              <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z" />
            </svg>
          </div>
          <div
            className="carousel-arrow flex h-7 w-7 items-center justify-center rounded-full bg-[#4c8435]/40 text-white cursor-pointer"
            onClick={handleNext}>
            <svg
              className="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 320 512">
              <path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex gap-4 ">
        {images.map((_, index) => (
          <div
            key={index}
            className={`carousel-dot h-4 w-4 rounded-full cursor-pointer -mt-4 ${
              currentIndex === index
                ? "carousel-dot-active bg-[#4c8435]/75"
                : "bg-[#4c8435]/50"
            }`}
            onClick={() => handleDotClick(index)}
          />
        ))}
      </div>
    </Build>
  );
};

export default ImageCarousel;
