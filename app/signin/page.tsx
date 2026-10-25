import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { SignInView } from '@/components/auth/SignInView';

export const metadata: Metadata = {
  title: 'Sign In — Shegger Wheels',
  description:
    'Sign in to access your Shegger Wheels peer-to-peer mobility account.',
};

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full py-24 flex items-center justify-center text-sm font-semibold text-[#66717D]">
          Loading Shegger authentication portal...
        </div>
      }
    >
      <SignInView />
    </Suspense>
  );
}
