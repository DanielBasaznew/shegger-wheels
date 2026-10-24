'use client';

import React, { useState, useSyncExternalStore, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { getUserById, resetDemoData, isOptimizableImage } from '@/lib/storage';
import { User, DemoSession, UserRole } from '@/lib/types';
import { signOutDemoUser, switchActiveRole } from '@/lib/auth';

import { NotificationBell } from '@/components/notifications/NotificationBell';
import { BrandLogo } from '@/components/ui/BrandLogo';

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('shegger-session-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('shegger-session-change', callback);
  };
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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

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

  const userButtonRef = useRef<HTMLButtonElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (userDropdownOpen) {
          setUserDropdownOpen(false);
          userButtonRef.current?.focus();
        } else if (mobileMenuOpen) {
          setMobileMenuOpen(false);
          mobileToggleRef.current?.focus();
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userDropdownOpen, mobileMenuOpen]);

  const handleSignOut = () => {
    signOutDemoUser();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/checkout')) {
      router.push('/');
    }
  };

  const handleResetDemo = () => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'Reset Shegger Wheels demo data?\n\nThis restores initial baseline seeds (cars, bookings, reviews, notifications) without affecting unrelated browser storage.'
      );
      if (confirmed) {
        resetDemoData();
        setUserDropdownOpen(false);
        setMobileMenuOpen(false);
        router.refresh();
      }
    }
  };

  const handleRoleSwitch = (newRole: UserRole) => {
    switchActiveRole(newRole);
    setUserDropdownOpen(false);
  };

  const navLinks = [
    { href: '/cars', label: 'Explore Cars' },
    { href: '/#how-it-works', label: 'How It Works' },
    {
      href: session?.activeRole === 'owner' ? '/dashboard/host' : '/signin?role=owner',
      label: 'Host a Vehicle',
    },
    { href: '/dashboard', label: 'Dashboard' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#F5F2EB]/95 backdrop-blur-xl border-b border-[#66717D]/15 shadow-[0_1px_8px_rgba(0,0,0,0.03)] transition-colors">
      <div className="h-20 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Identity */}
        <div className="flex items-center gap-space-sm">
          <Link
            href="/"
            className="flex items-center gap-space-sm group"
            id="header-brand-logo"
            aria-label="Sheggar Wheels Homepage"
          >
            <BrandLogo size="md" />
          </Link>

          <div className="hidden sm:flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
            Addis Ababa
          </div>
        </div>

        {/* Desktop Navigation Pills */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-1 p-1 bg-surface-container border border-outline-variant/20 rounded-full"
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-full font-title-md text-title-md transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-container text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-space-sm">
          {/* Simulated Currency Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container font-specs-tabular text-specs-tabular text-on-surface-variant border border-outline-variant/20">
            <span className="material-symbols-outlined text-[18px]">payments</span>
            <span className="font-bold text-on-surface">ETB</span>
          </div>

          {/* In-App Notifications Bell */}
          <NotificationBell />

          {/* User Capsule or Sign In Button */}
          {session && currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                ref={userButtonRef}
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/20 shadow-xs hover:bg-surface-container transition-colors cursor-pointer"
                id="header-user-profile"
                aria-expanded={userDropdownOpen}
                aria-haspopup="true"
                aria-controls="user-dropdown-menu"
              >
                {currentUser.avatarUrl ? (
                  <Image
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    width={28}
                    height={28}
                    unoptimized={!isOptimizableImage(currentUser.avatarUrl)}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary-container text-secondary-fixed flex items-center justify-center text-xs font-bold">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <div className="hidden xl:flex flex-col text-left leading-tight">
                  <span className="font-title-md text-[13px] text-on-surface font-semibold">
                    {currentUser.name.split(' ')[0]} {currentUser.name.split(' ')[1]?.[0] ? `${currentUser.name.split(' ')[1][0]}.` : ''}
                  </span>
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">
                    {session.activeRole}
                  </span>
                </div>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">expand_more</span>
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div
                  id="user-dropdown-menu"
                  role="menu"
                  aria-labelledby="header-user-profile"
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-[#66717D]/20 shadow-xl p-3 flex flex-col gap-2 z-50 animate-scale-in"
                >
                  <div className="p-3 rounded-xl bg-[#F6F3EC] flex flex-col gap-1">
                    <span className="text-xs font-bold text-[#111820]">{currentUser.name}</span>
                    <span className="text-[11px] text-[#66717D] truncate">{currentUser.email}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-full bg-[#111820] text-white text-[9px] font-label-caps uppercase font-bold">
                        Active: {session.activeRole}
                      </span>
                      {currentUser.roles.length > 1 && (
                        <span className="text-[10px] text-[#536600] font-semibold">
                          Multi-Role Account
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Multi-role Switcher if account holds multiple roles */}
                  {currentUser.roles.length > 1 && (
                    <div className="p-2 border-t border-b border-[#66717D]/12 flex flex-col gap-1">
                      <span className="text-[10px] font-label-caps uppercase text-[#66717D] font-bold">
                        Switch Active Role
                      </span>
                      <div className="flex gap-1.5">
                        {currentUser.roles.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => handleRoleSwitch(r)}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer ${
                              session?.activeRole === r
                                ? 'bg-[#111820] text-white shadow-xs'
                                : 'bg-[#EBE8E1] text-[#44474B] hover:bg-[#DCDAD3]'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Navigation Links in Menu */}
                  <div className="flex flex-col gap-1 text-xs font-semibold text-[#111820]">
                    <Link
                      href="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="px-3 py-2 rounded-xl hover:bg-[#F6F3EC] transition-colors flex items-center justify-between"
                    >
                      <span>Dashboard Overview</span>
                      <span>→</span>
                    </Link>
                    {session.activeRole === 'owner' && (
                      <Link
                        href="/dashboard/host"
                        onClick={() => setUserDropdownOpen(false)}
                        className="px-3 py-2 rounded-xl hover:bg-[#F6F3EC] transition-colors flex items-center justify-between"
                      >
                        <span>Host Fleet &amp; Blackouts</span>
                        <span>→</span>
                      </Link>
                    )}
                    {session.activeRole === 'admin' && (
                      <Link
                        href="/dashboard/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="px-3 py-2 rounded-xl hover:bg-[#F6F3EC] transition-colors flex items-center justify-between"
                      >
                        <span>Admin Audit Ledger</span>
                        <span>→</span>
                      </Link>
                    )}
                  </div>

                  {/* Reset Demo Data & Sign Out */}
                  <div className="pt-2 border-t border-[#66717D]/12 flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={handleResetDemo}
                      className="w-full py-1.5 px-3 rounded-xl bg-[#F1EEE7] hover:bg-[#E6E2D8] text-[#44474B] font-semibold text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Restores seed cars, bookings, reviews, and notifications"
                    >
                      <span className="material-symbols-outlined text-[15px]">restart_alt</span>
                      <span>Reset Demo Seed Data</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">logout</span>
                      <span>Sign Out (Clear Session)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/signin"
              className="hidden md:inline-flex items-center justify-center px-4 py-2 rounded-full font-title-md text-title-md text-on-surface bg-surface-container-high hover:bg-surface-container-highest hover:text-on-surface transition-colors"
              id="header-sign-in"
            >
              Demo Sign In
            </Link>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            ref={mobileToggleRef}
            type="button"
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-[#111820] hover:bg-[#EBE8E1] transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          role="region"
          aria-label="Mobile Navigation Menu"
          className="lg:hidden bg-[#F5F2EB] border-b border-[#66717D]/20 px-4 pt-2 pb-6 flex flex-col gap-3 shadow-lg"
        >
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

          <div className="pt-3 border-t border-[#66717D]/15 flex flex-col gap-2">
            {session && currentUser ? (
              <div className="flex flex-col gap-2 p-3 rounded-2xl bg-white border border-[#66717D]/15">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#111820]">{currentUser.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#111820] text-white text-[9px] font-label-caps uppercase">
                      {session.activeRole}
                    </span>
                  </div>
                </div>

                {currentUser.roles.length > 1 && (
                  <div className="flex gap-2 pt-1 border-t border-[#66717D]/10">
                    {currentUser.roles.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleRoleSwitch(r)}
                        className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-lg ${
                          session?.activeRole === r
                            ? 'bg-[#111820] text-white'
                            : 'bg-[#F1EEE7] text-[#44474B]'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleResetDemo}
                  className="w-full py-2 rounded-xl bg-[#F1EEE7] text-[#44474B] font-semibold text-xs flex items-center justify-center gap-1.5 mb-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  <span>Reset Demo Seed Data</span>
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full py-2 rounded-xl bg-red-50 text-red-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#66717D] font-specs-tabular">
                  Addis Ababa Fleet • ETB TeleBirr
                </span>
                <Link
                  href="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-[#111820] text-white"
                >
                  Demo Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

