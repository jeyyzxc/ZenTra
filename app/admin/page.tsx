'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/admin/dashboard');
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    alert('Forgot password instructions have been sent to your email.');
  };

  return (
    // Background: Dark with Wedding Image
    <div className="relative w-full h-screen flex items-center justify-center bg-gray-900 overflow-hidden">
      {/* Background Image - Matching Client Portal */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop')` }}
      >
        <div className="absolute inset-0 bg-neutral-900/70"></div>
      </div>
      
      {/* Premium Glass Container (More White) */}
      <div className="relative z-10 bg-gradient-to-br from-white via-white/95 to-[#FDF5CC]/90 backdrop-blur-2xl rounded-3xl w-full max-w-md p-8 sm:p-10 shadow-[0_30px_60px_-15px_rgba(214,181,59,0.25)] border border-white/80 animate-[fadeInUp_0.8s_ease-out]">
        
        {/* Readable Logo & Headers */}
        <div className="flex flex-col items-center mb-12">
          <div className="relative w-[140px] h-[140px] -mb-4 z-10 pointer-events-none">
             <Image
               src="/zion-logo.png"
               alt="Zion Events Place Logo"
               fill
               className="object-contain drop-shadow-md brightness-0 opacity-80"
               priority
             />
          </div>
          <div className="flex flex-col items-center group cursor-default">
            <h1 className="text-[1.35rem] sm:text-2xl font-sahitya font-bold text-[#1a1f18] uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 group-hover:text-[#D6B53B]">
              Zion Events Place
            </h1>
            <h2 className="text-[10px] sm:text-xs font-sans text-gray-500 uppercase tracking-[0.4em] font-semibold mt-1">
              Admin Portal
            </h2>
          </div>
        </div>

        {/* Form */}
        <form className="space-y-6" onSubmit={handleLogin}>
          
          {/* Email Input (Floating Label) */}
          <div className="relative group">
            <input 
              type="email" 
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="peer w-full bg-transparent border-b-2 border-gray-400 px-0 py-2.5 text-[#1a1f18] focus:outline-none focus:border-[#D6B53B] transition-colors placeholder-transparent font-sans text-sm"
              placeholder="Email Address"
              required
            />
            <label 
              htmlFor="email" 
              className="absolute left-0 -top-3.5 text-[11px] text-[#D6B53B] font-sans font-semibold tracking-wide uppercase transition-all duration-300 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-600 peer-placeholder-shown:top-2.5 peer-placeholder-shown:normal-case peer-focus:-top-3.5 peer-focus:text-[11px] peer-focus:text-[#D6B53B] peer-focus:uppercase cursor-text"
            >
              Email Address
            </label>
          </div>

          {/* Password Input (Floating Label & Hover Eye) */}
          <div className="relative group">
            <input 
              type={showPassword ? "text" : "password"} 
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="peer w-full bg-transparent border-b-2 border-gray-400 px-0 py-2.5 text-[#1a1f18] focus:outline-none focus:border-[#D6B53B] transition-colors placeholder-transparent font-sans text-sm pr-10"
              placeholder="Password"
              required
            />
            <label 
              htmlFor="password" 
              className="absolute left-0 -top-3.5 text-[11px] text-[#D6B53B] font-sans font-semibold tracking-wide uppercase transition-all duration-300 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-600 peer-placeholder-shown:top-2.5 peer-placeholder-shown:normal-case peer-focus:-top-3.5 peer-focus:text-[11px] peer-focus:text-[#D6B53B] peer-focus:uppercase cursor-text"
            >
              Password
            </label>

            {/* Hover Eye Icon */}
            <div 
              className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#D6B53B] transition-colors p-2 cursor-pointer"
              onMouseEnter={() => setShowPassword(true)}
              onMouseLeave={() => setShowPassword(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                {showPassword ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                ) : (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </>
                )}
              </svg>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-xs font-sans font-semibold text-gray-500 -mt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer appearance-none w-3.5 h-3.5 border border-gray-300 rounded-sm checked:bg-[#D6B53B] checked:border-[#D6B53B] transition-colors cursor-pointer" 
                />
                <svg className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="group-hover:text-[#1a1f18] transition-colors">Remember Me</span>
            </label>
            <button 
              type="button" 
              onClick={handleForgotPassword}
              className="hover:text-[#D6B53B] transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          {/* Elegant Login Button */}
          <div className="pt-6">
            <button 
              type="submit"
              className="relative w-full py-3.5 rounded-xl overflow-hidden group shadow-[0_10px_20px_rgba(26,31,24,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_25px_rgba(214,181,59,0.25)] active:scale-[0.98] active:translate-y-0"
            >
              {/* Primary Background */}
              <div className="absolute inset-0 bg-[#1a1f18] transition-transform duration-500 ease-in-out group-hover:translate-x-full"></div>
              {/* Secondary Hover Background */}
              <div className="absolute inset-0 bg-[#D6B53B] -translate-x-full transition-transform duration-500 ease-in-out group-hover:translate-x-0"></div>
              {/* Text */}
              <span className="relative z-10 text-white font-sans text-sm tracking-[0.2em] uppercase transition-colors duration-300 font-bold group-hover:text-white">
                Sign In
              </span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
