import { getAuctionBootstrapData } from '@/lib/auctionBootstrap';
import AuctionPageClient from './AuctionPageClient';

export default async function AuctionPage() {
  const initialData = await getAuctionBootstrapData();

  return <AuctionPageClient initialData={initialData} />;
}
