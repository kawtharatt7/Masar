import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Readex_Pro } from 'next/font/google';
import { Providers } from '@/components/Providers';
// @ts-ignore Next.js handles this global stylesheet import.
import './globals.css';

const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const body = Readex_Pro({
  subsets: ['arabic', 'latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Masar | مسار',
  description: 'Career path and skill-gap analysis for university students.',
};

export const viewport: Viewport = {
  themeColor: '#14213D',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}