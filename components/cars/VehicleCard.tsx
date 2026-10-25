'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Car } from '@/lib/types';
import { getUserById, isOptimizableImage, getCarSlug } from '@/lib/storage';

export interface VehicleCardProps {
  car: Car;
  tag?: string;
  rating?: number;
  tripsCount?: number;
  className?: string;
  priority?: boolean;
}

export function VehicleCard({
  car,
  tag,
  rating = 4.95,
  tripsCount = 28,
  className = '',
  priority = false,
}: VehicleCardProps) {
  const owner = getUserById(car.ownerId);
  const hostName = owner ? owner.name.split(' ')[0] + ' ' + (owner.name.split(' ')[1]?.[0] || '') + '.' : 'Host';
  const hostInitials = owner ? (owner.name.split(' ')[0]?.[0] || 'H') + (owner.name.split(' ')[1]?.[0] || '') : 'ET';

  // Fallback image if car.photos is empty or first photo is missing
  const photoUrl = car.featuredImage || car.photos[0] || '/cars/toyota-landcruiser-300.jpg';

  // Compute category label
  const categoryLabel = car.seats >= 7 ? 'Executive 4x4' : car.transmission === 'Manual' ? 'Compact Sedan' : 'Midsize Urban SUV';

  // Tag styling
  const tagText = tag || (car.pricePerDay <= 3000 ? 'ULTRA ECONOMY' : car.seats >= 7 ? 'INSTANT EXPEDITION' : 'INSTANT BOOK');

  return (
    <article
      className={`group flex flex-col bg-surface-container-lowest rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-shadow duration-300 border border-outline-variant/15 ${className}`}
      id={`car-card-${car.id}`}
    >
      {/* 16:10 Photo Showcase */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-surface-container">
        <Image
          src={photoUrl}
          alt={`${car.make} ${car.model}`}
          fill
          priority={priority}
          quality={70}
          unoptimized={!isOptimizableImage(photoUrl)}
          sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) 48vw, 380px"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Top-Left Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/85 backdrop-blur-md text-on-primary font-label-caps text-label-caps shadow-xs">
          <span className="material-symbols-outlined text-secondary-fixed text-[14px]">bolt</span>
          <span>{tagText}</span>
        </div>

        {/* Top-Right Neighbourhood Pill */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-label-caps text-label-caps uppercase shadow-xs">
          {car.neighbourhood}
        </div>

        {/* Bottom-Left Transmission/Drive Chip */}
        <div className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-md bg-secondary-container text-on-secondary-fixed font-specs-tabular text-[12px] font-bold">
          {car.seats} Seater • {car.transmission === 'Automatic' ? 'Auto AWD' : 'Manual'}
        </div>
      </div>

      {/* Content Body */}
      <div className="p-space-md flex flex-col flex-1 justify-between gap-space-sm">
        <div className="flex flex-col gap-1">
          {/* Category & Rating */}
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
              {categoryLabel}
            </span>
            <div className="flex items-center gap-1 text-on-surface font-specs-tabular text-[12px]">
              <span className="material-symbols-outlined text-secondary text-[16px]">star</span>
              <span className="font-bold">{rating}</span>
              <span className="text-on-surface-variant">({tripsCount} trips)</span>
            </div>
          </div>

          {/* Title */}
          <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight group-hover:text-secondary transition-colors line-clamp-1">
            {car.make} {car.model}
          </h2>

          <span className="font-specs-tabular text-[13px] text-on-surface-variant">
            {car.year} • {car.transmission} • {car.fuelType || 'Petrol'}
          </span>
        </div>

        {/* Specs Strip */}
        <div className="flex items-center justify-between py-2 px-3 bg-surface-container-low rounded-xl text-on-surface font-specs-tabular text-[12px]">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-on-surface-variant">airline_seat_recline_normal</span>
            <span>{car.seats} Seats</span>
          </span>
          <span className="text-outline-variant">/</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-on-surface-variant">settings</span>
            <span>{car.transmission}</span>
          </span>
          <span className="text-outline-variant">/</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-on-surface-variant">local_gas_station</span>
            <span>{car.fuelType || 'Petrol'}</span>
          </span>
        </div>

        {/* Host Meta */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-on-surface text-[12px]">
              {hostInitials}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-title-md text-[13px] text-on-surface">{hostName}</span>
              <span className="font-label-caps text-[9px] text-secondary uppercase font-bold">
                Superhost
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-on-surface-variant text-[12px]">
            <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
            <span>ID &amp; TeleBirr OK</span>
          </div>
        </div>

        {/* Pricing & Call to Action */}
        <div className="flex items-center justify-between pt-2 border-t border-surface-container">
          <div className="flex flex-col">
            <span className="font-specs-tabular text-headline-sm font-bold text-on-surface">
              {car.pricePerDay.toLocaleString()} <span className="text-[13px] font-normal text-on-surface-variant">ETB / day</span>
            </span>
            <span className="font-label-caps text-[10px] text-on-surface-variant">
              Includes Comprehensive Cover
            </span>
          </div>

          <Link
            href={`/cars/${getCarSlug(car)}`}
            id={`view-details-${car.id}`}
            aria-label={`View details for ${car.make} ${car.model}`}
            className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-title-md text-title-md hover:bg-primary-container transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>View Details</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
