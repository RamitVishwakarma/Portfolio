import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const ImageCarousel = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [direction, setDirection] = useState<string | null>(null);

  const slideVariants = {
    hiddenRight: {
      x: "100%",
      opacity: 0,
    },
    hiddenLeft: {
      x: "-100%",
      opacity: 0,
    },
    visible: {
      x: "0",
      opacity: 1,
      transition: {
        duration: 1,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.5,
      },
    },
  };
  const slidersVariants = {
    hover: {
      scale: 1.2,
      backgroundColor: "#4c84358e",
    },
  };
  const dotsVariants = {
    initial: {
      y: 0,
    },
    animate: {
      y: -10,
      scale: 1.2,
      transition: { type: "spring", stiffness: 1000, damping: "10" },
    },
    hover: {
      scale: 1.1,
      transition: { duration: 0.2 },
    },
  };

  const handleNext = () => {
    setDirection("right");
    setCurrentIndex((prevIndex) =>
      prevIndex + 1 === images.length ? 0 : prevIndex + 1
    );
  };

  const handlePrevious = () => {
    setDirection("left");

    setCurrentIndex((prevIndex) =>
      prevIndex - 1 < 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const handleDotClick = (index: number) => {
    setDirection(index > currentIndex ? "right" : "left");
    setCurrentIndex(index);
  };

  return (
    <div className="flex flex-col items-center mt-20">
      <div className="relative w-[36rem] h-[27rem] max-five:w-[25rem] max-five:h-[20rem] max-sm:w-[20rem] max-sm:h-[18rem] overflow-hidden rounded-lg">
        <AnimatePresence>
          <motion.div
            key={currentIndex}
            className="absolute "
            initial={direction === "right" ? "hiddenRight" : "hiddenLeft"}
            animate="visible"
            exit="exit"
            variants={slideVariants}>
            <Image
              src={images[currentIndex]}
              alt={`Slide ${currentIndex}`}
              width={576}
              height={432}
              className="rounded-lg border-2 object-contain border-[#4c8435]/75"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute top-[37%] bottom-0 left-0 right-0 flex justify-between px-4">
          <motion.div
            variants={slidersVariants}
            whileHover="hover"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#4c8435]/40 text-white cursor-pointer"
            onClick={handlePrevious}>
            <svg
              className="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 320 512">
              <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z" />
            </svg>
          </motion.div>
          <motion.div
            variants={slidersVariants}
            whileHover="hover"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#4c8435]/40 text-white cursor-pointer"
            onClick={handleNext}>
            <svg
              className="w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 320 512">
              <path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z" />
            </svg>
          </motion.div>
        </div>
      </div>
      <div className="flex gap-4 ">
        {images.map((_, index) => (
          <motion.div
            key={index}
            className={`h-4 w-4 rounded-full cursor-pointer -mt-4 ${
              currentIndex === index ? "bg-[#4c8435]/75" : "bg-[#4c8435]/50"
            }`}
            onClick={() => handleDotClick(index)}
            initial="initial"
            animate={currentIndex === index ? "animate" : ""}
            whileHover="hover"
            variants={dotsVariants}></motion.div>
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;
