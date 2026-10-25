'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserRole } from '@/lib/types';
import {
  DEMO_PERSONAS,
  DemoPersona,
  signInAsDemoUser,
  signInWithPhone,
  getSafeReturnUrl,
} from '@/lib/auth';

export function SignInView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract safe return URL
  const rawRedirect =
    searchParams.get('redirect') ||
    searchParams.get('next') ||
    searchParams.get('returnUrl');
  const roleParam = searchParams.get('role') as UserRole | null;

  // Selected persona state (default to Dawit or matching role)
  const defaultPersona = useMemo(() => {
    if (roleParam) {
      const match = DEMO_PERSONAS.find((p) => p.systemRole === roleParam && p.status === 'active');
      if (match) return match;
    }
    return DEMO_PERSONAS[0];
  }, [roleParam]);

  const [selectedPersona, setSelectedPersona] = useState<DemoPersona>(defaultPersona);
  const [phoneNumber, setPhoneNumber] = useState<string>(defaultPersona.displayPhone);
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Determine fallback route based on role
  const getRoleFallback = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return '/dashboard/admin';
      case 'owner':
        return '/dashboard/host';
      case 'renter':
      default:
        return '/dashboard';
    }
  };

  // Perform safe sign-in and redirect
  const executeSignIn = (persona: DemoPersona) => {
    setErrorMessage(null);

    // Guard suspended accounts
    if (persona.status === 'suspended') {
      setAuthStatus('error');
      setErrorMessage(
        `Account Suspended: Demo account "${persona.name}" has been suspended due to policy or identity verification flags. Sign-in is blocked.`
      );
      return;
    }

    setAuthStatus('loading');

    setTimeout(() => {
      const result = signInAsDemoUser(persona.id, roleParam || persona.systemRole);

      if (!result.success || !result.session) {
        setAuthStatus('error');
        setErrorMessage(result.error || 'Failed to authenticate demo persona.');
        return;
      }

      setAuthStatus('success');

      // Determine safe redirect destination
      const fallbackUrl = getRoleFallback(result.session.activeRole);
      const targetDestination = getSafeReturnUrl(rawRedirect, fallbackUrl);

      setTimeout(() => {
        router.push(targetDestination);
      }, 400);
    }, 600);
  };

  // Handle persona selection
  const handleSelectPersona = (persona: DemoPersona) => {
    setSelectedPersona(persona);
    setPhoneNumber(persona.displayPhone);
    setErrorMessage(null);
    setAuthStatus('idle');

    if (persona.status === 'suspended') {
      setErrorMessage(
        `Notice: "${persona.name}" is designated as a Suspended Demo Account to verify that security status checks properly block unauthorized access.`
      );
    }
  };

  // Handle manual form submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!phoneNumber.trim()) {
      setErrorMessage('Please enter an Ethiopian mobile phone number.');
      return;
    }

    setAuthStatus('loading');

    setTimeout(() => {
      const result = signInWithPhone(phoneNumber, roleParam || undefined);

      if (!result.success || !result.session) {
        setAuthStatus('error');
        setErrorMessage(
          result.error ||
            'No verified account matches this phone number. Try selecting one of the profiles above or enter +251 91 122 3344.'
        );
        return;
      }

      setAuthStatus('success');

      const fallbackUrl = getRoleFallback(result.session.activeRole);
      const targetDestination = getSafeReturnUrl(rawRedirect, fallbackUrl);

      setTimeout(() => {
        router.push(targetDestination);
      }, 400);
    }, 600);
  };

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] flex items-stretch bg-[#F5F2EB]">
      <section className="w-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden shadow-2xl">
        {/* Left Column: Obsidian Editorial & Prototype Sandbox (5 cols) */}
        <div className="lg:col-span-5 bg-[#111820] text-white flex flex-col justify-between p-8 sm:p-12 xl:p-16 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#D5F36A]/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-black/40 blur-2xl pointer-events-none" />

          {/* Header & Brandmark */}
          <div className="relative z-10 space-y-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#CEEC64] flex items-center justify-center text-[#171E00] shadow-md font-bold text-xl">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  directions_car
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-white">
                  SHEGGAR <span className="text-[#D5F36A]">WHEELS</span>
                </span>
                <span className="font-label-caps text-[10px] uppercase text-[#7D848F] tracking-widest">
                  Urban Carsharing Protocol
                </span>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#D5F36A] font-label-caps text-[10px] tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-[#D5F36A] animate-ping" />
                Addis Ababa Metropolitan Network
              </div>
              <h1 className="text-3xl sm:text-4xl text-white font-bold leading-tight tracking-tight">
                Addis Ababa’s trusted peer-to-peer automotive network.
              </h1>
              <p className="text-sm text-[#C5C6CB] max-w-md leading-relaxed">
                Direct vehicle reservations, decentralized host telemetry, and automated escrow guarantees crafted specifically for the capital&apos;s mobility landscape.
              </p>
            </div>

            {/* Pillar List */}
            <div className="space-y-5 pt-2">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-white/5 text-[#D5F36A] text-lg mt-0.5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">verified_user</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-white">Verified Hosts across 6 Sheggar Hubs</p>
                  <p className="text-xs text-[#C5C6CB]">
                    Bole International, Kazanchis, Old Airport, Sarbet, CMC, and Piassa terminal hubs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-white/5 text-[#D5F36A] text-lg mt-0.5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-white">Automated TeleBirr Escrow Protection</p>
                  <p className="text-xs text-[#C5C6CB]">
                    Zero cash handover required. Security bond released within 120 minutes of vehicle check-in.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-white/5 text-[#D5F36A] text-lg mt-0.5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">price_check</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-white">Transparent ETB Rates &amp; Zero Surcharges</p>
                  <p className="text-xs text-[#C5C6CB]">
                    Published daily tariffs inclusive of standard municipal insurance and kilometer quotas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice Banner */}
          <div className="relative z-10 mt-12 pt-6 bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#D5F36A] text-[#111820] text-[10px] font-bold uppercase tracking-wider">
                Instant Authentication Portal
              </span>
              <span className="text-[#C5C6CB] text-[10px] font-specs-tabular">PROD v2.4</span>
            </div>
            <p className="text-xs text-[#C5C6CB] leading-relaxed">
              Fast, secure access to Shegger Wheels. Switch between verified renter, vehicle host, and administrative operations with single-click role validation and multi-factor protocol compliance.
            </p>
          </div>
        </div>

        {/* Right Column: Authentication & Interactive Persona Switcher (7 cols) */}
        <div className="lg:col-span-7 bg-[#FCF9F2] p-8 sm:p-12 xl:p-16 flex flex-col justify-between">
          <div className="max-w-2xl mx-auto w-full space-y-8">
            {/* Header Strip */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-[11px] uppercase text-[#536600] font-bold tracking-widest">
                  Identity &amp; Access Gateway
                </span>
                <div className="flex items-center gap-1.5 text-xs text-[#66717D] font-specs-tabular">
                  <span className="w-2 h-2 rounded-full bg-[#536600] animate-pulse" />
                  Gateway: Active (200 OK)
                </div>
              </div>
              <h2 className="text-3xl font-bold text-[#111820] tracking-tight">
                Welcome to Sheggar Wheels
              </h2>
              <p className="text-sm text-[#66717D] leading-relaxed">
                Choose an account profile below to access your dashboard, or sign in directly with your Ethiopian mobile phone number.
              </p>

              {/* Account Switcher Guide */}
              <div className="p-3 rounded-xl bg-[#EBE8E1]/70 border border-[#66717D]/15 text-xs text-[#44474B] flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[#536600]">verified_user</span>
                <span>
                  <strong>Account Directory:</strong> Select an active profile below to sign in instantly. Kibreab Tesfaye demonstrates suspended account security protections.
                </span>
              </div>
            </div>

            {/* Error / Success Banners */}
            {errorMessage && (
              <div
                className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 transition-all ${
                  selectedPersona.status === 'suspended'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
                role="alert"
              >
                <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">warning</span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold">Authentication Notice</span>
                  <p className="leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {authStatus === 'success' && (
              <div
                className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm flex items-center gap-3 animate-fade-in"
                role="status"
              >
                <span className="material-symbols-outlined text-lg">check_circle</span>
                <span className="font-bold">
                  Access Granted as {selectedPersona.name} ({selectedPersona.role}) • Redirecting safely...
                </span>
              </div>
            )}

            {/* 4 Persona Switcher Cards */}
            <div className="space-y-3.5" id="persona-selector-container">
              {DEMO_PERSONAS.map((persona) => {
                const isSelected = selectedPersona.id === persona.id;
                const isSuspended = persona.status === 'suspended';

                return (
                  <div
                    key={persona.id}
                    onClick={() => handleSelectPersona(persona)}
                    className={`cursor-pointer transition-all duration-200 p-5 rounded-2xl bg-white border ${
                      isSelected
                        ? isSuspended
                          ? 'ring-2 ring-[#B9674B] border-[#B9674B] shadow-md'
                          : 'ring-2 ring-[#111820] border-[#111820] shadow-md'
                        : 'border-[#66717D]/18 hover:border-[#111820]/40 shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="relative shrink-0">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base ${
                              isSuspended
                                ? 'bg-red-100 text-red-800'
                                : isSelected
                                ? 'bg-[#111820] text-[#D5F36A]'
                                : 'bg-[#EBE8E1] text-[#111820]'
                            }`}
                          >
                            {persona.initials}
                          </div>
                          <span
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white font-bold ${
                              isSuspended ? 'bg-red-600' : 'bg-[#536600]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              {isSuspended ? 'close' : 'check'}
                            </span>
                          </span>
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-sm text-[#111820]">{persona.name}</h3>
                            <span
                              className={`px-2 py-0.5 rounded-full font-label-caps text-[9px] uppercase font-bold ${
                                isSuspended
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : 'bg-[#EBE8E1] text-[#44474B]'
                              }`}
                            >
                              {persona.role}
                            </span>
                            {persona.isDefault && (
                              <span className="px-2 py-0.5 rounded-full bg-[#D5F36A]/40 text-[#2C3800] text-[9px] font-bold">
                                Primary Account
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-xs font-semibold mt-0.5 ${
                              isSuspended ? 'text-red-700' : 'text-[#536600]'
                            }`}
                          >
                            {persona.subtitle}
                          </p>
                          <p className="text-xs text-[#66717D] mt-1 leading-relaxed">
                            {persona.description}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={authStatus === 'loading'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPersona(persona);
                          executeSignIn(persona);
                        }}
                        className={`px-4 py-2.5 rounded-full font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap self-start sm:self-center cursor-pointer ${
                          isSuspended
                            ? 'bg-red-100 hover:bg-red-200 text-red-800'
                            : isSelected
                            ? 'bg-[#D5F36A] hover:bg-[#C8E85B] text-[#111820]'
                            : 'bg-[#EBE8E1] hover:bg-[#DCDAD3] text-[#111820]'
                        }`}
                      >
                        <span>
                          {isSuspended
                            ? 'Test Blocked Status'
                            : isSelected
                            ? `Continue as ${persona.name.split(' ')[0]}`
                            : `Switch to ${persona.name.split(' ')[0]}`}
                        </span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Manual Sign-In Form Surface */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#66717D]/18 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#111820]">
                  Or sign in with mobile phone number
                </h4>
                <span className="font-label-caps text-[10px] text-[#66717D] uppercase tracking-wider font-bold">
                  SMS / OTP Verification
                </span>
              </div>

              <form className="space-y-4" onSubmit={handleManualSubmit}>
                {/* Ethiopian Phone Number Input */}
                <div className="space-y-1.5">
                  <label className="block font-label-caps text-[10px] uppercase text-[#66717D] font-bold">
                    Ethiopian Mobile Phone Number
                  </label>
                  <div className="flex items-center rounded-2xl bg-[#F6F3EC] px-3 py-2.5 border border-[#66717D]/20 focus-within:border-[#111820] transition-colors">
                    {/* Ethiopia Flag Badge */}
                    <div className="flex items-center gap-1.5 pr-3 select-none">
                      <span className="text-base">🇪🇹</span>
                      <span className="font-specs-tabular text-xs font-bold text-[#111820]">+251</span>
                    </div>
                    <div className="h-5 w-px bg-[#66717D]/30 mr-3" />
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="91 122 3344"
                      className="w-full bg-transparent font-specs-tabular text-xs text-[#111820] outline-none placeholder:text-[#66717D]"
                    />
                  </div>
                </div>

                {/* Pre-filled Token / OTP */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-label-caps text-[10px] uppercase text-[#66717D] font-bold">
                      Authentication Token / OTP
                    </label>
                    <span className="font-label-caps text-[10px] text-[#536600] font-bold">
                      Pre-verified for instant access
                    </span>
                  </div>
                  <div className="flex items-center rounded-2xl bg-[#F6F3EC] px-3 py-2.5 border border-[#66717D]/20">
                    <span className="material-symbols-outlined text-[16px] text-[#66717D] mr-2">lock</span>
                    <input
                      type="password"
                      readOnly
                      value="SHGR-994821-AUTH"
                      className="w-full bg-transparent font-specs-tabular text-xs text-[#111820] outline-none tracking-widest cursor-not-allowed"
                    />
                    <span className="px-2 py-0.5 rounded-lg bg-[#EBE8E1] text-[#111820] text-[10px] font-specs-tabular font-bold">
                      VERIFIED
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={authStatus === 'loading'}
                  className="w-full py-3.5 px-6 rounded-full bg-[#111820] hover:bg-[#1E293B] text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {authStatus === 'loading' ? (
                    <span>Verifying Demo Credentials...</span>
                  ) : (
                    <>
                      <span>Sign In as {selectedPersona.name} ({selectedPersona.role})</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              {/* Protocol Verification Notice */}
              <div className="p-4 rounded-2xl bg-[#EBE8E1]/60 border border-[#66717D]/15 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#536600] text-lg shrink-0 mt-0.5">info</span>
                <div className="text-xs text-[#44474B] leading-relaxed">
                  <span className="font-bold text-[#111820]">Protocol Verification Notice:</span> Suspended or unverified accounts trigger an immediate security block. All active pre-configured personas above hold active validation certificates.
                </div>
              </div>
            </div>

            {/* Footer Navigation Links */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4 text-xs text-[#66717D]">
              <Link
                href="/cars"
                className="inline-flex items-center gap-1.5 hover:text-[#111820] transition-colors font-semibold"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>Return to Fleet Catalogue</span>
              </Link>
              <div className="flex items-center gap-4">
                <Link href="/#how-it-works" className="hover:text-[#111820] transition-colors">
                  System Telemetry
                </Link>
                <span className="text-[#66717D]/30">•</span>
                <span className="hover:text-[#111820] cursor-pointer">
                  Escrow Security Specs
                </span>
                <span className="text-[#66717D]/30">•</span>
                <span className="font-specs-tabular">v2.4.0-addis</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
