"use client";

import React from "react";
import TestimonialContainer from "./TestimonialContainer";
import { testimonialData } from "./data";
import { useEffect, useRef } from "react";
import Build from "../Swarm/Build";

const Testimonials = () => {
  const FAST_DURATION = 30;
  const SLOW_DURATION = 100;

  // The marquee runs as a compositor animation (no per-frame JavaScript),
  // and hovering eases it to the slow speed without jumping.
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<Animation | null>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || typeof el.animate !== "function") return;
    let anim: Animation | null = null;
    const start = () => {
      const rate = anim?.playbackRate ?? 1;
      anim?.cancel();
      const finalPosition = -el.scrollWidth / 2 - 8;
      anim = el.animate(
        [
          { transform: "translateX(0px)" },
          { transform: `translateX(${finalPosition}px)` },
        ],
        { duration: FAST_DURATION * 1000, iterations: Infinity, easing: "linear" }
      );
      anim.playbackRate = rate;
      animRef.current = anim;
    };
    start();
    let first = true;
    const ro = new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      start();
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      anim?.cancel();
    };
  }, []);

  const setSpeed = (duration: number) =>
    animRef.current?.updatePlaybackRate(FAST_DURATION / duration);

  return (
    <>
      <div className="py-20">
        <Build
          as="h2"
          kind="text"
          className="text-white pb-10 text-6xl font-Anton text-center">
          Kind Words
        </Build>
        <Build
          caption="drawing marquee"
          className=" relative gap-12 flex w-full min-h-[36rem] max-md:min-h-[48rem] py-12 overflow-hidden">
          <div
            className="max-sm:invisible absolute right-0 top-0 w-[12%] h-full z-[2]"
            style={{
              background:
                "linear-gradient(to right, rgba(255, 255, 255, 0), black)",
            }}></div>
          <div
            className="max-sm:invisible absolute left-0 top-0 w-[12%] h-full z-[2]"
            style={{
              background:
                "linear-gradient(to left, rgba(255, 255, 255, 0), black)",
            }}></div>
          {/* the marquee track */}
          <div
            className="absolute left-0 flex gap-12"
            ref={trackRef}
            onMouseEnter={() => setSpeed(SLOW_DURATION)}
            onMouseLeave={() => setSpeed(FAST_DURATION)}>
            {testimonialData.concat(testimonialData).map((data, idx) => (
              <TestimonialContainer data={data} key={idx} />
            ))}
          </div>
        </Build>
      </div>
    </>
  );
};

export default Testimonials;
