import React from 'react';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export function Container({
  children,
  className = '',
  as: Component = 'div',
  ...rest
}: ContainerProps) {
  return (
    <Component
      className={`w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}
