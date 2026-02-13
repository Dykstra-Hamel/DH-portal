import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import localFont from 'next/font/local';
import { LayoutWrapper } from '@/components/Layout/LayoutWrapper/LayoutWrapper';
import { UserbackProvider } from '@/components/Common/UserbackProvider';
import ScrollToTop from '@/components/Common/ScrollToTop';
import ServiceWorkerRegistration from '@/components/Common/ServiceWorkerRegistration';
import '@/styles/main.scss';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const veganDays = localFont({
  src: '../../public/fonts/vegan-days.regular.ttf',
  variable: '--font-vegan-days',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'PMPCentral',
  description:
    'Your smart pest control sales lead and customer service platform.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PMPCentral',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.className} ${veganDays.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body>
        <ServiceWorkerRegistration />
        <ScrollToTop />
        <UserbackProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </UserbackProvider>
      </body>
    </html>
  );
}
