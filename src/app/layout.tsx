import type { Metadata } from 'next';
import './globals.css';
import { AuctionProvider } from '@/hooks/useAuction';
import { SessionProvider } from 'next-auth/react';

export const metadata: Metadata = {
  title: 'ProStream Auction',
  description: 'Real-time auction management system for sports/e-sports tournaments',
  icons: {
    icon: 'https://res.cloudinary.com/diitsd6nz/image/upload/v1760794476/ProSteam_logo_h9pb8b.png',
    apple: 'https://res.cloudinary.com/diitsd6nz/image/upload/v1760794476/ProSteam_logo_h9pb8b.png',
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
        <SessionProvider>
          <AuctionProvider>{children}</AuctionProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
