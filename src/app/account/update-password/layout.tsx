import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Update Password - PCOCENTRAL',
  description: 'Update your password for Dykstra Hamel Portal',
};

export default function UpdatePasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pageWrapper">
      <main className="main">
        {children}
      </main>
    </div>
  );
}