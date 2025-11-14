import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { PlayerModel } from '@/models/Player';
import { TournamentModel } from '@/models/Tournament';
import { TeamModel } from '@/models/Team';
import { connectToDatabase } from '@/lib/mongodb';
import { Tournament, Player } from '@/types';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'tournamentId is required' },
        { status: 400 }
      );
    }

    // Fetch tournament
    const tournament = await TournamentModel.findById(tournamentId).lean() as Tournament | null;
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Fetch all players in tournament
    const tournamentPlayers = await PlayerModel.find({ tournamentId })
      .sort({ playerNo: 1, name: 1 })
      .lean() as any[];

    if (tournamentPlayers.length === 0) {
      return NextResponse.json(
        { error: 'No players found in this tournament' },
        { status: 400 }
      );
    }

    // Fetch tournament teams for winning team resolution
    const tournamentTeams = await TeamModel.find({ tournamentId }).lean() as any[];

    // Create team map for quick lookup
    const teamMap = new Map(tournamentTeams.map(t => [t._id, t.name]));

    // Build export data based on tournament configuration
    const exportData = tournamentPlayers.map(player => {
      const row: any = {
        'Player No': player.playerNo || player._id.substring(0, 3),
        'Name': player.name,
        'Position': player.position || '',
        'Current Club': player.currentClub || '',
      };

      // Include player class column only if tournament uses classes
      if (tournament.usePlayerClasses) {
        row['Player Class'] = player.playerClass || '';
      }

      // Add stats
      row['Matches Played'] = player.stats?.matchesPlayed || 0;
      row['Total Score'] = player.stats?.totalScore || 0;
      row['Total Wickets'] = player.stats?.totalWickets || 0;

      // Add auction data
      row['Status'] = player.isSold ? 'SOLD' : 'AVAILABLE';
      row['Final Price'] = player.finalPrice || '';
      row['Winning Team'] = player.winningTeamId ? (teamMap.get(player.winningTeamId) || 'Unknown') : '';

      return row;
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 10 },  // Player No
      { wch: 25 },  // Name
      { wch: 15 },  // Position
      { wch: 25 },  // Current Club
    ];

    if (tournament.usePlayerClasses) {
      columnWidths.push({ wch: 15 }); // Player Class
    }

    columnWidths.push(
      { wch: 12 },  // Matches
      { wch: 12 },  // Score
      { wch: 12 },  // Wickets
      { wch: 12 },  // Status
      { wch: 15 },  // Final Price
      { wch: 25 }   // Winning Team
    );

    worksheet['!cols'] = columnWidths;

    // Add main sheet
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tournament Players');

    // Create summary sheet
    const soldCount = tournamentPlayers.filter(p => p.isSold).length;
    const unsoldCount = tournamentPlayers.length - soldCount;
    const totalPrize = tournamentPlayers
      .filter(p => p.finalPrice)
      .reduce((sum, p) => sum + (p.finalPrice || 0), 0);

    const summaryData = [
      { 'Metric': 'Tournament Name', 'Value': tournament.name },
      { 'Metric': 'Tournament Year', 'Value': tournament.year },
      { 'Metric': 'Total Players', 'Value': tournamentPlayers.length },
      { 'Metric': 'Sold Players', 'Value': soldCount },
      { 'Metric': 'Available Players', 'Value': unsoldCount },
      { 'Metric': 'Total Prize Pool', 'Value': totalPrize },
      { 'Metric': 'Budget Per Team', 'Value': tournament.budgetPerTeam },
      { 'Metric': 'Squad Size', 'Value': tournament.squadSize },
      { 'Metric': 'Base Price Per Player', 'Value': tournament.basePricePerPlayer },
      { 'Metric': 'Export Date', 'Value': new Date().toLocaleString() },
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return file
    const fileName = `tournament_players_export_${tournament.name.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('Tournament export error:', error);
    return NextResponse.json(
      { error: `Failed to export tournament players: ${error.message}` },
      { status: 500 }
    );
  }
}
