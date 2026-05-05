import FullScreenOverlay2 from '@/components/overlays/FullScreenOverlay2';

export default async function FullScreenOverlay2Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FullScreenOverlay2 tournamentId={id} />;
}
