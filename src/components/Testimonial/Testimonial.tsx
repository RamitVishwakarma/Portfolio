"use client";

import React from "react";
import TestimonialContainer from "./TestimonialContainer";
import { testimonialData } from "./data";
import { animate, motion, useMotionValue } from "framer-motion";
import { useEffect, useState } from "react";
import useMeasure from "react-use-measure";

const Testimonials = () => {
  const FAST_DURATION = 30;
  const SLOW_DURATION = 100;

  const [duration, setDuration] = useState(FAST_DURATION);
  let [ref, { width }] = useMeasure();

  const xTranslation = useMotionValue(0);

  const [mustFinish, setMustFinish] = useState(false);
  const [rerender, setRerender] = useState(false);

  useEffect(() => {
    let controls;
    let finalPosition = -width / 2 - 8;
    if (mustFinish) {
      controls = animate(xTranslation, [xTranslation.get(), finalPosition], {
        ease: "linear",
        duration: duration * (1 - xTranslation.get() / finalPosition),
        onComplete: () => {
          setMustFinish(false);
          setRerender(!rerender);
        },
      });
    } else {
      controls = animate(xTranslation, [0, finalPosition], {
        ease: "linear",
        duration: duration,
        repeat: Infinity,
        repeatType: "loop",
        repeatDelay: 0,
      });
    }

    return controls?.stop;
  }, [rerender, xTranslation, duration, width]);
  return (
    <>
      <div className="py-20">
        <h2 className="text-white pb-10 text-6xl font-Anton text-center">
          Kind Words
        </h2>
        <div className="relative gap-12 flex w-full min-h-[36rem] py-14 overflow-hidden">
          <div
            className="absolute right-0 top-0 w-[12%] h-full z-[2]"
            style={{
              background:
                "linear-gradient(to right, rgba(255, 255, 255, 0), black)",
            }}></div>
          <div
            className="absolute left-0 top-0 w-[12%] h-full z-[2]"
            style={{
              background:
                "linear-gradient(to left, rgba(255, 255, 255, 0), black)",
            }}></div>
          {/* the motion div */}
          <motion.div
            className="absolute left-0 flex gap-12"
            style={{ x: xTranslation }}
            ref={ref}
            onHoverStart={() => {
              setMustFinish(true);
              setDuration(SLOW_DURATION);
            }}
            onHoverEnd={() => {
              setMustFinish(true);
              setDuration(FAST_DURATION);
            }}>
            {testimonialData.concat(testimonialData).map((data, idx) => (
              <TestimonialContainer data={data} key={idx} />
            ))}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Testimonials;
