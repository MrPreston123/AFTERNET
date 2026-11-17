import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import DownloadCards from '@/components/DownloadCards';

export const metadata: Metadata = {
  title: 'Download AFTERNET · Windows & Android',
  description: 'Download the AFTERNET offline survival system for Windows and Android. Survival guides, Wikipedia, local AI and offline GPS maps that work with no internet.',
};

export default function DownloadPage() {
  return (
    <>
      <Nav />
      <main className="gear-page download-page">
        <div className="gear-bg" aria-hidden="true" />
        <div className="wrap">
          <p className="kicker">Download // free & open source</p>
          <h1 className="h-l dl-title">
            Get AFTERNET <span className="red">before you need it.</span>
          </h1>
          <p className="muted dl-lede">Install it while you still have a connection. After that it runs entirely from your device: no servers, no account, no internet.</p>
          <DownloadCards />
        </div>
      </main>
    </>
  );
}
