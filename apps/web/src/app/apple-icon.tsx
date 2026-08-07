import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 38,
          background: '#0B1731',
        }}
      >
        <svg width="132" height="132" viewBox="0 0 64 64" fill="none">
          <path d="M32 6 55 19v26L32 58 9 45V19L32 6Z" fill="#1754E8" fillOpacity="0.18" stroke="#4F83F1" strokeWidth="3" strokeLinejoin="round" />
          <path d="M19 43V21l26 22V21" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="19" cy="21" r="3.2" fill="#8CB2FF" />
          <circle cx="45" cy="43" r="3.2" fill="#8CB2FF" />
        </svg>
      </div>
    ),
    size,
  );
}
