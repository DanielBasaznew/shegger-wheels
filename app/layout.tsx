import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Shegger Wheels — Peer-to-Peer Car Rental in Addis Ababa",
  description:
    "Peer-to-peer car rental marketplace for Addis Ababa. Rent verified vehicles directly from local owners or list your car to earn.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F5F2EB] text-[#111820] font-sans selection:bg-[#D5F36A] selection:text-[#111820]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-[#111820] focus:text-[#D5F36A] focus:font-bold focus:shadow-xl focus:ring-2 focus:ring-[#D5F36A] transition-all"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main-content" tabIndex={-1} className="flex-1 pt-20 focus:outline-hidden">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
