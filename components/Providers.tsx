'use client';
import { useEffect } from 'react';
import Crosshair from './Crosshair';
import { nativeShell } from '@/lib/platform';

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // The installed apps open straight into the system, not the marketing page.
    if (nativeShell()) {
      if (location.pathname === '/' || location.pathname === '/index.html') location.replace('/app/');
      return;
    }
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
