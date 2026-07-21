'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import type { Role } from '@prisma/client';

const menuItems = [
  { name: 'Dashboard', path: '/admin/dashboard', imageIcon: '/dashboard.png' },
  { name: 'Booking Management', path: '/admin/bookings', imageIcon: '/booking.png' },
  { name: 'Contract Management', path: '/admin/contracts', flaticonClass: 'fi fi-rr-file-signature' },
  { name: 'Payment & History', path: '/admin/payments', flaticonClass: 'fi fi-rr-wallet' },
  { name: 'Calendar', path: '/admin/calendar', imageIcon: '/calendar.png' },
  { name: 'Services and Packages', path: '/admin/services', imageIcon: '/services.png', superadminOnly: true },
  { name: 'Inquiries', path: '/admin/inquiries', imageIcon: '/inquiries.png' },
  { name: 'Testimonies', path: '/admin/testimonies', flaticonClass: 'fi fi-rr-comment-quote' },
  { name: 'ZENTRA Command Center', path: '/admin/command-center', imageIcon: '/support.png' },
  { name: 'Reports & Analytics', path: '/admin/reports', imageIcon: '/reports.png' },
  { name: 'System Logs', path: '/admin/audit', imageIcon: '/audit.png' },
  { name: 'Team', path: '/admin/team', flaticonClass: 'fi fi-rr-users', superadminOnly: true },
];

