# Broadcast Controls Implementation Plan

## 📋 Overview
Add a control panel in the Auction Control Panel to toggle overlay visibility and trigger animations in real-time for OBS broadcast management.

**Status:** 📝 Planned (Not Yet Implemented)
**Estimated Time:** 2-3 hours for full implementation
**Created:** 2025-11-07

---

## 🎯 Features to Implement

### 1. Overlay Visibility Toggles
Individual toggle switches to show/hide each overlay:
- ✅ Player Card (Basic)
- ✅ Premium Player Card
- ✅ Team Cards
- ✅ Current Bid Display
- ✅ Leaderboard
- ✅ Status Messages
- ✅ Sold Players Ticker
- ✅ Sale Banner

**Benefit**: Control which overlays are visible in OBS without adding/removing browser sources

### 2. Animation Trigger Buttons
Buttons to manually trigger animations:
- 🎉 **Celebration** - Trigger sold/celebration animation
- ⚡ **Team Highlight** - Highlight a specific team
- 💥 **Bid Pulse** - Pulse the current bid display
- 📢 **Sale Banner** - Show sale notification manually
- 🎊 **Confetti** - Trigger confetti/celebration effects

**Benefit**: Create exciting moments during stream without waiting for automatic triggers

---

## 🏗️ Architecture Design

### Data Flow:
```
Auction Control Panel (UI Controls)
    ↓
API: POST /api/auction/overlay-control
    ↓
Database: Update overlayControls in Tournament/AuctionState
    ↓
SSE: Broadcast overlayControls to all connected clients
    ↓
Overlay Components: Listen and react to changes
    ↓
OBS: Display updated overlays
```

### State Structure:
```typescript
interface OverlayControls {
    visibility: {
        playerCard: boolean;
        premiumPlayerCard: boolean;
        teamCards: boolean;
        currentBid: boolean;
        leaderboard: boolean;
        statusOverlay: boolean;
        ticker: boolean;
        saleBanner: boolean;
    };
    animations: {
        trigger: 'celebration' | 'team-highlight' | 'bid-pulse' | 'sale-banner' | 'confetti' | null;
        targetTeamId?: string; // For team highlight
        timestamp: number; // To detect new triggers
    };
}
```

---

## 📐 UI Design - Broadcast Control Panel

**Location**: New collapsible section in Auction Control Panel

```
┌─────────────────────────────────────────────┐
│  🎬 BROADCAST CONTROLS               [↓]    │
├─────────────────────────────────────────────┤
│                                              │
│  📺 Overlay Visibility                       │
│  ┌──────────────────────────────────────┐   │
│  │ Player Card             [ON/OFF]     │   │
│  │ Premium Player Card     [ON/OFF]     │   │
│  │ Team Cards              [ON/OFF]     │   │
│  │ Current Bid             [ON/OFF]     │   │
│  │ Leaderboard             [ON/OFF]     │   │
│  │ Status Overlay          [ON/OFF]     │   │
│  │ Sold Players Ticker     [ON/OFF]     │   │
│  │ Sale Banner             [ON/OFF]     │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  🎨 Animation Triggers                       │
│  ┌──────────────────────────────────────┐   │
│  │  [🎉 Celebration]  [⚡ Highlight]    │   │
│  │  [💥 Bid Pulse]    [📢 Sale Banner]  │   │
│  │  [🎊 Confetti]     [🔄 Reset All]    │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ⚙️ Quick Actions                            │
│  ┌──────────────────────────────────────┐   │
│  │  [Show All] [Hide All] [Reset]       │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 🔧 Implementation Steps

### Phase 1: Backend Setup

#### Step 1.1: Update Types (`src/types/index.ts`)

Add new interfaces:

```typescript
export interface OverlayControls {
  visibility: {
    playerCard: boolean;
    premiumPlayerCard: boolean;
    teamCards: boolean;
    currentBid: boolean;
    leaderboard: boolean;
    statusOverlay: boolean;
    ticker: boolean;
    saleBanner: boolean;
  };
  animations: {
    trigger: 'celebration' | 'team-highlight' | 'bid-pulse' | 'sale-banner' | 'confetti' | null;
    targetTeamId?: string;
    timestamp: number;
  };
}

