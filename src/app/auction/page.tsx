import { getAuctionBootstrapData } from '@/lib/auctionBootstrap';
import AuctionPageClient from './AuctionPageClient';
import { headers } from 'next/headers';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

export default async function AuctionPage() {
  // Get user info from headers (set by middleware)
  const headersList = await headers();
  const userId = headersList.get('x-user-id') || undefined;
  const userRole = headersList.get('x-user-role') || undefined;

  // Fetch assignedTournaments from DB so non-admin users see their assigned tournaments
  let assignedTournaments: string[] = [];
  if (userId && userRole !== 'Admin') {
    try {
      await connectToDatabase();
      const user = await User.findById(userId).select('assignedTournaments').lean();
      assignedTournaments = (user as any)?.assignedTournaments ?? [];
    } catch {
      // Non-fatal — bootstrap will return null tournament
    }
  }

  const initialData = await getAuctionBootstrapData(
    null, // no specific tournament ID
    userId,
    userRole,
    assignedTournaments
  );

  return <AuctionPageClient initialData={initialData} />;
}
