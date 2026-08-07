import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'brand';
  showText?: boolean;
}

export function Logo({ className = 'w-8 h-8', variant = 'brand', showText = false }: LogoProps) {
  const primaryColor = variant === 'light' ? '#FFFFFF' : '#1754E8';
  const nodeColor = variant === 'light' ? '#FFFFFF' : variant === 'dark' ? '#101D38' : '#101D38';
  const fillColor = variant === 'light' ? 'rgba(255,255,255,0.08)' : 'rgba(23,84,232,0.08)';

  return (
    <div className="flex items-center gap-2.5">
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
        role="img"
        aria-label="NAVEMORA"
      >
        <path
          d="M32 5.5 55 18.75v26.5L32 58.5 9 45.25v-26.5L32 5.5Z"
          fill={fillColor}
          stroke={primaryColor}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M19 43V21l26 22V21"
          stroke={primaryColor}
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="19" cy="21" r="3.5" fill={nodeColor} />
        <circle cx="45" cy="43" r="3.5" fill={nodeColor} />
      </svg>
      {showText && (
        <span
          className={`font-extrabold tracking-[-0.045em] ${variant === 'light' ? 'text-white' : 'text-[#101828]'}`}
          style={{ fontSize: '1.18em' }}
        >
          NAVEMORA
        </span>
      )}
    </div>
  );
}
