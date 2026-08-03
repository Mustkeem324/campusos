import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'brand';
  showText?: boolean;
}

export function Logo({ className = "w-8 h-8", variant = 'brand', showText = false }: LogoProps) {
  const primaryColor = variant === 'light' ? '#FFFFFF' : '#1854E8';
  const secondaryColor = variant === 'light' ? 'rgba(255,255,255,0.7)' : variant === 'dark' ? '#101B33' : '#101B33';

  return (
    <div className="flex items-center gap-2">
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        {/* Outer Hexagon / Shield Shape */}
        <path 
          d="M50 4L91 25.5V74.5L50 96L9 74.5V25.5L50 4Z" 
          fill={primaryColor} 
          fillOpacity="0.1" 
          stroke={primaryColor} 
          strokeWidth="6" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        {/* Inner C */}
        <path 
          d="M68 36C65.5 32 60 28 50 28C36 28 26 38 26 50C26 62 36 72 50 72C60 72 65.5 68 68 64" 
          stroke={primaryColor} 
          strokeWidth="10" 
          strokeLinecap="round" 
        />
        {/* Inner Connection Node */}
        <circle 
          cx="68" 
          cy="50" 
          r="8" 
          fill={secondaryColor} 
        />
        {/* Connecting line */}
        <path 
          d="M48 50H60" 
          stroke={secondaryColor} 
          strokeWidth="6" 
          strokeLinecap="round" 
        />
      </svg>
      {showText && (
        <span className={`font-bold tracking-tight ${variant === 'light' ? 'text-white' : 'text-[#101828]'}`} style={{ fontSize: '1.25em' }}>
          CampusOS
        </span>
      )}
    </div>
  );
}
