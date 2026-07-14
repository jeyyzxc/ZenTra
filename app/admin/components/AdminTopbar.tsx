'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import type { Role } from '@prisma/client';

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  is_read: boolean;
  created_at: string;
  href: string;
};

type NotificationsResponse = {
  success: boolean;
  data?: NotificationItem[];
  error?: string;
};

const SEARCH_PLACEHOLDERS = [
  "Looking for something?",
  "Search for bookings...",
  "Find a specific client...",
  "Search through contracts...",
  "Search payments..."
];

function formatNotificationTime(value: string) {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return '';
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (diffMinutes < 1) return 'Now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function UserAvatar({
  className,
  initial,
  name,
  profileImage,
}: {
  className: string;
  initial: string;
  name: string;
  profileImage: string | null;
}) {
  return (
    <div
      aria-label={name}
      className={`${className} ${profileImage ? 'bg-cover bg-center bg-no-repeat text-transparent' : ''}`}
      role="img"
      style={profileImage ? { backgroundImage: `url("${profileImage}")` } : undefined}
      title={name}
    >
      {!profileImage && initial}
    </div>
  );
}

export default function AdminTopbar({
  isCollapsed,
  currentUser,
}: {
  isCollapsed: boolean;
  currentUser: {
    email: string;
    profileImage: string | null;
    role: Extract<Role, 'SUPERADMIN' | 'ADMIN'>;
    fullName: string | null;
  };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const roleLabel = currentUser.role === 'SUPERADMIN' ? 'Super Administrator' : 'Administrator';
  const displayName = currentUser.fullName?.trim() || currentUser.email.split('@')[0] || 'Administrator';
  const userInitial = displayName.charAt(0).toUpperCase();

  // Notification State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dynamic Search Placeholders
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [hoveredSearch, setHoveredSearch] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Profile State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Notifications State
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const url = showAllNotifications ? '/api/dashboard/notifications' : '/api/dashboard/notifications?limit=8';
      const response = await fetch(url, { cache: 'no-store' });
      const payload = await response.json() as NotificationsResponse;

      if (response.ok && payload.success && payload.data) {
        setNotifications(payload.data);
      }
    } catch {
      setNotifications([]);
    }
  }, [showAllNotifications]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadNotifications();
    }, 0);
    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 30_000);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [loadNotifications]);

  const handleNavigation = (path: string) => {
    setIsProfileOpen(false);
    router.push(path);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Cmd+K / Ctrl+K shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const markAllAsRead = () => {
    const unreadNotifications = notifications.filter((notification) => !notification.is_read);
    setNotifications(notifications.map((notification) => ({ ...notification, is_read: true })));
    unreadNotifications.forEach((notification) => {
      void fetch(`/api/dashboard/alerts/${encodeURIComponent(notification.id)}/acknowledge`, {
        method: 'PATCH',
      });
    });
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map((notification) => (
      notification.id === id ? { ...notification, is_read: true } : notification
    )));
    void fetch(`/api/dashboard/alerts/${encodeURIComponent(id)}/acknowledge`, {
      method: 'PATCH',
    });
  };

  const getTitle = () => {
    if (pathname.includes('/dashboard')) return 'Admin / Dashboard';
    if (pathname.includes('/bookings')) return 'Booking Management';
    if (pathname.includes('/contracts')) return 'Contract & Fallback Management';
    if (pathname.includes('/payments')) return 'Payment & History';
    if (pathname.includes('/calendar')) return 'Calendar & Availability';
    if (pathname.includes('/services')) return 'Services, Packages & Content';
    if (pathname.includes('/command-center')) return 'ZENTRA Command Center';
    if (pathname.includes('/testimonies')) return 'Testimony Management';
    if (pathname.includes('/support')) return 'Support Center';
    if (pathname.includes('/reports')) return 'Reports & Analytics';
    if (pathname.includes('/audit')) return 'System Logs';
    if (pathname.includes('/inquiries')) return 'Inquiry Management';
    if (pathname.includes('/team')) return 'Team Management';
    if (pathname.includes('/profile')) return 'Profile';
    if (pathname.includes('/settings')) return 'Settings';
    return 'Admin';
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking': return <i className="fi fi-rr-calendar-check text-[#D6B53B]"></i>;
      case 'payment': return <i className="fi fi-rr-wallet text-emerald-500"></i>;
      case 'inquiry': return <i className="fi fi-rr-messages text-blue-500"></i>;
      case 'testimony': return <i className="fi fi-rr-comment-quote text-[#D6B53B]"></i>;
      case 'email': return <i className="fi fi-rr-envelope text-red-500"></i>;
      case 'workflow': return <i className="fi fi-rr-settings-sliders text-orange-500"></i>;
      case 'task': return <i className="fi fi-rr-list-check text-[#D6B53B]"></i>;
      default: return <i className="fi fi-rr-info text-gray-500"></i>;
    }
  };

  return (
    <div
      className={`h-20 bg-white dark:bg-[#0C100B] border-b border-[#1a1f18]/10 dark:border-white/5 flex items-center justify-between gap-3 px-4 md:px-8 sticky top-0 z-40 transition-colors duration-500 ease-in-out ${
        isCollapsed ? 'ml-[80px]' : 'ml-[80px] md:ml-[280px]'
      }`}
    >

      {/* Title */}
      <h1 className="min-w-0 truncate text-base font-sahitya text-[#1a1f18] dark:text-[#F4F4F0] font-bold uppercase tracking-[0.08em] transition-colors duration-500 sm:text-[22px] sm:tracking-[0.1em]">
        {getTitle()}
      </h1>

      {/* Right Side */}
      <div className="flex flex-shrink-0 items-center gap-2 sm:gap-4 lg:gap-6">

        {/* Search */}
        {!pathname.includes('/admin/profile') && (
          <div className="relative z-50 hidden lg:block" ref={searchRef}>
            <div className={`flex items-center w-[290px] rounded-full border transition-all duration-300 bg-gray-50/50 dark:bg-[#141A13] ${isSearchFocused ? 'border-[#D6B53B] dark:border-[#D6B53B] bg-white dark:bg-[#1A2218] shadow-[0_0_0_4px_rgba(214,181,59,0.1)]' : 'border-gray-200 dark:border-[#1F2A1E] hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-[#1A2218]'}`}>
            <div className="pl-4 pr-2 flex items-center justify-center pointer-events-none pt-[2px]">
              <i className={`fi fi-rr-search text-[14px] leading-none transition-colors ${isSearchFocused ? 'text-[#D6B53B]' : 'text-gray-400 dark:text-[#A3B19B]'}`}></i>
            </div>
            <div className="relative w-full flex items-center">
              {/* Ghost text for recent search hover preview */}
              {!searchQuery && hoveredSearch && (
                <div className="absolute inset-0 flex items-center pointer-events-none z-0">
                  <span className="text-[13px] font-sans font-medium tracking-wide text-gray-400/80 dark:text-[#A3B19B]/60">{hoveredSearch}</span>
                </div>
              )}
              {/* Animated Placeholder Text */}
              {!searchQuery && !hoveredSearch && (
                <div className="absolute inset-0 flex items-center pointer-events-none z-0 overflow-hidden">
                  <span
                    key={placeholderIndex}
                    className="text-[13px] font-sans font-medium tracking-wide text-gray-400 dark:text-[#A3B19B] animate-[placeholderAnim_5s_ease-in-out]"
                  >
                    {SEARCH_PLACEHOLDERS[placeholderIndex]}
                  </span>
                </div>
              )}
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    handleNavigation(`/admin/bookings?search=${encodeURIComponent(searchQuery.trim())}`);
                    setIsSearchFocused(false);
                    if (!recentSearches.includes(searchQuery.trim())) {
                      setRecentSearches(prev => [searchQuery.trim(), ...prev].slice(0, 5));
                    }
                  }
                }}
                placeholder=""
                className="w-full bg-transparent py-2.5 pr-4 text-[13px] font-sans font-medium tracking-wide text-gray-800 dark:text-[#F4F4F0] focus:outline-none transition-all duration-300 ease-in-out relative z-10"
              />
            </div>

            {/* Clear Button */}
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="pr-4 pl-2 text-gray-400 dark:text-[#A3B19B] hover:text-gray-700 dark:hover:text-white transition-colors focus:outline-none"
              >
                <i className="fi fi-rr-cross-small text-[16px] flex items-center"></i>
              </button>
            )}
          </div>

          {/* Search Dropdown Panel */}
          {isSearchFocused && (
            <div className="absolute top-full mt-3 w-full bg-white dark:bg-[#141A13] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] border border-gray-100/50 dark:border-white/5 overflow-hidden origin-top z-50 transition-colors duration-500">
              {searchQuery ? (
                <div className="p-2">
                  <div className="px-3 py-2 text-[10px] font-bold text-gray-400 dark:text-[#A3B19B] uppercase tracking-[0.1em]">
                    Quick Results
                  </div>
                  <button
                    onClick={() => {
                      handleNavigation(`/admin/bookings?search=${encodeURIComponent(searchQuery.trim())}`);
                      setIsSearchFocused(false);
                      if (!recentSearches.includes(searchQuery.trim())) {
                        setRecentSearches(prev => [searchQuery.trim(), ...prev].slice(0, 5));
                      }
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3.5 group"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#FDF5CC]/50 dark:bg-[#D6B53B]/10 flex items-center justify-center text-[#D6B53B] group-hover:bg-[#D6B53B] group-hover:text-white transition-all shadow-sm dark:shadow-none border border-transparent dark:border-[#D6B53B]/20">
                      <i className="fi fi-rr-search text-xs leading-[0]"></i>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold tracking-wide text-gray-800 dark:text-[#F4F4F0] group-hover:text-[#D6B53B] transition-colors">Search for &ldquo;{searchQuery}&rdquo;</p>
                      <p className="text-[11px] text-gray-500 dark:text-[#A3B19B] font-medium">Press Enter to see all results</p>
                    </div>
                  </button>
                  <button className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3.5 group mt-1">
                    <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm dark:shadow-none border border-transparent dark:border-blue-500/20">
                      <i className="fi fi-rr-users text-xs leading-[0]"></i>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold tracking-wide text-gray-800 dark:text-[#F4F4F0]">&ldquo;{searchQuery}&rdquo; in Clients</p>
                      <p className="text-[11px] text-gray-500 dark:text-[#A3B19B] font-medium">Search client directory</p>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="p-2">
                  <div className="px-3 py-2 text-[10px] font-bold text-gray-400 dark:text-[#A3B19B] uppercase tracking-[0.1em] flex justify-between items-center">
                    <span>Recent Searches</span>
                    {recentSearches.length > 0 && (
                      <button
                        onClick={() => setRecentSearches([])}
                        className="text-[10px] text-gray-400 dark:text-[#A3B19B] hover:text-red-500 dark:hover:text-red-400 transition-colors uppercase tracking-wider"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  {recentSearches.length > 0 ? (
                    recentSearches.map((search, idx) => (
                      <div key={idx} className={`relative flex items-center w-full group ${idx > 0 ? 'mt-1' : ''}`}>
                        <button
                          onMouseEnter={() => setHoveredSearch(search)}
                          onMouseLeave={() => setHoveredSearch(null)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3 text-gray-600 dark:text-[#A3B19B] hover:text-gray-900 dark:hover:text-[#F4F4F0]"
                        >
                          <i className="fi fi-rr-time-past text-gray-400 dark:text-[#A3B19B] text-xs group-hover:text-[#D6B53B] transition-colors"></i>
                          <span className="text-[13px] font-medium tracking-wide pr-8 truncate">{search}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecentSearches(prev => prev.filter(s => s !== search));
                            if (hoveredSearch === search) setHoveredSearch(null);
                          }}
                          className="absolute right-2 p-1.5 rounded-lg text-gray-400 dark:text-[#A3B19B] hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
                          title="Delete search"
                        >
                          <i className="fi fi-rr-cross-small text-[14px] flex items-center justify-center"></i>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-6 text-center flex flex-col items-center">
                      <i className="fi fi-rr-time-past text-gray-200 dark:text-white/10 text-2xl mb-2"></i>
                      <span className="text-[12px] text-gray-400 dark:text-[#A3B19B] font-medium">No recent searches</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`relative text-black dark:text-[#A3B19B] transition-colors p-1.5 rounded-full focus:outline-none flex items-center justify-center ${isDropdownOpen ? 'bg-[#FDF5CC] dark:bg-[#D6B53B]/20 text-[#D6B53B]' : 'hover:bg-gray-50 dark:hover:bg-white/5 hover:text-[#D6B53B] dark:hover:text-[#D6B53B]'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>

            {/* Red Dot Indicator (Only shows if unreadCount > 0) */}
            {unreadCount > 0 && (
              <>
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-[#0C100B] rounded-full z-10"></span>
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-400 rounded-full animate-ping opacity-75"></span>
              </>
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#141A13] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] border border-gray-100/50 dark:border-white/5 overflow-hidden origin-top-right flex flex-col z-50 transition-colors duration-500">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-white/5 bg-white dark:bg-[#141A13]">
                <h3 className="text-[15px] font-semibold text-gray-800 dark:text-[#F4F4F0] tracking-tight font-sans">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-semibold text-[#D6B53B] hover:text-[#BEA542] dark:hover:text-[#E8D579] transition-colors tracking-[0.1em] uppercase"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[340px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full bg-white dark:bg-[#141A13] relative">
                {notifications.length > 0 ? (
                  <>
                    {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => {
                        markAsRead(notification.id);
                        setIsDropdownOpen(false);
                        router.push(notification.href);
                      }}
                      className={`flex gap-3.5 px-5 py-4 border-b border-gray-50 dark:border-white/5 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/5 group ${!notification.is_read ? 'bg-gradient-to-r from-[#FDF5CC]/30 dark:from-[#D6B53B]/10 to-transparent' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${!notification.is_read ? 'bg-white dark:bg-[#1F2A1E] shadow-sm dark:shadow-none border border-gray-100 dark:border-[#D6B53B]/20' : 'bg-gray-50 dark:bg-white/5'}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-[13px] tracking-wide truncate pr-3 ${!notification.is_read ? 'font-bold text-gray-900 dark:text-[#F4F4F0]' : 'font-semibold text-gray-700 dark:text-[#A3B19B]'}`}>
                            {notification.title}
                          </p>
                          <span className="text-[10px] text-gray-400 dark:text-[#A3B19B] font-semibold tracking-wide whitespace-nowrap flex-shrink-0 mt-0.5">{formatNotificationTime(notification.created_at)}</span>
                        </div>
                        <p className={`text-[12px] leading-snug line-clamp-2 tracking-wide ${!notification.is_read ? 'text-gray-700 dark:text-[#A3B19B] font-medium' : 'text-gray-500 dark:text-[#A3B19B]/70'}`}>
                          {notification.message}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-[#D6B53B] flex-shrink-0 mt-2 shadow-[0_0_8px_rgba(214,181,59,0.5)]"></div>
                      )}
                    </div>
                    ))}
                    {!showAllNotifications && notifications.length >= 8 && (
                      <div className="px-5 py-3 border-t border-gray-50 dark:border-white/5 flex justify-center sticky bottom-0 bg-white/95 dark:bg-[#141A13]/95 backdrop-blur-sm z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAllNotifications(true);
                          }}
                          className="text-[12px] font-semibold text-[#D6B53B] hover:text-[#BEA542] dark:hover:text-[#E8D579] transition-colors"
                        >
                          See previous notifications
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-10 flex flex-col items-center justify-center text-center">
                    <i className="fi fi-rr-bell-slash text-3xl text-gray-200 dark:text-white/10 mb-3 leading-[0]"></i>
                    <p className="text-[13px] font-medium tracking-wide text-gray-500 dark:text-[#A3B19B]">No notifications yet.</p>
                    <p className="text-[11px] text-gray-400 dark:text-[#A3B19B]/70 mt-1 tracking-wide">You&apos;re all caught up!</p>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Profile Controls */}
        <div className="relative flex items-center gap-1" ref={profileRef}>
          <button
            onClick={() => handleNavigation('/admin/profile')}
            className="cursor-pointer group focus:outline-none rounded-full"
            title="Go to My Profile"
          >
            <UserAvatar
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-[#D6B53B] font-bold text-[#1a1f18] shadow-sm transition-all duration-300 border-transparent hover:border-[#8E7722] hover:shadow-[0_0_12px_rgba(214,181,59,0.4)] ${pathname === '/admin/profile' ? 'border-[#8E7722] shadow-[0_0_12px_rgba(214,181,59,0.4)]' : ''}`}
              initial={userInitial}
              name={displayName}
              profileImage={currentUser.profileImage}
            />
          </button>

          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`p-1 rounded-full transition-colors focus:outline-none ${isProfileOpen ? 'bg-gray-100 dark:bg-white/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
            title="Open Profile Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3.5 h-3.5 transition-all duration-300 ${isProfileOpen ? 'text-[#D6B53B]' : 'text-gray-500 dark:text-[#A3B19B] hover:text-[#D6B53B]'}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {/* Profile Dropdown Panel */}
          {isProfileOpen && (
            <div className="absolute top-full -right-2 mt-3 w-64 bg-white dark:bg-[#141A13] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] border border-gray-100/50 dark:border-white/5 overflow-hidden origin-top-right z-50 transition-colors duration-500">

              {/* User Header */}
              <button
                onClick={() => handleNavigation('/admin/profile')}
                className="w-full text-left flex items-center gap-3 px-5 py-4 border-b border-gray-50 dark:border-white/5 bg-gradient-to-br from-white dark:from-[#141A13] to-gray-50/50 dark:to-white/5 hover:to-gray-100 dark:hover:to-[#1A2218] transition-colors focus:outline-none"
              >
                <UserAvatar
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#D6B53B]/20 bg-[#D6B53B] font-bold text-[#1a1f18]"
                  initial={userInitial}
                  name={displayName}
                  profileImage={currentUser.profileImage}
                />
                <div className="flex flex-col min-w-0">
                  <h3 className="font-semibold text-gray-800 dark:text-[#F4F4F0] tracking-tight font-sans text-[15px] truncate group-hover:text-[#D6B53B] transition-colors">{displayName}</h3>
                  <span className="text-[10px] font-semibold text-[#D6B53B] tracking-[0.1em]">{roleLabel}</span>
                  <span className="max-w-[150px] truncate text-[10px] text-gray-400 group-hover:text-gray-500 transition-colors">{currentUser.email}</span>
                </div>
              </button>

              {/* Menu Items */}
              <div className="p-2">
                <button
                  onClick={() => handleNavigation('/admin/profile')}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3.5 group"
                >
                  <div
                    className="w-[16px] h-[16px] flex-shrink-0 transition-colors bg-current text-gray-400 dark:text-[#A3B19B] group-hover:text-[#D6B53B]"
                    style={{
                      maskImage: `url('/profile-user.png'), url('/profile-user.png')`,
                      WebkitMaskImage: `url('/profile-user.png'), url('/profile-user.png')`,
                      maskSize: 'contain',
                      WebkitMaskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      WebkitMaskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      WebkitMaskPosition: 'center'
                    }}
                  />
                  <span className="text-[13px] font-medium tracking-wide text-gray-800 dark:text-[#F4F4F0] group-hover:text-black dark:group-hover:text-white transition-colors">My Profile</span>
                </button>
                <button
                  onClick={() => handleNavigation('/admin/settings')}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3.5 group mt-0.5"
                >
                  <div
                    className="w-[16px] h-[16px] flex-shrink-0 transition-colors bg-current text-gray-400 dark:text-[#A3B19B] group-hover:text-[#D6B53B]"
                    style={{
                      maskImage: `url('/profile-settings.png'), url('/profile-settings.png')`,
                      WebkitMaskImage: `url('/profile-settings.png'), url('/profile-settings.png')`,
                      maskSize: 'contain',
                      WebkitMaskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      WebkitMaskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      WebkitMaskPosition: 'center'
                    }}
                  />
                  <span className="text-[13px] font-medium tracking-wide text-gray-800 dark:text-[#F4F4F0] group-hover:text-black dark:group-hover:text-white transition-colors">Settings</span>
                </button>
              </div>

              {/* Logout Footer */}
              <div className="p-2 border-t border-gray-50 dark:border-white/5 bg-gray-50/30 dark:bg-[#1A2218]/50">
                <button
                  onClick={() => signOut({ callbackUrl: '/admin' })}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-3.5 group"
                >
                  <i className="fi fi-rr-sign-out-alt text-[15px] text-red-400 group-hover:text-red-500 transition-colors"></i>
                  <span className="text-[13px] font-semibold tracking-wide text-red-500 group-hover:text-red-600 transition-colors">Sign out</span>
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
