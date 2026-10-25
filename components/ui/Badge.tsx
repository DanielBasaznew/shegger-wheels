import React from 'react';

export type BadgeVariant = 'citron' | 'obsidian' | 'terracotta' | 'neutral' | 'white' | 'success';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  citron: 'bg-[#D5F36A]/30 text-[#2C3800] border border-[#B6D24D]',
  obsidian: 'bg-[#111820] text-white border border-[#111820]',
  terracotta: 'bg-[#B9674B]/15 text-[#76331B] border border-[#B9674B]/30',
  neutral: 'bg-[#EBE8E1] text-[#44474B] border border-[#66717D]/20',
  white: 'bg-white text-[#111820] border border-[#66717D]/25 shadow-xs',
  success: 'bg-emerald-50 text-emerald-900 border border-emerald-200',
};

export function Badge({
  variant = 'neutral',
  children,
  dot = false,
  className = '',
  ...rest
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-caps text-[10px] tracking-wider uppercase select-none ${variantStyles[variant]} ${className}`}
      {...rest}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === 'citron'
              ? 'bg-[#536600]'
              : variant === 'terracotta'
              ? 'bg-[#B9674B]'
              : variant === 'success'
              ? 'bg-emerald-600'
              : 'bg-current'
          }`}
        />
      )}
      {children}
    </span>
  );
}
