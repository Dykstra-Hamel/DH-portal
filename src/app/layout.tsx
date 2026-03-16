import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import localFont from 'next/font/local';
import { LayoutWrapper } from '@/components/Layout/LayoutWrapper/LayoutWrapper';
import { UserbackProvider } from '@/components/Common/UserbackProvider';
import { PWAServiceWorkerRegistration } from '@/components/Common/PWAServiceWorkerRegistration';
import ScrollToTop from '@/components/Common/ScrollToTop';
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

export const metadata: Metadata = {
  title: 'PMPCentral',
  description:
    'Your smart pest control sales lead and customer service platform.',
  applicationName: 'PMPCentral',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PMPCentral',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.className} ${veganDays.variable}`}>
      <body>
        <ScrollToTop />
        <UserbackProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </UserbackProvider>
        <PWAServiceWorkerRegistration />
      </body>
    </html>
  );
}