export default function AdminSidebar({ 
  isCollapsed, 
  isMobileOpen,
  onMobileClose,
  onToggle,
  currentUserRole,
}: { 
  isCollapsed: boolean; 
  isMobileOpen: boolean;
  onMobileClose: () => void;
  onToggle: () => void;
  currentUserRole: Extract<Role, 'SUPERADMIN' | 'ADMIN'>;
}) {
  const pathname = usePathname();
  const visibleMenuItems = menuItems.filter(
    (item) => !item.superadminOnly || currentUserRole === 'SUPERADMIN',
  );

  return (
    <>
      <button
        aria-label="Close admin navigation"
        className={`fixed inset-0 z-[55] bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 md:hidden ${
          isMobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onMobileClose}
        tabIndex={isMobileOpen ? 0 : -1}
        type="button"
      />
      <aside
        aria-label="Admin navigation"
        className={`fixed left-0 top-0 z-[60] flex h-dvh w-[min(86vw,280px)] flex-col border-r border-[#D6B53B]/20 bg-gradient-to-b from-white to-[#FDF5CC]/20 shadow-[4px_0_24px_rgba(214,181,59,0.05)] transition-[width,transform,background-color] duration-300 ease-in-out dark:border-white/5 dark:from-[#0C100B] dark:to-[#141A13] dark:shadow-[4px_0_24px_rgba(0,0,0,0.5)] ${
          isMobileOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'
        } ${isCollapsed ? 'md:w-[80px]' : 'md:w-[280px]'} md:visible md:translate-x-0`}
        id="admin-navigation"
      >
      {/* Logo & Hamburger area */}
      <div className={`flex h-20 items-center justify-between border-b border-[#D6B53B]/10 px-5 transition-all duration-300 dark:border-white/5 ${isCollapsed ? 'md:justify-center md:px-3' : ''}`}>
        
        {/* Logo - Fades out and shrinks when collapsed */}
        <div className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed ? 'md:w-0 md:overflow-hidden md:opacity-0' : 'md:w-auto md:opacity-100'}`}>
          <div className="relative w-11 h-11 flex-shrink-0">
            <Image 
              src="/zion-logo.png" 
              alt="Zion Logo" 
              fill
              sizes="44px"
              className="object-contain drop-shadow-sm brightness-0 dark:invert transition-all duration-500" 
            />
          </div>
          <div className="flex flex-col justify-center pt-1">
            <span className="font-sahitya font-bold text-[#1a1f18] dark:text-[#F4F4F0] text-[12px] leading-none tracking-widest uppercase whitespace-nowrap transition-colors duration-500">
              Zion Events Place
            </span>
            <span className="font-sans font-semibold text-gray-400 dark:text-[#A3B19B] text-[9px] tracking-[0.2em] uppercase whitespace-nowrap mt-1 transition-colors duration-500">
              Admin Panel
            </span>
          </div>
        </div>

        {/* Toggle Button / Collapsed Logo Area */}
        <button
          aria-label="Close admin navigation"
          className="touch-target flex items-center justify-center rounded-full text-[#1a1f18] transition-colors hover:bg-[#D6B53B]/10 hover:text-[#BEA542] dark:text-[#A3B19B] dark:hover:bg-white/5 dark:hover:text-[#D6B53B] md:hidden"
          onClick={onMobileClose}
          type="button"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <button 
          onClick={onToggle}
          className={`group hidden cursor-pointer flex-shrink-0 items-center justify-center text-[#1a1f18] transition-all duration-300 hover:text-[#BEA542] focus:outline-none dark:text-[#A3B19B] dark:hover:text-[#D6B53B] md:flex ${isCollapsed ? 'relative h-12 w-12 rounded-full hover:bg-white/40 hover:shadow-sm dark:hover:bg-white/5' : 'rounded-full p-2 hover:bg-[#D6B53B]/10 hover:shadow-sm dark:hover:bg-white/5'}`}
          aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {/* Expanded State: Left Panel Close Button */}
          {!isCollapsed && (
            <span className="material-symbols-outlined text-xl flex items-center justify-center transition-transform duration-300 group-hover:-translate-x-1">
              left_panel_close
            </span>
          )}

          {/* Collapsed State: Logo (default) -> Left Panel Open (hover) */}
          {isCollapsed && (
            <>
              {/* Collapsed Logo */}
              <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 opacity-100 scale-100 group-hover:opacity-0 group-hover:scale-75">
                <div className="relative w-8 h-8">
                  <Image 
                    src="/zion-logo.png" 
                    alt="Zion Logo" 
                    fill
                    sizes="32px"
                    className="object-contain drop-shadow-sm brightness-0 dark:invert transition-all duration-500" 
                  />
                </div>
              </div>

              {/* Hover Left Panel Open */}
              <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100">
                <div className="w-10 h-10 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl transition-transform duration-300 group-hover:translate-x-1">
                    left_panel_open
                  </span>
                </div>
              </div>
            </>
          )}
        </button>
      </div>

      {/* Navigation Links - Scrollbar Hidden */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 flex flex-col gap-2 px-3 no-scrollbar">
        {visibleMenuItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
          return (
            <Link key={item.path} href={item.path} onClick={onMobileClose}>
              <div 
                className={`flex items-center rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#D6B53B]/10 dark:from-[#D6B53B]/20 to-transparent border-l-4 border-[#D6B53B] text-[#D6B53B]' 
                    : 'border-l-4 border-transparent hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 dark:text-[#A3B19B] hover:text-[#BEA542] dark:hover:text-[#D6B53B]'
                } justify-start px-4 py-3 ${isCollapsed ? 'md:justify-center md:px-0' : 'md:justify-start md:px-4'}`}
                title={isCollapsed ? item.name : undefined}
              >
                {item.imageIcon ? (
                  <div 
                    className={`mr-[14px] h-[22px] w-[22px] flex-shrink-0 bg-current transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'} ${isCollapsed ? 'md:mr-0' : 'md:mr-[14px]'}`}
                    style={{
                      maskImage: `url('${item.imageIcon}'), url('${item.imageIcon}')`,
                      WebkitMaskImage: `url('${item.imageIcon}'), url('${item.imageIcon}')`,
                      maskSize: 'contain',
                      WebkitMaskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      WebkitMaskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      WebkitMaskPosition: 'center'
                    }}
                  />
                ) : (
                  <i className={`${item.flaticonClass} mr-4 flex flex-shrink-0 items-center justify-center text-xl transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'} ${isCollapsed ? 'md:mr-0' : 'md:mr-4'}`}></i>
                )}
                
                <span className={`w-auto whitespace-nowrap font-sans text-[13px] font-semibold tracking-wide opacity-100 transition-all duration-300 ${isCollapsed ? 'md:hidden md:w-0 md:opacity-0' : 'md:inline'}`}>
                  {item.name}
                </span>

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="invisible absolute left-14 z-50 hidden whitespace-nowrap rounded border bg-[#1a1f18] px-2 py-1 text-xs font-bold text-white opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100 dark:border-white/10 dark:bg-white dark:text-[#1a1f18] md:block">
                    {item.name}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-[#D6B53B]/10 dark:border-white/5 transition-colors duration-500">
        <button
          onClick={() => signOut({ callbackUrl: '/admin' })}
          className={`flex w-full items-center justify-start rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-gray-600 shadow-sm transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-[#A3B19B] dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 ${
            isCollapsed ? 'md:justify-center md:px-0' : 'md:px-4'
          }`}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <i className={`fi fi-rr-power mr-2 flex flex-shrink-0 items-center justify-center text-xl ${isCollapsed ? 'md:mr-0' : 'md:mr-2'}`}></i>
          <span className={`w-auto whitespace-nowrap font-sans text-sm font-semibold tracking-wide opacity-100 transition-all duration-300 ${isCollapsed ? 'md:hidden md:w-0 md:opacity-0' : 'md:inline'}`}>
            Logout
          </span>
        </button>
      </div>

      </aside>
    </>
  );
}
