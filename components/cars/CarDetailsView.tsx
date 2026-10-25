'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { VehicleCard } from '@/components/cars/VehicleCard';
import { ShareVehicleModal } from '@/components/cars/ShareVehicleModal';
import NeighbourhoodMapPanel from '@/components/map/NeighbourhoodMapPanel';
import { User, Review } from '@/lib/types';
import {
  getUserById,
  getCurrentSession,
  setCheckoutDraft,
  isOptimizableImage,
  getCarSlug,
  cleanSlug,
} from '@/lib/storage';
import { SEED_USERS } from '@/lib/seeds';
import { getCarRatingSummary } from '@/lib/reviews';
import { useCars, useReviews } from '@/lib/swr';

// Format date helpers
function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 1;
  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
}

interface CarDetailsViewProps {
  id: string;
}

export function CarDetailsView({ id }: CarDetailsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load cars with reactive SWR and 1-hour cache validation
  const { cars: allCars, isLoading } = useCars();
  const car = useMemo(() => {
    const normalizedParam = cleanSlug(id);
    return (
      allCars.find(
        (c) =>
          c.id.toLowerCase() === id.toLowerCase() ||
          getCarSlug(c) === normalizedParam ||
          cleanSlug(`${c.year}-${c.make}-${c.model}`) === normalizedParam ||
          cleanSlug(`${c.make}-${c.model}`) === normalizedParam
      ) || allCars.find((c) => c.id === id)
    );
  }, [allCars, id]);

  // Seamlessly synchronize browser address bar to canonical slug when accessed via car ID
  useEffect(() => {
    if (typeof window !== 'undefined' && car) {
      try {
        const canonicalSlug = getCarSlug(car);
        const currentPath = window.location.pathname;
        if (currentPath.toLowerCase() === `/cars/${car.id.toLowerCase()}`) {
          window.history.replaceState(null, '', `/cars/${canonicalSlug}${window.location.search}`);
        }
      } catch {
        // Tolerate environments where history modification is restricted
      }
    }
  }, [car]);

  // Today string for min date
  const todayStr = useMemo(() => formatDateString(new Date()), []);
  const defaultStartStr = useMemo(() => {
    const fromQuery = searchParams.get('startDate');
    if (fromQuery && fromQuery >= todayStr) return fromQuery;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateString(tomorrow);
  }, [searchParams, todayStr]);

  const defaultEndStr = useMemo(() => {
    const fromQuery = searchParams.get('endDate');
    if (fromQuery && fromQuery > defaultStartStr) return fromQuery;
    const end = new Date(defaultStartStr + 'T00:00:00');
    end.setDate(end.getDate() + 3);
    return formatDateString(end);
  }, [searchParams, defaultStartStr]);

  // Date selection states
  const [startDate, setStartDate] = useState(defaultStartStr);
  const [endDate, setEndDate] = useState(defaultEndStr);
  const [handoverOption, setHandoverOption] = useState<'pickup' | 'delivery'>('pickup');
  const [isCopied, setIsCopied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Host info lookup
  const host: User = useMemo(() => {
    if (!car) {
      return SEED_USERS[2]; // Abebe Kebede fallback
    }
    const found = getUserById(car.ownerId);
    return (
      found || {
        id: car.ownerId,
        name: 'Abebe Kebede',
        email: 'abebe.kebede@example.et',
        phone: '+251911556677',
        roles: ['owner'],
        status: 'active',
        avatarUrl:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
        neighbourhood: car.neighbourhood || 'Kazanchis',
        createdAt: '2025-01-20T11:15:00Z',
      }
    );
  }, [car]);

  // Live reviews from reactive SWR
  const { reviews: allReviews } = useReviews();

  // Filter reviews for this car
  const reviews: Review[] = useMemo(() => {
    if (!car) return [];
    return allReviews.filter((r) => r.carId === car.id);
  }, [allReviews, car]);

  // Dynamic Rating Analytics Summary
  const ratingSummary = useMemo(() => {
    if (!car) return { averageRating: 0, totalReviews: 0, starCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    return getCarRatingSummary(car.id, reviews);
  }, [car, reviews]);

  // Related vehicles in same or nearby neighbourhoods
  const relatedCars = useMemo(() => {
    if (!car) return [];
    return allCars
      .filter((c) => c.status === 'approved' && c.id !== car.id)
      .slice(0, 3);
  }, [allCars, car]);

  // Date validation computations
  const isPastDate = startDate < todayStr;
  const isInvalidRange = endDate <= startDate;

  // Check unavailable dates conflict
  const unavailableConflict = useMemo(() => {
    if (!car || !car.unavailableDates || car.unavailableDates.length === 0) return null;
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');

    for (const dStr of car.unavailableDates) {
      const cur = new Date(dStr + 'T00:00:00');
      if (cur >= start && cur < end) {
        return dStr;
      }
    }
    return null;
  }, [car, startDate, endDate]);

  const hasDateError = isPastDate || isInvalidRange || Boolean(unavailableConflict);

  // Rental duration and pricing calculations
  const rentalDays = useMemo(() => {
    if (isInvalidRange) return 1;
    return calculateDaysBetween(startDate, endDate);
  }, [startDate, endDate, isInvalidRange]);

  const subtotal = useMemo(() => {
    if (!car) return 0;
    return rentalDays * car.pricePerDay;
  }, [car, rentalDays]);

  const platformFee = useMemo(() => Math.round(subtotal * 0.05), [subtotal]);
  const handoverFee = handoverOption === 'delivery' ? 400 : 0;
  const estimatedTotal = subtotal + platformFee + handoverFee;

  // Gallery photo list
  const photosList = useMemo(() => {
    if (!car) return [];
    const list = [...car.photos];
    if (list.length === 0 && car.featuredImage) list.push(car.featuredImage);

    // Supplement with contextual vehicle perspectives to fulfill the 4-tile Stitch gallery
    if (list.length === 1) {
      list.push(
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80'
      );
    } else if (list.length === 2) {
      list.push(
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80'
      );
    }
    return list;
  }, [car]);

  // Handle share click
  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  // Keyboard accessibility for modals (Escape to dismiss, Arrow keys for gallery)
  useEffect(() => {
    if (!isContactModalOpen && !isGalleryModalOpen && !isShareModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isContactModalOpen) setIsContactModalOpen(false);
        if (isGalleryModalOpen) setIsGalleryModalOpen(false);
        if (isShareModalOpen) setIsShareModalOpen(false);
      } else if (isGalleryModalOpen) {
        if (e.key === 'ArrowLeft') {
          setActivePhotoIdx((prev) => (prev - 1 + photosList.length) % photosList.length);
        } else if (e.key === 'ArrowRight') {
          setActivePhotoIdx((prev) => (prev + 1) % photosList.length);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isContactModalOpen, isGalleryModalOpen, isShareModalOpen, photosList.length]);

  // Handle booking CTA click
  const handleProceedToBooking = () => {
    if (!car || hasDateError) return;

    const session = getCurrentSession();
    const destination = `/checkout?carId=${encodeURIComponent(car.id)}&startDate=${startDate}&endDate=${endDate}&handover=${handoverOption}`;

    // Record checkout draft in session storage for state continuity
    setCheckoutDraft({
      carId: car.id,
      startDate,
      endDate,
      days: rentalDays,
      pricePerDay: car.pricePerDay,
      subtotal,
      fee: platformFee,
      securityDeposit: 0,
      total: estimatedTotal,
      pickupLocation:
        handoverOption === 'delivery'
          ? `Airport / Concierge Hotel Delivery (${car.neighbourhood})`
          : `${car.neighbourhood} Hub Self Pickup`,
      savedAt: new Date().toISOString(),
    });

    if (session) {
      router.push(destination);
    } else {
      // Safe return path encoding
      const redirectUrl = `/signin?redirect=${encodeURIComponent(destination)}`;
      router.push(redirectUrl);
    }
  };

  // Keyboard navigation for gallery modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGalleryModalOpen) return;
      if (e.key === 'Escape') setIsGalleryModalOpen(false);
      if (e.key === 'ArrowRight') {
        setActivePhotoIdx((prev) => (prev + 1) % photosList.length);
      }
      if (e.key === 'ArrowLeft') {
        setActivePhotoIdx((prev) => (prev - 1 + photosList.length) % photosList.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGalleryModalOpen, photosList.length]);

  // 1. Loading & Not Found States
  if (!car) {
    if (isLoading) {
      return (
        <div className="w-full py-20 bg-[#F5F2EB]">
          <Container>
            <div className="max-w-lg mx-auto p-8 rounded-3xl bg-white border border-[#66717D]/15 shadow-sm flex flex-col items-center text-center animate-pulse">
              <div className="w-16 h-16 rounded-2xl bg-[#EBE8E1] flex items-center justify-center mb-4">
                <div className="w-8 h-8 rounded-full border-3 border-[#111820] border-t-[#D5F36A] animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-[#111820] mb-2">Loading Vehicle Details...</h2>
              <p className="text-[#66717D] text-xs leading-relaxed">
                Retrieving verified vehicle specifications, host certification, and live Addis Ababa telematics.
              </p>
            </div>
          </Container>
        </div>
      );
    }

    return (
      <div className="w-full py-20 bg-[#F5F2EB]">
        <Container>
          <div className="max-w-lg mx-auto p-8 rounded-3xl bg-white border border-[#66717D]/15 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#111820] text-[#D5F36A] flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl">directions_car</span>
            </div>
            <Badge variant="terracotta" className="mb-2">
              404 — Record Missing
            </Badge>
            <h1 className="text-2xl font-bold text-[#111820] mb-2">Vehicle Not Found</h1>
            <p className="text-[#66717D] text-sm mb-6 leading-relaxed">
              We could not locate a vehicle listing matching ID &ldquo;{id}&rdquo;. The car may have been removed or the URL may be incorrect.
            </p>
            <Button variant="secondary" href="/cars" size="md">
              ← Return to Fleet Catalogue
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  // 2. Non-Approved Status State (Pending, Rejected, Inactive)
  if (car.status !== 'approved') {
    return (
      <div className="w-full py-20 bg-[#F5F2EB]">
        <Container>
          <div className="max-w-lg mx-auto p-8 rounded-3xl bg-white border border-[#B9674B]/25 shadow-sm flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-[#B9674B]/10 flex items-center justify-center text-2xl mb-4 text-[#B9674B]">
              ⏳
            </div>
            <Badge variant="terracotta" className="mb-2 uppercase">
              Listing Status: {car.status}
            </Badge>
            <h1 className="text-2xl font-bold text-[#111820] mb-2">
              {car.year} {car.make} {car.model}
            </h1>
            <p className="text-[#66717D] text-sm mb-6 leading-relaxed">
              {car.status === 'pending'
                ? 'This listing was recently submitted by the vehicle owner and is currently undergoing administrative verification by Shegger Wheels. It is not yet available for public bookings.'
                : 'This vehicle listing is currently inactive for maintenance or host break, and is not accepting rental requests at this time.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button variant="secondary" href="/cars" size="md">
                ← Explore Approved Fleet
              </Button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // 3. Approved Car Details View
  return (
    <div className="w-full pb-28 lg:pb-20">
      {/* Subtle Ambient Light Accents */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute -top-32 right-12 w-96 h-96 rounded-full bg-[#D5F36A]/15 blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-96 -left-20 w-80 h-80 rounded-full bg-[#EBE8E1]/80 blur-2xl pointer-events-none -z-10" />

        <Container className="py-6 flex flex-col gap-6">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-2 text-[#66717D] text-xs">
            <Link
              href="/cars"
              className="hover:text-[#111820] transition-colors flex items-center gap-1 font-medium"
            >
              <span>←</span>
              <span>Fleet Catalogue</span>
            </Link>
            <span className="text-[#66717D]/40 font-specs-tabular">/</span>
            <span className="text-[#66717D]">Addis Ababa</span>
            <span className="text-[#66717D]/40 font-specs-tabular">/</span>
            <Link
              href={`/cars?neighbourhood=${encodeURIComponent(car.neighbourhood)}`}
              className="hover:text-[#111820] transition-colors"
            >
              {car.neighbourhood} Hub
            </Link>
            <span className="text-[#66717D]/40 font-specs-tabular">/</span>
            <span className="text-[#111820] font-semibold truncate max-w-xs sm:max-w-none">
              {car.year} {car.make} {car.model}
            </span>
          </nav>

          {/* Editorial Vehicle Header */}
          <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-2 border-b border-[#66717D]/12">
            <div className="flex flex-col gap-2">
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111820] text-white font-label-caps text-[10px] tracking-wider uppercase shadow-xs">
                  <span className="material-symbols-outlined text-[#D5F36A] text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified
                  </span>
                  Top Rated Host
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#CEEC64]/40 text-[#2C3800] font-label-caps text-[10px] tracking-wider uppercase font-bold">
                  <span className="material-symbols-outlined text-[15px]">bolt</span>
                  Instant Confirmation
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBE8E1] text-[#44474B] font-label-caps text-[10px] tracking-wider uppercase">
                  <span className="material-symbols-outlined text-[15px]">location_on</span>
                  {car.neighbourhood} Pickup
                </span>
              </div>

              {/* Title */}
              <h1 className="font-headline-lg text-3xl sm:text-4xl text-[#111820] font-bold tracking-tight">
                {car.year} {car.make} {car.model}
              </h1>

              {/* Stats Bar */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#66717D]">
                <div className="flex items-center gap-1">
                  <span className="text-[#536600] font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    {ratingSummary.totalReviews > 0 ? ratingSummary.averageRating.toFixed(1) : 'New'}
                  </span>
                  <a href="#reviews-section" className="underline hover:text-[#111820]">
                    ({reviews.length} {reviews.length === 1 ? 'verified review' : 'verified reviews'})
                  </a>
                </div>
                <span className="text-[#66717D]/30">•</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[#111820] font-specs-tabular">
                    {car.pricePerDay.toLocaleString()} ETB
                  </span>
                  <span>/ day</span>
                </div>
                <span className="text-[#66717D]/30">•</span>
                <div className="inline-flex items-center gap-1 text-[#536600] font-semibold">
                  <span className="material-symbols-outlined text-[16px]">all_inclusive</span>
                  <span>Unlimited urban km included</span>
                </div>
              </div>
            </div>

            {/* Share & Wishlist Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                aria-label="Share listing"
                className="relative p-2.5 rounded-full bg-white hover:bg-[#F1EEE7] border border-[#66717D]/20 text-[#111820] transition-colors shadow-xs cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">share</span>
                {isCopied && (
                  <span className="absolute -bottom-8 right-0 bg-[#111820] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap animate-fade-in">
                    Link copied!
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsFavorited(!isFavorited)}
                aria-label="Save to favorites"
                className="p-2.5 rounded-full bg-white hover:bg-[#F1EEE7] border border-[#66717D]/20 text-[#111820] transition-colors shadow-xs cursor-pointer flex items-center justify-center"
              >
                <span className={`material-symbols-outlined text-[20px] ${isFavorited ? 'text-[#B9674B]' : 'text-[#66717D]'}`} style={isFavorited ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {isFavorited ? 'favorite' : 'favorite_border'}
                </span>
              </button>
            </div>
          </header>

          {/* Asymmetrical Photo Gallery Mosaic */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 relative rounded-2xl overflow-hidden shadow-xs">
            {/* Main Featured Photo (8 cols) */}
            <div className="lg:col-span-8 relative group overflow-hidden bg-[#EBE8E1] min-h-[360px] lg:min-h-[460px] rounded-2xl lg:rounded-r-none">
              <Image
                src={photosList[0]}
                alt={`${car.year} ${car.make} ${car.model} in ${car.neighbourhood}, Addis Ababa`}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                unoptimized={!isOptimizableImage(photosList[0])}
                priority
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111820]/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#111820]/85 backdrop-blur-md text-white font-specs-tabular text-xs">
                  {car.fuelType || 'Petrol'} • {car.transmission}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#D5F36A] text-[#111820] font-label-caps text-[10px] font-bold uppercase">
                  {car.seats} Seats • {car.neighbourhood} Hub
                </span>
              </div>
            </div>

            {/* Supporting Trio (4 cols) */}
            <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-3">
              {/* Photo 2: Cockpit / Interior */}
              <div className="relative group overflow-hidden bg-[#EBE8E1] h-[175px] lg:h-[145px] rounded-2xl lg:rounded-l-none">
                <Image
                  src={photosList[1] || photosList[0]}
                  alt={`${car.make} ${car.model} cockpit and digital infotainment display`}
                  fill
                  sizes="(max-width: 1024px) 50vw, 33vw"
                  unoptimized={!isOptimizableImage(photosList[1] || photosList[0])}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-[#111820]/80 backdrop-blur-md text-white font-label-caps text-[9px] uppercase">
                  Cockpit &amp; Interior
                </span>
              </div>

              {/* Photo 3: Cabin & Config */}
              <div className="relative group overflow-hidden bg-[#EBE8E1] h-[175px] lg:h-[145px] rounded-2xl lg:rounded-l-none">
                <Image
                  src={photosList[2] || photosList[0]}
                  alt={`${car.make} ${car.model} spacious passenger seating layout`}
                  fill
                  sizes="(max-width: 1024px) 50vw, 33vw"
                  unoptimized={!isOptimizableImage(photosList[2] || photosList[0])}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-[#111820]/80 backdrop-blur-md text-white font-label-caps text-[9px] uppercase">
                  {car.seats} Seats Config
                </span>
              </div>

              {/* Photo 4 / Gallery Trigger (Spans 2 cols on mobile) */}
              <div className="col-span-2 lg:col-span-1 relative group overflow-hidden bg-[#EBE8E1] h-[175px] lg:h-[145px] rounded-2xl lg:rounded-l-none">
                <Image
                  src={photosList[3] || photosList[0]}
                  alt={`${car.make} ${car.model} alloy wheels and exterior details`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  unoptimized={!isOptimizableImage(photosList[3] || photosList[0])}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={() => setIsGalleryModalOpen(true)}
                  className="absolute inset-0 w-full h-full bg-[#111820]/40 hover:bg-[#111820]/55 backdrop-blur-[2px] transition-all flex items-center justify-center gap-2 text-white font-title-md text-sm font-semibold cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">photo_library</span>
                  <span>View Full Photo Showcase</span>
                </button>
              </div>
            </div>
          </section>

          {/* Main Layout: 7:5 Specification & Host vs Sticky Booking Column */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">
            {/* LEFT COLUMN: Vehicle Details & Storytelling (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-8">
              {/* SECTION 1: Technical Spec Strip (6 Tiles) */}
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-title-md text-sm font-bold text-[#111820] uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">tune</span>
                    Vehicle Mechanical Architecture
                  </h2>
                  <span className="font-specs-tabular text-xs text-[#66717D]">
                    Verified Telemetry
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Tile 1: Passenger Capacity */}
                  <div className="p-3.5 rounded-2xl bg-white border border-[#66717D]/12 flex flex-col gap-1 shadow-xs hover:border-[#111820]/30 transition-colors">
                    <div className="flex items-center gap-1.5 text-[#66717D] font-label-caps text-[10px] uppercase font-bold">
                      <span className="material-symbols-outlined text-[18px]">group</span>
                      <span>Capacity</span>
                    </div>
                    <span className="text-sm text-[#111820] font-bold">{car.seats} Seats</span>
                    <span className="text-xs text-[#66717D]">Folding split comfort</span>
                  </div>

                  {/* Tile 2: Transmission */}
                  <div className="p-3.5 rounded-2xl bg-white border border-[#66717D]/12 flex flex-col gap-1 shadow-xs hover:border-[#111820]/30 transition-colors">
                    <div className="flex items-center gap-1.5 text-[#66717D] font-label-caps text-[10px] uppercase font-bold">
                      <span className="material-symbols-outlined text-[18px]">settings</span>
                      <span>Transmission</span>
                    </div>
                    <span className="text-sm text-[#111820] font-bold">{car.transmission}</span>
                    <span className="text-xs text-[#66717D]">Adaptive city gearbox</span>
                  </div>

                  {/* Tile 3: Fuel Powertrain */}
                  <div className="p-3.5 rounded-2xl bg-white border border-[#66717D]/12 flex flex-col gap-1 shadow-xs hover:border-[#111820]/30 transition-colors">
                    <div className="flex items-center gap-1.5 text-[#66717D] font-label-caps text-[10px] uppercase font-bold">
                      <span className="material-symbols-outlined text-[18px]">local_gas_station</span>
                      <span>Powertrain</span>
                    </div>
                    <span className="text-sm text-[#111820] font-bold">{car.fuelType || 'Petrol'}</span>
                    <span className="text-xs text-[#66717D]">High-efficiency engine</span>
                  </div>

                  {/* Tile 4: Subcity Hub */}
                  <div className="p-3.5 rounded-2xl bg-white border border-[#66717D]/12 flex flex-col gap-1 shadow-xs hover:border-[#111820]/30 transition-colors">
                    <div className="flex items-center gap-1.5 text-[#66717D] font-label-caps text-[10px] uppercase font-bold">
                      <span className="material-symbols-outlined text-[18px]">location_on</span>
                      <span>Station Hub</span>
                    </div>
                    <span className="text-sm text-[#111820] font-bold">{car.neighbourhood}</span>
                    <span className="text-xs text-[#66717D]">Central pickup zone</span>
                  </div>

                  {/* Tile 5: Model Year */}
                  <div className="p-3.5 rounded-2xl bg-white border border-[#66717D]/12 flex flex-col gap-1 shadow-xs hover:border-[#111820]/30 transition-colors">
                    <div className="flex items-center gap-1.5 text-[#66717D] font-label-caps text-[10px] uppercase font-bold">
                      <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                      <span>Model Year</span>
                    </div>
                    <span className="text-sm text-[#111820] font-bold">{car.year} Release</span>
                    <span className="text-xs text-[#66717D]">Current-generation fleet</span>
                  </div>

                  {/* Tile 6: Climate Control */}
                  <div className="p-3.5 rounded-2xl bg-white border border-[#66717D]/12 flex flex-col gap-1 shadow-xs hover:border-[#111820]/30 transition-colors">
                    <div className="flex items-center gap-1.5 text-[#66717D] font-label-caps text-[10px] uppercase font-bold">
                      <span className="material-symbols-outlined text-[18px]">ac_unit</span>
                      <span>Climate</span>
                    </div>
                    <span className="text-sm text-[#111820] font-bold">Front &amp; Rear AC</span>
                    <span className="text-xs text-[#66717D]">Purified cabin filtration</span>
                  </div>
                </div>
              </section>

              {/* SECTION 2: Verified Host Profile Card */}
              <section className="p-5 sm:p-6 rounded-2xl bg-white border border-[#66717D]/15 shadow-xs flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#66717D]/10">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Image
                        src={
                          host.avatarUrl ||
                          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80'
                        }
                        alt={`Host ${host.name}`}
                        width={64}
                        height={64}
                        unoptimized={!isOptimizableImage(host.avatarUrl)}
                        className="w-16 h-16 rounded-full object-cover shadow-xs border border-[#111820]/10"
                      />
                      <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#D5F36A] flex items-center justify-center text-[#111820] text-xs shadow-xs font-bold">
                        <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          shield
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-[#111820]">
                          Hosted by {host.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-[#D5F36A]/30 text-[#2C3800] font-label-caps text-[9px] uppercase font-bold">
                          Superhost
                        </span>
                      </div>
                      <span className="text-xs text-[#66717D]">
                        Host in {host.neighbourhood || 'Addis Ababa'} • 140+ completed trips
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(true)}
                    className="px-4 py-2 rounded-full bg-[#EBE8E1] hover:bg-[#DCDAD3] text-[#111820] text-xs font-bold transition-colors self-start sm:self-auto flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                    <span>Contact Host</span>
                  </button>
                </div>

                {/* Host Telemetry Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-[#F6F3EC] flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary text-[24px]">verified</span>
                    <div className="flex flex-col">
                      <span className="font-specs-tabular text-xs font-bold text-[#111820]">
                        100% Response Rate
                      </span>
                      <span className="text-[11px] text-[#66717D]">Replies within 10 min</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F6F3EC] flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary text-[24px]">translate</span>
                    <div className="flex flex-col">
                      <span className="font-specs-tabular text-xs font-bold text-[#111820]">
                        Languages
                      </span>
                      <span className="text-[11px] text-[#66717D]">Amharic, English</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F6F3EC] flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary text-[24px]">workspace_premium</span>
                    <div className="flex flex-col">
                      <span className="font-specs-tabular text-xs font-bold text-[#111820]">
                        Host Rating
                      </span>
                      <span className="text-[11px] text-[#66717D]">4.98 from 86 reviews</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 3: Vehicle Description */}
              <section className="flex flex-col gap-3">
                <h2 className="text-lg font-bold text-[#111820]">
                  About This {car.make} {car.model}
                </h2>
                <div className="text-sm text-[#44474B] flex flex-col gap-3 leading-relaxed">
                  <p>{car.description}</p>
                  <p>
                    Cleaned, inspected, and fully fueled before every handover. Whether you are navigating Bole&apos;s commercial center, Kazanchis diplomatic towers, or taking weekend scenic drives to Entoto or Bishoftu, this vehicle delivers reliable comfort.
                  </p>
                </div>

                {/* Expedition Readiness Callout Bar */}
                <div className="p-4 rounded-2xl bg-[#EBE8E1]/80 border border-[#66717D]/12 flex items-start gap-3 mt-1">
                  <span className="p-2 rounded-xl bg-[#111820] text-[#D5F36A] shrink-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">explore</span>
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#111820]">
                      Tested &amp; Prepared for Ethiopian Urban &amp; Regional Roads
                    </span>
                    <p className="text-xs text-[#66717D] mt-0.5 leading-relaxed">
                      Reinforced suspension, full-size mounted spare tire, Jack &amp; toolkit, and verified brake inspection certification verified for Addis Ababa topography.
                    </p>
                  </div>
                </div>
              </section>

              {/* SECTION 4: Included Equipment & Amenities */}
              <section className="flex flex-col gap-3">
                <h2 className="text-lg font-bold text-[#111820]">
                  Included Equipment &amp; Amenities
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {car.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white border border-[#66717D]/12 flex items-center gap-3 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[#536600] text-[18px]">check_circle</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[#111820]">{feature}</span>
                        <span className="text-xs text-[#66717D]">Included at zero surcharge</span>
                      </div>
                    </div>
                  ))}
                  {/* Default standard protections */}
                  <div className="p-3.5 rounded-2xl bg-white border border-[#66717D]/12 flex items-center gap-3 shadow-xs">
                    <span className="material-symbols-outlined text-[#536600] text-[20px]">security</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[#111820]">
                        Comprehensive Insurance
                      </span>
                      <span className="text-xs text-[#66717D]">
                        Nyala Insurance zero-excess cover
                      </span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-[#66717D]/12 flex items-center gap-3 shadow-xs">
                    <span className="material-symbols-outlined text-[#536600] text-[20px]">emergency</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-[#111820]">
                        24/7 Roadside Assistance
                      </span>
                      <span className="text-xs text-[#66717D]">
                        Instant towing and mechanical dispatch
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECTION 5: Pickup & Delivery Logistics */}
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#111820]">
                    Pickup &amp; Delivery Logistics
                  </h2>
                  <span className="font-label-caps text-[10px] uppercase text-[#536600] font-bold">
                    {car.neighbourhood} Subcity Hub
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-[#66717D]/12 flex flex-col gap-1 shadow-xs">
                    <div className="flex items-center gap-1.5 font-bold text-sm text-[#111820]">
                      <span className="material-symbols-outlined text-[#536600] text-[18px]">location_on</span>
                      <span>Free Pickup in {car.neighbourhood}</span>
                    </div>
                    <p className="text-xs text-[#66717D] leading-relaxed">
                      Pick up directly at the host&apos;s secured compound near {car.neighbourhood} main avenue or receive free doorstep handoff within the subcity.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#66717D]/12 flex flex-col gap-1 shadow-xs">
                    <div className="flex items-center gap-1.5 font-bold text-sm text-[#111820]">
                      <span className="material-symbols-outlined text-[#111820] text-[18px]">flight_land</span>
                      <span>Airport &amp; Hotel Concierge Drop-off</span>
                    </div>
                    <p className="text-xs text-[#66717D] leading-relaxed">
                      Bole International Airport (ADD) Terminal 2 or Kazanchis/Bole hotel delivery available for an optional 400 ETB concierge fee.
                    </p>
                  </div>
                </div>

                {/* Interactive Leaflet Neighbourhood Hub Map */}
                <div className="mt-2">
                  <NeighbourhoodMapPanel
                    neighbourhood={car.neighbourhood}
                    carName={`${car.year} ${car.make} ${car.model}`}
                  />
                </div>
              </section>

              {/* SECTION 6: Verified Renter Reviews */}
              <section id="reviews-section" className="flex flex-col gap-4 pt-2">
                <div className="flex items-center justify-between pb-1 border-b border-[#66717D]/12">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#111820]">Renter Experiences</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#111820] text-white font-specs-tabular text-xs font-bold inline-flex items-center gap-1">
                      {ratingSummary.totalReviews > 0 ? (
                        <>
                          <span className="material-symbols-outlined text-xs text-[#D5F36A]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span>{ratingSummary.averageRating.toFixed(1)}</span>
                        </>
                      ) : (
                        'New'
                      )}
                    </span>
                  </div>
                  <span className="text-xs text-[#66717D]">
                    {reviews.length} {reviews.length === 1 ? 'Verified Trip' : 'Verified Trips'}
                  </span>
                </div>

                {reviews.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-white border border-[#66717D]/12 shadow-xs flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#F5F2EB] flex items-center justify-center text-[#66717D]">
                      <span className="material-symbols-outlined text-2xl">rate_review</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-bold text-sm text-[#111820]">No Reviews Yet</h3>
                      <p className="text-xs text-[#66717D] max-w-sm">
                        This vehicle hasn&apos;t received reviews yet. Complete a trip to be the first verified traveler to leave feedback!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {reviews.map((rev) => {
                      const reviewer = getUserById(rev.renterId);
                      const reviewerName = reviewer ? reviewer.name : 'Verified Shegger Traveler';
                      return (
                        <div
                          key={rev.id}
                          className="p-4 rounded-2xl bg-white border border-[#66717D]/12 shadow-xs flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {reviewer?.avatarUrl ? (
                                <Image
                                  src={reviewer.avatarUrl}
                                  alt={reviewerName}
                                  width={40}
                                  height={40}
                                  unoptimized={!isOptimizableImage(reviewer.avatarUrl)}
                                  className="w-10 h-10 rounded-full object-cover border border-[#66717D]/15"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-[#EBE8E1] text-[#111820] flex items-center justify-center font-bold text-sm">
                                  {reviewerName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-[#111820]">
                                  {reviewerName}
                                </span>
                                <span className="text-[11px] text-[#66717D]">
                                  {formatDisplayDate(rev.createdAt.split('T')[0])}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center text-amber-500 text-xs">
                              {Array.from({ length: rev.rating }).map((_, i) => (
                                <span key={i} className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              ))}
                              <span className="text-[#66717D] ml-1 text-[11px] font-specs-tabular">
                                {rev.rating}.0
                              </span>
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-[#111820] leading-relaxed mt-1">
                            &ldquo;{rev.comment}&rdquo;
                          </p>
                          {rev.ownerReply && (
                            <div className="mt-2.5 p-3 rounded-xl bg-[#F5F2EB] border border-[#66717D]/10 flex flex-col gap-1">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 font-bold text-[#111820]">
                                  <span className="material-symbols-outlined text-[16px] text-secondary">forum</span>
                                  <span>Response from Host ({host.name})</span>
                                </div>
                                {rev.ownerReplyAt && (
                                  <span className="text-[10px] text-[#66717D]">
                                    {formatDisplayDate(rev.ownerReplyAt.split('T')[0])}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#44474B] leading-relaxed">
                                {rev.ownerReply}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* RIGHT COLUMN: Sticky Booking & Transparent Escrow Calculator (5 cols) */}
            <aside id="booking-card" className="lg:col-span-5 sticky top-24">
              <div className="rounded-3xl bg-white border border-[#66717D]/18 shadow-md p-6 flex flex-col gap-5">
                {/* Rate & Security Header */}
                <div className="flex items-end justify-between pb-4 border-b border-[#66717D]/12">
                  <div className="flex flex-col">
                    <span className="font-label-caps text-[10px] uppercase text-[#66717D] tracking-wider font-bold">
                      Daily Rate
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-[#111820] tracking-tight font-specs-tabular">
                        {car.pricePerDay.toLocaleString()}
                      </span>
                      <span className="text-sm font-bold text-[#111820]">ETB</span>
                      <span className="text-xs text-[#66717D]">/ day</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="inline-flex items-center gap-1 text-[#536600] text-xs font-bold">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>No Deposit Required</span>
                    </span>
                    <span className="font-label-caps text-[9px] text-[#66717D] uppercase">
                      For verified Shegger ID
                    </span>
                  </div>
                </div>

                {/* Date Selection Module */}
                <div className="flex flex-col gap-2">
                  <label className="font-label-caps text-[10px] uppercase text-[#66717D] tracking-wider font-bold">
                    Rental Period &amp; Dates
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Pick-up Date Input */}
                    <div className="p-3 rounded-2xl bg-[#F6F3EC] border border-[#66717D]/12 flex flex-col gap-1 focus-within:border-[#111820] transition-colors">
                      <span className="font-label-caps text-[9px] uppercase text-[#66717D] font-bold">
                        Trip Start
                      </span>
                      <input
                        type="date"
                        min={todayStr}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent text-xs font-bold text-[#111820] outline-none cursor-pointer"
                        aria-label="Trip start date"
                      />
                      <span className="text-[10px] text-[#66717D] truncate">
                        {car.neighbourhood} Hub
                      </span>
                    </div>

                    {/* Return Date Input */}
                    <div className="p-3 rounded-2xl bg-[#F6F3EC] border border-[#66717D]/12 flex flex-col gap-1 focus-within:border-[#111820] transition-colors">
                      <span className="font-label-caps text-[9px] uppercase text-[#66717D] font-bold">
                        Trip Return
                      </span>
                      <input
                        type="date"
                        min={startDate || todayStr}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent text-xs font-bold text-[#111820] outline-none cursor-pointer"
                        aria-label="Trip return date"
                      />
                      <span className="text-[10px] text-[#66717D] truncate">
                        {car.neighbourhood} Hub
                      </span>
                    </div>
                  </div>

                  {/* Validation Errors or Duration Banner */}
                  {isPastDate && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">warning</span>
                      <span>Pickup date cannot be in the past. Please select today or a future date.</span>
                    </div>
                  )}

                  {isInvalidRange && !isPastDate && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">warning</span>
                      <span>Return date must be strictly after the pickup date.</span>
                    </div>
                  )}

                  {unavailableConflict && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">lock</span>
                      <span>
                        Vehicle is booked on <strong>{unavailableConflict}</strong>. Please adjust your dates.
                      </span>
                    </div>
                  )}

                  {!hasDateError && (
                    <div className="mt-1 px-3 py-2 rounded-xl bg-[#EBE8E1]/80 flex items-center justify-between font-specs-tabular text-xs">
                      <span className="text-[#111820] font-medium flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                        <span>Duration: {rentalDays} {rentalDays === 1 ? 'Day' : 'Days'}</span>
                      </span>
                      <span className="text-[#66717D] font-bold">
                        Billed as {rentalDays} rental {rentalDays === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Handover Delivery Options */}
                <div className="flex flex-col gap-2 pt-1 border-t border-[#66717D]/12">
                  <label className="font-label-caps text-[10px] uppercase text-[#66717D] tracking-wider font-bold">
                    Vehicle Handover Options
                  </label>
                  <div className="flex flex-col gap-2">
                    <label
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-colors cursor-pointer ${
                        handoverOption === 'pickup'
                          ? 'bg-[#111820] text-white border-[#111820]'
                          : 'bg-[#F6F3EC] text-[#111820] border-transparent hover:bg-[#EBE8E1]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="handover"
                          value="pickup"
                          checked={handoverOption === 'pickup'}
                          onChange={() => setHandoverOption('pickup')}
                          className="accent-[#D5F36A]"
                        />
                        <span className="material-symbols-outlined text-[18px]">location_on</span>
                        <span className="text-xs font-semibold">
                          {car.neighbourhood} Hub Self Pickup
                        </span>
                      </div>
                      <span className="text-xs font-bold font-specs-tabular text-[#D5F36A]">
                        Free
                      </span>
                    </label>

                    <label
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-colors cursor-pointer ${
                        handoverOption === 'delivery'
                          ? 'bg-[#111820] text-white border-[#111820]'
                          : 'bg-[#F6F3EC] text-[#111820] border-transparent hover:bg-[#EBE8E1]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="handover"
                          value="delivery"
                          checked={handoverOption === 'delivery'}
                          onChange={() => setHandoverOption('delivery')}
                          className="accent-[#D5F36A]"
                        />
                        <span className="material-symbols-outlined text-[18px]">flight_land</span>
                        <span className="text-xs font-semibold">
                          Airport / Hotel Concierge Drop-off
                        </span>
                      </div>
                      <span className="text-xs font-bold font-specs-tabular">
                        +400 ETB
                      </span>
                    </label>
                  </div>
                </div>

                {/* Fee Computation Breakdown */}
                <div className="flex flex-col gap-2 pt-2 border-t border-[#66717D]/12">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-[10px] uppercase text-[#66717D] tracking-wider font-bold">
                      Estimated Cost Breakdown
                    </span>
                    <span className="text-[10px] text-[#536600] font-bold">TeleBirr Escrow</span>
                  </div>

                  <div className="flex flex-col gap-1.5 font-specs-tabular text-xs">
                    <div className="flex items-center justify-between text-[#111820]">
                      <span>
                        {car.pricePerDay.toLocaleString()} ETB × {rentalDays} {rentalDays === 1 ? 'day' : 'days'}
                      </span>
                      <span className="font-bold">{subtotal.toLocaleString()} ETB</span>
                    </div>

                    <div className="flex items-center justify-between text-[#111820]">
                      <span className="text-[#66717D] flex items-center gap-1">
                        <span>Sheggar Comprehensive Protection</span>
                        <span className="material-symbols-outlined text-[#536600] text-[15px]" title="Zero excess collision & liability">
                          check_circle
                        </span>
                      </span>
                      <span className="text-[#536600] font-bold">Included (0 ETB)</span>
                    </div>

                    <div className="flex items-center justify-between text-[#111820]">
                      <span className="text-[#66717D]">Marketplace Platform Fee (5%)</span>
                      <span className="font-bold">{platformFee.toLocaleString()} ETB</span>
                    </div>

                    {handoverOption === 'delivery' && (
                      <div className="flex items-center justify-between text-[#111820]">
                        <span className="text-[#66717D]">Concierge Delivery Service</span>
                        <span className="font-bold">400 ETB</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-[#66717D]">
                      <span>TeleBirr Escrow Security Hold</span>
                      <span className="text-[#536600] font-semibold">Waived (Verified ID)</span>
                    </div>

                    {/* Total Block */}
                    <div className="mt-2 p-3 rounded-2xl bg-[#F1EEE7] flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-label-caps text-[9px] uppercase text-[#66717D] font-bold">
                          Estimated Total
                        </span>
                        <span className="text-xl font-bold text-[#111820]">
                          {estimatedTotal.toLocaleString()} ETB
                        </span>
                      </div>
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-[#111820] font-specs-tabular text-xs border border-[#66717D]/15 shadow-xs">
                        <span className="material-symbols-outlined text-[#536600] text-[16px]">lock</span>
                        <span className="text-[11px] font-bold">Escrow Protected</span>
                      </div>
                    </div>

                    <span className="text-[10px] text-[#66717D] italic mt-0.5">
                      * Estimated total — Authoritative booking snapshot locked at checkout.
                    </span>
                  </div>
                </div>

                {/* Primary Booking CTA */}
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    disabled={hasDateError}
                    onClick={handleProceedToBooking}
                    className="w-full py-4 px-6 rounded-full bg-[#D5F36A] hover:bg-[#C8E85B] text-[#111820] font-bold text-sm tracking-tight text-center transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none select-none"
                  >
                    <span>Proceed to Checkout</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>

                  {/* Trust Micro-copy */}
                  <div className="p-3 rounded-xl bg-[#F6F3EC] flex items-start gap-2 text-[#66717D] text-xs">
                    <span className="material-symbols-outlined text-[#536600] text-[18px] shrink-0 mt-0.5">shield</span>
                    <p className="leading-relaxed text-[11px]">
                      <span className="font-bold text-[#111820]">You won&apos;t be charged yet.</span> Funds are securely locked in TeleBirr escrow until you meet host {host.name.split(' ')[0]} and complete the physical inspection check-in.
                    </p>
                  </div>

                  {/* Cancellation Guarantee */}
                  <div className="flex items-center justify-center gap-1.5 text-[#66717D] text-[11px]">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    <span>Free cancellation up to 24 hours prior to handover</span>
                  </div>
                </div>

                {/* Host Direct Inquiries Footer */}
                <div className="pt-2 border-t border-[#66717D]/12 flex items-center justify-between text-xs text-[#66717D]">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-[#536600]">verified</span>
                    <span>Addis Ababa Bureau Reg #ET-04918</span>
                  </span>
                  <Link href="/terms" className="underline hover:text-[#111820]">
                    Rental Terms
                  </Link>
                </div>
              </div>
            </aside>
          </div>

          {/* SIMILAR RECOMMENDED VEHICLES STRIP */}
          {relatedCars.length > 0 && (
            <section className="mt-12 pt-8 border-t border-[#66717D]/15 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <span className="font-label-caps text-[10px] uppercase text-[#66717D] font-bold tracking-wider">
                    Alternative Options in Addis Ababa
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#111820]">
                    Other Verified Vehicles in Addis Ababa
                  </h2>
                </div>
                <Link
                  href="/cars"
                  className="text-sm font-bold text-[#111820] hover:text-[#536600] flex items-center gap-1"
                >
                  <span>View entire fleet catalogue</span>
                  <span>→</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedCars.map((related) => (
                  <VehicleCard key={related.id} car={related} />
                ))}
              </div>
            </section>
          )}
        </Container>
      </div>

      {/* Mobile Sticky Booking Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#66717D]/18 p-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-between shadow-lg">
        <div className="flex flex-col">
          <span className="font-specs-tabular text-base font-extrabold text-[#111820]">
            {car.pricePerDay.toLocaleString()} ETB <span className="text-xs font-normal text-[#66717D]">/ day</span>
          </span>
          <span className="text-[10px] text-[#536600] font-semibold">Zero deposit with verified ID</span>
        </div>
        <button
          type="button"
          onClick={() => {
            const card = document.getElementById('booking-card');
            if (card) {
              card.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="px-5 py-2.5 rounded-full bg-[#D5F36A] hover:bg-[#C8E85B] text-[#111820] font-bold text-xs shadow-xs active:scale-95 transition-transform cursor-pointer"
        >
          Reserve Vehicle
        </button>
      </div>

      {/* MODAL 1: Contact Host Modal */}
      {isContactModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-host-dialog-title"
          className="fixed inset-0 z-50 bg-[#111820]/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#66717D]/15">
              <div className="flex items-center gap-3">
                <Image
                  src={
                    host.avatarUrl ||
                    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80'
                  }
                  alt={host.name}
                  width={40}
                  height={40}
                  unoptimized={!isOptimizableImage(host.avatarUrl)}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex flex-col">
                  <span id="contact-host-dialog-title" className="text-sm font-bold text-[#111820]">
                    Contact {host.name}
                  </span>
                  <span className="text-[11px] text-[#66717D]">Verified Shegger Host</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                aria-label="Close dialog"
                className="w-8 h-8 rounded-full bg-[#F1EEE7] hover:bg-[#EBE8E1] text-[#111820] flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#F6F3EC] flex flex-col gap-1">
                <span className="font-bold text-[#111820]">Phone Inquiry</span>
                <span className="font-specs-tabular text-sm text-[#536600] font-bold">
                  {host.phone}
                </span>
                <span className="text-[10px] text-[#66717D]">
                  Available 8:00 AM – 8:00 PM East Africa Time (EAT)
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-host-textarea" className="font-bold text-[#111820]">
                  Direct Message to Host
                </label>
                <textarea
                  id="contact-host-textarea"
                  rows={3}
                  defaultValue={`Hello ${host.name}, I am interested in renting your ${car.year} ${car.make} ${car.model} from ${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}. Is the vehicle ready for key handoff?`}
                  className="w-full p-3 rounded-2xl border border-[#66717D]/25 text-xs text-[#111820] outline-none focus:border-[#111820]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsContactModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  alert(`Message sent to host ${host.name}! They will reply within 10 minutes.`);
                  setIsContactModalOpen(false);
                }}
              >
                Send Message
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Photo Lightbox Gallery Modal */}
      {isGalleryModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Vehicle photo gallery lightbox"
          className="fixed inset-0 z-50 bg-[#111820]/90 backdrop-blur-md flex flex-col p-4 sm:p-8"
        >
          <div className="flex items-center justify-between pb-4 text-white">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">
                {car.year} {car.make} {car.model} Showcase
              </span>
              <span className="text-xs text-[#D5F36A] font-specs-tabular">
                ({activePhotoIdx + 1} of {photosList.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsGalleryModalOpen(false)}
              aria-label="Close photo gallery"
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold transition"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              <span>Close</span>
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center overflow-hidden">
            <Image
              src={photosList[activePhotoIdx]}
              alt={`${car.make} ${car.model} view ${activePhotoIdx + 1}`}
              fill
              sizes="100vw"
              unoptimized={!isOptimizableImage(photosList[activePhotoIdx])}
              className="object-contain"
            />

            {/* Nav Arrows */}
            {photosList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoIdx((prev) => (prev - 1 + photosList.length) % photosList.length)
                  }
                  className="absolute left-2 sm:left-6 w-12 h-12 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center text-xl cursor-pointer"
                  aria-label="Previous photo"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoIdx((prev) => (prev + 1) % photosList.length)}
                  className="absolute right-2 sm:right-6 w-12 h-12 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center text-xl cursor-pointer"
                  aria-label="Next photo"
                >
                  →
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Bar */}
          <div className="pt-4 flex items-center justify-center gap-2 overflow-x-auto">
            {photosList.map((p, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`View photo ${idx + 1}`}
                aria-current={activePhotoIdx === idx ? 'true' : undefined}
                onClick={() => setActivePhotoIdx(idx)}
                className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 cursor-pointer transition-all shrink-0 ${
                  activePhotoIdx === idx ? 'border-[#D5F36A] scale-105' : 'border-transparent opacity-60'
                }`}
              >
                <Image src={p} alt={`Thumbnail ${idx + 1}`} fill sizes="64px" unoptimized={!isOptimizableImage(p)} className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Social Card Share Preview Modal */}
      {car && (
        <ShareVehicleModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          car={car}
        />
      )}
    </div>
  );
}
