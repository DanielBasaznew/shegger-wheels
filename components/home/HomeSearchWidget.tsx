'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export function HomeSearchWidget() {
  const router = useRouter();
  const [selectedHub, setSelectedHub] = useState('All');
  const [selectedClass, setSelectedClass] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
    <div className="w-full bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#66717D]/18 p-4 sm:p-6 lg:p-7">
      {/* Top Header & Rental Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#66717D]/12 gap-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-[#EBE8E1] text-[#111820] flex items-center justify-center text-sm font-bold">
            🔍
          </span>
          <span className="font-bold text-base text-[#111820]">
            Quick Reserve Dispatch
          </span>
        </div>

        <div className="flex items-center gap-1 bg-[#F1EEE7] p-1 rounded-full text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setRentalMode('daily')}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              rentalMode === 'daily'
                ? 'bg-white text-[#111820] shadow-xs'
                : 'text-[#44474B] hover:text-[#111820]'
            }`}
          >
            Daily Rental
          </button>
          <button
            type="button"
            onClick={() => setRentalMode('chauffeured')}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              rentalMode === 'chauffeured'
                ? 'bg-white text-[#111820] shadow-xs'
                : 'text-[#44474B] hover:text-[#111820]'
            }`}
          >
            Chauffeured / VIP
          </button>
          <button
            type="button"
            onClick={() => setRentalMode('airport')}
            className={`px-3 py-1.5 rounded-full transition-colors ${
              rentalMode === 'airport'
                ? 'bg-white text-[#111820] shadow-xs'
                : 'text-[#44474B] hover:text-[#111820]'
            }`}
          >
            Airport Transfer
          </button>
        </div>
      </div>

      {/* Dispatch Search Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-end">
        {/* Hub Selection */}
        <div className="lg:col-span-4 flex flex-col bg-[#F6F3EC] hover:bg-[#F1EEE7] p-3 rounded-xl transition-colors border border-transparent focus-within:border-[#111820]/30">
          <label
            htmlFor="home-hub-select"
            className="font-label-caps text-[10px] text-[#44474B] uppercase flex items-center gap-1 mb-1 font-bold"
          >
            <span>📍 Pick-up Hub in Addis</span>
          </label>
          <select
            id="home-hub-select"
            value={selectedHub}
            onChange={(e) => setSelectedHub(e.target.value)}
            className="bg-transparent font-semibold text-sm text-[#111820] outline-none cursor-pointer"
          >
            <option value="All">All Addis Ababa Hubs</option>
            <option value="Bole">Bole (Medhanialem / Atlas)</option>
            <option value="Kazanchis">Kazanchis Diplomatic Quarter</option>
            <option value="Old Airport">Old Airport & Sarbet</option>
            <option value="CMC">CMC / Ayat Hub</option>
            <option value="Piassa">Piassa & Churchill Ave</option>
            <option value="Sarbet">Sarbet & Vatican</option>
            <option value="Lideta">Lideta Commercial Center</option>
          </select>
        </div>

        {/* Date Window */}
        <div className="lg:col-span-3 flex flex-col bg-[#F6F3EC] hover:bg-[#F1EEE7] p-3 rounded-xl transition-colors border border-transparent focus-within:border-[#111820]/30">
          <label
            htmlFor="home-start-date"
            className="font-label-caps text-[10px] text-[#44474B] uppercase flex items-center gap-1 mb-1 font-bold"
          >
            <span>📅 Trip Dates (Start — End)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              id="home-start-date"
              aria-label="Pick-up start date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#111820] outline-none cursor-pointer"
            />
            <input
              type="date"
              id="home-end-date"
              aria-label="Drop-off end date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#111820] outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Vehicle Class */}
        <div className="lg:col-span-2 flex flex-col bg-[#F6F3EC] hover:bg-[#F1EEE7] p-3 rounded-xl transition-colors border border-transparent focus-within:border-[#111820]/30">
          <label
            htmlFor="home-class-select"
            className="font-label-caps text-[10px] text-[#44474B] uppercase flex items-center gap-1 mb-1 font-bold"
          >
            <span>🚗 Vehicle Class</span>
          </label>
          <select
            id="home-class-select"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-transparent font-semibold text-sm text-[#111820] outline-none cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="SUV">SUV & 4x4</option>
            <option value="Sedan">Sedan</option>
            <option value="EV">Electric (EV)</option>
          </select>
        </div>

        {/* Submit CTA Button */}
        <div className="lg:col-span-3">
          <button
            type="submit"
            id="home-search-submit"
            className="w-full h-13 px-6 rounded-xl bg-[#D5F36A] hover:bg-[#C8E85B] text-[#111820] font-bold text-sm tracking-tight shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Search Fleet</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>
    </div>
  );
}
