import FullScreenOverlay from '@/components/overlays/FullScreenOverlay';

export default async function FullScreenOverlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FullScreenOverlay tournamentId={id} />;
}
