import TeamOwnerOverlay from '@/components/overlays/shared/TeamOwnerOverlay';

export default async function TeamOwnerOverlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TeamOwnerOverlay tournamentId={id} />;
}
