'use client';

import React, { useEffect, useRef, useState } from 'react';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  once?: boolean;
}

export default function FadeIn({ children, delay = 0, className = '', direction = 'up', once = false }: FadeInProps) {
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

  let transformClass = '';
  if (!isVisible) {
    if (direction === 'up') transformClass = 'translate-y-12';
    if (direction === 'down') transformClass = '-translate-y-12';
    if (direction === 'left') transformClass = 'translate-x-12';
    if (direction === 'right') transformClass = '-translate-x-12';
  }

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 transform-none blur-none' : `opacity-0 blur-sm ${transformClass}`
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
