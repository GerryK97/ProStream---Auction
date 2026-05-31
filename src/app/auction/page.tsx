import { getAuctionBootstrapData } from '@/lib/auctionBootstrap';
import AuctionPageClient from './AuctionPageClient';
import { headers } from 'next/headers';
import { getAssignedTournaments } from '@/lib/pg/user-queries';

export default async function AuctionPage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id') || undefined;
  const userRole = headersList.get('x-user-role') || undefined;

  let assignedTournaments: string[] = [];
  if (userId && userRole !== 'Admin') {
    try {
      assignedTournaments = await getAssignedTournaments(userId);
    } catch {
      // Non-fatal - bootstrap will return null tournament
    }
  }

  const initialData = await getAuctionBootstrapData(
    null,
    userId,
    userRole,
    assignedTournaments
  );

  return <AuctionPageClient initialData={initialData} />;
}