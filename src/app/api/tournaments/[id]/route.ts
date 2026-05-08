import { NextRequest, NextResponse } from 'next/server';
import { tournamentDB } from '@/lib/db-mongodb';
import { PlayerClassConfig } from '@/types';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction, canAccessTournament } from '@/lib/permissions';
import { validateOverlayToken, validateOverlaySessionToken, getOverlayTokenFromRequest } from '@/lib/overlay-auth';
import { connectToDatabase } from '@/lib/mongodb';
import { PlayerModel } from '@/models/Player';
import { TeamModel } from '@/models/Team';
import { AuctionStateModel } from '@/models/AuctionState';

/**
 * Validate player class codes
 * Ensures all classes have codes and no duplicates exist
 */
function validatePlayerClassCodes(playerClasses?: PlayerClassConfig[]): { valid: boolean; error?: string } {
  if (!playerClasses || playerClasses.length === 0) {
    return { valid: true };
  }

  // Check for empty codes
  const hasEmptyCode = playerClasses.some(cls => !cls.code || cls.code.trim() === '');
  if (hasEmptyCode) {
    return {
      valid: false,
      error: 'All player classes must have a code. Please provide a code for each class.'
    };
  }

  // Check for duplicate codes
  const codes = playerClasses.map(cls => cls.code.toUpperCase());
  const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
  if (duplicates.length > 0) {
    return {
      valid: false,
      error: `Duplicate player class code detected: "${duplicates[0]}". Each class must have a unique code.`
    };
  }

  return { valid: true };
}

async function syncRenamedClassNames(
  tournamentId: string,
  existingClasses: PlayerClassConfig[] = [],
  updatedClasses: PlayerClassConfig[] = []
) {
  const oldNameByCode = new Map(existingClasses.map(cls => [cls.code, cls.name]));
  const newNameByCode = new Map(updatedClasses.map(cls => [cls.code, cls.name]));

  const renamedPairs: Array<{ oldName: string; newName: string }> = [];
  for (const [code, oldName] of oldNameByCode.entries()) {
    const newName = newNameByCode.get(code);
    if (newName && newName !== oldName) {
      renamedPairs.push({ oldName, newName });
    }
  }

  if (renamedPairs.length === 0) return;

  await connectToDatabase();

  // Keep all players aligned with renamed class names (matched by stable class code).
  for (const { oldName, newName } of renamedPairs) {
    await PlayerModel.updateMany(
      { tournamentId, playerClass: oldName },
      { $set: { playerClass: newName } }
    );
  }

  // Keep auction state's class pointers valid after rename.
  const state = await AuctionStateModel.findOne({ tournamentId });
  if (!state) return;

  const renameMap = new Map(renamedPairs.map(pair => [pair.oldName, pair.newName]));
  const currentAuctionClass = state.currentAuctionClass
    ? (renameMap.get(state.currentAuctionClass) || state.currentAuctionClass)
    : state.currentAuctionClass;
  const completedClasses = (state.completedClasses || []).map(
    (clsName: string) => renameMap.get(clsName) || clsName
  );

  state.currentAuctionClass = currentAuctionClass;
  state.completedClasses = Array.from(new Set(completedClasses));
  await state.save();
}

async function syncTeamBudgets(tournamentId: string, newBudget: number) {
  const teams = await TeamModel.find({ tournamentId }).lean() as any[];
  if (!teams.length) return;

  const spendAgg: { _id: string; totalSpent: number; playerIds: string[] }[] =
    await PlayerModel.aggregate([
      { $match: { tournamentId, isSold: true, winningTeamId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$winningTeamId',
          totalSpent: { $sum: '$finalPrice' },
          playerIds: { $push: { $toString: '$_id' } },
        },
      },
    ]);

  const spendByTeam = new Map(spendAgg.map(r => [r._id, r]));

  await Promise.all(
    teams.map(async (team: any) => {
      const entry = spendByTeam.get(String(team._id));
      const totalSpent = entry?.totalSpent ?? 0;
      const playersPurchased = entry?.playerIds ?? [];
      const newBalance = newBudget - totalSpent;

      await TeamModel.findByIdAndUpdate(team._id, {
        $set: {
          initialBudget: newBudget,
          currentBalance: newBalance,
          playersPurchased,
        },
      });
    })
  );
}

// GET /api/tournaments/[id] - Get tournament by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Overlay token auth — allows OBS browser sources to read tournament data without JWT
    const overlayToken = getOverlayTokenFromRequest(request);
    const isOverlayAuth = overlayToken && (
      validateOverlayToken(overlayToken) ||
      await validateOverlaySessionToken(overlayToken)
    );

    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user && !isOverlayAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const tournament = await tournamentDB.getById(id);
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Overlay access: return tournament directly — the ID is already scoped in the URL
    if (!user && isOverlayAuth) {
      return NextResponse.json(tournament);
    }

    // Check if user has permission to read tournaments
    if (!canPerformAction(user!.role, 'read', 'tournament')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if user has access to this tournament
    if (!canAccessTournament(user!.userId, user!.role, tournament, user!.assignedTournaments)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(tournament);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: 500 }
    );
  }
}

// PUT /api/tournaments/[id] - Update tournament
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update tournaments
    if (!canPerformAction(user.role, 'update', 'tournament')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const tournament = await tournamentDB.getById(id);
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this tournament
    if (!canAccessTournament(user.userId, user.role, tournament, user.assignedTournaments)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate player class codes if player classes are enabled
    if (body.usePlayerClasses && body.playerClasses) {
      const validation = validatePlayerClassCodes(body.playerClasses);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      await syncRenamedClassNames(
        id,
        (tournament.playerClasses as PlayerClassConfig[] | undefined) || [],
        body.playerClasses as PlayerClassConfig[]
      );
    }

    const oldBudget = (tournament as any).budgetPerTeam;
    const updatedTournament = await tournamentDB.update(id, body);
    if (!updatedTournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    const newBudget = (updatedTournament as any).budgetPerTeam;
    if (typeof newBudget === 'number' && newBudget !== oldBudget) {
      await syncTeamBudgets(id, newBudget);
    }

    return NextResponse.json(updatedTournament);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update tournament' },
      { status: 500 }
    );
  }
}

// DELETE /api/tournaments/[id] - Delete tournament
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to delete tournaments
    if (!canPerformAction(user.role, 'delete', 'tournament')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const tournament = await tournamentDB.getById(id);
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this tournament
    if (!canAccessTournament(user.userId, user.role, tournament, user.assignedTournaments)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const success = await tournamentDB.delete(id);
    if (!success) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: 'Tournament deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete tournament' },
      { status: 500 }
    );
  }
}
