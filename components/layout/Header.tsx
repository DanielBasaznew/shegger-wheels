'use client';

import React, { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { getUserById } from '@/lib/storage';
import { User, DemoSession } from '@/lib/types';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSessionSnapshot(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.sessionStorage.getItem('sw_session_v1') || '';
  } catch {
    return '';
  }
}

function getServerSnapshot(): string {
  return '';
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const sessionRaw = useSyncExternalStore(subscribe, getSessionSnapshot, getServerSnapshot);
  let session: DemoSession | null = null;
  let currentUser: User | null = null;

  if (sessionRaw) {
    try {
      session = JSON.parse(sessionRaw);
      if (session) {
        currentUser = getUserById(session.userId) || null;
      }
    } catch {
      session = null;
      currentUser = null;
    }
  }

  const navLinks = [
    { href: '/cars', label: 'Explore Cars' },
    { href: '/#how-it-works', label: 'How It Works' },
    { href: '/signin?role=owner', label: 'Host a Vehicle' },
    { href: '/dashboard', label: 'Dashboard' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#F5F2EB]/95 backdrop-blur-xl border-b border-[#66717D]/15 shadow-[0_1px_8px_rgba(0,0,0,0.03)] transition-colors">
      <div className="h-20 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            id="header-brand-logo"
            aria-label="Shegger Wheels Homepage"
          >
            <div className="w-10 h-10 rounded-xl bg-[#111820] flex items-center justify-center text-[#D5F36A] shadow-sm group-hover:scale-105 transition-transform">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg sm:text-xl tracking-tight text-[#111820]">
                Shegger Wheels
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#536600]">
                Addis Ababa P2P
              </span>
            </div>
          </Link>

          <div className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#EBE8E1] text-[#44474B] font-label-caps text-[10px] uppercase tracking-wider ml-1">
            Addis Ababa
          </div>
        </div>

        {/* Desktop Navigation Pills */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-1 p-1 bg-[#F1EEE7] border border-[#66717D]/12 rounded-full"
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#111820] text-white shadow-xs'
                    : 'text-[#44474B] hover:text-[#111820] hover:bg-[#EBE8E1]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Simulated Currency Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F1EEE7] border border-[#66717D]/12 text-xs font-specs-tabular text-[#44474B]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-[#536600]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="font-bold text-[#111820]">ETB / TeleBirr</span>
          </div>

          {/* User Capsule or Sign In Button */}
          {session && currentUser ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-[#FFFFFF] border border-[#66717D]/20 shadow-xs hover:border-[#111820]/40 transition-colors"
              id="header-user-profile"
            >
              {currentUser.avatarUrl ? (
                <Image
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  width={28}
                  height={28}
                  unoptimized
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#111820] text-[#D5F36A] flex items-center justify-center text-xs font-bold">
                  {currentUser.name.charAt(0)}
                </div>
              )}
              <div className="hidden xl:flex flex-col text-left leading-tight">
                <span className="text-xs font-bold text-[#111820]">
                  {currentUser.name.split(' ')[0]}
                </span>
                <span className="text-[9px] font-label-caps uppercase text-[#66717D]">
                  {session.activeRole}
                </span>
              </div>
            </Link>
          ) : (
            <Link
              href="/signin"
              className="inline-flex items-center justify-center px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-[#EBE8E1] hover:bg-[#E5E2DB] text-[#111820] transition-colors"
              id="header-sign-in"
            >
              Demo Sign In
            </Link>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-[#111820] hover:bg-[#EBE8E1] transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#F5F2EB] border-b border-[#66717D]/20 px-4 pt-2 pb-6 flex flex-col gap-3 shadow-lg">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-semibold text-[#111820] hover:bg-[#EBE8E1] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t border-[#66717D]/15 flex items-center justify-between">
            <span className="text-xs text-[#66717D] font-specs-tabular">
              Addis Ababa Fleet • ETB TeleBirr
            </span>
            <Link
              href="/signin"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-[#111820] text-white"
            >
              {session ? 'Switch Account' : 'Demo Sign In'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
