import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import localFont from 'next/font/local';
import { LayoutWrapper } from '@/components/Layout/LayoutWrapper/LayoutWrapper';
import { UserbackProvider } from '@/components/Common/UserbackProvider';
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.className} ${veganDays.variable}`}>
      <body>
        <UserbackProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </UserbackProvider>
      </body>
    </html>
  );
}
