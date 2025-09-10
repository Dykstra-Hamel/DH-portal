import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { LayoutWrapper } from '@/components/Layout/LayoutWrapper/LayoutWrapper';
import '@/styles/main.scss';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PCOCENTRAL',
  description: 'Home of the Dykstra Hamel Portal',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.className}`}>
      <body>
        <LayoutWrapper>
          <section className="pageWrapper">{children}</section>
        </LayoutWrapper>
      </body>
    </html>
  );
}
