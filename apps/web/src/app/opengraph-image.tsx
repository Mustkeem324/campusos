import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'CampusOS connected higher-education operations platform';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0B1731',
          color: '#FFFFFF',
          padding: '72px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div
            style={{
              width: 78,
              height: 78,
              borderRadius: 22,
              background: '#1754E8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 44,
              fontWeight: 800,
            }}
          >
            C
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-1px' }}>CampusOS</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 980 }}>
          <div style={{ color: '#93C5FD', fontSize: 24, fontWeight: 700, letterSpacing: '2px' }}>
            CONNECTED HIGHER-EDUCATION OPERATIONS
          </div>
          <div style={{ marginTop: 22, fontSize: 68, lineHeight: 1.05, fontWeight: 800, letterSpacing: '-3px' }}>
            One operating platform for the modern institution.
          </div>
          <div style={{ marginTop: 26, color: '#CBD5E1', fontSize: 28, lineHeight: 1.4 }}>
            Academic, administrative, finance and student-service workflows in one governed system.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: 22 }}>
          <span>campusos</span>
          <span>Guides · Research · Product insights</span>
        </div>
      </div>
    ),
    size,
  );
}
