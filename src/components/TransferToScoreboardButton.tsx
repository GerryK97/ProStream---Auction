'use client';

import React, { useCallback, useState } from 'react';
import Modal from '@/components/Modal';
import { getAuthHeaders } from '@/lib/api-client';

interface TransferWarning {
  scope: 'team' | 'player' | 'tournament';
  subject: string;
  field: string;
  note: string;
}

interface SkippedPlayer {
  playerId: string;
  name: string;
  reason: string;
}

interface PlannedPlayer {
  auctionPlayerId: string;
  name: string;
  displayName: string;
  role: string;
  battingStyle: string;
  bowlingStyle: string | null;
  headshotCloudinaryId: string | null;
}

interface PlannedTeam {
  auctionTeamId: string;
  name: string;
  shortCode: string;
  logoCloudinaryId: string | null;
  players: PlannedPlayer[];
}

interface TransferPlan {
  tournament: { name: string; shortName: string; format: string; totalOvers: number };
  teams: PlannedTeam[];
  warnings: TransferWarning[];
  skippedPlayers: SkippedPlayer[];
  totals: { teams: number; players: number; skipped: number; warnings: number };
}

interface Blocker { code: string; message: string }

interface PreviewResponse {
  plan: TransferPlan;
  blockers: Blocker[];
  canTransfer: boolean;
  existingTransfers: { scoreboardTournamentId: number; transferredAt: string }[];
}

interface SuccessResult {
  scoreboardTournamentId: number;
  teamsCreated: number;
  playersCreated: number;
}

/**
 * "Send to Scoreboard" action for a completed auction.
 *
 * Deliberately two-step: the preview is read-only and shows every value that
 * had to be approximated (the Scoreboard's enums are narrower than the
 * auction's free text) so nothing is written until the operator has seen what
 * will change.
 */
