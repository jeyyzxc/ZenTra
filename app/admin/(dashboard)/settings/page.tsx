'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  // Notification States
  const [notifications, setNotifications] = useState({
    newBooking: true,
    bookingConfirmations: true,
    bookingCancellations: true,
    customerInquiries: false,
    paymentUpdates: true,
    weeklySummary: true,
    marketingEmails: false,
  });

  // Security States
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    deleteRecords: true,
    cancelBookings: true,
    modifyData: false
  });

  // Preferences
  const [sessionTimeout, setSessionTimeout] = useState('30 Minutes');
  const [language, setLanguage] = useState('English (US)');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [timezone, setTimezone] = useState('(GMT+08:00) Manila, Taipei');

  // UI States
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotification, setSaveNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const handleSaveSettings = () => {
    setIsSaving(true);
    setSaveNotification(null);
    
    setTimeout(() => {
      setIsSaving(false);
      setSaveNotification({ type: 'success', message: 'All settings have been successfully saved.' });
      setTimeout(() => setSaveNotification(null), 5000);
    }, 1000);
  };

  // Ultra-smooth Reusable Toggle Component with Micro-Interactions
  const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <div 
      onClick={onChange}
      className={`w-10 h-5 rounded-full relative cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] border shadow-inner flex-shrink-0 active:scale-90 ${checked ? 'bg-[#D6B53B] border-[#D6B53B]' : 'bg-gray-200 dark:bg-white/10 border-gray-300 dark:border-white/20 hover:bg-gray-300 dark:hover:bg-white/20'}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full absolute top-[1px] shadow-md transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${checked ? 'translate-x-[22px] scale-105' : 'translate-x-[2px]'}`}></div>
      {/* Subtle glow effect when active */}
      {checked && <div className="absolute inset-0 rounded-full shadow-[0_0_12px_rgba(214,181,59,0.5)] opacity-50 animate-pulse"></div>}
    </div>
  );

  return (
    <div className={`px-6 pb-8 pt-4 w-full max-w-[1400px] mx-auto transition-all duration-1000 ease-[cubic-bezier(0.2,0.8,0.2,1)] transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-[22px] font-sahitya text-[#1a1f18] dark:text-[#F4F4F0] font-bold uppercase tracking-[0.1em] mb-1.5 transition-colors duration-500">Settings</h1>
          <p className="text-gray-500 dark:text-[#A3B19B] font-sans text-[13px] font-medium tracking-wide transition-colors duration-500">Manage system preferences, localization, and advanced security configurations.</p>
        </div>
        <button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-8 py-3 bg-[#1a1f18] dark:bg-[#D6B53B] text-white dark:text-[#0C100B] text-[11.5px] font-semibold tracking-[0.15em] uppercase rounded-xl hover:bg-[#D6B53B] dark:hover:bg-white transition-all duration-500 ease-out shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center gap-2 transform active:scale-95 whitespace-nowrap overflow-hidden relative group"
        >
          {/* Button highlight effect */}
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
          {isSaving ? (
            <>
              <i className="fi fi-rr-spinner animate-spin text-[13px]"></i>
              Saving...
            </>
          ) : (
            <>
              <i className="fi fi-rr-disk text-[13px] leading-[0] relative top-[1px]"></i>
              <span className="leading-none relative top-[1px]">Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Notification Banner */}
      <div className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${saveNotification ? 'max-h-24 opacity-100 mb-6 scale-100' : 'max-h-0 opacity-0 mb-0 scale-95'}`}>
        {saveNotification && (
          <div className={`p-3.5 rounded-xl flex items-start gap-3 border shadow-sm backdrop-blur-sm ${saveNotification.type === 'success' ? 'bg-green-50/90 dark:bg-green-900/20 border-green-200 dark:border-green-500/30 text-green-800 dark:text-green-400' : 'bg-red-50/90 dark:bg-red-900/20 border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-400'}`}>
            <i className={`fi ${saveNotification.type === 'success' ? 'fi-rr-check-circle text-green-600 dark:text-green-400' : 'fi-rr-cross-circle text-red-600 dark:text-red-400'} text-[16px] leading-[0] mt-0.5`}></i>
            <p className="text-[13px] font-medium tracking-wide leading-relaxed">{saveNotification.message}</p>
          </div>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* Appearance Section */}
          <section className="bg-white dark:bg-[#141A13] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden transition-all duration-500 group">
            <div className="px-6 py-4 border-b border-gray-50 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.02]">
              <h2 className="text-[14.5px] font-semibold text-gray-800 dark:text-[#F4F4F0] font-sans tracking-tight flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#FDF5CC]/50 dark:bg-[#D6B53B]/10 flex items-center justify-center text-[#D6B53B] shadow-sm">
                  <i className="fi fi-rr-palette text-[14px] leading-[0] relative top-[1px]"></i>
                </div>
                Appearance & Theme
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* Light Mode Toggle */}
              <div 
                onClick={() => toggleTheme('light')}
                className={`border rounded-xl p-5 cursor-pointer relative overflow-hidden bg-white dark:bg-[#0C100B] shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-md dark:hover:shadow-none ${theme === 'light' ? 'border-[#D6B53B] ring-1 ring-[#D6B53B]/20' : 'border-gray-200 dark:border-white/10 opacity-80 hover:opacity-100'}`}
              >
                <div className={`absolute top-4 right-4 text-[#D6B53B] transform transition-transform duration-500 ${theme === 'light' ? 'scale-110 opacity-100' : 'scale-0 opacity-0'}`}>
                  <i className="fi fi-rr-check-circle text-xl drop-shadow-sm leading-[0]"></i>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-[#FDF5CC] to-white dark:from-[#D6B53B]/20 dark:to-transparent border border-[#D6B53B]/20 rounded-full flex items-center justify-center text-[#D6B53B] mb-4 shadow-sm">
                  <i className="fi fi-rr-brightness text-2xl leading-[0]"></i>
                </div>
                <h3 className={`font-semibold tracking-tight text-[15px] mb-1.5 ${theme === 'light' ? 'text-gray-900' : 'text-gray-500 dark:text-[#A3B19B]'}`}>Light Mode</h3>
                <p className="text-[12.5px] text-gray-500 dark:text-[#A3B19B]/80 font-medium tracking-wide">Default bright interface.</p>
              </div>

              {/* Dark Mode Toggle */}
              <div 
                onClick={() => toggleTheme('dark')}
                className={`border rounded-xl p-5 cursor-pointer relative overflow-hidden bg-gray-50 dark:bg-[#0C100B] shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-md dark:hover:shadow-none ${theme === 'dark' ? 'border-[#D6B53B] ring-1 ring-[#D6B53B]/20' : 'border-gray-200 dark:border-white/10 opacity-80 hover:opacity-100'}`}
              >
                <div className={`absolute top-4 right-4 text-[#D6B53B] transform transition-transform duration-500 ${theme === 'dark' ? 'scale-110 opacity-100' : 'scale-0 opacity-0'}`}>
                  <i className="fi fi-rr-check-circle text-xl drop-shadow-sm leading-[0]"></i>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-100 dark:from-white/10 dark:to-transparent border border-gray-300 dark:border-white/10 rounded-full flex items-center justify-center text-gray-600 dark:text-white mb-4 shadow-sm">
                  <i className="fi fi-rr-moon text-2xl leading-[0]"></i>
                </div>
                <h3 className={`font-semibold tracking-tight text-[15px] mb-1.5 ${theme === 'dark' ? 'text-gray-900 dark:text-[#F4F4F0]' : 'text-gray-500 dark:text-[#A3B19B]'}`}>Evening Gala</h3>
                <p className="text-[12.5px] text-gray-500 dark:text-[#A3B19B]/80 font-medium tracking-wide">Rich, dark interface.</p>
              </div>

            </div>
          </section>

          {/* Session & Security */}
          <section className="bg-white dark:bg-[#141A13] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden transition-all duration-500 group">
            <div className="px-6 py-4 border-b border-gray-50 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.02]">
              <h2 className="text-[14.5px] font-semibold text-gray-800 dark:text-[#F4F4F0] font-sans tracking-tight flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#FDF5CC]/50 dark:bg-[#D6B53B]/10 flex items-center justify-center text-[#D6B53B] shadow-sm">
                  <i className="fi fi-rr-shield-check text-[14px] leading-[0] relative top-[1px]"></i>
                </div>
                Session & Advanced Security
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10.5px] font-bold text-gray-500 dark:text-[#A3B19B] uppercase tracking-[0.1em] block">Session Timeout</label>
                  <div className="relative group/select">
                    <select 
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-[13px] font-semibold tracking-wide text-gray-800 dark:text-[#F4F4F0] focus:outline-none focus:ring-2 focus:ring-[#D6B53B]/30 focus:border-[#D6B53B] transition-all duration-300 appearance-none cursor-pointer shadow-sm"
                    >
                      <option>15 Minutes</option>
                      <option>30 Minutes</option>
                      <option>1 Hour</option>
                      <option>4 Hours</option>
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 dark:text-[#A3B19B]">
                      <i className="fi fi-rr-angle-small-down text-base"></i>
                    </div>
                  </div>
                </div>

                <div className="p-5 border border-blue-100 dark:border-blue-500/20 bg-gradient-to-br from-blue-50/80 dark:from-blue-900/10 to-white dark:to-[#141A13] rounded-xl relative overflow-hidden group/2fa">
                  <div className="flex items-start justify-between relative z-10 gap-3">
                    <div className="flex-1">
                      <h4 className="text-[13.5px] font-semibold text-gray-900 dark:text-[#F4F4F0] tracking-wide mb-1.5 flex items-center gap-2">
                        Two-Factor Auth
                        {security.twoFactorAuth && <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-[8.5px] uppercase tracking-widest font-bold rounded-full">Active</span>}
                      </h4>
                      <p className="text-[12px] text-gray-600 dark:text-[#A3B19B] font-medium tracking-wide mb-3 leading-relaxed">Add extra security with 2FA.</p>
                      <button 
                        onClick={() => setSecurity({...security, twoFactorAuth: !security.twoFactorAuth})}
                        className="text-[10.5px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                      >
                        {security.twoFactorAuth ? 'Disable' : 'Set Up'}
                      </button>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 dark:text-blue-400 border dark:border-blue-500/20 flex-shrink-0">
                      <i className="fi fi-rr-smartphone text-[18px] leading-[0]"></i>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10.5px] font-bold text-gray-500 dark:text-[#A3B19B] uppercase tracking-[0.1em] block mb-4">Require Password For</label>
                <div className="space-y-3">
                  {[
                    { id: 'deleteRecords', label: 'Delete Official Records', state: security.deleteRecords },
                    { id: 'cancelBookings', label: 'Cancel Active Bookings', state: security.cancelBookings },
                    { id: 'modifyData', label: 'Modify Client Billing Data', state: security.modifyData },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-white dark:bg-[#1A2218] border border-gray-100 dark:border-white/5 px-4 py-3 rounded-xl">
                      <span className="text-[13px] font-medium tracking-wide text-gray-800 dark:text-[#F4F4F0]">{item.label}</span>
                      <Toggle 
                        checked={item.state} 
                        onChange={() => setSecurity({...security, [item.id as keyof typeof security]: !item.state})}
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </section>

        </div>

        {/* Right Column */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* Notification Preferences */}
          <section className="bg-white dark:bg-[#141A13] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden transition-all duration-500 group h-auto">
            <div className="px-6 py-4 border-b border-gray-50 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.02]">
              <h2 className="text-[14.5px] font-semibold text-gray-800 dark:text-[#F4F4F0] font-sans tracking-tight flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#FDF5CC]/50 dark:bg-[#D6B53B]/10 flex items-center justify-center text-[#D6B53B] shadow-sm">
                  <i className="fi fi-rr-bell text-[14px] leading-[0] relative top-[1px]"></i>
                </div>
                Communications
              </h2>
            </div>
            <div className="p-6 space-y-1.5">
              <h4 className="text-[10px] font-bold text-gray-400 dark:text-[#A3B19B]/70 uppercase tracking-widest mb-3 pl-3">System Alerts</h4>
              {[
                { id: 'newBooking', label: 'New Booking Requests', state: notifications.newBooking },
                { id: 'bookingConfirmations', label: 'Booking Confirmations', state: notifications.bookingConfirmations },
                { id: 'bookingCancellations', label: 'Booking Cancellations', state: notifications.bookingCancellations },
                { id: 'paymentUpdates', label: 'Payment Updates', state: notifications.paymentUpdates },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <span className="text-[13px] font-medium tracking-wide text-gray-800 dark:text-[#F4F4F0]">{item.label}</span>
                  <Toggle 
                    checked={item.state} 
                    onChange={() => setNotifications({...notifications, [item.id as keyof typeof notifications]: !item.state})}
                  />
                </div>
              ))}

              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-white/5"></div>
              <h4 className="text-[10px] font-bold text-gray-400 dark:text-[#A3B19B]/70 uppercase tracking-widest mb-3 pl-3">Email Subscriptions</h4>
              {[
                { id: 'weeklySummary', label: 'Weekly Performance Summary', state: notifications.weeklySummary },
                { id: 'marketingEmails', label: 'Marketing & Feature Updates', state: notifications.marketingEmails },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <span className="text-[13px] font-medium tracking-wide text-gray-800 dark:text-[#F4F4F0]">{item.label}</span>
                  <Toggle 
                    checked={item.state} 
                    onChange={() => setNotifications({...notifications, [item.id as keyof typeof notifications]: !item.state})}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Account Preferences */}
          <section className="bg-white dark:bg-[#141A13] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden transition-all duration-500 group">
            <div className="px-6 py-4 border-b border-gray-50 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.02]">
              <h2 className="text-[14.5px] font-semibold text-gray-800 dark:text-[#F4F4F0] font-sans tracking-tight flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#FDF5CC]/50 dark:bg-[#D6B53B]/10 flex items-center justify-center text-[#D6B53B] shadow-sm">
                  <i className="fi fi-rr-settings-sliders text-[14px] leading-[0] relative top-[1px]"></i>
                </div>
                Localization & Data
              </h2>
            </div>
            <div className="p-6 space-y-5">
              
              <div className="space-y-2.5">
                <label className="text-[10.5px] font-bold text-gray-500 dark:text-[#A3B19B] uppercase tracking-[0.1em] block">Preferred Language</label>
                <div className="relative group/select">
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-[13px] font-medium tracking-wide text-gray-800 dark:text-[#F4F4F0] focus:outline-none focus:ring-2 focus:ring-[#D6B53B]/30 focus:border-[#D6B53B] transition-all duration-300 appearance-none shadow-sm"
                  >
                    <option>English (US)</option>
                    <option>Spanish (ES)</option>
                    <option>Tagalog (PH)</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 dark:text-[#A3B19B]">
                    <i className="fi fi-rr-angle-small-down text-base"></i>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10.5px] font-bold text-gray-500 dark:text-[#A3B19B] uppercase tracking-[0.1em] block">Timezone</label>
                <div className="relative group/select">
                  <select 
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-[13px] font-medium tracking-wide text-gray-800 dark:text-[#F4F4F0] focus:outline-none focus:ring-2 focus:ring-[#D6B53B]/30 focus:border-[#D6B53B] transition-all duration-300 appearance-none shadow-sm"
                  >
                    <option>(GMT+08:00) Manila, Taipei</option>
                    <option>(GMT+09:00) Tokyo, Seoul</option>
                    <option>(GMT-08:00) Pacific Time (US)</option>
                    <option>(GMT-05:00) Eastern Time (US)</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 dark:text-[#A3B19B]">
                    <i className="fi fi-rr-angle-small-down text-base"></i>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10.5px] font-bold text-gray-500 dark:text-[#A3B19B] uppercase tracking-[0.1em] block">Date & Time Format</label>
                <div className="relative group/select">
                  <select 
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-[13px] font-medium tracking-wide text-gray-800 dark:text-[#F4F4F0] focus:outline-none focus:ring-2 focus:ring-[#D6B53B]/30 focus:border-[#D6B53B] transition-all duration-300 appearance-none shadow-sm"
                  >
                    <option>MM/DD/YYYY (12-hour)</option>
                    <option>DD/MM/YYYY (24-hour)</option>
                    <option>YYYY-MM-DD (ISO)</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 dark:text-[#A3B19B]">
                    <i className="fi fi-rr-angle-small-down text-base"></i>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-[13.5px] font-semibold text-gray-800 dark:text-[#F4F4F0] tracking-wide mb-0.5">Export Data</h4>
                  <p className="text-[11.5px] text-gray-500 dark:text-[#A3B19B] tracking-wide font-medium">Download activity logs.</p>
                </div>
                <button className="px-4 py-2 border border-gray-200 dark:border-white/20 text-gray-600 dark:text-[#A3B19B] rounded-lg text-[10.5px] font-semibold tracking-widest uppercase hover:bg-[#1a1f18] dark:hover:bg-white hover:border-[#1a1f18] dark:hover:border-white hover:text-white dark:hover:text-[#0C100B] transition-all duration-300 shadow-sm flex items-center gap-1.5 active:scale-95">
                  <i className="fi fi-rr-download leading-[0]"></i>
                  Export CSV
                </button>
              </div>

            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
