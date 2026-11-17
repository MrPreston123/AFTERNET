'use client';
import { SITE } from './config';

/** Native wrappers expose themselves here: Electron (preload) or Capacitor (Android). */
type W = Window & { afternetNative?: { platform: string; version: string }; Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } };

export function nativeShell(): 'windows' | 'android' | null {
  if (typeof window === 'undefined') return null;
  const w = window as W;
  if (w.afternetNative) return 'windows';
  if (w.Capacitor?.isNativePlatform?.()) return 'android';
  return null;
}

export type OS = 'windows' | 'android' | 'ios' | 'mac' | 'linux' | 'other';
export function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document)) return 'ios';
  if (/Windows/i.test(ua)) return 'windows';
  if (/Macintosh/.test(ua)) return 'mac';
  if (/Linux/.test(ua)) return 'linux';
  return 'other';
}

const REL = `${SITE.github}/releases/latest/download`;
export const DOWNLOADS = {
  windows: { url: `${REL}/AFTERNET-Setup.exe`, label: 'Install for Windows', file: 'AFTERNET-Setup.exe', size: '≈ 135 MB' },
  android: { url: `${REL}/AFTERNET.apk`, label: 'Install for Android', file: 'AFTERNET.apk', size: '≈ 25 MB' },
  releases: `${SITE.github}/releases/latest`,
};
