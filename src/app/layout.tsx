import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./styles/globals.scss";
import { Sidebar } from "@/components/sidenav/Sidebar";

const outfit = Outfit({
  subsets: ["latin"],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "DH | Portal",
  description: "Home of the Dykstra Hamel Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" className={`${outfit.className}`}>
      <body>
        <Sidebar />
        <section className="page">
          {children}
        </section>
      </body>
    </html>
  );
}
