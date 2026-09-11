import type { Metadata } from 'next';
import '../src/index.css';
import '../src/arrival-blue.css';
import '../src/workspace-office.css';
import '../src/perspective-left.css';
import '../src/perspective-final.css';
import '../src/golden-final.css';
import '../src/golden-scroll-source.css';
import '../src/golden-pixel-fixes.css';
import '../src/approved-keep-talking.css';

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
