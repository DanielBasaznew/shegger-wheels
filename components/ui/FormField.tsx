import React from 'react';

export interface FormFieldProps {
  label: string;
  id?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  id,
  error,
  hint,
  required,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={id}
        className="font-label-caps text-[11px] uppercase tracking-wider text-[#44474B] flex items-center gap-1"
      >
        <span>{label}</span>
        {required && <span className="text-[#B9674B] font-bold">*</span>}
      </label>

      {children}

      {hint && !error && (
        <span className="text-xs text-[#66717D] mt-0.5">{hint}</span>
      )}

      {error && (
        <span className="text-xs font-medium text-[#B9674B] mt-0.5">{error}</span>
      )}
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ icon, error, className = '', ...rest }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3.5 text-[#66717D] pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full bg-white text-[#111820] placeholder-[#66717D]/60 text-sm rounded-xl py-3 border transition-colors outline-none ${
            icon ? 'pl-10 pr-4' : 'px-4'
          } ${
            error
              ? 'border-[#B9674B] focus:ring-2 focus:ring-[#B9674B]/20'
              : 'border-[#66717D]/25 focus:border-[#111820] focus:ring-2 focus:ring-[#111820]/10'
          } ${className}`}
          {...rest}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: React.ReactNode;
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ icon, error, className = '', children, ...rest }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3.5 text-[#66717D] pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <select
          ref={ref}
          className={`w-full bg-white text-[#111820] text-sm rounded-xl py-3 border appearance-none transition-colors outline-none cursor-pointer ${
            icon ? 'pl-10 pr-10' : 'px-4 pr-10'
          } ${
            error
              ? 'border-[#B9674B] focus:ring-2 focus:ring-[#B9674B]/20'
              : 'border-[#66717D]/25 focus:border-[#111820] focus:ring-2 focus:ring-[#111820]/10'
          } ${className}`}
          {...rest}
        >
          {children}
        </select>
        <div className="absolute right-3.5 text-[#66717D] pointer-events-none flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }
);
Select.displayName = 'Select';
