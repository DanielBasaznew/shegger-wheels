import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { isOptimizableImage } from '@/lib/storage';

export function Footer() {
  const addisHubs = [
    'Bole',
    'Kazanchis',
    'Old Airport',
    'Piassa',
    'Sarbet',
    'CMC',
  ];

  const logoUrl =
    'https://lh3.googleusercontent.com/aida/AEtjO1Wjf8m02Rb-cwPHgm5cnVZC1CVpL1LFethHyJYd7Th9j3PK34Q9mjRpVzQ8XdKtRKURQWEcNSDvuAsR4KO3b2dFJcQSgdgHB703UShGYlQwineuyfjCBdQY4ATMt4l7E4C7iN6gGxVzg49y05qvpcvJpFPEYrc60X1w46B9s2os5w78rgIqGfOBsIYIS9G-BKP_6P5OoBBtkYEHZ8AbXnb3YlR-WfvBqgsl9mKS8W0tJ9SjYa9cKeUvSA';

  return (
    <footer className="w-full bg-surface-container-low text-on-surface-variant mt-space-xl border-t border-outline-variant/20">
      <div className="max-w-[1360px] mx-auto px-gutter py-space-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-space-lg mb-space-xl">
          {/* Logo & Platform Mission */}
          <div className="lg:col-span-5 flex flex-col gap-space-md">
            <div className="flex items-center gap-space-sm">
              <Image
                alt="Sheggar Wheels Logo"
                className="h-7 w-auto object-contain"
                src={logoUrl}
                width={28}
                height={28}
                unoptimized={!isOptimizableImage(logoUrl)}
              />
              <span className="font-headline-sm text-headline-sm text-on-surface">
                Sheggar Wheels
              </span>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
              Next-generation peer-to-peer automotive mobility in Addis Ababa. Direct, verified car sharing built for effortless metropolitan transit and diaspora expeditions without traditional car rental friction.
            </p>

            <div className="flex items-center gap-space-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-specs-tabular text-specs-tabular">
                <span className="material-symbols-outlined text-secondary text-[18px]">verified_user</span>
                <span>100% Verified Hosts &amp; TeleBirr Escrow</span>
              </div>
            </div>
          </div>

          {/* Active Hubs in Addis */}
          <div className="lg:col-span-3 flex flex-col gap-space-sm">
            <span className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider">
              Active Hubs in Addis
            </span>
            <ul className="flex flex-wrap gap-2">
              {addisHubs.map((hub) => (
                <li
                  key={hub}
                  className="px-2.5 py-1 rounded-lg bg-surface-container font-body-sm text-body-sm text-on-surface"
                >
                  {hub}
                </li>
              ))}
            </ul>
          </div>

          {/* Platform Links */}
          <div className="lg:col-span-2 flex flex-col gap-space-sm">
            <span className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider">
              Platform
            </span>
            <div className="flex flex-col gap-2 font-body-md text-body-md">
              <Link className="text-on-surface-variant hover:text-on-surface transition-colors" href="/cars">
                Fleet Inventory
              </Link>
              <Link className="text-on-surface-variant hover:text-on-surface transition-colors" href="/#how-it-works">
                Protection &amp; Terms
              </Link>
              <Link className="text-on-surface-variant hover:text-on-surface transition-colors" href="/signin?role=owner">
                List Your Car
              </Link>
              <Link className="text-on-surface-variant hover:text-on-surface transition-colors" href="/dashboard">
                Fleet Portal
              </Link>
            </div>
          </div>

          {/* Verification */}
          <div className="lg:col-span-2 flex flex-col gap-space-sm">
            <span className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider">
              Verification
            </span>
            <div className="flex flex-col gap-2 font-body-md text-body-md">
              <span className="text-on-surface-variant">Addis Ababa Transport Bureau Sync</span>
              <span className="text-on-surface-variant">Chapa &amp; TeleBirr Rails</span>
              <span className="text-on-surface-variant">24/7 Roadside Assistance</span>
            </div>
          </div>
        </div>

        {/* Prototype Disclaimer Bar */}
        <div className="pt-space-md bg-surface-container-high/40 rounded-xl px-space-md py-space-sm flex flex-col md:flex-row items-center justify-between gap-space-sm text-center md:text-left">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">info</span>
            <span className="font-specs-tabular text-specs-tabular text-on-surface">
              Simulated Prototype for Demonstration Purposes
            </span>
          </div>
          <span className="font-body-sm text-body-sm text-on-surface-variant">
            © 2025 Sheggar Wheels P2P Inc. Addis Ababa, Ethiopia. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
