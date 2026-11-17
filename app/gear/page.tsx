import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import GearShop from '@/components/GearShop';

export const metadata: Metadata = {
  title: 'Survival Gear · AFTERNET',
  description: 'The essential survival gear to keep your devices and yourself running when the grid goes down: solar power banks, radios, water filters, first aid and more.',
};

export default function GearPage() {
  return (
    <>
      <Nav />
      <main className="gear-page">
        <div className="gear-bg" aria-hidden="true" />
        <div className="wrap">
          <GearShop />
        </div>
      </main>
    </>
  );
}
