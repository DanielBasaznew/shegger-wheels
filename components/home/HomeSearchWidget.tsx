'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export function HomeSearchWidget() {
  const router = useRouter();
  const [selectedHub, setSelectedHub] = useState('All');
  const [selectedClass, setSelectedClass] = useState('All');
  const [startDate, setStartDate] = useState('2026-10-24');
  const [endDate, setEndDate] = useState('2026-10-27');
  const [rentalMode, setRentalMode] = useState<'daily' | 'chauffeured' | 'airport'>('daily');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedHub && selectedHub !== 'All') {
      params.set('neighbourhood', selectedHub);
    }
    if (selectedClass && selectedClass !== 'All') {
      params.set('category', selectedClass);
    }
    if (startDate) {
      params.set('startDate', startDate);
    }
    if (endDate) {
      params.set('endDate', endDate);
    }

    const query = params.toString();
    router.push(query ? `/cars?${query}` : '/cars');
  };

  return (
    <div className="w-full bg-surface-container-lowest rounded-2xl shadow-xl p-space-md sm:p-space-lg border border-outline-variant/30">
      {/* Top Header & Rental Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-sm mb-space-sm gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[22px]">tune</span>
          <span className="font-title-md text-title-md text-on-surface">Quick Reserve Dispatch</span>
        </div>

        <div className="flex items-center gap-1 bg-surface-container-high p-1 rounded-full text-on-surface self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setRentalMode('daily')}
            className={`px-3 py-1 rounded-full text-title-md font-title-md transition-all cursor-pointer ${
              rentalMode === 'daily'
                ? 'bg-surface text-on-surface shadow-xs font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Daily Rental
          </button>
          <button
            type="button"
            onClick={() => setRentalMode('chauffeured')}
            className={`px-3 py-1 rounded-full text-title-md font-title-md transition-all cursor-pointer ${
              rentalMode === 'chauffeured'
                ? 'bg-surface text-on-surface shadow-xs font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Chauffeured / VIP
          </button>
          <button
            type="button"
            onClick={() => setRentalMode('airport')}
            className={`px-3 py-1 rounded-full text-title-md font-title-md transition-all cursor-pointer ${
              rentalMode === 'airport'
                ? 'bg-surface text-on-surface shadow-xs font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Airport Transfer
          </button>
        </div>
      </div>

      {/* Dispatch Search Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-space-sm items-stretch">
        {/* Pick-up Hub in Addis */}
        <div className="lg:col-span-3 flex flex-col bg-surface-container-low hover:bg-surface-container p-3 rounded-xl transition-colors">
          <label
            htmlFor="home-hub-select"
            className="font-label-caps text-label-caps text-on-surface-variant uppercase flex items-center gap-1 mb-1"
          >
            <span className="material-symbols-outlined text-[14px]">location_on</span>
            <span>Pick-up Hub in Addis</span>
          </label>
          <select
            id="home-hub-select"
            value={selectedHub}
            onChange={(e) => setSelectedHub(e.target.value)}
            className="bg-transparent font-title-md text-title-md text-on-surface outline-hidden cursor-pointer w-full"
          >
            <option value="All">All Addis Ababa Hubs</option>
            <option value="Bole">Bole (Medhanialem / Atlas)</option>
            <option value="Kazanchis">Kazanchis Diplomatic Quarter</option>
            <option value="Old Airport">Old Airport &amp; Sarbet</option>
            <option value="CMC">CMC / Ayat Hub</option>
            <option value="Piassa">Piassa &amp; Churchill Ave</option>
            <option value="Gerji">Gerji &amp; Jackros</option>
          </select>
        </div>

        {/* Pick-up & Drop-off Dates */}
        <div className="lg:col-span-3 flex flex-col bg-surface-container-low hover:bg-surface-container p-3 rounded-xl transition-colors">
          <label
            htmlFor="home-start-date"
            className="font-label-caps text-label-caps text-on-surface-variant uppercase flex items-center gap-1 mb-1"
          >
            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
            <span>Pick-up &amp; Drop-off</span>
          </label>
          <div className="flex items-center justify-between gap-1">
            <input
              type="date"
              id="home-start-date"
              aria-label="Pick-up start date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent font-title-md text-[13px] text-on-surface outline-hidden cursor-pointer w-28"
            />
            <span className="text-on-surface-variant font-specs-tabular text-sm">→</span>
            <input
              type="date"
              id="home-end-date"
              aria-label="Drop-off end date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent font-title-md text-[13px] text-on-surface outline-hidden cursor-pointer w-28"
            />
          </div>
          <span className="font-label-caps text-[10px] text-secondary font-bold mt-1">3 Days Rental Duration</span>
        </div>

        {/* Vehicle Class */}
        <div className="lg:col-span-3 flex flex-col bg-surface-container-low hover:bg-surface-container p-3 rounded-xl transition-colors">
          <label
            htmlFor="home-class-select"
            className="font-label-caps text-label-caps text-on-surface-variant uppercase flex items-center gap-1 mb-1"
          >
            <span className="material-symbols-outlined text-[14px]">directions_car</span>
            <span>Vehicle Class</span>
          </label>
          <select
            id="home-class-select"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-transparent font-title-md text-title-md text-on-surface outline-hidden cursor-pointer w-full"
          >
            <option value="All">All Vehicle Types (84)</option>
            <option value="SUV">4x4 &amp; Luxury SUV (28)</option>
            <option value="Automatic">Automatic Transmission (62)</option>
            <option value="Sedan">Fuel-Efficient Sedans (34)</option>
            <option value="EV">EV / Hybrid Fleet (12)</option>
          </select>
        </div>

        {/* Search CTA Button */}
        <div className="lg:col-span-3 flex items-stretch">
          <button
            type="submit"
            id="home-search-submit"
            className="w-full flex items-center justify-center gap-2 bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim rounded-xl p-4 font-headline-sm text-headline-sm transition-transform active:scale-[0.99] shadow-md cursor-pointer"
          >
            <span>Search 84+ Cars</span>
            <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
          </button>
        </div>
      </form>
    </div>
  );
}
