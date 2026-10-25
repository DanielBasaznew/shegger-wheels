import { ImageResponse } from 'next/og';
import fs from 'node:fs';
import path from 'node:path';

export const alt = 'Shegger Wheels — Peer-to-Peer Car Rental in Addis Ababa';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  let heroSrc = '';
  try {
    const heroFilePath = path.join(process.cwd(), 'public', 'hero', 'hero-luxury-suv.jpg');
    if (fs.existsSync(heroFilePath)) {
      const buffer = fs.readFileSync(heroFilePath);
      heroSrc = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    }
  } catch {
    heroSrc = '';
  }

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
          position: 'relative',
        }}
      >
        {/* Hero Background Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {heroSrc ? (
          <img
            src={heroSrc}
            alt="Shegger Wheels Hero Luxury SUV"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : null}

        {/* Cinematic Dark Gradient Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(17, 24, 32, 0.78)',
          }}
        />

        {/* Top Header Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            position: 'relative',
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
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: '#D5F36A',
                color: '#111820',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '30px',
                marginRight: '18px',
              }}
            >
              S
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontSize: '26px',
                  fontWeight: 900,
                  letterSpacing: '2px',
                  color: '#ffffff',
                }}
              >
                SHEGGER WHEELS
              </div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  color: '#D5F36A',
                  textTransform: 'uppercase',
                }}
              >
                Addis Ababa Peer-to-Peer Car Rental
              </div>
            </div>
          </div>

          {/* TeleBirr Escrow Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(17, 24, 32, 0.9)',
              border: '1.5px solid rgba(213, 243, 106, 0.6)',
              borderRadius: '999px',
              padding: '12px 24px',
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

        {/* Center Tagline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: '20px',
              fontWeight: 700,
              color: '#D5F36A',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            Bole · Kazanchis · Sarbet · Piassa · CMC · Arat Kilo
          </div>

          <div
            style={{
              fontSize: '60px',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-2px',
              lineHeight: 1.1,
            }}
          >
            Verified Car Rentals Across Addis Ababa
          </div>

          <div
            style={{
              fontSize: '24px',
              color: '#E0E7EE',
              lineHeight: 1.4,
              maxWidth: '960px',
            }}
          >
            Rent directly from verified local hosts with instant booking, zero deposit on verified ID, and transparent TeleBirr escrow protection.
          </div>
        </div>

        {/* Bottom Feature Badges Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '2px solid rgba(255, 255, 255, 0.18)',
            paddingTop: '24px',
            width: '100%',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', gap: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', color: '#D5F36A', fontSize: '18px', fontWeight: 700 }}>
              100% ID-Verified Hosts
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#D5F36A', fontSize: '18px', fontWeight: 700 }}>
              TeleBirr Secure Escrow
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#D5F36A', fontSize: '18px', fontWeight: 700 }}>
              Airport & Hotel Handover
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: '22px',
              fontWeight: 800,
              color: '#D5F36A',
              fontFamily: 'monospace',
            }}
          >
            sheggerwheels.et
          </div>
        </div>
      </div>
    ),
    size
  );
}