export default function TransferToScoreboardButton({
  tournamentId,
  disabled,
}: {
  tournamentId: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [error, setError] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [result, setResult] = useState<SuccessResult | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const reset = () => {
    setPreview(null);
    setError('');
    setResult(null);
    setExpandedTeam(null);
  };

  const openPreview = useCallback(async () => {
    setOpen(true);
    reset();
    setLoading(true);
    try {
      const res = await fetch('/api/transfer/scoreboard/preview', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to build the transfer preview.');
        return;
      }
      setPreview(data);
    } catch {
      setError('Network error while building the preview.');
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  const runTransfer = useCallback(async (confirmDuplicate: boolean) => {
    setTransferring(true);
    setError('');
    try {
      const res = await fetch('/api/transfer/scoreboard/execute', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId, confirmDuplicate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Transfer failed.');
        return;
      }
      setResult({
        scoreboardTournamentId: data.scoreboardTournamentId,
        teamsCreated: data.teamsCreated,
        playersCreated: data.playersCreated,
      });
    } catch {
      setError('Network error during the transfer.');
    } finally {
      setTransferring(false);
    }
  }, [tournamentId]);

  const alreadyTransferred = (preview?.existingTransfers.length ?? 0) > 0;

  return (
    <>
      <button
        onClick={openPreview}
        disabled={disabled}
        className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50"
        style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
      >
        Send to Scoreboard
      </button>

      <Modal
        isOpen={open}
        onClose={() => { setOpen(false); reset(); }}
        title="Transfer auction to Scoreboard"
        size="3xl"
      >
        {loading && (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--brand-primary)' }} />
          </div>
        )}

        {!loading && error && !result && (
          <div className="rounded-md p-3 mb-4 text-sm" style={{ backgroundColor: 'rgba(248,113,113,0.12)', color: '#f87171' }}>
            {error}
          </div>
        )}

        {/* ── Success ── */}
        {result && (
          <div className="space-y-4">
            <div className="rounded-md p-4" style={{ backgroundColor: 'rgba(74,222,128,0.12)' }}>
              <p className="font-semibold" style={{ color: '#4ade80' }}>Transfer complete</p>
              <p className="text-sm mt-1 text-neutral-300">
                Created {result.teamsCreated} team{result.teamsCreated === 1 ? '' : 's'} and{' '}
                {result.playersCreated} player{result.playersCreated === 1 ? '' : 's'} in a new
                Scoreboard tournament (#{result.scoreboardTournamentId}).
              </p>
            </div>
            <p className="text-xs text-neutral-400">
              Open the Scoreboard to set up matches. Player photos and team logos are shared
              from the same Cloudinary account, so they appear without re-uploading.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => { setOpen(false); reset(); }}
                className="rounded-md px-4 py-2 text-sm font-semibold"
                style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-primary)' }}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* ── Preview ── */}
        {!loading && preview && !result && (
          <div className="space-y-4">
            {preview.blockers.length > 0 && (
              <div className="rounded-md p-3 text-sm" style={{ backgroundColor: 'rgba(248,113,113,0.12)', color: '#f87171' }}>
                <p className="font-semibold mb-1">This auction cannot be transferred</p>
                <ul className="list-disc pl-5 space-y-1">
                  {preview.blockers.map(b => <li key={b.code}>{b.message}</li>)}
                </ul>
              </div>
            )}

            {alreadyTransferred && preview.blockers.length === 0 && (
              <div className="rounded-md p-3 text-sm" style={{ backgroundColor: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
                Already transferred to Scoreboard tournament #
                {preview.existingTransfers[0].scoreboardTournamentId}. Transferring again creates
                a second, separate tournament.
              </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Teams', value: preview.plan.totals.teams },
                { label: 'Players', value: preview.plan.totals.players },
                { label: 'Skipped', value: preview.plan.totals.skipped },
                { label: 'Adjusted', value: preview.plan.totals.warnings },
              ].map(s => (
                <div key={s.label} className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--surface-elevated)' }}>
                  <p className="text-xs text-neutral-400">{s.label}</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-md p-3 text-sm" style={{ backgroundColor: 'var(--surface-elevated)' }}>
              <p className="text-neutral-300">
                Creates a new <strong>{preview.plan.tournament.format}</strong> tournament named{' '}
                <strong>{preview.plan.tournament.name}</strong>{' '}
                <span className="text-neutral-500">({preview.plan.tournament.shortName})</span>.
              </p>
            </div>

            {/* Squads */}
            <div>
              <p className="text-sm font-semibold mb-2 text-neutral-200">Squads</p>
              <div className="space-y-1">
                {preview.plan.teams.map(team => (
                  <div key={team.auctionTeamId} className="rounded-md" style={{ backgroundColor: 'var(--surface-elevated)' }}>
                    <button
                      onClick={() => setExpandedTeam(expandedTeam === team.auctionTeamId ? null : team.auctionTeamId)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm"
                    >
                      <span className="text-neutral-200">
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded mr-2" style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}>
                          {team.shortCode}
                        </span>
                        {team.name}
                      </span>
                      <span className="text-neutral-400 text-xs">
                        {team.players.length} player{team.players.length === 1 ? '' : 's'} ▾
                      </span>
                    </button>
                    {expandedTeam === team.auctionTeamId && (
                      <div className="px-3 pb-2">
                        {team.players.length === 0 ? (
                          <p className="text-xs text-neutral-500 py-1">No players sold to this team.</p>
                        ) : (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-neutral-500">
                                <th className="text-left py-1">Name</th>
                                <th className="text-left py-1">Role</th>
                                <th className="text-left py-1">Bats</th>
                                <th className="text-left py-1">Bowls</th>
                                <th className="text-left py-1">Photo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {team.players.map(p => (
                                <tr key={p.auctionPlayerId} className="text-neutral-300">
                                  <td className="py-1">{p.name}</td>
                                  <td className="py-1">{p.role}</td>
                                  <td className="py-1">{p.battingStyle}</td>
                                  <td className="py-1">{p.bowlingStyle ?? '—'}</td>
                                  <td className="py-1">{p.headshotCloudinaryId ? '✓' : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Adjustments — the important part */}
            {preview.plan.warnings.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: '#fbbf24' }}>
                  Values adjusted to fit the Scoreboard
                </p>
                <div className="rounded-md p-3 max-h-44 overflow-y-auto space-y-1" style={{ backgroundColor: 'rgba(251,191,36,0.08)' }}>
                  {preview.plan.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-neutral-300">
                      <span className="text-neutral-500">{w.subject} · {w.field}:</span> {w.note}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Skipped */}
            {preview.plan.skippedPlayers.length > 0 && (
              <details>
                <summary className="text-sm font-semibold cursor-pointer text-neutral-300">
                  {preview.plan.skippedPlayers.length} player
                  {preview.plan.skippedPlayers.length === 1 ? '' : 's'} not transferred
                </summary>
                <div className="rounded-md p-3 mt-2 max-h-40 overflow-y-auto space-y-1" style={{ backgroundColor: 'var(--surface-elevated)' }}>
                  {preview.plan.skippedPlayers.map(s => (
                    <p key={s.playerId} className="text-xs text-neutral-400">
                      <span className="text-neutral-300">{s.name}</span> — {s.reason}
                    </p>
                  ))}
                </div>
              </details>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setOpen(false); reset(); }}
                className="rounded-md px-4 py-2 text-sm"
                style={{ backgroundColor: 'var(--surface-elevated)', color: 'var(--text-primary)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => runTransfer(alreadyTransferred)}
                disabled={!preview.canTransfer || transferring}
                className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
              >
                {transferring
                  ? 'Transferring…'
                  : alreadyTransferred
                    ? 'Transfer again'
                    : `Create tournament with ${preview.plan.totals.players} players`}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
