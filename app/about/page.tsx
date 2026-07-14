import React from 'react';
import Link from 'next/link';
import { Star, Leaf, CalendarCheck, Award, ShieldCheck, Clock } from 'lucide-react';

import PublicSubpageShell from '@/components/client/PublicSubpageShell';
import TestimonialSection from '@/components/client/TestimonialSection';
import ImageSlideshow from '@/components/client/ImageSlideshow';
import FadeIn from '@/components/shared/FadeIn';
import AnimatedNumber from '@/components/shared/AnimatedNumber';
import AnimatedDivider from '@/components/shared/AnimatedDivider';

export default function AboutPage() {
  return (
    <PublicSubpageShell heroKey="about" className="overflow-hidden">

      <div className="w-full relative z-10 bg-transparent pb-6">

        {/* Story Section - Modern Asymmetric Layout */}
        <section className="max-w-7xl mx-auto px-4 md:px-12 py-16 md:py-20 relative">
          <div className="absolute top-0 right-10 w-64 h-64 bg-[#D6B53B]/5 rounded-full blur-3xl -z-10" />

          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <FadeIn direction="right" className="flex-1 w-full relative">
              <div className="relative z-10 p-4 md:p-6 bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-[0_20px_40px_-15px_rgba(214,181,59,0.15)]">
                <img
                  src="/about-story-2.jpg"
                  alt="Zion Indoor Hall Setup"
                  className="w-full h-[400px] md:h-[550px] object-cover rounded-2xl"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 w-2/3 h-64 md:h-80 z-20 hidden md:block">
                <img
                  src="/about-story-1.jpg"
                  alt="Zion Outdoor Stage Setup"
                  className="w-full h-full object-cover rounded-2xl shadow-2xl border-4 border-white"
                />
              </div>
            </FadeIn>

            <FadeIn direction="left" delay={200} className="flex-1 w-full lg:pl-10 mt-12 lg:mt-0">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="h-[1px] w-12 bg-[#D6B53B]"></div>
                <h3 className="font-serif text-sm tracking-[0.2em] text-[#D6B53B] uppercase font-bold">Our Journey</h3>
              </div>
              <h2 className="text-4xl md:text-6xl font-sahitya text-[#1a1f18] mb-8 leading-tight">
                The Zion Events<br/>Place Story
              </h2>
              <p className="font-serif text-lg text-neutral-600 leading-relaxed mb-6">
                Founded on the belief that every celebration deserves an extraordinary backdrop, Zion Events Place was designed to blend breathtaking natural scenery with sophisticated architecture.
              </p>
              <p className="font-serif text-lg text-neutral-600 leading-relaxed mb-10">
                What began as a passion for hosting intimate gatherings has blossomed into San Pedro City&apos;s premier venue, where meticulous attention to detail meets unparalleled elegance to bring your grandest visions to life.
              </p>

              <Link href="/book" className="group relative inline-flex items-center gap-4 px-10 py-4 bg-transparent border border-[#1a1f18] text-[#1a1f18] font-sans text-sm font-bold uppercase tracking-widest overflow-hidden rounded-full transition-all hover:border-[#D6B53B] hover:shadow-[0_0_20px_rgba(214,181,59,0.3)]">
                <div className="absolute inset-0 bg-[#1a1f18] transition-transform duration-500 ease-in-out -translate-x-full group-hover:translate-x-0" />
                <span className="relative z-10 transition-colors duration-500 group-hover:text-white">Start Planning</span>
                <span className="relative z-10 transition-transform duration-500 group-hover:translate-x-1 group-hover:text-white">→</span>
              </Link>
            </FadeIn>
          </div>
        </section>

        {/* Stats Section - Minimalist Elegance */}
        <section className="w-full py-8 md:py-16 relative z-20 border-y border-[#D6B53B]/20 bg-white/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:gap-y-12 md:gap-y-0 md:divide-x divide-[#D6B53B]/30">
              {[
                { end: 12, suffix: "+", label: "Years of Excellence", delay: 0 },
                { end: 100, suffix: "+", label: "Happy Customers", delay: 100 },
                { end: 70, suffix: "+", label: "Events Organized", delay: 200 },
                { end: 98, suffix: "%", label: "Client Satisfaction", delay: 300 }
              ].map((stat, i) => (
                <FadeIn key={i} direction="up" delay={stat.delay} className="w-full">
                  <div className="w-full py-8 md:py-4 flex flex-col items-center justify-center text-center group cursor-default">
                    <span className="text-5xl md:text-6xl font-sahitya text-[#1a1f18] mb-3 transition-all duration-500 group-hover:-translate-y-2 group-hover:text-[#D6B53B] drop-shadow-sm">
                      <AnimatedNumber end={stat.end} suffix={stat.suffix} />
                    </span>
                    <span className="text-xs md:text-sm font-serif font-bold uppercase tracking-[0.2em] text-neutral-500 transition-colors duration-500 group-hover:text-[#1a1f18] leading-relaxed">{stat.label}</span>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Advantages - Grid of Elegant Cards */}
        <section className="max-w-7xl mx-auto px-4 md:px-12 py-16 md:py-20">
          <FadeIn direction="up" className="flex flex-col items-center text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-6 bg-white/60 border border-white px-6 py-2 rounded-full shadow-sm">
              <Star className="w-4 h-4 text-[#D6B53B]" />
              <h3 className="font-serif text-sm tracking-[0.2em] text-[#1a1f18] uppercase font-bold">Our Advantages</h3>
              <Star className="w-4 h-4 text-[#D6B53B]" />
            </div>
            <h2 className="text-4xl md:text-6xl font-sahitya text-[#1a1f18]">Why Choose Zion?</h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Star, title: "Premium Venue", desc: "Meticulously designed interiors featuring elegant finishes and adaptable layouts for any occasion." },
              { icon: Leaf, title: "Sustainable Celebrations", desc: "Partnering with eco-conscious caterers and local suppliers to minimize our environmental footprint." },
              { icon: CalendarCheck, title: "Seamless Planning", desc: "Comprehensive event packages and coordination assistance to ensure a stress-free experience." },
              { icon: Award, title: "Award-Winning Aesthetic", desc: "A stunning architectural backdrop recognized for its unique blend of modern style and comfort." },
              { icon: ShieldCheck, title: "Satisfaction Guarantee", desc: "Our commitment to excellence ensures your event runs smoothly, backed by a dedicated service pledge." },
              { icon: Clock, title: "Expert Coordination 24/7", desc: "Our dedicated team of event specialists is always available to assist with your planning needs." }
            ].map((adv, i) => (
              <FadeIn key={i} delay={i * 100} direction="up">
                <div className="group h-full bg-white/40 backdrop-blur-md border border-white shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(214,181,59,0.2)] rounded-3xl p-8 md:p-10 flex flex-col items-center text-center transition-all duration-500 hover:-translate-y-2">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#FDF5CC] to-white rounded-2xl flex items-center justify-center mb-8 shadow-inner border border-[#D6B53B]/20 group-hover:scale-110 transition-transform duration-500">
                    <adv.icon className="w-8 h-8 text-[#D6B53B]" strokeWidth={1.5} />
                  </div>
                  <h4 className="font-sahitya text-2xl mb-4 text-[#1a1f18]">{adv.title}</h4>
                  <p className="font-serif text-neutral-600 leading-relaxed">{adv.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* Full width image banner with parallax feel */}
        <section className="w-full h-[40vh] min-h-[320px] relative overflow-hidden mt-8 mb-2 md:mb-4">
          <ImageSlideshow />
          <div className="absolute inset-0 bg-neutral-900/40 z-10" />
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <FadeIn direction="up">
              <h2 className="text-white text-4xl md:text-6xl font-segoe drop-shadow-xl text-center px-4">Moments made timeless</h2>
            </FadeIn>
          </div>
        </section>

        {/* Founders Section */}
        <section className="max-w-7xl mx-auto px-4 md:px-12 pt-4 pb-16 md:pt-6 md:pb-20">
          <div className="flex flex-col-reverse md:flex-row gap-12 items-start">
            <FadeIn direction="right" className="flex-1 md:mt-16">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="h-[1px] w-12 bg-[#D6B53B]"></div>
                <h3 className="font-serif text-sm tracking-[0.2em] text-[#D6B53B] uppercase font-bold">Our Founders</h3>
              </div>
              <h2 className="text-4xl md:text-6xl font-sahitya text-[#1a1f18] mb-6 leading-tight">
                Visionaries of Elegance
              </h2>
              <p className="font-serif text-lg text-neutral-600 leading-relaxed mb-6">
                Driven by a shared passion for hospitality and design, our founders established Zion Events Place to redefine the standard for luxury celebrations in San Pedro City.
              </p>
              <p className="font-serif text-lg text-neutral-600 leading-relaxed">
                With decades of combined experience in event management, they have cultivated a dedicated team that shares their unwavering commitment to excellence, ensuring that every occasion hosted at Zion is nothing short of perfection.
              </p>
            </FadeIn>
            <FadeIn direction="left" className="flex-1 w-full md:mt-12">
              <div className="relative p-2 md:p-3 bg-white/60 backdrop-blur-sm border border-white rounded-3xl shadow-xl">
                <img
                  src="/zion/Screenshot 2026-01-31 203841.png"
                  alt="Founders"
                  className="w-full h-[450px] md:h-[600px] object-cover rounded-2xl"
                />
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Testimonials */}
        <section className="w-full bg-transparent py-4">
          <TestimonialSection />
        </section>

        {/* Grand CTA */}
        <section className="max-w-4xl mx-auto px-4 pt-6 pb-12 flex flex-col items-center text-center">
          <FadeIn direction="up" className="flex flex-col items-center">
            <AnimatedDivider delay={300} className="w-32 h-1 bg-[#D6B53B] mb-4" />
            <h2 className="text-5xl md:text-7xl font-sahitya text-[#1a1f18] mb-6 leading-tight">
              Ready to Bring Your<br/>Vision to Life?
            </h2>
            <p className="font-serif text-xl md:text-2xl text-neutral-600 mb-8 max-w-2xl">
              Discover a breathtaking setting where your special moments become lasting, unforgettable memories.
            </p>
            <Link href="/book" className="group relative inline-flex items-center justify-center px-12 py-5 bg-[#1a1f18] text-white font-sans text-sm font-bold uppercase tracking-[0.2em] overflow-hidden rounded-full transition-all shadow-[0_15px_30px_-10px_rgba(26,31,24,0.4)] hover:shadow-[0_20px_40px_-15px_rgba(214,181,59,0.5)]">
              <div className="absolute inset-0 bg-[#D6B53B] transition-transform duration-500 ease-in-out translate-y-full group-hover:translate-y-0" />
              <span className="relative z-10 transition-colors duration-500 group-hover:text-[#1a1f18]">RESERVE YOUR DATE</span>
            </Link>
          </FadeIn>
        </section>

      </div>
    </PublicSubpageShell>
  );
}
