import { Tournament, Player, PlayerClassConfig } from '@/types';

/**
 * Get default player classes (Platinum, Gold, Silver, Bronze)
 */
export function getDefaultClasses(): PlayerClassConfig[] {
    return [
        {
            name: 'Platinum',
            color: '#E5E4E2',
            icon: '💎',
            order: 1,
        },
        {
            name: 'Gold',
            color: '#FFD700',
            icon: '🏆',
            order: 2,
        },
        {
            name: 'Silver',
            color: '#C0C0C0',
            icon: '🥈',
            order: 3,
        },
        {
            name: 'Bronze',
            color: '#CD7F32',
            icon: '🥉',
            order: 4,
        },
    ];
}

/**
 * Get player class configuration by name
 */
export function getClassConfig(
    tournament: Tournament | null,
    className: string | undefined
): PlayerClassConfig | null {
    if (!tournament || !className || !tournament.playerClasses) {
        return null;
    }

    return tournament.playerClasses.find(c => c.name === className) || null;
}

/**
 * Get base price for a player based on their class
 * Falls back to tournament base price if no class-specific price
 */
export function getClassBasePrice(
    tournament: Tournament | null,
    player: Player | null
): number {
    if (!tournament) return 0;

    if (!player?.playerClass || !tournament.usePlayerClasses) {
        return tournament.basePricePerPlayer;
    }

    const classConfig = getClassConfig(tournament, player.playerClass);

    // Use class-specific base price if available, otherwise fall back to tournament base
    return classConfig?.basePrice ?? tournament.basePricePerPlayer;
}

/**
 * Get formatted base price display text
 * Returns something like "50,000 (Gold)" or just "50,000"
 */
export function getFormattedBasePrice(
    tournament: Tournament | null,
    player: Player | null
): string {
    const basePrice = getClassBasePrice(tournament, player);
    const formattedPrice = basePrice.toLocaleString();

    if (player?.playerClass && tournament?.usePlayerClasses) {
        return `${formattedPrice} (${player.playerClass})`;
    }

    return formattedPrice;
}

/**
 * Validate player class exists in tournament's classes
 */
export function isValidPlayerClass(
    tournament: Tournament | null,
    className: string | undefined
): boolean {
    if (!tournament || !className || !tournament.playerClasses) {
        return false;
    }

    return tournament.playerClasses.some(c => c.name === className);
}

/**
 * Get sorted player classes by order
 */
export function getSortedClasses(
    tournament: Tournament | null
): PlayerClassConfig[] {
    if (!tournament?.playerClasses) {
        return [];
    }

    return [...tournament.playerClasses].sort((a, b) => a.order - b.order);
}
