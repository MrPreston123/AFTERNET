import type { Metadata } from 'next';
import AppShell from '@/components/app/AppShell';

export const metadata: Metadata = {
  title: 'AFTERNET · System',
  description: 'The AFTERNET offline survival system: library, Wikipedia, local AI and offline GPS.',
};

export default function AppPage() {
  return <AppShell />;
}
