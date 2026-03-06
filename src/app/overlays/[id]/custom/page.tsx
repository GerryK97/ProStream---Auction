import CustomOverlay from '@/components/overlays/CustomOverlay';

export default async function CustomOverlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomOverlay tournamentId={id} />;
}
