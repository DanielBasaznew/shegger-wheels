import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { SEED_CARS } from '@/lib/seeds';
import { CarDetailsView } from '@/components/cars/CarDetailsView';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return SEED_CARS.map((car) => ({
    id: car.id,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const car = SEED_CARS.find((c) => c.id === id);

  if (!car) {
    return {
      title: 'Vehicle Not Found — Shegger Wheels',
      description: 'The requested vehicle could not be found on Shegger Wheels.',
    };
  }

  return {
    title: `${car.year} ${car.make} ${car.model} in ${car.neighbourhood} — Shegger Wheels`,
    description: `${car.description} Rent this ${car.make} ${car.model} in ${car.neighbourhood}, Addis Ababa for ${car.pricePerDay.toLocaleString()} ETB/day.`,
  };
}

export default async function CarDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="w-full py-24 flex items-center justify-center text-sm font-semibold text-[#66717D]">
          Loading vehicle specifications...
        </div>
      }
    >
      <CarDetailsView id={id} />
    </Suspense>
  );
}
