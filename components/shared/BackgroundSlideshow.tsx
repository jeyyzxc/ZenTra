'use client';

import React, { useState, useEffect } from 'react';

const images = [
  '/bg1.jpg',
  '/bg2.jpg',
  '/bg3.jpg'
];

export default function BackgroundSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 6000); // 6 seconds per image

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {images.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1500 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url('${src}')` }}
        />
      ))}
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-neutral-900/65 z-10" />
    </>
  );
}
