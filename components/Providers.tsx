'use client';
import { useEffect } from 'react';
import Crosshair from './Crosshair';

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  return (
    <>
      <Crosshair />
      {children}
    </>
  );
}
