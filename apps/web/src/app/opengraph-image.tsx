import { ImageResponse } from 'next/og';

// Node.js is the supported runtime for route handlers and metadata images.
// This image has no edge-only dependency.
export const runtime = 'nodejs';
export const alt = 'NAVEMORA connected higher-education operations platform';
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 82,
              height: 82,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="82" height="82" viewBox="0 0 64 64" fill="none">
              <path d="M32 6 55 19v26L32 58 9 45V19L32 6Z" fill="#1754E8" fillOpacity="0.2" stroke="#4F83F1" strokeWidth="3" strokeLinejoin="round" />
              <path d="M19 43V21l26 22V21" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="19" cy="21" r="3.2" fill="#8CB2FF" />
              <circle cx="45" cy="43" r="3.2" fill="#8CB2FF" />
            </svg>
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-1px' }}>NAVEMORA</div>
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
          <span>NAVEMORA</span>
          <span>Guides · Research · Product insights</span>
        </div>
      </div>
    ),
    size,
  );
}
