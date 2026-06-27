import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'BestChoice - Fashion & Cosmetics',
    template: '%s | BestChoice',
  },
  description: 'Premium fashion and cosmetics store across Tamilnadu. Shop men\'s wear, women\'s wear, kids clothing, and cosmetics with home delivery.',
  keywords: ['fashion', 'cosmetics', 'Tamilnadu', 'online shopping', 'clothing', 'Chennai'],
  openGraph: {
    title: 'BestChoice - Fashion & Cosmetics',
    description: 'Premium fashion and cosmetics store across Tamilnadu',
    type: 'website',
    locale: 'en_IN',
    siteName: 'BestChoice',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
