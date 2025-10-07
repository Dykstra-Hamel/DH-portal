import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { LayoutWrapper } from '@/components/Layout/LayoutWrapper/LayoutWrapper';
import { UserbackProvider } from '@/components/Common/UserbackProvider';
import '@/styles/main.scss';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
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
    <html lang="en" className={`${outfit.className}`}>
      <body>
        <UserbackProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </UserbackProvider>
      </body>
    </html>
  );
}
