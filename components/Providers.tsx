'use client';
import { useEffect } from 'react';
import Crosshair from './Crosshair';
import { nativeShell } from '@/lib/platform';

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // The installed apps open straight into the system, not the marketing page.
    const shell = nativeShell();
    if (shell) {
      // Windows serves the site as-is, so open the system rather than the marketing page.
      // (On Android the root index.html already is the system app.)
      if (shell === 'windows' && location.pathname === '/') location.replace('/app/');
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
