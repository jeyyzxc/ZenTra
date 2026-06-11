import React from 'react';
import { BookFormData } from './BookFlow';

interface Props {
  data: BookFormData;
  nextStep: () => void;
  goToStep: (step: number) => void;
}

const ReviewItem = ({ 
  label, 
  value, 
  step, 
  goToStep, 
  icon 
}: { 
  label: string, 
  value: React.ReactNode, 
  step: number, 
  goToStep: (step: number) => void,
  icon: React.ReactNode
}) => (
  <div className="bg-white/70 backdrop-blur-md rounded-[2rem] p-8 shadow-sm border border-[#D2CB96]/30 relative group flex flex-col items-center transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(151,141,82,0.15)] hover:border-[#D4A017]/50 hover:bg-white overflow-hidden">
    
    {/* Icon Container */}
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#F5F1DA] to-[#EAE5C3] flex items-center justify-center mb-5 text-[#978D52] group-hover:text-[#D4A017] group-hover:scale-110 transition-all duration-500 shadow-sm">
      {icon}
    </div>

    <h4 className="text-[#3A4B3C]/60 font-sans text-xs uppercase tracking-[0.2em] font-bold mb-3 transition-colors group-hover:text-[#D4A017]">{label}</h4>
    
    <div className="text-[#2c3328] font-serif text-2xl text-center leading-snug">
      {value || <span className="italic text-black/20 text-lg">Not specified</span>}
    </div>
    
    {/* Interactive Edit button */}
    <button 
      onClick={() => goToStep(step)}
      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#F5F1DA]/80 flex items-center justify-center text-[#3A4B3C]/60 transition-all duration-300 md:opacity-0 md:-translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-[#D4A017] hover:text-white shadow-sm hover:shadow-md"
      title="Edit this section"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.89 1.125l-2.816.94a.75.75 0 01-.95-.95l.94-2.816a4.5 4.5 0 011.124-1.89l13.416-13.415z" />
      </svg>
    </button>
  </div>
);

// SVGs
const Icons = {
  Event: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>,
  Date: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" /></svg>,
  Theme: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>,
  Guests: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
  Time: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Price: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  AddOns: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>,
  Notes: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.89 1.125l-2.816.94a.75.75 0 01-.95-.95l.94-2.816a4.5 4.5 0 011.124-1.89l8.9-8.9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L22.125 9.75M15 19.125h6" /></svg>
};

export default function Step9Review({ data, nextStep, goToStep }: Props) {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 flex flex-col items-center">
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 w-full mb-16">
        <ReviewItem label="Event Type" value={data.eventType} step={1} goToStep={goToStep} icon={Icons.Event} />
        <ReviewItem label="Date" value={data.date} step={2} goToStep={goToStep} icon={Icons.Date} />
        <ReviewItem label="Theme" value={data.theme} step={3} goToStep={goToStep} icon={Icons.Theme} />
        <ReviewItem label="Guests" value={data.guestCount} step={4} goToStep={goToStep} icon={Icons.Guests} />
        <ReviewItem label="Time" value={data.time} step={5} goToStep={goToStep} icon={Icons.Time} />
        <ReviewItem label="Price Range" value={data.budget} step={6} goToStep={goToStep} icon={Icons.Price} />
        <div className="sm:col-span-2">
          <ReviewItem 
            label="Add-ons" 
            value={data.addOns.length > 0 ? data.addOns.join(', ') : 'None'} 
            step={7} 
            goToStep={goToStep}
            icon={Icons.AddOns}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <ReviewItem 
            label="Special Request" 
            value={data.notes.length > 0 ? data.notes : 'None'} 
            step={8} 
            goToStep={goToStep}
            icon={Icons.Notes}
          />
        </div>
      </div>

      <div className="flex justify-center w-full mt-2">
        <button 
          onClick={nextStep}
          className="relative overflow-hidden group px-12 sm:px-16 py-5 bg-gradient-to-r from-[#1a1f18] to-[#2c3328] hover:from-[#2c3328] hover:to-[#3a4b3c] text-[#ECDD77] font-sans font-medium text-lg sm:text-xl tracking-[0.2em] uppercase rounded-full transition-all duration-500 shadow-[0_10px_30px_rgba(44,51,40,0.3)] hover:shadow-[0_15px_40px_rgba(44,51,40,0.5)] hover:-translate-y-1 flex items-center gap-4"
        >
          <span className="relative z-10">Confirm Booking</span>
          
          {/* Animated Arrow */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={2.5} 
            stroke="currentColor" 
            className="w-6 h-6 relative z-10 transform transition-transform duration-500 group-hover:translate-x-2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>

          {/* Hover Shine Effect */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite] z-0" />
        </button>
      </div>
    </div>
  );
}
