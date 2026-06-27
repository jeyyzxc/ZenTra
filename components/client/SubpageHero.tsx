import React from 'react';

interface SubpageHeroProps {
  title: string;
  subtitle: string;
  imageSrc: string;
}

export default function SubpageHero({ title, subtitle, imageSrc }: SubpageHeroProps) {
  return (
    <section className="relative w-full h-[60vh] min-h-[400px] flex flex-col justify-center items-center text-center px-4 bg-transparent z-0">
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center -z-10"
        style={{ backgroundImage: `url("${imageSrc}")` }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative z-10 pt-12 w-full flex flex-col items-center">
        <h1 className="text-white text-5xl md:text-7xl lg:text-[80px] mb-1 drop-shadow-lg font-segoe leading-tight text-center">
          {title}
        </h1>
        <p className="text-white text-lg md:text-xl lg:text-2xl font-sahitya max-w-3xl mx-auto drop-shadow-md tracking-wide text-center">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
