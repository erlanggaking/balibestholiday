import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Bali Best Holiday — Tours, Hotels, Cars, Flights & Insurance',
    template: '%s · Bali Best Holiday',
  },
  description:
    'Bali Best Holiday is your one-stop online travel agent for tours, hotels, car rentals, flights, and travel insurance — supporting 20 languages and 20 currencies.',
  keywords: ['Bali', 'tours', 'hotels', 'car rental', 'flights', 'travel insurance', 'OTA'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: 'Bali Best Holiday',
    description: 'Tours, hotels, cars, flights & insurance — all in one place.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
