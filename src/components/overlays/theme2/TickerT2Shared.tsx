'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Player, Team, Tournament } from '@/types';

interface TickerT2SharedProps {
  soldPlayers: Player[];
  players: Player[];
  teams: Team[];
  tournament: Tournament | null;
  mode: 'all' | 'sold' | 'available';
  customMode?: boolean;
  customLine1?: string;
  customLine2?: string;
}

const LABEL_W = 245;
const ARROW_D = 24;

const TickerT2Shared: React.FC<TickerT2SharedProps> = ({
  soldPlayers, players, teams, mode, customMode, customLine1, customLine2,
}) => {
  const heading = mode === 'sold' ? 'SOLD' : mode === 'available' ? 'AVAILABLE' : 'ALL';
  const emptyText = mode === 'sold' ? 'Waiting for sold players…' : mode === 'available' ? 'No players available…' : 'No players yet…';

  const lines = customMode ? [customLine1, customLine2].filter((l): l is string => !!l?.trim()) : [];
  const [lineIndex, setLineIndex] = useState(0);
  const [sliding, setSliding] = useState(false);
  const linesLenRef = useRef(lines.length);
  useEffect(() => { linesLenRef.current = lines.length; }, [lines.length]);
  useEffect(() => {
    if (!customMode || lines.length <= 1) return;
    const iv = setInterval(() => {
      setSliding(true);
      const t = setTimeout(() => { setLineIndex(p => (p + 1) % linesLenRef.current); setSliding(false); }, 450);
      return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 5000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customMode, customLine1, customLine2]);

  const source = mode === 'sold' ? soldPlayers : mode === 'available' ? players.filter(p => !p.isSold) : players;
  const duration = Math.max(20, source.length * 6);

  return (
    <>
      <style>{`
        @keyframes t2TickerScroll {
          0%   { transform: translateY(-50%) translateX(0); }
          100% { transform: translateY(-50%) translateX(-50%); }
        }
      `}</style>
      <div style={{
        position: 'absolute', left: 0, bottom: 0, right: 0, height: 74,
        background: '#ffffff',
        borderTop: '3px solid #E7C403',
        fontFamily: "'Varela Round', sans-serif",
        boxShadow: '0 -8px 32px rgba(0,0,0,0.2)',
      }}>
        {/* tickhead — gold arrow badge */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0,
          width: LABEL_W, height: '100%',
          backgroundColor: '#E7C403',
          clipPath: `polygon(0 0, calc(100% - ${ARROW_D}px) 0, 100% 50%, calc(100% - ${ARROW_D}px) 100%, 0 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          paddingRight: ARROW_D,
          zIndex: 2,
        }}>
          <span style={{
            fontSize: 20, letterSpacing: 5, textTransform: 'uppercase',
            color: '#111', fontWeight: 700, whiteSpace: 'nowrap',
          }}>
            {customMode ? 'ProStream' : heading}
          </span>
        </div>

        {/* ticker2 — content clip zone */}
        <div style={{
          position: 'absolute',
          top: 0, left: LABEL_W, right: 0, bottom: 0,
          overflow: 'hidden',
        }}>
          {customMode ? (
            <div style={{
              display: 'flex', flexDirection: 'column', height: '200%',
              transform: sliding ? 'translateY(-50%)' : 'translateY(0)',
              transition: sliding ? 'transform 0.45s cubic-bezier(0.4,0,0.2,1)' : 'none',
            }}>
              {[0, 1].map(offset => (
                <div key={offset} style={{
                  height: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, color: 'rgba(0,0,0,0.7)', whiteSpace: 'nowrap',
                }}>
                  {lines[(lineIndex + offset) % (lines.length || 1)] ?? ''}
                </div>
              ))}
            </div>
          ) : source.length > 0 ? (
            <div style={{
              position: 'absolute', top: '50%', transform: 'translateY(-50%)',
              whiteSpace: 'nowrap',
              animation: `t2TickerScroll ${duration}s linear infinite`,
              fontSize: 18, paddingLeft: 24,
            }}>
              {[...source, ...source].map((p, i) => {
                const team = mode === 'sold' ? teams.find(t => t._id === p.winningTeamId) : null;
                return (
                  <React.Fragment key={`${i}-${p._id}`}>
                    {i > 0 && <span style={{ color: '#E7C403', margin: '0 20px' }}>·</span>}
                    <span style={{ color: 'rgba(0,0,0,0.75)', fontWeight: 600 }}>{p.name.toUpperCase()}</span>
                    {mode === 'sold' && (
                      <span style={{ color: 'rgba(0,0,0,0.4)', marginLeft: 10 }}>
                        › {team?.name ?? '—'} · {p.finalPrice?.toLocaleString('en-IN') ?? '—'}
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          ) : (
            <div style={{
              position: 'absolute', top: '50%', transform: 'translateY(-50%)',
              paddingLeft: 24, fontSize: 25, color: 'rgba(0,0,0,0.35)',
            }}>
              {emptyText}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TickerT2Shared;
