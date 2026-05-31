import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { PlayerModel } from '@/models/Player';
import { TournamentModel } from '@/models/Tournament';
import { TeamModel } from '@/models/Team';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';
import { Tournament } from '@/types';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!canPerformAction(user.role, 'read', 'player')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
      return NextResponse.json({ error: 'tournamentId is required' }, { status: 400 });
    }

    const tournament = await TournamentModel.findById(tournamentId).lean() as Tournament | null;
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const tournamentPlayers = await PlayerModel.find({ tournamentId })
      .sort({ playerNo: 1, name: 1 })
      .lean() as any[];

    if (tournamentPlayers.length === 0) {
      return NextResponse.json({ error: 'No players found in this tournament' }, { status: 400 });
    }

    const tournamentTeams = await TeamModel.find({ tournamentId }).lean() as any[];
    const teamMap = new Map(tournamentTeams.map(t => [String(t._id), t.name]));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tournament Players');

    // Build columns
    const columns: Partial<ExcelJS.Column>[] = [
      { header: 'Player No',    key: 'playerNo',    width: 12 },
      { header: 'Name',         key: 'name',        width: 25 },
      { header: 'Position',     key: 'position',    width: 15 },
      { header: 'Current Club', key: 'currentClub', width: 25 },
      { header: 'Age',          key: 'age',         width: 8  },
    ];
    if (tournament.usePlayerClasses) {
      columns.push({ header: 'Player Class', key: 'playerClass', width: 15 });
    }
    columns.push(
      { header: 'Matches Played', key: 'matchesPlayed', width: 15 },
      { header: 'Total Score',    key: 'totalScore',    width: 13 },
      { header: 'Total Wickets',  key: 'totalWickets',  width: 14 },
      { header: 'Status',         key: 'status',        width: 12 },
      { header: 'Final Price',    key: 'finalPrice',    width: 15 },
      { header: 'Winning Team',   key: 'winningTeam',   width: 25 },
    );
    worksheet.columns = columns;

    for (const player of tournamentPlayers) {
      const row: any = {
        playerNo:     player.playerNo || player._id?.toString().substring(0, 3),
        name:         player.name,
        position:     player.position || '',
        currentClub:  player.currentClub || '',
        age:          player.age || '',
        matchesPlayed: player.stats?.matchesPlayed || 0,
        totalScore:   player.stats?.totalScore || 0,
        totalWickets: player.stats?.totalWickets || 0,
        status:       player.isIconic ? 'ICONIC' : (player.isSold ? 'SOLD' : player.isUnsold ? 'UNSOLD' : 'AVAILABLE'),
        finalPrice:   player.isIconic ? 'ICONIC' : (player.finalPrice || ''),
        winningTeam:  player.winningTeamId ? (teamMap.get(String(player.winningTeamId)) || 'Unknown') : '',
      };
      if (tournament.usePlayerClasses) row.playerClass = player.playerClass || '';
      worksheet.addRow(row);
    }

    // Summary sheet
    const summary = workbook.addWorksheet('Summary');
    summary.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value',  key: 'value',  width: 25 },
    ] as Partial<ExcelJS.Column>[];

    const soldCount  = tournamentPlayers.filter(p => p.isSold).length;
    const totalPrize = tournamentPlayers.filter(p => p.finalPrice).reduce((s, p) => s + (p.finalPrice || 0), 0);
    [
      ['Tournament Name',    tournament.name],
      ['Tournament Year',    tournament.year],
      ['Total Players',      tournamentPlayers.length],
      ['Sold Players',       soldCount],
      ['Available Players',  tournamentPlayers.length - soldCount],
      ['Total Prize Pool',   totalPrize],
      ['Budget Per Team',    tournament.budgetPerTeam],
      ['Squad Size',         tournament.squadSize],
      ['Base Price',         tournament.basePricePerPlayer],
      ['Export Date',        new Date().toLocaleString()],
    ].forEach(([m, v]) => summary.addRow({ metric: m, value: v }));

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `tournament_players_export_${tournament.name.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('Tournament export error:', error);
    return NextResponse.json({ error: `Failed to export tournament players: ${error.message}` }, { status: 500 });
  }
}
