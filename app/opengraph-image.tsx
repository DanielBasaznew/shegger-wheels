import { ImageResponse } from 'next/og';

export const alt = 'Shegger Wheels — Peer-to-Peer Car Rental in Addis Ababa';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          backgroundColor: '#111820',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          position: 'relative',
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
              backgroundColor: 'rgba(213, 243, 106, 0.12)',
              border: '1.5px solid rgba(213, 243, 106, 0.4)',
              borderRadius: '999px',
              padding: '12px 24px',
              color: '#D5F36A',
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            TeleBirr Escrow Protected
          </div>
        </div>

        {/* Center Tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div
            style={{
              display: 'flex',
              fontSize: '22px',
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
              fontSize: '68px',
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
              fontSize: '26px',
              color: '#8A99A8',
              lineHeight: 1.4,
              maxWidth: '920px',
            }}
          >
            Rent directly from verified local vehicle hosts. Secure payment escrow, zero hidden fees, and transparent handover inspections.
          </div>
        </div>

        {/* Bottom Feature Badges Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '2px solid rgba(255, 255, 255, 0.12)',
            paddingTop: '28px',
            width: '100%',
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
