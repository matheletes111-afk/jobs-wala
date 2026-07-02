"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface HomeSliderProps {
  children?: React.ReactNode;
}

const SLIDE_IMAGES = [
  "/images/slider1.png",
  "/images/slider2.jpeg",
  "/images/slider3.jpeg",
];

export default function HomeSlider({ children }: HomeSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % SLIDE_IMAGES.length);
    }, 4500); // Change image every 4.5 seconds

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full overflow-hidden min-h-[500px] sm:min-h-[550px] md:min-h-[600px] lg:min-h-[650px] xl:min-h-[700px] flex items-stretch">
      {/* Slider Images Background */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        {SLIDE_IMAGES.map((src, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={src}
                alt={`Slide ${index + 1}`}
                fill
                priority={index === 0}
                className="object-cover object-center transition-transform duration-10000 ease-out scale-105"
                sizes="100vw"
                unoptimized
              />
            </div>
          );
        })}
        {/* Soft overlay gradient to ensure text readability on the left, leaving the right side of the images completely clear */}
        <div className="absolute left-0 top-0 bottom-0 w-full md:w-[60%] bg-gradient-to-r from-white/50 via-white/15 to-transparent z-10" />
      </div>

      {/* Slide Navigation Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {SLIDE_IMAGES.map((_, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                isActive ? "w-6 bg-blue-600" : "w-2 bg-slate-300 hover:bg-slate-400"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          );
        })}
      </div>

      {/* Content overlayed above the slider */}
      <div className="relative z-20 w-full flex items-center">
        {children}
      </div>
    </div>
  );
}
