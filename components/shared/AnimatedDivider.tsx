'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AnimatedDividerProps {
  className?: string;
  delay?: number;
  once?: boolean;
}

export default function AnimatedDivider({ className = "w-20 h-1 bg-[#D6B53B] mb-4", delay = 200, once = false }: AnimatedDividerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once && domRef.current) observer.unobserve(domRef.current);
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      { rootMargin: '0px 0px -100px 0px', threshold: 0.1 }
    );
    
    if (domRef.current) {
      observer.observe(domRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 ease-out origin-center ${
        isVisible ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`w-full h-full ${isVisible ? 'animate-pulse' : ''} shadow-[0_0_10px_rgba(214,181,59,0.5)]`} />
    </div>
  );
}
