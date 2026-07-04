"use client";

import React, { useState, useEffect } from 'react';

const IMAGES = [
  "/zion/610864487_17932258035152473_3062717545982169111_n.jpg",
  "/zion/652799513_17941061205152473_4418633130533869582_n.jpg",
  "/zion/ChatGPT Image Jul 3, 2026, 11_56_13 AM.png"
];

export default function ImageSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % IMAGES.length);
    }, 4000); // Change image every 4 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {IMAGES.map((src, idx) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <img
            src={src}
            alt={`Zion Moments Slide ${idx + 1}`}
            className="w-full h-full object-cover object-center"
          />
        </div>
      ))}

      {/* Navigation Dots */}
      <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center items-center gap-3">
        {IMAGES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
              idx === currentIndex ? 'w-8 bg-[#FDEB9E] shadow-[0_0_8px_rgba(253,235,158,0.5)]' : 'w-3 bg-white/50 hover:bg-white/80 hover:scale-110'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
