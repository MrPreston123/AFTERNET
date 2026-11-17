import type { Metadata, Viewport } from 'next';
import { Michroma, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';
import Providers from '@/components/Providers';
import './globals.css';
import '@/styles/app.css';

const display = Michroma({ weight: '400', subsets: ['latin'], variable: '--f-display', display: 'swap' });
const body = IBM_Plex_Sans({ weight: ['400', '500', '600'], subsets: ['latin'], variable: '--f-body', display: 'swap' });
const mono = JetBrains_Mono({ weight: ['400', '500'], subsets: ['latin'], variable: '--f-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://afternet-liard.vercel.app'),
  title: 'AFTERNET · Offline Survival System',
  description:
    'What happens when the internet goes dark? Offline Wikipedia, a survival library, a local AI and offline GPS maps, all running on your own device. No servers. No subscriptions. No internet required.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon-48.png', sizes: '48x48' },
      { url: '/icons/icon-192.png', sizes: '192x192' },
    ],
    apple: '/icons/icon-180.png',
  },
  appleWebApp: { capable: true, title: 'AFTERNET', statusBarStyle: 'black-translucent' },
  openGraph: {
    title: 'AFTERNET ($AFTERNET)',
    description: 'The internet is temporary. Knowledge shouldn’t be.',
    images: ['/brand/og.jpg'],
    type: 'website',
  },
  twitter: { card: 'summary_large_image', images: ['/brand/og.jpg'] },
};

export const viewport: Viewport = { themeColor: '#050505', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
