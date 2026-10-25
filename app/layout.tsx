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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://shegger-wheels-cyan.vercel.app');

const baseUrl = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    template: "%s · Shegger Wheels",
    default: "Shegger Wheels — Peer-to-Peer Car Rental in Addis Ababa",
  },
  description:
    "Peer-to-peer car rental marketplace for Addis Ababa. Rent verified vehicles directly from local owners with TeleBirr escrow protection.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Shegger Wheels — Peer-to-Peer Car Rental in Addis Ababa",
    description:
      "Peer-to-peer car rental marketplace for Addis Ababa. Rent verified vehicles directly from local owners with TeleBirr escrow protection.",
    url: "/",
    siteName: "Shegger Wheels",
    locale: "en_ET",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shegger Wheels — Peer-to-Peer Car Rental in Addis Ababa",
    description:
      "Peer-to-peer car rental marketplace for Addis Ababa. Rent verified vehicles directly from local owners with TeleBirr escrow protection.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
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
