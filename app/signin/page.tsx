import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { SignInView } from '@/components/auth/SignInView';

export const metadata: Metadata = {
  title: 'Demo Sign In — Shegger Wheels',
  description:
    'Sign in to explore Shegger Wheels peer-to-peer mobility platform using pre-configured Addis Ababa demo personas.',
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
