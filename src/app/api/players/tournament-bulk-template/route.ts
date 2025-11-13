import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { MasterPlayerModel } from '@/models/MasterPlayer';
import { PlayerModel } from '@/models/Player';
import { TournamentModel } from '@/models/Tournament';
import { Tournament } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'tournamentId is required' },
        { status: 400 }
      );
    }

    // Fetch tournament to get player classes
    const tournament = await TournamentModel.findById(tournamentId).lean() as Tournament | null;
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Get all master players
    const allMasterPlayers = await MasterPlayerModel.find({})
      .select('_id name position currentClub suggestedClass careerStats')
      .sort({ name: 1 })
      .lean();

    // Get players already added to this tournament
    const existingPlayers = await PlayerModel.find({ tournamentId })
      .select('masterPlayerId')
      .lean();

    const existingMasterPlayerIds = new Set(
      existingPlayers.map(p => p.masterPlayerId).filter(Boolean)
    );

    // Filter out players already in tournament
    const availablePlayers = allMasterPlayers.filter(
      player => !existingMasterPlayerIds.has(player._id)
    );

    if (availablePlayers.length === 0) {
      return NextResponse.json(
        { error: 'No available players to add. All master players are already in this tournament.' },
        { status: 400 }
      );
    }

    // Get tournament-specific player classes
    const playerClasses = tournament.usePlayerClasses && tournament.playerClasses
      ? tournament.playerClasses.map((c: any) => c.name)
      : [];

    // Create template data
    const templateData = availablePlayers.map(player => {
      // Find default class for this player
      let defaultClass = '';
      if (playerClasses.length > 0 && player.suggestedClass) {
        // Check if suggested class exists in tournament classes
        if (playerClasses.includes(player.suggestedClass)) {
          defaultClass = player.suggestedClass;
        } else {
          // Use first tournament class as default
          defaultClass = playerClasses[0] || '';
        }
      }

      const row: any = {
        'Master Player ID': player._id,
        'Name': player.name,
        'Position': player.position,
        'Current Club': player.currentClub,
        'Matches': player.careerStats?.matchesPlayed || 0,
        'Score': player.careerStats?.totalScore || 0,
        'Wickets': player.careerStats?.totalWickets || 0,
        'Add (Yes/No)': 'No',
      };

      // Only add Player Class column if tournament uses player classes
      if (playerClasses.length > 0) {
        row['Player Class'] = defaultClass;
      }

      return row;
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    const columnWidths = [
      { wch: 18 }, // Master Player ID
      { wch: 25 }, // Name
      { wch: 15 }, // Position
      { wch: 30 }, // Current Club
      { wch: 10 }, // Matches
      { wch: 10 }, // Score
      { wch: 10 }, // Wickets
      { wch: 15 }, // Add (Yes/No)
    ];

    if (playerClasses.length > 0) {
      columnWidths.push({ wch: 20 }); // Player Class
    }

    worksheet['!cols'] = columnWidths;

    // Add data validation for "Add (Yes/No)" column
    const addColumnIndex = playerClasses.length > 0 ? 'H' : 'H'; // Column H
    const playerClassColumnIndex = 'I'; // Column I

    if (!worksheet['!dataValidation']) {
      worksheet['!dataValidation'] = [];
    }

    // Add Yes/No dropdown validation for "Add" column (rows 2 to end)
    for (let i = 2; i <= templateData.length + 1; i++) {
      worksheet['!dataValidation'].push({
        sqref: `${addColumnIndex}${i}`,
        type: 'list',
        formula1: '"Yes,No"',
        showErrorMessage: true,
        error: 'Please select Yes or No',
        errorTitle: 'Invalid Value'
      });
    }

    // Add player class dropdown validation if tournament uses classes
    if (playerClasses.length > 0) {
      const classListFormula = `"${playerClasses.join(',')}"`;
      for (let i = 2; i <= templateData.length + 1; i++) {
        worksheet['!dataValidation'].push({
          sqref: `${playerClassColumnIndex}${i}`,
          type: 'list',
          formula1: classListFormula,
          showErrorMessage: true,
          error: `Please select from: ${playerClasses.join(', ')}`,
          errorTitle: 'Invalid Player Class'
        });
      }
    }

    // Add main sheet
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Available Players');

    // Create instructions sheet
    const instructions: Array<{ 'Step': number | string; 'Instruction': string }> = [
      { 'Step': 1, 'Instruction': 'Review the list of available players' },
      { 'Step': 2, 'Instruction': 'Set "Add (Yes/No)" to "Yes" for players you want to add to the tournament' },
    ];

    if (playerClasses.length > 0) {
      instructions.push(
        { 'Step': 3, 'Instruction': `Select Player Class from dropdown: ${playerClasses.join(', ')}` }
      );
      instructions.push(
        { 'Step': 4, 'Instruction': 'Player Class MUST match tournament\'s configured classes' }
      );
      instructions.push(
        { 'Step': 5, 'Instruction': 'Save the file and upload it back to the application' }
      );
    } else {
      instructions.push(
        { 'Step': 3, 'Instruction': 'This tournament does not use player classes' }
      );
      instructions.push(
        { 'Step': 4, 'Instruction': 'Save the file and upload it back to the application' }
      );
    }

    instructions.push(
      { 'Step': '', 'Instruction': '' },
      { 'Step': 'Note', 'Instruction': `Tournament: ${tournament.name}` },
      { 'Step': 'Note', 'Instruction': `Available Players: ${availablePlayers.length}` },
      { 'Step': 'Note', 'Instruction': `Already Added: ${existingPlayers.length}` }
    );

    if (playerClasses.length > 0) {
      instructions.push(
        { 'Step': 'Classes', 'Instruction': `Configured Classes: ${playerClasses.join(', ')}` }
      );
    }

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    instructionsSheet['!cols'] = [{ wch: 10 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="tournament_players_${tournament.name.replace(/\s+/g, '_')}_${Date.now()}.xlsx"`
      }
    });

  } catch (error: any) {
    console.error('Template generation error:', error);
    return NextResponse.json(
      { error: `Failed to generate template: ${error.message}` },
      { status: 500 }
    );
  }
}
