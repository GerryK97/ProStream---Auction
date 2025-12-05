import { getAuctionBootstrapData } from '@/lib/auctionBootstrap';
import AuctionPageClient from './AuctionPageClient';
import { headers } from 'next/headers';

export default async function AuctionPage() {
  // Get user info from headers (set by middleware)
  const headersList = await headers();
  const userId = headersList.get('x-user-id') || undefined;
  const userRole = headersList.get('x-user-role') || undefined;

  // For assignedTournaments, we'd need to fetch from DB or add to headers
  // For now, pass empty array (Tournament role doesn't use assigned tournaments)
  const assignedTournaments: string[] = [];

  const initialData = await getAuctionBootstrapData(
    null, // no specific tournament ID
    userId,
    userRole,
    assignedTournaments
  );

  return <AuctionPageClient initialData={initialData} />;
}
