'use client';
import { useId } from 'react';

/** Vector redraw of the AFTERNET mark: red power ring + steel "A". `boot` animates it drawing on. */
export default function Logo({ size = 40, boot = false, glow = true, className = '' }: { size?: number; boot?: boolean; glow?: boolean; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      className={`logo ${boot ? 'logo-boot' : ''} ${className}`}
      width={size}
      height={size * 1.07}
      viewBox="300 160 654 700"
      aria-label="AFTERNET"
      role="img"
    >
      <defs>
        <linearGradient id={`r${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff3a45" />
          <stop offset="0.55" stopColor="#d4000f" />
          <stop offset="0.85" stopColor="#6d0007" />
          <stop offset="1" stopColor="#6d0007" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`a${id}`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#d9d9d9" />
          <stop offset="1" stopColor="#8d8d8d" />
        </linearGradient>
        {glow && (
          <filter id={`g${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="14" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <g filter={glow ? `url(#g${id})` : undefined}>
        <path className="logo-ring" d="M707.4 297 A275 275 0 1 1 546.6 297" fill="none" stroke={`url(#r${id})`} strokeWidth="50" pathLength={1} />
        <rect className="logo-bar" x="599" y="182" width="56" height="206" rx="28" fill="#f01422" />
      </g>
      <path className="logo-a" d="M627 455 L830 866 L627 565 L423 866 Z" fill={`url(#a${id})`} />
    </svg>
  );
}
