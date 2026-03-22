import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { TournamentModel } from '@/models/Tournament';
import { Tournament } from '@/types';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const playerClasses = tournament.usePlayerClasses && tournament.playerClasses
      ? tournament.playerClasses.map((c: any) => c.name)
      : [];

    // Build sample rows to illustrate the expected format
    const sampleRows = [
      {
        'Player No': '001',
        'Name': 'John Smith',
        'Position': 'Batsman',
        'Current Club': 'Mumbai FC',
        'Age': 25,
        'Add (Yes/No)': 'Yes',
        ...(playerClasses.length > 0 ? { 'Player Class': playerClasses[0] || '' } : {}),
      },
      {
        'Player No': '002',
        'Name': 'Alex Johnson',
        'Position': 'Bowler',
        'Current Club': 'Delhi Tigers',
        'Age': 28,
        'Add (Yes/No)': 'No',
        ...(playerClasses.length > 0 ? { 'Player Class': playerClasses[1] || playerClasses[0] || '' } : {}),
      },
    ];

    // Add empty rows for data entry
    const emptyRowCount = 20;
    for (let i = 0; i < emptyRowCount; i++) {
      sampleRows.push({
        'Player No': '',
        'Name': '',
        'Position': '',
        'Current Club': '',
        'Age': '' as any,
        'Add (Yes/No)': 'Yes',
        ...(playerClasses.length > 0 ? { 'Player Class': '' } : {}),
      });
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sampleRows);

    // Column widths
    const columnWidths: Array<{ wch: number }> = [
      { wch: 12 }, // Player No
      { wch: 25 }, // Name
      { wch: 18 }, // Position
      { wch: 30 }, // Current Club
      { wch: 8  }, // Age
      { wch: 15 }, // Add (Yes/No)
    ];
    if (playerClasses.length > 0) {
      columnWidths.push({ wch: 20 }); // Player Class
    }
    worksheet['!cols'] = columnWidths;

    // Determine column letters
    const addColLetter = 'F';
    const classColLetter = 'G';
    const totalRows = sampleRows.length + 1;

    if (!worksheet['!dataValidation']) {
      (worksheet as any)['!dataValidation'] = [];
    }

    // Yes/No dropdown for "Add" column
    for (let i = 2; i <= totalRows; i++) {
      (worksheet as any)['!dataValidation'].push({
        sqref: `${addColLetter}${i}`,
        type: 'list',
        formula1: '"Yes,No"',
        showErrorMessage: true,
        error: 'Please select Yes or No',
        errorTitle: 'Invalid Value',
      });
    }

    // Player class dropdown
    if (playerClasses.length > 0) {
      const classListFormula = `"${playerClasses.join(',')}"`;
      for (let i = 2; i <= totalRows; i++) {
        (worksheet as any)['!dataValidation'].push({
          sqref: `${classColLetter}${i}`,
          type: 'list',
          formula1: classListFormula,
          showErrorMessage: true,
          error: `Please select from: ${playerClasses.join(', ')}`,
          errorTitle: 'Invalid Player Class',
        });
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Players');

    // Instructions sheet
    const instructions: Array<{ Step: number | string; Instruction: string }> = [
      { Step: 1, Instruction: 'Fill in player details in the "Players" sheet. The first two rows are examples — replace them with real data.' },
      { Step: 2, Instruction: 'Required columns: Name, Position, Current Club, Add (Yes/No). Optional: Player No (e.g. 001, 002)' },
      { Step: 3, Instruction: 'Set "Add (Yes/No)" to "Yes" for rows you want to import. Rows set to "No" will be skipped.' },
    ];

    if (playerClasses.length > 0) {
      instructions.push(
        { Step: 4, Instruction: `Select a Player Class from the dropdown: ${playerClasses.join(', ')}` },
        { Step: 5, Instruction: 'TIP: You can use short codes to reduce typos! (e.g., P=Platinum, G=Gold, S=Silver, B=Bronze, E=Elite, Pr=Premium, St=Standard)' },
        { Step: 6, Instruction: 'Short codes are case-insensitive. Examples: "P" or "p" → Platinum, "G" → Gold, "S" → Silver' },
        { Step: 7, Instruction: 'Save the file and upload it back to the application.' },
      );
    } else {
      instructions.push(
        { Step: 4, Instruction: 'This tournament does not use player classes — no class column needed.' },
        { Step: 5, Instruction: 'Save the file and upload it back to the application.' },
      );
    }

    instructions.push(
      { Step: '', Instruction: '' },
      { Step: 'Tournament', Instruction: tournament.name },
      { Step: 'Positions', Instruction: 'Batsman, Bowler, All-rounder, Batting All-rounder, Bowling All-rounder, Wicket-keeper, Wicket Keeper Batsman' },
    );

    if (playerClasses.length > 0) {
      const classCodesInfo = tournament.playerClasses
        ?.map((c: any) => `${c.code} (${c.name})`)
        .join(', ') || '';
      instructions.push(
        { Step: 'Classes', Instruction: `Configured: ${playerClasses.join(', ')}` },
        { Step: 'Short Codes', Instruction: `Use these codes in the Player Class column: ${classCodesInfo}` },
      );
    }

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    instructionsSheet['!cols'] = [{ wch: 12 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="players_import_${tournament.name.replace(/\s+/g, '_')}_${Date.now()}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Template generation error:', error);
    return NextResponse.json({ error: `Failed to generate template: ${error.message}` }, { status: 500 });
  }
}
