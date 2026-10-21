'use client';

import React, { useState, useMemo, useEffect, useSyncExternalStore, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { VehicleCard } from '@/components/cars/VehicleCard';
import { Car } from '@/lib/types';
import { getCars, STORAGE_KEYS } from '@/lib/storage';
import { SEED_CARS } from '@/lib/seeds';

// SSR-safe synchronizer for client storage with referential stability
let cachedStorageCars: Car[] = [];
let lastRawCars = '';

function subscribeToStorage(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getApprovedCarsSnapshot(): Car[] {
  if (typeof window === 'undefined') {
    return SEED_CARS.filter((c) => c.status === 'approved');
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.CARS) || '';
    if (raw !== lastRawCars || cachedStorageCars.length === 0) {
      lastRawCars = raw;
      const loaded = getCars().filter((c) => c.status === 'approved');
      cachedStorageCars = loaded.length > 0 ? loaded : SEED_CARS.filter((c) => c.status === 'approved');
    }
    return cachedStorageCars;
  } catch {
    return SEED_CARS.filter((c) => c.status === 'approved');
  }
}

const serverApprovedCars = SEED_CARS.filter((c) => c.status === 'approved');
function getServerApprovedCarsSnapshot(): Car[] {
  return serverApprovedCars;
}

function CatalogueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load cars with SSR-safe subscription
  const allCars = useSyncExternalStore(
    subscribeToStorage,
    getApprovedCarsSnapshot,
    getServerApprovedCarsSnapshot
  );

  // Filter States initialized from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedNeighbourhoods, setSelectedNeighbourhoods] = useState<string[]>(() => {
    const fromUrl = searchParams.get('neighbourhood');
    return fromUrl ? fromUrl.split(',').filter(Boolean) : [];
  });
  const [maxPrice, setMaxPrice] = useState<number>(() => {
    const priceFromUrl = searchParams.get('maxPrice');
    return priceFromUrl ? parseInt(priceFromUrl, 10) : 12000;
  });
  const [selectedGearbox, setSelectedGearbox] = useState<'All' | 'Automatic' | 'Manual'>(() => {
    const fromUrl = searchParams.get('transmission');
    if (fromUrl === 'Automatic' || fromUrl === 'Manual') return fromUrl;
    return 'All';
  });
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('category') || 'All'
  );
  const [selectedSeats, setSelectedSeats] = useState<string>(
    searchParams.get('seats') || 'All'
  );
  const [sortBy, setSortBy] = useState<string>(
    searchParams.get('sort') || 'recommended'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const pageSize = 6;

  // Available Addis Neighbourhoods for filter
  const neighbourhoodsList = [
    { id: 'Bole', name: 'Bole (Medhanialem/Atlas)' },
    { id: 'Kazanchis', name: 'Kazanchis (UNECA)' },
    { id: 'Old Airport', name: 'Old Airport / Sarbet' },
    { id: 'CMC', name: 'CMC & Ayat' },
    { id: 'Piassa', name: 'Piassa & Arat Kilo' },
    { id: 'Sarbet', name: 'Sarbet & Vatican' },
    { id: 'Lideta', name: 'Lideta' },
  ];

  // Action handlers that update filter criteria and reset pagination to page 1
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleMaxPriceChange = (val: number) => {
    setMaxPrice(val);
    setCurrentPage(1);
  };

  const handleGearboxChange = (val: 'All' | 'Automatic' | 'Manual') => {
    setSelectedGearbox(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    setCurrentPage(1);
  };

  const handleSeatsChange = (val: string) => {
    setSelectedSeats(val);
    setCurrentPage(1);
  };

  const handleSortChange = (val: string) => {
    setSortBy(val);
    setCurrentPage(1);
  };

  // Sync state to URL searchParams without page reloads
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedNeighbourhoods.length > 0) params.set('neighbourhood', selectedNeighbourhoods.join(','));
    if (maxPrice < 12000) params.set('maxPrice', maxPrice.toString());
    if (selectedGearbox !== 'All') params.set('transmission', selectedGearbox);
    if (selectedCategory !== 'All') params.set('category', selectedCategory);
    if (selectedSeats !== 'All') params.set('seats', selectedSeats);
    if (sortBy !== 'recommended') params.set('sort', sortBy);

    const queryString = params.toString();
    const targetUrl = queryString ? `/cars?${queryString}` : '/cars';
    router.replace(targetUrl, { scroll: false });
  }, [searchQuery, selectedNeighbourhoods, maxPrice, selectedGearbox, selectedCategory, selectedSeats, sortBy, router]);

  // Handle neighbourhood checkbox toggle
  const toggleNeighbourhood = (nId: string) => {
    setSelectedNeighbourhoods((prev) =>
      prev.includes(nId) ? prev.filter((id) => id !== nId) : [...prev, nId]
    );
    setCurrentPage(1);
  };

  // Reset all filters helper
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedNeighbourhoods([]);
    setMaxPrice(12000);
    setSelectedGearbox('All');
    setSelectedCategory('All');
    setSelectedSeats('All');
    setSortBy('recommended');
    setCurrentPage(1);
  };

  // Compute filtered cars
  const filteredCars = useMemo(() => {
    return allCars.filter((car) => {
      // 1. Keyword search (make, model, neighbourhood, description)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          car.make.toLowerCase().includes(q) ||
          car.model.toLowerCase().includes(q) ||
          car.neighbourhood.toLowerCase().includes(q) ||
          car.description.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // 2. Neighbourhood filter
      if (selectedNeighbourhoods.length > 0) {
        const matchesNeighbourhood = selectedNeighbourhoods.some(
          (n) => car.neighbourhood.toLowerCase().includes(n.toLowerCase())
        );
        if (!matchesNeighbourhood) return false;
      }

      // 3. Price filter
      if (car.pricePerDay > maxPrice) {
        return false;
      }

      // 4. Transmission
      if (selectedGearbox !== 'All' && car.transmission !== selectedGearbox) {
        return false;
      }

      // 5. Category
      if (selectedCategory !== 'All') {
        const modelLower = (car.make + ' ' + car.model).toLowerCase();
        if (selectedCategory === 'SUV' && !modelLower.includes('rav4') && !modelLower.includes('tucson') && !modelLower.includes('prado') && !modelLower.includes('pajero') && !modelLower.includes('id.4')) {
          return false;
        }
        if (selectedCategory === 'Sedan' && !modelLower.includes('dzire') && !modelLower.includes('corolla') && !modelLower.includes('elantra')) {
          return false;
        }
        if (selectedCategory === 'EV' && car.fuelType !== 'Electric') {
          return false;
        }
      }

      // 6. Seats
      if (selectedSeats === '4-5' && (car.seats < 4 || car.seats > 5)) return false;
      if (selectedSeats === '6-7' && (car.seats < 6 || car.seats > 7)) return false;
      if (selectedSeats === '8+' && car.seats < 8) return false;

      return true;
    });
  }, [allCars, searchQuery, selectedNeighbourhoods, maxPrice, selectedGearbox, selectedCategory, selectedSeats]);

  // Compute sorted cars
  const sortedCars = useMemo(() => {
    const list = [...filteredCars];
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.pricePerDay - b.pricePerDay);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.pricePerDay - a.pricePerDay);
    } else if (sortBy === 'newest') {
      list.sort((a, b) => b.year - a.year);
    }
    return list;
  }, [filteredCars, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedCars.length / pageSize) || 1;
  const paginatedCars = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCars.slice(start, start + pageSize);
  }, [sortedCars, currentPage, pageSize]);

  // Count active filters
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedNeighbourhoods.length > 0 ||
    maxPrice < 12000 ||
    selectedGearbox !== 'All' ||
    selectedCategory !== 'All' ||
    selectedSeats !== 'All';

  return (
    <div className="flex flex-col w-full pb-20">
      {/* 1. Catalogue Header Bar */}
      <section className="w-full pt-8 pb-6 border-b border-[#66717D]/12 bg-[#F6F3EC]/50">
        <Container>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="flex flex-col items-start gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBE8E1] text-[#111820] font-label-caps text-[10px] uppercase font-bold tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#536600] animate-pulse" />
                Fleet Inventory • Addis Ababa Real-Time Sync
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111820] tracking-tight">
                Explore Cars in Addis Ababa
              </h1>
              <p className="text-sm sm:text-base text-[#44474B] max-w-2xl">
                {allCars.length} verified vehicles available for self-drive and hosted trips with TeleBirr secure escrow protection.
              </p>
            </div>

            {/* Quick Stats Pill Strip */}
            <div className="flex items-center gap-3 self-start lg:self-auto flex-wrap">
              <div className="p-3 rounded-2xl bg-white border border-[#66717D]/15 shadow-xs">
                <span className="font-label-caps text-[9px] text-[#66717D] uppercase block">Instant Pickups</span>
                <span className="font-specs-tabular text-sm font-bold text-[#111820]">Near Bole</span>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-[#66717D]/15 shadow-xs">
                <span className="font-label-caps text-[9px] text-[#66717D] uppercase block">Avg. Day Rate</span>
                <span className="font-specs-tabular text-sm font-bold text-[#111820]">4,800 ETB</span>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-[#66717D]/15 shadow-xs">
                <span className="font-label-caps text-[9px] text-[#66717D] uppercase block">Insurance</span>
                <span className="font-specs-tabular text-sm font-bold text-[#536600]">Comprehensive</span>
              </div>
            </div>
          </div>

          {/* Search Input & Sort Strip */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-8 relative flex items-center">
              <span className="absolute left-4 text-[#66717D]">🔍</span>
              <input
                type="text"
                placeholder="Search by make, model, or neighbourhood (e.g. Prado, Bole, Kazanchis)..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full h-12 pl-11 pr-10 rounded-2xl bg-white border border-[#66717D]/25 focus:border-[#111820] text-sm text-[#111820] outline-none shadow-xs transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3.5 text-[#66717D] hover:text-[#111820] text-sm"
                  aria-label="Clear search input"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Mobile Filter Toggle */}
            <div className="md:hidden flex items-center">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="w-full h-12 px-4 rounded-2xl bg-[#111820] text-white font-semibold text-sm flex items-center justify-center gap-2"
              >
                <span>⚙️ Refine Filters</span>
                {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[#D5F36A]" />}
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="md:col-span-4 flex items-center gap-2">
              <label htmlFor="sort-select" className="text-xs font-semibold text-[#66717D] shrink-0 hidden sm:inline">
                Sort by:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl bg-white border border-[#66717D]/25 text-sm font-semibold text-[#111820] outline-none cursor-pointer shadow-xs"
              >
                <option value="recommended">Sort: Recommended</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest Fleet</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips Strip */}
          {hasActiveFilters && (
            <div className="mt-4 pt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-label-caps text-[10px] text-[#66717D] uppercase font-bold mr-1">
                Active Filters:
              </span>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111820] text-white font-medium"
                >
                  <span>Query: &ldquo;{searchQuery}&rdquo;</span>
                  <span>✕</span>
                </button>
              )}

              {selectedNeighbourhoods.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => toggleNeighbourhood(n)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111820] text-white font-medium"
                >
                  <span>Hub: {n}</span>
                  <span>✕</span>
                </button>
              ))}

              {maxPrice < 12000 && (
                <button
                  type="button"
                  onClick={() => handleMaxPriceChange(12000)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111820] text-white font-medium font-specs-tabular"
                >
                  <span>&lt; {maxPrice.toLocaleString()} ETB</span>
                  <span>✕</span>
                </button>
              )}

              {selectedGearbox !== 'All' && (
                <button
                  type="button"
                  onClick={() => handleGearboxChange('All')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111820] text-white font-medium"
                >
                  <span>{selectedGearbox}</span>
                  <span>✕</span>
                </button>
              )}

              {selectedCategory !== 'All' && (
                <button
                  type="button"
                  onClick={() => handleCategoryChange('All')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111820] text-white font-medium"
                >
                  <span>{selectedCategory}</span>
                  <span>✕</span>
                </button>
              )}

              {selectedSeats !== 'All' && (
                <button
                  type="button"
                  onClick={() => handleSeatsChange('All')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111820] text-white font-medium"
                >
                  <span>{selectedSeats} Seats</span>
                  <span>✕</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-1 text-[#536600] hover:text-[#111820] font-bold text-xs underline cursor-pointer ml-auto"
              >
                Reset all filters
              </button>
            </div>
          )}
        </Container>
      </section>

      {/* 2. Main Two-Column Catalogue Layout */}
      <section className="w-full pt-8">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT FILTER SIDEBAR (Visible on Desktop, Collapsible on Mobile) */}
            <aside
              className={`lg:col-span-4 xl:col-span-3 ${
                mobileFilterOpen ? 'block' : 'hidden lg:block'
              } bg-white p-5 sm:p-6 rounded-3xl border border-[#66717D]/18 shadow-sm flex flex-col gap-6 sticky top-24`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#66717D]/12">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-[#111820]">Refine Fleet</span>
                </div>
                <span className="font-specs-tabular text-xs font-bold text-[#536600] bg-[#D5F36A]/30 px-2.5 py-0.5 rounded-full border border-[#D5F36A]">
                  {sortedCars.length} Available
                </span>
              </div>

              {/* Neighbourhood Hubs Checkboxes */}
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[10px] text-[#44474B] uppercase font-bold tracking-wider">
                  Neighborhood Hub
                </label>
                <div className="flex flex-col gap-1.5 mt-1">
                  {neighbourhoodsList.map((hub) => {
                    const isChecked = selectedNeighbourhoods.includes(hub.id);
                    const countInHub = allCars.filter((c) =>
                      c.neighbourhood.toLowerCase().includes(hub.id.toLowerCase())
                    ).length;

                    return (
                      <label
                        key={hub.id}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F6F3EC] cursor-pointer transition-colors group text-sm"
                      >
                        <span className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleNeighbourhood(hub.id)}
                            className="w-4 h-4 rounded text-[#111820] accent-[#111820] cursor-pointer"
                          />
                          <span className={`font-medium ${isChecked ? 'text-[#111820] font-bold' : 'text-[#44474B]'}`}>
                            {hub.name}
                          </span>
                        </span>
                        <span className="font-specs-tabular text-xs text-[#66717D] bg-[#F1EEE7] px-2 py-0.5 rounded-full">
                          {countInHub}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Daily Budget Slider */}
              <div className="flex flex-col gap-2 pt-3 border-t border-[#66717D]/12">
                <div className="flex items-center justify-between">
                  <label htmlFor="price-slider" className="font-label-caps text-[10px] text-[#44474B] uppercase font-bold tracking-wider">
                    Daily Budget (ETB)
                  </label>
                  <span className="font-specs-tabular text-xs font-bold text-[#536600]">
                    Max: {maxPrice.toLocaleString()} ETB
                  </span>
                </div>
                <input
                  id="price-slider"
                  type="range"
                  min="2000"
                  max="12000"
                  step="500"
                  value={maxPrice}
                  onChange={(e) => handleMaxPriceChange(parseInt(e.target.value, 10))}
                  className="w-full accent-[#111820] h-2 bg-[#EBE8E1] rounded-lg cursor-pointer my-2"
                />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex flex-col bg-[#F6F3EC] p-2 rounded-xl">
                    <span className="font-label-caps text-[9px] text-[#66717D] uppercase">Min Price</span>
                    <span className="font-specs-tabular font-bold text-[#111820]">2,000 ETB</span>
                  </div>
                  <div className="flex flex-col bg-[#F6F3EC] p-2 rounded-xl text-right">
                    <span className="font-label-caps text-[9px] text-[#66717D] uppercase">Max Cap</span>
                    <span className="font-specs-tabular font-bold text-[#111820]">{maxPrice.toLocaleString()} ETB</span>
                  </div>
                </div>
              </div>

              {/* Gearbox Switch */}
              <div className="flex flex-col gap-2 pt-3 border-t border-[#66717D]/12">
                <label className="font-label-caps text-[10px] text-[#44474B] uppercase font-bold tracking-wider">
                  Transmission
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-[#F1EEE7] rounded-xl text-xs font-semibold">
                  {(['All', 'Automatic', 'Manual'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handleGearboxChange(mode)}
                      className={`py-2 rounded-lg transition-colors cursor-pointer text-center ${
                        selectedGearbox === mode
                          ? 'bg-[#111820] text-white shadow-xs'
                          : 'text-[#44474B] hover:text-[#111820]'
                      }`}
                    >
                      {mode === 'Automatic' ? 'Auto' : mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seating Capacity */}
              <div className="flex flex-col gap-2 pt-3 border-t border-[#66717D]/12">
                <label className="font-label-caps text-[10px] text-[#44474B] uppercase font-bold tracking-wider">
                  Seating Capacity
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-[#F1EEE7] rounded-xl text-xs font-semibold">
                  {['All', '4-5', '6-7'].map((seat) => (
                    <button
                      key={seat}
                      type="button"
                      onClick={() => handleSeatsChange(seat)}
                      className={`py-2 rounded-lg transition-colors cursor-pointer text-center ${
                        selectedSeats === seat
                          ? 'bg-[#111820] text-white shadow-xs'
                          : 'text-[#44474B] hover:text-[#111820]'
                      }`}
                    >
                      {seat === 'All' ? 'Any' : `${seat} Seats`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Sidebar Action */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full py-2.5 rounded-xl border border-[#66717D]/30 text-xs font-bold text-[#111820] hover:bg-[#F1EEE7] transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
              )}
            </aside>

            {/* RIGHT FLEET INVENTORY GRID */}
            <main className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
              {/* Grid Header Info */}
              <div className="flex items-center justify-between text-xs text-[#44474B]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#111820]">
                    Showing {sortedCars.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sortedCars.length)}
                  </span>
                  <span>of {sortedCars.length} verified vehicles</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-[#536600] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#536600]" />
                  <span>Live TeleBirr instant booking enabled</span>
                </div>
              </div>

              {/* Cars Grid */}
              {paginatedCars.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {paginatedCars.map((car) => (
                    <VehicleCard key={car.id} car={car} />
                  ))}
                </div>
              ) : (
                /* Empty State */
                <div className="p-10 sm:p-14 rounded-3xl bg-white border border-[#66717D]/18 text-center flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#F1EEE7] flex items-center justify-center text-3xl">
                    🔍
                  </div>
                  <h3 className="text-xl font-bold text-[#111820]">
                    No vehicles match your current criteria
                  </h3>
                  <p className="text-sm text-[#44474B] max-w-md">
                    Try expanding your budget cap, selecting other neighbourhoods like Bole or Kazanchis, or relaxing transmission filters.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-6 py-2.5 rounded-full bg-[#111820] text-white font-semibold text-xs mt-2 hover:bg-[#1E293B] transition-colors cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-8 pt-6 border-t border-[#66717D]/15 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="px-4 py-2 rounded-xl border border-[#66717D]/25 text-xs font-bold text-[#111820] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBE8E1] transition-colors"
                  >
                    ← Previous
                  </button>

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-[#111820] text-white'
                            : 'bg-white border border-[#66717D]/20 text-[#111820] hover:bg-[#F1EEE7]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="px-4 py-2 rounded-xl border border-[#66717D]/25 text-xs font-bold text-[#111820] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBE8E1] transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}

              {/* Custom Model Request Banner */}
              <div className="mt-8 p-6 rounded-3xl bg-white border border-[#66717D]/18 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#EBE8E1] text-[#111820] flex items-center justify-center text-xl shrink-0">
                    💡
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#111820]">
                      Looking for a specific vehicle or fleet size?
                    </span>
                    <span className="text-xs text-[#66717D]">
                      Our concierge team can coordinate private owner bookings across any Addis sub-city.
                    </span>
                  </div>
                </div>

                <Link
                  href="/#how-it-works"
                  className="px-5 py-2.5 rounded-full bg-[#111820] text-white font-semibold text-xs shrink-0 hover:bg-[#1E293B] transition-colors"
                >
                  Contact Concierge
                </Link>
              </div>
            </main>
          </div>
        </Container>
      </section>
    </div>
  );
}

export default function CataloguePage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-20 flex items-center justify-center text-sm font-semibold text-[#111820]">Loading fleet inventory...</div>}>
      <CatalogueContent />
    </Suspense>
  );
}
