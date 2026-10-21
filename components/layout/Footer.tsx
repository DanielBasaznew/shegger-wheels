import React from 'react';
import Link from 'next/link';

export function Footer() {
  const addisHubs = [
    'Bole',
    'Kazanchis',
    'Old Airport',
    'Piassa',
    'Sarbet',
    'CMC',
  ];

  return (
    <footer className="w-full bg-[#F6F3EC] text-[#44474B] border-t border-[#66717D]/20 mt-16 sm:mt-24">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-12 mb-12">
          {/* Brand & Mission */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#111820] flex items-center justify-center text-[#D5F36A]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <span className="font-bold text-lg text-[#111820] tracking-tight">
                Shegger Wheels
              </span>
            </div>

            <p className="text-sm leading-relaxed text-[#44474B] max-w-md">
              Next-generation peer-to-peer automotive mobility across Addis Ababa. Direct, verified car sharing built for effortless metropolitan transit, diaspora visits, and weekend journeys without traditional car rental friction.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBE8E1] text-[#111820] text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#536600]" />
                <span>100% Verified Hosts & TeleBirr Escrow</span>
              </div>
            </div>
          </div>

          {/* Active Hubs in Addis */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <span className="font-label-caps text-[11px] text-[#111820] uppercase tracking-wider">
              Active Hubs in Addis
            </span>
            <ul className="flex flex-wrap gap-2">
              {addisHubs.map((hub) => (
                <li
                  key={hub}
                  className="px-3 py-1 rounded-lg bg-[#EBE8E1] text-xs font-medium text-[#111820]"
                >
                  {hub}
                </li>
              ))}
            </ul>
          </div>

          {/* Platform Navigation */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <span className="font-label-caps text-[11px] text-[#111820] uppercase tracking-wider">
              Platform
            </span>
            <div className="flex flex-col gap-2.5 text-sm">
              <Link href="/cars" className="text-[#44474B] hover:text-[#111820] transition-colors">
                Fleet Inventory
              </Link>
              <Link href="/#how-it-works" className="text-[#44474B] hover:text-[#111820] transition-colors">
                Protection & Terms
              </Link>
              <Link href="/signin?role=owner" className="text-[#44474B] hover:text-[#111820] transition-colors">
                List Your Car
              </Link>
              <Link href="/dashboard" className="text-[#44474B] hover:text-[#111820] transition-colors">
                Fleet Portal
              </Link>
            </div>
          </div>

          {/* Verification & Tech */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <span className="font-label-caps text-[11px] text-[#111820] uppercase tracking-wider">
              Verification
            </span>
            <div className="flex flex-col gap-2.5 text-xs text-[#66717D]">
              <span>Addis Ababa Transport Bureau Sync</span>
              <span>Chapa & TeleBirr Rails</span>
              <span>24/7 Roadside Assistance</span>
              <span>Sub-city Key Handover Protocol</span>
            </div>
          </div>
        </div>

        {/* Prototype Disclaimer Bar */}
        <div className="pt-6 border-t border-[#66717D]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-[#536600]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-specs-tabular text-[#111820]">
              Simulated Frontend Prototype • Stored in Browser Storage
            </span>
          </div>

          <span className="text-xs text-[#66717D]">
            © 2025 Shegger Wheels P2P. Addis Ababa, Ethiopia. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
