'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Car } from '@/lib/types';
import { getCarSlug, isOptimizableImage } from '@/lib/storage';

interface ShareVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car;
}

export function ShareVehicleModal({ isOpen, onClose, car }: ShareVehicleModalProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof navigator.share === 'function') {
      setHasNativeShare(true);
    }
  }, []);

  // Keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const canonicalSlug = getCarSlug(car);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://shegger-wheels-cyan.vercel.app';
  const shareUrl = `${origin}/cars/${canonicalSlug}`;
  const shareTitle = `${car.year} ${car.make} ${car.model} in ${car.neighbourhood} — Shegger Wheels`;
  const shareText = `Rent this ${car.year} ${car.make} ${car.model} in ${car.neighbourhood}, Addis Ababa for ${car.pricePerDay.toLocaleString()} ETB/day with TeleBirr escrow protection on Shegger Wheels.`;

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      }
    } catch (err) {
      console.error('Failed to copy share link:', err);
    }
  };

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      }
    } catch {
      // User cancelled or share dismissed
    }
  };

  const photo =
    car.photos && car.photos[0]
      ? car.photos[0]
      : car.featuredImage ||
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80';

  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;
  const whatsAppUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareTitle} — ${shareUrl}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111820]/75 backdrop-blur-sm animate-fade-in"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#66717D]/20 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 flex items-center justify-between border-b border-[#66717D]/12">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#111820] text-[#D5F36A] flex items-center justify-center font-bold text-sm">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </div>
            <div>
              <h2 id="share-modal-title" className="text-base font-bold text-[#111820]">
                Share Vehicle
              </h2>
              <p className="text-xs text-[#66717D]">
                Shared link previews rich social card across Telegram, WhatsApp, and X
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close share preview modal"
            className="w-8 h-8 rounded-full bg-[#F5F2EB] hover:bg-[#EBE8E1] text-[#111820] flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
          {/* Visual Social Card Preview Frame */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-label-caps uppercase text-[#66717D] font-bold">
                Social Link Preview Card
              </span>
              <span className="text-[10px] text-[#536600] font-bold bg-[#D5F36A]/20 px-2 py-0.5 rounded-full border border-[#D5F36A]/40">
                OpenGraph 1200×630
              </span>
            </div>

            {/* Social Card Simulation Card */}
            <div className="rounded-2xl border border-[#66717D]/20 bg-[#111820] text-white overflow-hidden shadow-md">
              {/* Card Image Banner */}
              <div className="relative w-full h-44 sm:h-48 bg-surface-container-high overflow-hidden">
                <Image
                  src={photo}
                  alt={`${car.year} ${car.make} ${car.model}`}
                  fill
                  sizes="(max-width: 640px) 100vw, 512px"
                  unoptimized={!isOptimizableImage(photo)}
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111820] via-transparent to-black/30" />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111820]/90 backdrop-blur-md text-[#D5F36A] text-[10px] font-bold uppercase tracking-wider border border-white/10">
                  <span>SHEGGER WHEELS</span>
                  <span>•</span>
                  <span>ADDIS ABABA</span>
                </div>
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#D5F36A] text-[#111820] text-[11px] font-extrabold shadow-sm">
                  {car.pricePerDay.toLocaleString()} ETB / day
                </div>
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs">
                  <span className="font-bold text-white text-sm drop-shadow-md">
                    {car.year} {car.make} {car.model}
                  </span>
                  <span className="text-white/80 text-[11px] font-mono drop-shadow-md">
                    📍 {car.neighbourhood} Hub
                  </span>
                </div>
              </div>

              {/* Card Bottom Meta Bar */}
              <div className="p-3 bg-[#1C2630] border-t border-white/10 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-[#D5F36A] font-bold">✓ TeleBirr Escrow Protected</span>
                  <span className="text-white/40">•</span>
                  <span className="text-white/70">{car.transmission}</span>
                </div>
                <span className="text-white/50 font-mono text-[10px] truncate max-w-[140px]">
                  sheggerwheels.et
                </span>
              </div>
            </div>
          </div>

          {/* Copy URL Input Group */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="share-url-input" className="text-xs font-bold text-[#111820]">
              Vehicle Direct Link
            </label>
            <div className="flex items-center gap-2">
              <input
                id="share-url-input"
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F5F2EB] border border-[#66717D]/20 text-xs font-mono text-[#111820] focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs ${
                  isCopied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#111820] text-[#D5F36A] hover:bg-[#1C2630]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isCopied ? 'check' : 'content_copy'}
                </span>
                <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
            {isCopied && (
              <p className="text-[11px] text-emerald-700 font-semibold animate-fade-in">
                ✓ Copied to clipboard! Ready to paste into chat or messages.
              </p>
            )}
          </div>

          {/* Social Network Share Buttons */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-label-caps uppercase text-[#66717D] font-bold">
              Share to Platform
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-2xl bg-[#0088cc]/10 hover:bg-[#0088cc]/15 text-[#0088cc] border border-[#0088cc]/25 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors text-center no-underline"
              >
                <span className="text-base">✈️</span>
                <span>Telegram</span>
              </a>

              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/15 text-[#128C7E] border border-[#25D366]/25 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors text-center no-underline"
              >
                <span className="text-base">💬</span>
                <span>WhatsApp</span>
              </a>

              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-2xl bg-[#111820]/10 hover:bg-[#111820]/15 text-[#111820] border border-[#111820]/25 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors text-center no-underline"
              >
                <span className="text-base">𝕏</span>
                <span>X / Twitter</span>
              </a>
            </div>

            {hasNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="mt-1 w-full py-2.5 px-4 rounded-2xl bg-[#F5F2EB] hover:bg-[#EBE8E1] text-[#111820] font-bold text-xs flex items-center justify-center gap-2 border border-[#66717D]/20 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">ios_share</span>
                <span>More Share Options</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
