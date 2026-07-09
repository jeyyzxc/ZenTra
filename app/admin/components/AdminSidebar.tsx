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
  { name: 'Support Center', path: '/admin/support', imageIcon: '/support.png' },
  { name: 'Reports & Analytics', path: '/admin/reports', imageIcon: '/reports.png' },
  { name: 'System Logs', path: '/admin/audit', imageIcon: '/audit.png' },
  { name: 'Team', path: '/admin/team', flaticonClass: 'fi fi-rr-users', superadminOnly: true },
];

export default function AdminSidebar({ 
  isCollapsed, 
  onToggle,
  currentUserRole,
}: { 
  isCollapsed: boolean; 
  onToggle: () => void;
  currentUserRole: Extract<Role, 'SUPERADMIN' | 'ADMIN'>;
}) {
  const pathname = usePathname();
  const visibleMenuItems = menuItems.filter(
    (item) => !item.superadminOnly || currentUserRole === 'SUPERADMIN',
  );

  return (
    <div 
      className={`h-screen bg-gradient-to-b from-white to-[#FDF5CC]/20 dark:from-[#0C100B] dark:to-[#141A13] flex flex-col fixed left-0 top-0 border-r border-[#D6B53B]/20 dark:border-white/5 z-50 transition-colors duration-500 ease-in-out shadow-[4px_0_24px_rgba(214,181,59,0.05)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.5)] ${
        isCollapsed ? 'w-[80px]' : 'w-[80px] md:w-[280px]'
      }`}
    >
      {/* Logo & Hamburger area */}
      <div className={`h-20 flex items-center border-b border-[#D6B53B]/10 dark:border-white/5 transition-all duration-300 px-3 md:px-5 ${isCollapsed ? 'justify-center' : 'justify-center md:justify-between'}`}>
        
        {/* Logo - Fades out and shrinks when collapsed */}
        <div className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'max-md:w-0 max-md:overflow-hidden max-md:opacity-0 md:w-auto md:opacity-100'}`}>
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
          onClick={onToggle}
          className={`group cursor-pointer flex-shrink-0 transition-all duration-300 flex items-center justify-center text-[#1a1f18] dark:text-[#A3B19B] hover:text-[#BEA542] dark:hover:text-[#D6B53B] focus:outline-none ${isCollapsed ? 'w-12 h-12 relative rounded-full hover:shadow-sm hover:bg-white/40 dark:hover:bg-white/5' : 'p-2 rounded-full hover:bg-[#D6B53B]/10 dark:hover:bg-white/5 hover:shadow-sm'}`}
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
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div 
                className={`flex items-center rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#D6B53B]/10 dark:from-[#D6B53B]/20 to-transparent border-l-4 border-[#D6B53B] text-[#D6B53B]' 
                    : 'border-l-4 border-transparent hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 dark:text-[#A3B19B] hover:text-[#BEA542] dark:hover:text-[#D6B53B]'
                } ${isCollapsed ? 'justify-center py-3 px-0' : 'justify-center px-0 py-3 md:justify-start md:px-4'}`}
                title={isCollapsed ? item.name : undefined}
              >
                {item.imageIcon ? (
                  <div 
                    className={`w-[22px] h-[22px] flex-shrink-0 transition-transform duration-300 bg-current ${isActive ? 'scale-110' : 'group-hover:scale-110'} ${isCollapsed ? 'mr-0' : 'mr-0 md:mr-[14px]'}`}
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
                  <i className={`${item.flaticonClass} text-xl flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'} ${isCollapsed ? 'mr-0' : 'mr-0 md:mr-4'} flex items-center justify-center`}></i>
                )}
                
                <span className={`font-sans text-[13px] font-semibold tracking-wide whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'hidden w-auto opacity-100 md:inline'}`}>
                  {item.name}
                </span>

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-14 bg-[#1a1f18] dark:bg-white text-white dark:text-[#1a1f18] font-bold text-xs px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg border dark:border-white/10">
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
          className={`flex items-center justify-center bg-gray-100 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 text-gray-600 dark:text-[#A3B19B] rounded-xl transition-all duration-200 shadow-sm active:scale-95 border border-gray-200 dark:border-white/10 hover:border-red-200 dark:hover:border-red-500/30 ${
            isCollapsed ? 'w-full py-3 px-0' : 'w-full px-0 py-3 md:px-4'
          }`}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <i className={`fi fi-rr-power text-xl flex items-center justify-center flex-shrink-0 ${isCollapsed ? 'mr-0' : 'mr-0 md:mr-2'}`}></i>
          <span className={`font-sans font-semibold text-sm tracking-wide whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'hidden w-auto opacity-100 md:inline'}`}>
            Logout
          </span>
        </button>
      </div>

    </div>
  );
}
