import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { SEED_CARS } from '@/lib/seeds';
import { CarDetailsView } from '@/components/cars/CarDetailsView';

import { getCarBySlugOrId, getCarSlug } from '@/lib/storage';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return SEED_CARS.flatMap((car) => [
    { id: car.id },
    { id: getCarSlug(car) },
  ]);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const car = getCarBySlugOrId(id) || SEED_CARS.find((c) => c.id === id);

  if (!car) {
    return {
      title: 'Vehicle Not Found — Shegger Wheels',
      description: 'The requested vehicle could not be found on Shegger Wheels.',
    };
  }

  const slug = getCarSlug(car);
  const title = `${car.year} ${car.make} ${car.model} in ${car.neighbourhood} — Shegger Wheels`;
  const description = `${car.description || ''} Rent this ${car.make} ${car.model} in ${car.neighbourhood}, Addis Ababa for ${car.pricePerDay.toLocaleString()} ETB/day. Verified host, comprehensive cover, and instant TeleBirr escrow reservation.`;
  const canonicalUrl = `/cars/${slug}`;
  const ogImage = car.featuredImage || car.photos?.[0] || `/cars/${slug}/opengraph-image`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Shegger Wheels',
      locale: 'en_ET',
      type: 'article',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${car.year} ${car.make} ${car.model} — Shegger Wheels`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

async function CarDetailsContent({ params }: PageProps) {
  const { id } = await params;
  return <CarDetailsView id={id} />;
}

export default function CarDetailPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full py-24 flex items-center justify-center text-sm font-semibold text-[#66717D]">
          Loading vehicle specifications...
        </div>
      }
    >
      <CarDetailsContent params={params} />
    </Suspense>
  );
}
