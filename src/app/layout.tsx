import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { MobileMenuButton } from '@/components/MobileMenu/MobileMenu';
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
        <MobileMenuButton />
        <section className="pageWrapper">{children}</section>
      </body>
    </html>
  );
}
