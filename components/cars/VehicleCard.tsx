'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Car } from '@/lib/types';
import { getUserById } from '@/lib/storage';

export interface VehicleCardProps {
  car: Car;
  tag?: string;
  rating?: number;
  tripsCount?: number;
  className?: string;
}

export function VehicleCard({
  car,
  tag,
  rating = 4.95,
  tripsCount = 28,
  className = '',
}: VehicleCardProps) {
  const owner = getUserById(car.ownerId);
  const hostName = owner ? owner.name.split(' ')[0] + ' ' + (owner.name.split(' ')[1]?.[0] || '') + '.' : 'Host';
  const hostInitials = owner ? (owner.name.split(' ')[0]?.[0] || 'H') + (owner.name.split(' ')[1]?.[0] || '') : 'ET';

  // Fallback image if car.photos is empty or first photo is missing
  const photoUrl = car.featuredImage || car.photos[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80';

  // Compute category label
  const categoryLabel = car.seats >= 7 ? '7-SEAT SUV / 4X4' : car.transmission === 'Manual' ? 'COMPACT SEDAN' : 'MIDSIZE URBAN SUV';

  // Tag styling
  const tagText = tag || (car.pricePerDay <= 3000 ? 'ECONOMY' : car.seats >= 7 ? 'EXPEDITION READY' : 'INSTANT BOOK');

  return (
    <div
      className={`group flex flex-col bg-white rounded-2xl overflow-hidden border border-[#66717D]/18 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-xl hover:border-[#111820]/30 transition-all duration-300 ${className}`}
      id={`car-card-${car.id}`}
    >
      {/* 16:10 Photo Showcase */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#F1EEE7]">
        <Image
          src={photoUrl}
          alt={`${car.make} ${car.model}`}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Top-Left Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#D5F36A] text-[#111820] font-label-caps text-[10px] font-bold shadow-xs">
          <span>⚡ {tagText}</span>
        </div>

        {/* Top-Right Neighbourhood Pill */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[#111820] font-label-caps text-[10px] uppercase shadow-xs">
          {car.neighbourhood}
        </div>

        {/* Bottom-Left Transmission/Drive Chip */}
        <div className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-md bg-[#111820]/80 backdrop-blur-md text-white font-specs-tabular text-[11px] font-semibold">
          {car.transmission} • {car.seats} Seats
        </div>
      </div>

      {/* Content Body */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-3.5">
        <div className="flex flex-col gap-1">
          {/* Category & Rating */}
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-[#66717D] uppercase tracking-wider font-semibold">
              {categoryLabel}
            </span>
            <div className="flex items-center gap-1 text-[#111820] font-specs-tabular text-xs">
              <span className="text-[#536600] font-bold">★</span>
              <span className="font-bold">{rating}</span>
              <span className="text-[#66717D]">({tripsCount} trips)</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-headline-sm text-lg font-bold text-[#111820] tracking-tight group-hover:text-[#536600] transition-colors line-clamp-1">
            {car.make} {car.model}
          </h3>

          <span className="font-specs-tabular text-xs text-[#66717D]">
            {car.year} • {car.transmission} • {car.fuelType || 'Petrol'}
          </span>
        </div>

        {/* Specs Strip */}
        <div className="flex items-center justify-between py-2 px-3 bg-[#F6F3EC] rounded-xl text-[#111820] font-specs-tabular text-xs">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="text-[#66717D]">🪑</span> {car.seats} Seats
          </span>
          <span className="text-[#66717D]/30">/</span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="text-[#66717D]">⚙️</span> {car.transmission}
          </span>
          <span className="text-[#66717D]/30">/</span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="text-[#66717D]">⛽</span> {car.fuelType || 'Petrol'}
          </span>
        </div>

        {/* Host Info Row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#EBE8E1] text-[#111820] flex items-center justify-center font-bold text-[11px]">
              {hostInitials}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold text-[#111820]">{hostName}</span>
              <span className="font-label-caps text-[9px] text-[#536600] uppercase font-bold">
                Verified Host
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[#66717D] text-xs font-specs-tabular">
            <span className="text-[#536600]">✓</span>
            <span>ID & Escrow OK</span>
          </div>
        </div>

        {/* Pricing & Call to Action */}
        <div className="flex items-center justify-between pt-3 border-t border-[#66717D]/15 mt-1">
          <div className="flex flex-col">
            <span className="font-specs-tabular text-lg font-bold text-[#111820]">
              {car.pricePerDay.toLocaleString()} <span className="text-xs font-normal text-[#66717D]">ETB / day</span>
            </span>
            <span className="font-label-caps text-[9px] text-[#66717D]">
              Direct Local Pricing
            </span>
          </div>

          <Link
            href={`/cars/${car.id}`}
            id={`view-details-${car.id}`}
            className="px-4 py-2 rounded-xl bg-[#111820] hover:bg-[#1E293B] text-white font-semibold text-xs transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <span>View Details</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
