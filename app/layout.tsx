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
      <body className="min-h-screen flex flex-col bg-zentra-bg overflow-x-hidden">
        <GlobalHeader />
        {children}
        <Footer />
      </body>
    </html>
  );
}

