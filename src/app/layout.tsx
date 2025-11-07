import type { Metadata } from 'next';
import './globals.css';
import { AuctionProvider } from '@/hooks/useAuction';

export const metadata: Metadata = {
  title: 'ProStream Auction',
  description: 'Real-time auction management system for sports/e-sports tournaments',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuctionProvider>{children}</AuctionProvider>
      </body>
    </html>
  );
}