export interface AuctionState {
  tournamentId: string;
  currentPlayerId: string | null;
  currentBid: number;
  winningTeamId: string | null;
  currentAuctionStatus: 'Pending' | 'Bidding' | 'Sold';
  history: Bid[];
  overlayControls: OverlayControls; // ← Add this field
}
```

#### Step 1.2: Update Database Models

Update the AuctionState model in your database to include `overlayControls`:

```typescript
// Default value for new auction states
const defaultOverlayControls: OverlayControls = {
  visibility: {
    playerCard: true,
    premiumPlayerCard: false,
    teamCards: true,
    currentBid: true,
    leaderboard: true,
    statusOverlay: true,
    ticker: true,
    saleBanner: true,
  },
  animations: {
    trigger: null,
    targetTeamId: undefined,
    timestamp: 0,
  },
};
```

#### Step 1.3: Create API Endpoint

Create: `src/app/api/auction/overlay-control/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AuctionState from '@/models/AuctionState';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { tournamentId, visibility, animations } = await request.json();

    if (!tournamentId) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
    }

    // Find auction state
    let auctionState = await AuctionState.findOne({ tournamentId });

    if (!auctionState) {
      return NextResponse.json({ error: 'Auction state not found' }, { status: 404 });
    }

    // Update overlay controls
    const updateData: any = {};

    if (visibility) {
      updateData['overlayControls.visibility'] = visibility;
    }

    if (animations) {
      updateData['overlayControls.animations'] = animations;
    }

    auctionState = await AuctionState.findOneAndUpdate(
      { tournamentId },
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json(auctionState, { status: 200 });
  } catch (error) {
    console.error('Error updating overlay controls:', error);
    return NextResponse.json({ error: 'Failed to update overlay controls' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
    }

    const auctionState = await AuctionState.findOne({ tournamentId });

    if (!auctionState) {
      return NextResponse.json({ error: 'Auction state not found' }, { status: 404 });
    }

    return NextResponse.json(auctionState.overlayControls, { status: 200 });
  } catch (error) {
    console.error('Error fetching overlay controls:', error);
    return NextResponse.json({ error: 'Failed to fetch overlay controls' }, { status: 500 });
  }
}
```

#### Step 1.4: Update SSE Stream

Update: `src/app/api/auction/stream/[tournamentId]/route.ts`

Ensure `overlayControls` is included in the SSE events:

```typescript
// In your SSE broadcast function, include overlayControls
const auctionState = await AuctionState.findOne({ tournamentId });

controller.enqueue(
  encoder.encode(`data: ${JSON.stringify({
    type: 'auction:update',
    auctionState: {
      ...auctionState,
      overlayControls: auctionState.overlayControls // ← Ensure this is included
    },
    // ... other data
  })}\n\n`)
);
```

---

### Phase 2: UI Component

#### Step 2.1: Create BroadcastControlPanel Component

Create: `src/components/BroadcastControlPanel.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import { OverlayControls } from '@/types';

interface BroadcastControlPanelProps {
    tournamentId: string;
    overlayControls: OverlayControls;
    onUpdate: () => void;
}

