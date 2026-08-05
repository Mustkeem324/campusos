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
          borderRadius: 36,
          background: '#0B1731',
        }}
      >
        <div
          style={{
            width: 126,
            height: 126,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 30,
            background: '#1754E8',
            color: 'white',
            fontSize: 82,
            fontWeight: 800,
            fontFamily: 'Arial, sans-serif',
          }}
        >
          C
        </div>
      </div>
    ),
    size,
  );
}
