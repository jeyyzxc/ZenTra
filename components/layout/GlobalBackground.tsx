"use client";

import React from "react";

export default function GlobalBackground() {
  return (
    <div className="fixed inset-0 w-full h-full -z-50 pointer-events-none overflow-hidden bg-white dark:bg-[#0C100B]">
      {/* Left side gold gradient */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#FBF4C4] via-white/0 to-transparent dark:from-[#111610] dark:via-[#0C100B]/0 dark:to-transparent"></div>
      
      {/* Right side gold gradient (mirrored) */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-bl from-[#FBF4C4] via-white/0 to-transparent dark:from-[#111610] dark:via-[#0C100B]/0 dark:to-transparent"></div>
    </div>
  );
}
