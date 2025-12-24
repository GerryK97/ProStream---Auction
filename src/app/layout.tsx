import type { Metadata } from 'next';
import './globals.css';
import { AuctionProvider } from '@/hooks/useAuction';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { TournamentProvider } from '@/contexts/TournamentContext';

export const metadata: Metadata = {
  title: 'ProStream Auction',
  description: 'Real-time auction management system for sports/e-sports tournaments',
  verification: {
    google: 'google5a0e1376d5ae7ba5',
  },
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
        <ThemeProvider>
          <AuthProvider>
            <TournamentProvider>
              <AuctionProvider>{children}</AuctionProvider>
            </TournamentProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