const BroadcastControlPanel: React.FC<BroadcastControlPanelProps> = ({
    tournamentId,
    overlayControls,
    onUpdate
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const updateVisibility = async (overlay: string, visible: boolean) => {
        setIsUpdating(true);
        try {
            const response = await fetch('/api/auction/overlay-control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId,
                    visibility: {
                        ...overlayControls.visibility,
                        [overlay]: visible
                    }
                })
            });

            if (response.ok) {
                onUpdate();
            }
        } catch (error) {
            console.error('Failed to update overlay visibility:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const triggerAnimation = async (trigger: string, targetTeamId?: string) => {
        setIsUpdating(true);
        try {
            const response = await fetch('/api/auction/overlay-control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId,
                    animations: {
                        trigger,
                        targetTeamId,
                        timestamp: Date.now()
                    }
                })
            });

            if (response.ok) {
                onUpdate();
                // Reset animation after 2 seconds
                setTimeout(() => {
                    fetch('/api/auction/overlay-control', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tournamentId,
                            animations: {
                                trigger: null,
                                timestamp: Date.now()
                            }
                        })
                    });
                }, 2000);
            }
        } catch (error) {
            console.error('Failed to trigger animation:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const showAll = async () => {
        setIsUpdating(true);
        try {
            await fetch('/api/auction/overlay-control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId,
                    visibility: {
                        playerCard: true,
                        premiumPlayerCard: true,
                        teamCards: true,
                        currentBid: true,
                        leaderboard: true,
                        statusOverlay: true,
                        ticker: true,
                        saleBanner: true,
                    }
                })
            });
            onUpdate();
        } catch (error) {
            console.error('Failed to show all overlays:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const hideAll = async () => {
        setIsUpdating(true);
        try {
            await fetch('/api/auction/overlay-control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournamentId,
                    visibility: {
                        playerCard: false,
                        premiumPlayerCard: false,
                        teamCards: false,
                        currentBid: false,
                        leaderboard: false,
                        statusOverlay: false,
                        ticker: false,
                        saleBanner: false,
                    }
                })
            });
            onUpdate();
        } catch (error) {
            console.error('Failed to hide all overlays:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const overlayLabels = {
        playerCard: 'Player Card',
        premiumPlayerCard: 'Premium Player Card',
        teamCards: 'Team Cards',
        currentBid: 'Current Bid',
        leaderboard: 'Leaderboard',
        statusOverlay: 'Status Overlay',
        ticker: 'Sold Players Ticker',
        saleBanner: 'Sale Banner',
    };

    return (
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-neutral-700/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-xl">🎬</span>
                    <h3 className="font-bold text-lg">BROADCAST CONTROLS</h3>
                </div>
                <span className="text-neutral-400">{isExpanded ? '▼' : '▶'}</span>
            </button>

            {isExpanded && (
                <div className="p-4 pt-0 space-y-4">
                    {/* Overlay Visibility */}
                    <div>
                        <h4 className="font-semibold mb-3 text-cyan-400 flex items-center gap-2">
                            <span>📺</span> Overlay Visibility
                        </h4>
                        <div className="space-y-2">
                            {Object.entries(overlayLabels).map(([key, label]) => (
                                <div key={key} className="flex items-center justify-between p-2 bg-neutral-700/50 rounded">
                                    <span className="text-sm">{label}</span>
                                    <button
                                        onClick={() => updateVisibility(key, !overlayControls.visibility[key as keyof typeof overlayControls.visibility])}
                                        disabled={isUpdating}
                                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                                            overlayControls.visibility[key as keyof typeof overlayControls.visibility]
                                                ? 'bg-green-600 hover:bg-green-700'
                                                : 'bg-neutral-600 hover:bg-neutral-500'
                                        } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {overlayControls.visibility[key as keyof typeof overlayControls.visibility] ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Animation Triggers */}
                    <div>
                        <h4 className="font-semibold mb-3 text-purple-400 flex items-center gap-2">
                            <span>🎨</span> Animation Triggers
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => triggerAnimation('celebration')}
                                disabled={isUpdating}
                                className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                🎉 Celebration
                            </button>
                            <button
                                onClick={() => triggerAnimation('team-highlight')}
                                disabled={isUpdating}
                                className="p-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                ⚡ Highlight
                            </button>
                            <button
                                onClick={() => triggerAnimation('bid-pulse')}
                                disabled={isUpdating}
                                className="p-2 bg-green-600 hover:bg-green-700 rounded text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                💥 Bid Pulse
                            </button>
                            <button
                                onClick={() => triggerAnimation('sale-banner')}
                                disabled={isUpdating}
                                className="p-2 bg-red-600 hover:bg-red-700 rounded text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                📢 Sale Banner
                            </button>
                            <button
                                onClick={() => triggerAnimation('confetti')}
                                disabled={isUpdating}
                                className="p-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                🎊 Confetti
                            </button>
                            <button
                                onClick={() => triggerAnimation(null as any)}
                                disabled={isUpdating}
                                className="p-2 bg-neutral-600 hover:bg-neutral-700 rounded text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                🔄 Reset
                            </button>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <h4 className="font-semibold mb-3 text-orange-400 flex items-center gap-2">
                            <span>⚙️</span> Quick Actions
                        </h4>
                        <div className="flex gap-2">
                            <button
                                onClick={showAll}
                                disabled={isUpdating}
                                className="flex-1 p-2 bg-green-600 hover:bg-green-700 rounded text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                Show All
                            </button>
                            <button
                                onClick={hideAll}
                                disabled={isUpdating}
                                className="flex-1 p-2 bg-red-600 hover:bg-red-700 rounded text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                Hide All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BroadcastControlPanel;
```

#### Step 2.2: Integrate into AuctionControlPanel

Update: `src/components/AuctionControlPanel.tsx`

Add the BroadcastControlPanel component:

```typescript
import BroadcastControlPanel from './BroadcastControlPanel';

// Inside AuctionControlPanel component
<div className="space-y-4">
    {/* Existing panels */}

    {/* Add Broadcast Controls */}
    {tournament && auctionState && (
        <BroadcastControlPanel
            tournamentId={tournament._id}
            overlayControls={auctionState.overlayControls}
            onUpdate={fetchAuctionData}
        />
    )}
</div>
```

---

### Phase 3: Overlay Updates

#### Step 3.1: Update useAuctionSSE Hook

Update: `src/hooks/useAuctionSSE.ts`

Ensure `overlayControls` is returned:

```typescript
export function useAuctionSSE(tournamentId: string | null) {
    const [overlayControls, setOverlayControls] = useState<OverlayControls>({
        visibility: {
            playerCard: true,
            premiumPlayerCard: false,
            teamCards: true,
            currentBid: true,
            leaderboard: true,
            statusOverlay: true,
            ticker: true,
            saleBanner: true,
        },
        animations: {
            trigger: null,
            timestamp: 0,
        },
    });

    // In your SSE event handler
    if (data.auctionState?.overlayControls) {
        setOverlayControls(data.auctionState.overlayControls);
    }

    return {
        tournament,
        auctionState,
        players,
        teams,
        isConnected,
        overlayControls, // ← Add this
    };
}
```

#### Step 3.2: Update OverlayWrapper

Update: `src/components/overlays/OverlayWrapper.tsx`

```typescript
const OverlayWrapper: React.FC<OverlayWrapperProps> = ({
    tournamentId,
    children
}) => {
    // ... existing code

    const {
        tournament,
        auctionState,
        players,
        teams,
        isConnected,
        overlayControls, // ← Add this
    } = useAuctionSSE(liveTournamentId);

    return (
        <div className="w-full h-full bg-transparent text-white font-sans relative overflow-hidden">
            {children({
                tournament,
                auctionState,
                players,
                teams,
                isConnected,
                currentPlayer,
                soldPlayers,
                overlayControls, // ← Pass to children
            })}
        </div>
    );
};
```

#### Step 3.3: Update All Overlay Components

Example for `PlayerCardOverlay.tsx`:

```typescript
interface PlayerCardOverlayProps {
    currentPlayer: Player | undefined;
    tournament: Tournament | null;
    auctionState: AuctionState;
    overlayControls: OverlayControls; // ← Add this
    size?: 'small' | 'medium' | 'large';
    position?: 'top' | 'center' | 'bottom';
}

const PlayerCardOverlay: React.FC<PlayerCardOverlayProps> = ({
    currentPlayer,
    tournament,
    auctionState,
    overlayControls, // ← Add this
    size = 'medium',
    position = 'top'
}) => {
    const [animationKey, setAnimationKey] = useState(0);

    // Check visibility
    if (!overlayControls.visibility.playerCard) {
        return null;
    }

    // Listen for animation triggers
    useEffect(() => {
        if (overlayControls.animations.trigger === 'celebration') {
            setAnimationKey(prev => prev + 1);
            // Trigger celebration animation
        } else if (overlayControls.animations.trigger === 'bid-pulse') {
            setAnimationKey(prev => prev + 1);
            // Trigger bid pulse animation
        }
    }, [overlayControls.animations.timestamp]);

    // ... rest of component
};
```

**Repeat this pattern for ALL overlay components:**
- PremiumPlayerCardOverlay.tsx
- TeamCardsOverlay.tsx
- CurrentBidOverlay.tsx
- LeaderboardOverlay.tsx
- StatusOverlay.tsx
- SoldPlayersTickerOverlay.tsx
- SaleBanner.tsx

#### Step 3.4: Update Overlay Route Pages

Update each overlay page to pass `overlayControls`:

Example: `src/app/overlays/player-card/page.tsx`

```typescript
return (
    <OverlayWrapper tournamentId={tournamentId}>
        {({ tournament, auctionState, currentPlayer, overlayControls }) => (
            <PlayerCardOverlay
                currentPlayer={currentPlayer}
                tournament={tournament}
                auctionState={auctionState}
                overlayControls={overlayControls} // ← Add this
                size={size}
                position={position}
            />
        )}
    </OverlayWrapper>
);
```

---

## 🎨 Animation System Details

### Trigger Mechanism:

1. User clicks animation button in BroadcastControlPanel
2. API updates `overlayControls.animations.trigger` and `timestamp`
3. SSE broadcasts update to all overlays
4. Target overlay detects trigger via `useEffect` watching `timestamp`
5. Overlay plays animation
6. After 2 seconds, trigger is reset to `null`

### Animation Mapping:

| Trigger | Affected Overlay | Effect |
|---------|------------------|--------|
| `celebration` | PlayerCardOverlay | Scale up + confetti |
| `team-highlight` | TeamCardsOverlay | Border pulse + glow |
| `bid-pulse` | CurrentBidOverlay | Scale pulse + color flash |
| `sale-banner` | SaleBanner | Force show banner |
| `confetti` | All overlays | Full-screen confetti burst |

### Example Animation Implementation:

```typescript
// In overlay component
const [showCelebration, setShowCelebration] = useState(false);

useEffect(() => {
    if (overlayControls.animations.trigger === 'celebration') {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
    }
}, [overlayControls.animations.timestamp]);

// In JSX
<div className={`${showCelebration ? 'animate-celebration' : ''}`}>
    {/* content */}
</div>
```

---

## 📁 File Structure (Changes Summary)

### New Files:
```
src/
├── app/api/auction/overlay-control/
│   └── route.ts                      # NEW - API endpoint for overlay controls
├── components/
│   └── BroadcastControlPanel.tsx     # NEW - Broadcast control UI
└── docs/
    └── BROADCAST_CONTROLS_IMPLEMENTATION.md  # THIS FILE
```

### Files to Modify:
```
src/
├── types/
│   └── index.ts                      # ADD OverlayControls interface
├── components/
│   └── AuctionControlPanel.tsx       # INTEGRATE BroadcastControlPanel
├── hooks/
│   └── useAuctionSSE.ts              # RETURN overlayControls
├── components/overlays/
│   ├── OverlayWrapper.tsx            # PASS overlayControls to children
│   ├── PlayerCardOverlay.tsx         # ADD visibility & animation logic
│   ├── PremiumPlayerCardOverlay.tsx  # ADD visibility & animation logic
│   ├── TeamCardsOverlay.tsx          # ADD visibility & animation logic
│   ├── CurrentBidOverlay.tsx         # ADD visibility & animation logic
│   ├── LeaderboardOverlay.tsx        # ADD visibility & animation logic
│   ├── StatusOverlay.tsx             # ADD visibility & animation logic
│   ├── SoldPlayersTickerOverlay.tsx  # ADD visibility & animation logic
│   └── SaleBanner.tsx                # ADD visibility & animation logic
└── app/overlays/
    ├── player-card/page.tsx          # PASS overlayControls
    ├── premium-player-card/page.tsx  # PASS overlayControls
    ├── teams/page.tsx                # PASS overlayControls
    ├── current-bid/page.tsx          # PASS overlayControls
    ├── leaderboard/page.tsx          # PASS overlayControls
    ├── status/page.tsx               # PASS overlayControls
    ├── ticker/page.tsx               # PASS overlayControls
    └── sale-banner/page.tsx          # PASS overlayControls
```

---

## ✅ Testing Checklist

### Phase 1: Backend
- [ ] Types are correctly defined in `index.ts`
- [ ] Database schema includes `overlayControls` field
- [ ] API endpoint POST works and updates database
- [ ] API endpoint GET returns current controls
- [ ] SSE includes `overlayControls` in broadcasts
- [ ] SSE updates received in real-time by clients

### Phase 2: UI
- [ ] BroadcastControlPanel renders correctly
- [ ] Toggle switches work for each overlay
- [ ] Animation buttons trigger correctly
- [ ] Show All / Hide All buttons work
- [ ] Loading states show during updates
- [ ] UI is collapsible/expandable

### Phase 3: Overlays
- [ ] Overlays hide when visibility = false
- [ ] Overlays show when visibility = true
- [ ] Animation triggers are received
- [ ] Animations play correctly
- [ ] Multiple overlays can be controlled independently
- [ ] OBS browser sources update in real-time

### Phase 4: Integration
- [ ] No console errors
- [ ] Performance is good (no lag)
- [ ] State persists on page refresh
- [ ] Works with multiple OBS sources simultaneously
- [ ] Animations don't conflict with each other

---

## 💡 Advanced Features (Future Enhancements)

### A. Preset Profiles
```typescript
interface OverlayPreset {
    name: string;
    visibility: OverlayControls['visibility'];
}

const presets: OverlayPreset[] = [
    { name: 'Minimal', visibility: { playerCard: true, currentBid: true, /* others false */ } },
    { name: 'Full', visibility: { /* all true */ } },
    { name: 'Auction Active', visibility: { statusOverlay: false, /* others true */ } },
    { name: 'Break Time', visibility: { leaderboard: true, ticker: true, /* others false */ } },
];
```

### B. Scheduled Animations
```typescript
// Auto-trigger animations on events
if (auctionState.currentAuctionStatus === 'Sold') {
    triggerAnimation('celebration');
}
```

### C. Animation Queue
```typescript
interface AnimationQueue {
    queue: Array<{ trigger: string; delay: number }>;
    isPlaying: boolean;
}
```

---

## 🚀 Benefits Summary

### For Broadcasters:
- ✅ Control overlay visibility without touching OBS
- ✅ Create exciting moments with animation triggers
- ✅ Quick show/hide for different broadcast scenarios
- ✅ Professional production control

### For Production:
- ✅ Smooth transitions between scenes
- ✅ Manual control for special moments
- ✅ No need to add/remove OBS sources
- ✅ Real-time updates across all overlays

### For Viewers:
- ✅ More dynamic and engaging stream
- ✅ Professional production quality
- ✅ Controlled information display
- ✅ Exciting animations at key moments

---

## 📝 Implementation Notes

1. **Database Migration**: Ensure existing auction states get default `overlayControls` values
2. **Backward Compatibility**: Handle cases where `overlayControls` might be undefined
3. **Performance**: Animation triggers should be lightweight and non-blocking
4. **Error Handling**: Gracefully handle API failures
5. **User Feedback**: Show loading states and success/error messages

---

## 🔗 Related Documentation

- [Overlay System Architecture](./OVERLAY_ARCHITECTURE.md) - How overlays work
- [SSE Implementation](./SSE_IMPLEMENTATION.md) - Real-time updates
- [API Documentation](./API_DOCUMENTATION.md) - All API endpoints

---

## 📅 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-07 | Initial plan created |

---

**Status:** 📝 Ready to implement when needed
**Priority:** Medium
**Impact:** High - Greatly improves broadcast control capabilities
