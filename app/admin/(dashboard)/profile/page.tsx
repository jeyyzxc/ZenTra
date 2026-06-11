'use client';

import React, { useState, useEffect } from 'react';

const MaskIcon = ({ src, className = "" }: { src: string, className?: string }) => (
  <div 
    className={`w-[16px] h-[16px] bg-current transition-colors flex-shrink-0 ${className}`}
    style={{
      maskImage: `url('${src}')`,
      WebkitMaskImage: `url('${src}')`,
      maskSize: 'contain',
      WebkitMaskSize: 'contain',
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
      maskPosition: 'center',
      WebkitMaskPosition: 'center'
    }}
  />
);

// We define a sleek, highly modern inline notification component
const ElegantNotification = ({ 
  notification, 
  onDismiss 
}: { 
  notification: {type: 'success' | 'error', message: string} | null,
  onDismiss: () => void
}) => {
  return (
    <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${notification ? 'max-h-40 opacity-100 mb-5 scale-100 origin-top' : 'max-h-0 opacity-0 mb-0 scale-95 origin-top'}`}>
      {notification && (
        <div className={`relative p-4 rounded-xl flex items-center gap-3 border shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none bg-white dark:bg-[#141A13] transition-colors duration-500 ${notification.type === 'success' ? 'border-green-100/50 dark:border-green-500/20' : 'border-red-100/50 dark:border-red-500/20'}`}>
          {/* Icon Block */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner dark:shadow-none transition-colors duration-500 ${notification.type === 'success' ? 'bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-800/20 text-green-500 dark:text-green-400 border border-green-100 dark:border-green-500/20' : 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/30 dark:to-red-800/20 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-500/20'}`}>
            <i className={`fi ${notification.type === 'success' ? 'fi-rr-check-circle' : 'fi-rr-shield-exclamation'} text-xl`}></i>
          </div>
          
          {/* Content */}
          <div className="flex-1 pr-5">
            <h4 className={`text-[13px] font-bold mb-0.5 tracking-wide uppercase transition-colors duration-500 ${notification.type === 'success' ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
              {notification.type === 'success' ? 'Update Successful' : 'Action Required'}
            </h4>
            <p className="text-[12px] text-gray-500 dark:text-[#A3B19B] font-medium transition-colors duration-500">{notification.message}</p>
          </div>
          
          {/* Dismiss */}
          <button 
            type="button"
            onClick={onDismiss}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-50 dark:hover:bg-white/10 text-gray-400 dark:text-[#A3B19B] hover:text-gray-600 dark:hover:text-white transition-colors focus:outline-none"
          >
            <i className="fi fi-rr-cross-small text-lg"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // State for editable profile fields
  const [profileData, setProfileData] = useState({
    fullName: 'Jeyy Admin',
    contactNumber: '912 345 6789',
    profilePicture: 'https://ui-avatars.com/api/?name=Jeyy+Admin&background=random'
  });

  // State for security fields
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI States
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [profileNotification, setProfileNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [securityNotification, setSecurityNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Static Metadata
  const staticData = {
    email: 'admin@zionevents.com',
    role: 'Administrator',
    accountCreationDate: 'October 12, 2024',
    lastLogin: 'Today, 08:45 AM'
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileNotification(null);
    
    setTimeout(() => {
      setIsSavingProfile(false);
      setProfileNotification({ type: 'success', message: 'Your profile information has been securely updated.' });
      setTimeout(() => setProfileNotification(null), 5000);
    }, 800);
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityNotification(null);
    
    if (passwords.newPassword.length < 8) {
      setSecurityNotification({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setSecurityNotification({ type: 'error', message: 'New passwords do not match. Please try again.' });
      return;
    }

    setIsSavingPassword(true);

    setTimeout(() => {
      setIsSavingPassword(false);
      setSecurityNotification({ type: 'success', message: 'Your security credentials have been updated.' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSecurityNotification(null), 5000);
    }, 800);
  };

  return (
    <div className={`px-6 pb-8 pt-4 max-w-6xl mx-auto transition-all duration-700 ease-out transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[20px] font-sahitya text-[#1a1f18] dark:text-[#F4F4F0] font-bold uppercase tracking-[0.1em] mb-1.5 transition-colors duration-500">My Profile</h1>
        <p className="text-gray-500 dark:text-[#A3B19B] font-sans text-[13px] font-medium tracking-wide transition-colors duration-500">Manage your personal account information and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Static Overview & Metadata */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#141A13] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden relative transition-all duration-500 hover:shadow-md">
            <div className="h-24 bg-gradient-to-r from-[#1a1f18] via-[#2a3227] to-[#1a1f18] dark:from-[#0C100B] dark:via-[#1A2218] dark:to-[#0C100B] transition-colors duration-500"></div>
            
            <div className="px-5 pb-5 relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-[#141A13] shadow-lg absolute -top-12 left-5 bg-white dark:bg-[#141A13] group cursor-pointer transition-transform duration-300 hover:scale-105">
                <img src={profileData.profilePicture} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex flex-col items-center">
                    <i className="fi fi-rr-camera text-white text-lg mb-1"></i>
                    <span className="text-[8.5px] text-white font-bold uppercase tracking-widest">Update</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-14 pb-4 border-b border-gray-100 dark:border-white/5 transition-colors duration-500">
                <h2 className="text-[20px] font-semibold text-gray-900 dark:text-[#F4F4F0] font-sans tracking-tight transition-colors duration-500">{profileData.fullName}</h2>
                <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#FDF5CC] to-white dark:from-[#D6B53B]/20 dark:to-[#D6B53B]/5 border border-[#D6B53B]/30 dark:border-[#D6B53B]/20 mt-1.5 shadow-sm transition-colors duration-500">
                  <i className="fi fi-rr-shield-check text-[11px] text-[#D6B53B] leading-[0] relative top-[1px]"></i>
                  <span className="text-[9px] font-semibold text-[#D6B53B] uppercase tracking-wider leading-none relative top-[1px]">{staticData.role}</span>
                </div>
              </div>

              <div className="pt-4 space-y-3.5">
                <div className="group">
                  <label className="text-[9.5px] font-bold text-gray-400 dark:text-[#A3B19B]/70 uppercase tracking-widest mb-1 block ml-[28px] transition-colors">Email Address</label>
                  <div className="flex items-center gap-2.5 text-gray-700 dark:text-[#F4F4F0] text-[13px] font-medium group-hover:text-black dark:group-hover:text-[#D6B53B] transition-colors">
                    <div className="w-4 flex items-center justify-center flex-shrink-0">
                      <i className="fi fi-rr-envelope text-[14px] text-[#D6B53B]/70 group-hover:text-[#D6B53B] transition-colors leading-[0] relative top-[1px]"></i>
                    </div>
                    <span className="leading-none relative top-[1px] tracking-wide">{staticData.email}</span>
                  </div>
                </div>
                <div className="group">
                  <label className="text-[9.5px] font-bold text-gray-400 dark:text-[#A3B19B]/70 uppercase tracking-widest mb-1 block ml-[28px] transition-colors">Account Created</label>
                  <div className="flex items-center gap-2.5 text-gray-700 dark:text-[#F4F4F0] text-[13px] font-medium group-hover:text-black dark:group-hover:text-[#D6B53B] transition-colors">
                    <div className="w-4 flex items-center justify-center flex-shrink-0">
                      <i className="fi fi-rr-calendar-lines text-[14px] text-[#D6B53B]/70 group-hover:text-[#D6B53B] transition-colors leading-[0] relative top-[1px]"></i>
                    </div>
                    <span className="leading-none relative top-[1px] tracking-wide">{staticData.accountCreationDate}</span>
                  </div>
                </div>
                <div className="group">
                  <label className="text-[9.5px] font-bold text-gray-400 dark:text-[#A3B19B]/70 uppercase tracking-widest mb-1 block ml-[28px] transition-colors">Last Login</label>
                  <div className="flex items-center gap-2.5 text-gray-700 dark:text-[#F4F4F0] text-[13px] font-medium group-hover:text-black dark:group-hover:text-[#D6B53B] transition-colors">
                    <div className="w-4 flex items-center justify-center flex-shrink-0">
                      <i className="fi fi-rr-time-past text-[14px] text-[#D6B53B]/70 group-hover:text-[#D6B53B] transition-colors leading-[0] relative top-[1px]"></i>
                    </div>
                    <span className="leading-none relative top-[1px] tracking-wide">{staticData.lastLogin}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Profile Information Form */}
          <div className="bg-white dark:bg-[#141A13] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 p-6 relative transition-all duration-500 hover:shadow-md">
            <h3 className="text-[15.5px] font-semibold text-gray-800 dark:text-[#F4F4F0] font-sans tracking-tight mb-5 flex items-center gap-2.5 transition-colors duration-500">
              <div className="w-7 h-7 rounded-full bg-[#FDF5CC]/50 dark:bg-[#D6B53B]/10 flex items-center justify-center text-[#D6B53B] flex-shrink-0">
                <i className="fi fi-rr-edit text-[14px] leading-[0] relative top-[1px] ml-[2px]"></i>
              </div>
              <span className="leading-none relative top-[1px]">Edit Profile Information</span>
            </h3>

            <ElegantNotification 
              notification={profileNotification} 
              onDismiss={() => setProfileNotification(null)} 
            />

            <form onSubmit={handleProfileUpdate} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="fullName" className="text-[10.5px] font-bold text-gray-500 dark:text-[#A3B19B] uppercase tracking-[0.1em] transition-colors duration-500">Full Name</label>
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
                      <MaskIcon src="/icon-user.png" className="text-gray-500 dark:text-[#A3B19B] group-focus-within:text-[#D6B53B] dark:group-focus-within:text-[#D6B53B]" />
                    </div>
                    <input 
                      type="text" 
                      id="fullName"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-3.5 text-[13.5px] font-medium text-gray-800 dark:text-[#F4F4F0] tracking-wide focus:outline-none focus:ring-2 focus:ring-[#D6B53B]/30 focus:border-[#D6B53B] transition-all hover:border-gray-300 dark:hover:border-white/20 shadow-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contactNumber" className="text-[10.5px] font-bold text-gray-500 dark:text-[#A3B19B] uppercase tracking-[0.1em] transition-colors duration-500">Contact Number</label>
                  <div className="relative group flex items-center">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
                      <MaskIcon src="/icon-contact.png" className="text-gray-500 dark:text-[#A3B19B] group-focus-within:text-[#D6B53B] dark:group-focus-within:text-[#D6B53B]" />
                    </div>
                    {/* Fixed +63 Prefix */}
                    <div className="absolute left-[36px] top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10 text-[13.5px] font-medium text-gray-800 dark:text-[#F4F4F0] tracking-wide">
                      +63
                    </div>
                    {/* Vertical Divider */}
                    <div className="absolute left-[68px] top-1/2 -translate-y-1/2 w-[1.5px] h-[16px] bg-gray-200 dark:bg-white/10 z-10 group-focus-within:bg-[#D6B53B]/50 transition-colors"></div>
                    <input 
                      type="tel" 
                      id="contactNumber"
                      value={profileData.contactNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9\s]/g, '');
                        setProfileData({...profileData, contactNumber: val})
                      }}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-[80px] pr-3.5 text-[13.5px] font-medium text-gray-800 dark:text-[#F4F4F0] tracking-wide focus:outline-none focus:ring-2 focus:ring-[#D6B53B]/30 focus:border-[#D6B53B] transition-all hover:border-gray-300 dark:hover:border-white/20 shadow-sm placeholder-gray-400 dark:placeholder-gray-500"
                      required
                      placeholder="9XX XXX XXXX"
                      maxLength={12}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 bg-[#1a1f18] dark:bg-[#D6B53B] text-white dark:text-[#0C100B] text-[11.5px] font-semibold tracking-[0.15em] uppercase rounded-xl hover:bg-[#D6B53B] dark:hover:bg-white transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 transform active:scale-95"
                >
                  {isSavingProfile ? (
                    <>
                      <i className="fi fi-rr-spinner animate-spin"></i>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Security & Password Form */}
          <div className="bg-white dark:bg-[#141A13] rounded-xl shadow-sm border border-gray-100 dark:border-white/5 p-6 transition-all duration-500 hover:shadow-md">
            <h3 className="text-[15.5px] font-semibold text-gray-800 dark:text-[#F4F4F0] font-sans tracking-tight mb-1.5 flex items-center gap-2.5 transition-colors duration-500">
              <div className="w-7 h-7 rounded-full bg-[#FDF5CC]/50 dark:bg-[#D6B53B]/10 flex items-center justify-center text-[#D6B53B] flex-shrink-0">
                <i className="fi fi-rr-lock text-[14px] leading-[0] relative top-[1px]"></i>
              </div>
              <span className="leading-none relative top-[1px]">Security & Password</span>
            </h3>
            <p className="text-[12.5px] text-gray-500 dark:text-[#A3B19B] mb-5 font-medium tracking-wide transition-colors duration-500">Ensure your account is using a long, random password to stay secure.</p>

            <ElegantNotification 
              notification={securityNotification} 
              onDismiss={() => setSecurityNotification(null)} 
            />

            <form onSubmit={handlePasswordUpdate} className="space-y-5">
              
              <div className="space-y-1.5 max-w-sm">
                <label htmlFor="currentPassword" className="text-[10.5px] font-bold text-gray-500 dark:text-[#A3B19B] uppercase tracking-[0.1em] transition-colors duration-500">Current Password</label>
                <div className="relative group flex items-center">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
                    <MaskIcon src="/icon-current-pw.png" className="text-gray-500 dark:text-[#A3B19B] group-focus-within:text-[#D6B53B] dark:group-focus-within:text-[#D6B53B]" />
                  </div>
                  <input 
                    type={showCurrentPassword ? "text" : "password"} 
                    id="currentPassword"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-[13.5px] font-medium text-gray-800 dark:text-[#F4F4F0] tracking-wide focus:outline-none focus:ring-2 focus:ring-[#D6B53B]/30 focus:border-[#D6B53B] transition-all hover:border-gray-300 dark:hover:border-white/20 shadow-sm font-sans"
                    required
                  />
                  <div 
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#A3B19B] hover:text-[#D6B53B] transition-colors cursor-pointer z-10 flex items-center justify-center"
                    onMouseEnter={() => setShowCurrentPassword(true)}
                    onMouseLeave={() => setShowCurrentPassword(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[16px] h-[16px]">
                      {showCurrentPassword ? (
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-gray-100 dark:border-white/5 transition-colors duration-500">
                <div className="space-y-1.5">
                  <label htmlFor="newPassword" className="text-[10.5px] font-bold text-gray-500 dark:text-[#A3B19B] uppercase tracking-[0.1em] transition-colors duration-500">New Password</label>
                  <div className="relative group flex items-center">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
                      <MaskIcon src="/icon-new-pw.png" className="text-gray-500 dark:text-[#A3B19B] group-focus-within:text-[#D6B53B] dark:group-focus-within:text-[#D6B53B]" />
                    </div>
                    <input 
                      type={showNewPassword ? "text" : "password"} 
                      id="newPassword"
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-[13.5px] font-medium text-gray-800 dark:text-[#F4F4F0] tracking-wide focus:outline-none focus:ring-2 focus:ring-[#D6B53B]/30 focus:border-[#D6B53B] transition-all hover:border-gray-300 dark:hover:border-white/20 shadow-sm font-sans"
                      required
                    />
                    <div 
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#A3B19B] hover:text-[#D6B53B] transition-colors cursor-pointer z-10 flex items-center justify-center"
                      onMouseEnter={() => setShowNewPassword(true)}
                      onMouseLeave={() => setShowNewPassword(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[16px] h-[16px]">
                        {showNewPassword ? (
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
                  <p className="text-[10px] text-gray-400 dark:text-[#A3B19B]/70 font-bold tracking-wide transition-colors duration-500">Minimum 8 characters long</p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-[10.5px] font-bold text-gray-500 dark:text-[#A3B19B] uppercase tracking-[0.1em] transition-colors duration-500">Confirm New Password</label>
                  <div className="relative group flex items-center">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
                      <MaskIcon src="/icon-confirm-pw.png" className="text-gray-500 dark:text-[#A3B19B] group-focus-within:text-[#D6B53B] dark:group-focus-within:text-[#D6B53B]" />
                    </div>
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      id="confirmPassword"
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-[13.5px] font-medium text-gray-800 dark:text-[#F4F4F0] tracking-wide focus:outline-none focus:ring-2 focus:ring-[#D6B53B]/30 focus:border-[#D6B53B] transition-all hover:border-gray-300 dark:hover:border-white/20 shadow-sm font-sans"
                      required
                    />
                    <div 
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#A3B19B] hover:text-[#D6B53B] transition-colors cursor-pointer z-10 flex items-center justify-center"
                      onMouseEnter={() => setShowConfirmPassword(true)}
                      onMouseLeave={() => setShowConfirmPassword(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[16px] h-[16px]">
                        {showConfirmPassword ? (
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
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit"
                  disabled={isSavingPassword}
                  className="px-6 py-2.5 bg-white dark:bg-transparent border-2 border-[#D6B53B] text-[#D6B53B] text-[11.5px] font-semibold tracking-[0.15em] uppercase rounded-xl hover:bg-[#D6B53B] hover:text-white dark:hover:bg-[#F4F4F0] dark:hover:border-[#F4F4F0] dark:hover:text-[#1a1f18] transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 transform active:scale-95"
                >
                  {isSavingPassword ? (
                    <>
                      <i className="fi fi-rr-spinner animate-spin"></i>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="fi fi-rr-shield-check text-[13px] leading-[0] relative top-[1px]"></i>
                      <span className="leading-none relative top-[1px]">Change Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
