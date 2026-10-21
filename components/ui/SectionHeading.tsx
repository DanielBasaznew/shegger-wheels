import React from 'react';

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
  badgeDot?: boolean;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className = '',
  badgeDot = false,
}: SectionHeadingProps) {
  const isCenter = align === 'center';

  return (
    <div
      className={`flex flex-col ${
        isCenter ? 'items-center text-center max-w-2xl mx-auto' : 'items-start text-left max-w-3xl'
      } ${className}`}
    >
      {eyebrow && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBE8E1] text-[#111820] font-label-caps text-[11px] mb-3">
          {badgeDot && <span className="w-1.5 h-1.5 rounded-full bg-[#536600] animate-pulse" />}
          <span>{eyebrow}</span>
        </div>
      )}

      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111820] tracking-tight leading-[1.15]">
        {title}
      </h2>

      {subtitle && (
        <p className="mt-3.5 text-base sm:text-lg text-[#44474B] leading-relaxed max-w-xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}
