import type { Metadata } from 'next';
import '../src/index.css';
import '../src/arrival-blue.css';

export const metadata: Metadata = {
  title: 'SHIFT — Mind over matter',
  description: 'Reflect, practice, and prepare for clearer therapy sessions with SHIFT.',
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
