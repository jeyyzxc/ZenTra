import type { Metadata } from "next";
import { Inter, Playfair_Display, Alex_Brush, Sahitya } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

const alexBrush = Alex_Brush({
  weight: "400",
  variable: "--font-script",
  subsets: ["latin"],
});

const sahitya = Sahitya({
  weight: "400",
  variable: "--font-sahitya",
  subsets: ["latin"],
});

import GlobalHeader from "./components/GlobalHeader";
import Footer from "./components/Footer";
import SmartGuide from "./components/SmartGuide";
import PublicOnly from "./components/PublicOnly";
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
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${alexBrush.variable} ${sahitya.variable} antialiased`}
    >
      <head>
        <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/2.1.0/uicons-regular-rounded/css/uicons-regular-rounded.css" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body className="min-h-screen flex flex-col bg-zentra-bg text-zentra-primary transition-colors duration-500 ease-in-out dark:bg-[#0C100B] dark:text-[#F4F4F0] overflow-x-hidden">
        <ThemeProvider>
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

