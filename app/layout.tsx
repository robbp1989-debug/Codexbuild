import type { Metadata } from 'next';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'SHIFT Reflection Arcade',
  description: 'Practice CBT, ACT, DBT, and IPT skills through active recall and create a therapist-ready record of your work between sessions.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
