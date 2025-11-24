export type TeamCardThemeVariant = 'neonPulse' | 'emberPulse';

interface ThemeAccentStrip {
    label: string;
    icon: string;
    textColor: string;
    background: string;
    maxBadgeBackground: string;
    maxBadgeText: string;
    progressColor: string;
}

interface ThemeBackgroundLayers {
    gradientStart: string;
    gradientEnd: string;
    useGradient: boolean;
    solidFallback: string;
    overlayPattern: string;
    noiseLayer: string;
    opacity: number;
}

interface ThemeBorder {
    color: string;
    radius: number;
    glow: string;
    width: number;
}

interface ThemeTextPalette {
    teamName: string;
    stats: string;
    balance: string;
    maxBid: string;
    badge: string;
}

interface ThemeLogoFrame {
    background: string;
    border: string;
    glow: string;
}

interface ThemeWinningState {
    borderColor: string;
    glow: string;
}

export interface TeamCardTheme {
    name: string;
    variant: TeamCardThemeVariant;
    animation: string;
    background: ThemeBackgroundLayers;
    border: ThemeBorder;
    text: ThemeTextPalette;
    accentStrip: ThemeAccentStrip;
    logoFrame: ThemeLogoFrame;
    winning: ThemeWinningState;
}

export const teamCardThemes: Record<TeamCardThemeVariant, TeamCardTheme> = {
    neonPulse: {
        name: 'Neon Pulse',
        variant: 'neonPulse',
        animation: 'neonPulseGlow 4s ease-in-out infinite',
        background: {
            gradientStart: '#051937',
            gradientEnd: '#5c2c90',
            useGradient: true,
            solidFallback: '#0f172a',
            overlayPattern: 'radial-gradient(circle at 25% 15%, rgba(34, 211, 238, 0.35), transparent 55%)',
            noiseLayer: 'linear-gradient(120deg, rgba(14, 165, 233, 0.07), transparent)',
            opacity: 90
        },
        border: {
            color: '#22d3ee',
            radius: 22,
            glow: '0 0 30px rgba(13, 148, 136, 0.45)',
            width: 1.5
        },
        text: {
            teamName: '#ecfeff',
            stats: '#bae6fd',
            balance: '#fef3c7',
            maxBid: '#e9d5ff',
            badge: '#cffafe'
        },
        accentStrip: {
            label: 'Neon Pulse',
            icon: '⚡',
            textColor: '#a5f3fc',
            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.35), rgba(168, 85, 247, 0.15))',
            maxBadgeBackground: 'rgba(168, 85, 247, 0.25)',
            maxBadgeText: '#f0f9ff',
            progressColor: 'linear-gradient(90deg, #22d3ee, #c084fc)'
        },
        logoFrame: {
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(244, 114, 182, 0.3))',
            border: 'rgba(103, 232, 249, 0.9)',
            glow: '0 0 30px rgba(14, 165, 233, 0.6)'
        },
        winning: {
            borderColor: '#f97316',
            glow: '0 0 45px rgba(249, 115, 22, 0.65)'
        }
    },
    emberPulse: {
        name: 'Ember Pulse',
        variant: 'emberPulse',
        animation: 'emberHeatWave 5s ease-in-out infinite',
        background: {
            gradientStart: '#2b0f00',
            gradientEnd: '#7a2314',
            useGradient: true,
            solidFallback: '#3b0a0a',
            overlayPattern: 'radial-gradient(circle at 80% 20%, rgba(249, 115, 22, 0.35), transparent 40%)',
            noiseLayer: 'linear-gradient(180deg, rgba(251, 191, 36, 0.08), transparent)',
            opacity: 92
        },
        border: {
            color: '#fb923c',
            radius: 20,
            glow: '0 0 35px rgba(251, 146, 60, 0.45)',
            width: 1.5
        },
        text: {
            teamName: '#fef3c7',
            stats: '#fed7aa',
            balance: '#fff7ed',
            maxBid: '#ffedd5',
            badge: '#fffbeb'
        },
        accentStrip: {
            label: 'Ember Rush',
            icon: '🔥',
            textColor: '#fed7aa',
            background: 'linear-gradient(90deg, rgba(249, 115, 22, 0.45), rgba(220, 38, 38, 0.2))',
            maxBadgeBackground: 'rgba(251, 191, 36, 0.25)',
            maxBadgeText: '#fff7ed',
            progressColor: 'linear-gradient(90deg, #fb923c, #f87171)'
        },
        logoFrame: {
            background: 'linear-gradient(135deg, rgba(194, 65, 12, 0.4), rgba(249, 115, 22, 0.35))',
            border: 'rgba(251, 191, 36, 0.9)',
            glow: '0 0 25px rgba(251, 146, 60, 0.55)'
        },
        winning: {
            borderColor: '#fbbf24',
            glow: '0 0 50px rgba(251, 191, 36, 0.65)'
        }
    }
};

export const resolveTeamCardTheme = (variant: TeamCardThemeVariant = 'neonPulse') => {
    return teamCardThemes[variant] ?? teamCardThemes.neonPulse;
};
