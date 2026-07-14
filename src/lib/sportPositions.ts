// ─── Sport → Player Positions config ─────────────────────────────────────────
// Single source of truth used by Auction PlayerForm and Scoreboard player UI.

export type Sport =
  | 'cricket'
  | 'football'
  | 'basketball'
  | 'volleyball'
  | 'kabaddi'
  | 'baseball'
  | 'rugby'
  | 'hockey'
  | 'other';

export const SPORT_LABELS: Record<Sport, string> = {
  cricket:    '🏏 Cricket',
  football:   '⚽ Football',
  basketball: '🏀 Basketball',
  volleyball: '🏐 Volleyball',
  kabaddi:    '🤼 Kabaddi',
  baseball:   '⚾ Baseball',
  rugby:      '🏉 Rugby',
  hockey:     '🏑 Hockey',
  other:      '🎯 Other',
};

export const SPORT_POSITIONS: Record<Sport, string[]> = {
  cricket: [
    'Batsman',
    'Bowler',
    'All-rounder',
    'Batting All-rounder',
    'Bowling All-rounder',
    'Wicket-keeper',
    'Wicket Keeper Batsman',
  ],
  football: [
    'Goalkeeper (GK)',
    'Defender',
    'Centre-back (CB)',
    'Left-back (LB)',
    'Right-back (RB)',
    'Sweeper (SW)',
    'Midfielder',
    'Defensive Midfielder (CDM)',
    'Central Midfielder (CM)',
    'Attacking Midfielder (CAM)',
    'Left Midfielder (LM)',
    'Right Midfielder (RM)',
    'Forward',
    'Left Winger (LW)',
    'Right Winger (RW)',
    'Striker (ST)',
    'Centre-forward (CF)',
  ],
  basketball: [
    'Point Guard (PG)',
    'Shooting Guard (SG)',
    'Small Forward (SF)',
    'Power Forward (PF)',
    'Center (C)',
  ],
  volleyball: [
    'Setter',
    'Outside Hitter',
    'Opposite Hitter',
    'Middle Blocker',
    'Libero',
    'Defensive Specialist',
  ],
  kabaddi: [
    'Raider',
    'Defender',
    'All-rounder',
    'Cover',
    'Corner',
  ],
  baseball: [
    'Pitcher',
    'Catcher',
    'First Baseman',
    'Second Baseman',
    'Third Baseman',
    'Shortstop',
    'Left Fielder',
    'Center Fielder',
    'Right Fielder',
    'Designated Hitter',
  ],
  rugby: [
    'Prop',
    'Hooker',
    'Lock',
    'Flanker',
    'Number 8',
    'Scrum-half',
    'Fly-half',
    'Centre',
    'Wing',
    'Fullback',
  ],
  hockey: [
    'Goalkeeper',
    'Right Back',
    'Left Back',
    'Right Half',
    'Left Half',
    'Centre Half',
    'Right Wing',
    'Left Wing',
    'Centre Forward',
    'Inside Right',
    'Inside Left',
  ],
  other: [],
};

/** Returns position list for a sport, falling back to cricket. */
export function getPositionsForSport(sport?: string | null): string[] {
  return SPORT_POSITIONS[(sport as Sport) ?? 'cricket'] ?? SPORT_POSITIONS.cricket;
}
