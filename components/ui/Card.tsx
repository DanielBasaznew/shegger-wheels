import React from 'react';

export type CardVariant = 'default' | 'flat' | 'obsidian' | 'interactive';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

const variantStyles: Record<CardVariant, string> = {
  default:
    'bg-white text-[#111820] border border-[#66717D]/18 shadow-[0_4px_20px_-2px_rgba(17,24,32,0.04)]',
  flat:
    'bg-[#F1EEE7] text-[#111820] border border-[#66717D]/12',
  obsidian:
    'bg-[#111820] text-white border border-white/10 shadow-lg',
  interactive:
    'bg-white text-[#111820] border border-[#66717D]/18 shadow-[0_4px_20px_-2px_rgba(17,24,32,0.04)] hover:border-[#111820]/40 hover:shadow-[0_8px_24px_-4px_rgba(17,24,32,0.08)] transition-all duration-200 cursor-pointer',
};

export function Card({
  variant = 'default',
  children,
  className = '',
  as: Component = 'div',
  ...rest
}: CardProps) {
  return (
    <Component
      className={`rounded-2xl p-6 ${variantStyles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}
