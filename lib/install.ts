'use client';
import { useEffect, useState } from 'react';

/** Captures the browser's "install app" prompt so any button can trigger it. */
type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let deferred: BIP | null = null;
const subs = new Set<() => void>();
if (typeof window !== 'undefined') {
  addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BIP;
    subs.forEach((f) => f());
  });
  addEventListener('appinstalled', () => {
    deferred = null;
    subs.forEach((f) => f());
  });
}

export type Platform = 'ios' | 'android' | 'desktop';

export function useInstall() {
  const [, force] = useState(0);
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const f = () => force((n) => n + 1);
    subs.add(f);
    const ua = navigator.userAgent;
    setPlatform(/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document) ? 'ios' : /Android/.test(ua) ? 'android' : 'desktop');
    setInstalled(matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true);
    return () => void subs.delete(f);
  }, []);
  return {
    canPrompt: !!deferred,
    installed,
    platform,
    async prompt() {
      if (!deferred) return false;
      await deferred.prompt();
      const r = await deferred.userChoice;
      deferred = null;
      force((n) => n + 1);
      return r.outcome === 'accepted';
    },
  };
}

export function useOnline() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    setOn(navigator.onLine);
    const a = () => setOn(true);
    const b = () => setOn(false);
    addEventListener('online', a);
    addEventListener('offline', b);
    return () => {
      removeEventListener('online', a);
      removeEventListener('offline', b);
    };
  }, []);
  return on;
}
