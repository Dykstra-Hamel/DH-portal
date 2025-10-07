import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Update Password - PMPCentral',
  description: 'Follow the instructions to update your PMPCentral password.',
};

export default function UpdatePasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pageWrapper">
      <main className="main">{children}</main>
    </div>
  );
}
