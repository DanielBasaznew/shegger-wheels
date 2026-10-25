import { ImageResponse } from 'next/og';
import { SEED_CARS } from '@/lib/seeds';
import { cleanSlug, getCarSlug } from '@/lib/storage';

export const alt = 'Shegger Wheels — Vehicle Rental in Addis Ababa';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export async function generateStaticParams() {
  return SEED_CARS.flatMap((car) => [
    { id: car.id },
    { id: getCarSlug(car) },
  ]);
}

export default async function OpenGraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cleanParam = cleanSlug(id);

  const car =
    SEED_CARS.find(
      (c) =>
        c.id.toLowerCase() === id.toLowerCase() ||
        getCarSlug(c) === cleanParam ||
        cleanSlug(`${c.year}-${c.make}-${c.model}`) === cleanParam
    ) || SEED_CARS[0];

  const title = `${car.year} ${car.make} ${car.model}`;
  const price = `${car.pricePerDay.toLocaleString()} ETB`;
  const location = `${car.neighbourhood} Hub, Addis Ababa`;
  const specs = `${car.seats} Seats • ${car.transmission} • ${car.fuelType || 'Petrol'}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          backgroundColor: '#111820',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Header Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {/* Brand Logo & Name */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                backgroundColor: '#D5F36A',
                color: '#111820',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '28px',
                marginRight: '16px',
              }}
            >
              S
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 900,
                  letterSpacing: '2px',
                  color: '#ffffff',
                }}
              >
                SHEGGER WHEELS
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  color: '#D5F36A',
                  textTransform: 'uppercase',
                }}
              >
                Addis Ababa Verified Mobility
              </div>
            </div>
          </div>

          {/* Escrow Protected Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(213, 243, 106, 0.12)',
              border: '1.5px solid rgba(213, 243, 106, 0.4)',
              borderRadius: '999px',
              padding: '10px 22px',
              color: '#D5F36A',
              fontSize: '14px',
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            TeleBirr Escrow Protected
          </div>
        </div>

        {/* Center Vehicle Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              color: '#8A99A8',
              fontSize: '20px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
            }}
          >
            {location}
          </div>

          <div
            style={{
              fontSize: '64px',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-1.5px',
              lineHeight: 1.1,
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                backgroundColor: '#1C2630',
                border: '1px solid #2C3A48',
                borderRadius: '12px',
                padding: '8px 18px',
                fontSize: '18px',
                fontWeight: 700,
                color: '#E1E7EC',
              }}
            >
              {specs}
            </div>

            <div
              style={{
                display: 'flex',
                backgroundColor: '#1C2630',
                border: '1px solid #2C3A48',
                borderRadius: '12px',
                padding: '8px 18px',
                fontSize: '18px',
                fontWeight: 700,
                color: '#D5F36A',
              }}
            >
              4.95 Rating · Superhost
            </div>
          </div>
        </div>

        {/* Bottom Strip: Price & Guarantee */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderTop: '1px solid #222E3A',
            paddingTop: '24px',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '14px', color: '#8A99A8', fontWeight: 600 }}>
              Daily Marketplace Rate
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span
                style={{
                  fontSize: '44px',
                  fontWeight: 900,
                  color: '#D5F36A',
                  letterSpacing: '-1px',
                }}
              >
                {price}
              </span>
              <span style={{ fontSize: '18px', color: '#8A99A8', fontWeight: 600 }}>
                / day
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '16px',
              fontWeight: 700,
              color: '#8A99A8',
            }}
          >
            Instant Booking • sheggerwheels.com
          </div>
        </div>
      </div>
    ),
    size
  );
}
