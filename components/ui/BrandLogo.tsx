'use client';

import React from 'react';

export interface BrandLogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  className?: string;
  inverted?: boolean;
}

export function BrandLogo({
  variant = 'full',
  size = 'md',
  showBadge = false,
  className = '',
  inverted = false,
}: BrandLogoProps) {
  const sizeConfig = {
    sm: { icon: 26, text: 'text-[15px]', sub: 'text-[8px]' },
    md: { icon: 32, text: 'text-[18px]', sub: 'text-[9px]' },
    lg: { icon: 40, text: 'text-[22px]', sub: 'text-[10px]' },
    xl: { icon: 52, text: 'text-[28px]', sub: 'text-[12px]' },
  };

  const { icon, text, sub } = sizeConfig[size];

  const IconEmblem = (
    <div
      style={{ width: icon, height: icon }}
      className="relative shrink-0 rounded-[28%] bg-gradient-to-br from-[#1C2530] via-[#111820] to-[#0A0E13] p-[2px] shadow-[0_2px_8px_rgba(0,0,0,0.18)] ring-1 ring-white/10 flex items-center justify-center transition-transform group-hover:scale-105 duration-200"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-0.5"
      >
        {/* Subtle geometric wheel spoke track */}
        <circle
          cx="18"
          cy="18"
          r="14"
          stroke="#333D4B"
          strokeWidth="1.2"
          strokeDasharray="2 3"
        />

        {/* Dynamic Electric Lime kinetic arc */}
        <path
          d="M7 18C7 11.9249 11.9249 7 18 7C22.2 7 25.8 9.3 27.6 12.8"
          stroke="#D5F36A"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* Counter balanced arc in cool silver */}
        <path
          d="M29 18C29 24.0751 24.0751 29 18 29C13.8 29 10.2 26.7 8.4 23.2"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />

        {/* Precision steering / speed 'S' lettermark */}
        <path
          d="M22 13.5H16C14.6 13.5 13.5 14.6 13.5 16C13.5 17.4 14.6 18.5 16 18.5H20C21.4 18.5 22.5 19.6 22.5 21C22.5 22.4 21.4 23.5 20 23.5H14"
          stroke="#D5F36A"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Kinetic wheel axle center hub */}
        <circle cx="18" cy="18.5" r="1.5" fill="#FFFFFF" />
      </svg>
    </div>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{IconEmblem}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {IconEmblem}
      <div className="flex flex-col leading-none">
        <span
          className={`font-headline-sm ${text} font-extrabold tracking-tight ${
            inverted ? 'text-white' : 'text-on-surface'
          }`}
        >
          Sheggar Wheels
        </span>
        {showBadge && (
          <span
            className={`font-label-caps ${sub} uppercase tracking-widest font-bold mt-0.5 ${
              inverted ? 'text-[#D5F36A]' : 'text-[#536600]'
            }`}
          >
            Addis Ababa
          </span>
        )}
      </div>
    </div>
  );
}
