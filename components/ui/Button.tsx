import React from 'react';
import Link from 'next/link';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'terracotta';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#D5F36A] hover:bg-[#C8E85B] text-[#111820] font-semibold shadow-sm hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-[#111820]',
  secondary:
    'bg-[#111820] hover:bg-[#1E293B] text-white font-semibold shadow-sm hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-[#D5F36A]',
  outline:
    'bg-white hover:bg-[#F1EEE7] text-[#111820] font-medium border border-[#66717D]/30 shadow-xs focus-visible:ring-2 focus-visible:ring-[#111820]',
  ghost:
    'bg-transparent hover:bg-[#EBE8E1] text-[#111820] font-medium focus-visible:ring-2 focus-visible:ring-[#111820]',
  terracotta:
    'bg-[#B9674B] hover:bg-[#A8583D] text-white font-semibold shadow-sm hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-[#111820]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-full gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-full gap-2',
  lg: 'px-7 py-3.5 text-base rounded-full gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  href,
  icon,
  iconPosition = 'right',
  className = '',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const baseClass = `inline-flex items-center justify-center font-sans transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  const content = (
    <>
      {icon && iconPosition === 'left' && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="inline-flex shrink-0">{icon}</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseClass}>
        {content}
      </Link>
    );
  }

  return (
    <button className={baseClass} disabled={disabled} {...rest}>
      {content}
    </button>
  );
}
