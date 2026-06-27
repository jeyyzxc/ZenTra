import type { Metadata } from "next";
import "./globals.css";

import GlobalBackground from "@/components/layout/GlobalBackground";
import GlobalHeader from "@/components/layout/GlobalHeader";
import Footer from "@/components/layout/Footer";
import PublicOnly from "@/components/layout/PublicOnly";
import SmartGuide from "@/components/client/SmartGuide";
import { ThemeProvider } from "./context/ThemeContext";

export const metadata: Metadata = {
  title: "Zion Events Place",
  description: "Celebrate life's best moments with the view you'll always remember.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/2.1.0/uicons-regular-rounded/css/uicons-regular-rounded.css" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body className="min-h-screen flex flex-col bg-transparent text-neutral-900 transition-colors duration-500 ease-in-out dark:text-[#F4F4F0] overflow-x-hidden">
        <ThemeProvider>
          <GlobalBackground />
          <PublicOnly>
            <GlobalHeader />
          </PublicOnly>
          {children}
          <PublicOnly>
            <SmartGuide />
            <Footer />
          </PublicOnly>
        </ThemeProvider>
      </body>
    </html>
  );
}
