import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { TournamentModel } from '@/models/Tournament';
import { Tournament } from '@/types';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';

const BATTING_STYLES = ['Right-handed', 'Left-handed'];
const BOWLING_STYLES = [
  'Right-arm Fast', 'Right-arm Medium-fast', 'Right-arm Medium', 'Right-arm Off-spin',
  'Left-arm Fast', 'Left-arm Medium-fast', 'Left-arm Medium', 'Left-arm Orthodox',
  'Left-arm Chinaman', 'Leg-spin',
];

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

    const ppf = tournament.playerProfileFields;
    const showAge          = ppf?.showAge          ?? false;
    const showBattingStyle = ppf?.showBattingStyle  ?? false;
    const showBowlingStyle = ppf?.showBowlingStyle  ?? false;
    const statFields       = ppf?.statFields        ?? [];

    // Build the ordered column list so we can derive column letters dynamically
    const colNames: string[] = [
      'Player No',
      'Name',
      'Position',
      'Current Club',
      ...(showAge          ? ['Age']           : []),
      ...(showBattingStyle ? ['Batting Style'] : []),
      ...(showBowlingStyle ? ['Bowling Style'] : []),
      ...statFields.map(sf => sf.label),
      'Add (Yes/No)',
      ...(playerClasses.length > 0 ? ['Player Class'] : []),
    ];

    const addColIdx   = colNames.indexOf('Add (Yes/No)');
    const classColIdx = colNames.indexOf('Player Class');
    const battingColIdx = colNames.indexOf('Batting Style');
    const bowlingColIdx = colNames.indexOf('Bowling Style');

    const addColLetter   = XLSX.utils.encode_col(addColIdx);
    const classColLetter = classColIdx >= 0 ? XLSX.utils.encode_col(classColIdx) : null;
    const battingColLetter = battingColIdx >= 0 ? XLSX.utils.encode_col(battingColIdx) : null;
    const bowlingColLetter = bowlingColIdx >= 0 ? XLSX.utils.encode_col(bowlingColIdx) : null;

    // Build sample rows
    const makeRow = (
      no: string, name: string, pos: string, club: string,
      age: number | string, batting: string, bowling: string,
      stat1: string, addVal: string, cls: string
    ) => ({
      'Player No': no,
      'Name': name,
      'Position': pos,
      'Current Club': club,
      ...(showAge          ? { 'Age': age }                 : {}),
      ...(showBattingStyle ? { 'Batting Style': batting }   : {}),
      ...(showBowlingStyle ? { 'Bowling Style': bowling }   : {}),
      ...Object.fromEntries(statFields.map((sf, i) => [sf.label, i === 0 ? stat1 : ''])),
      'Add (Yes/No)': addVal,
      ...(playerClasses.length > 0 ? { 'Player Class': cls } : {}),
    });

    const sampleRows: Record<string, any>[] = [
      makeRow('001', 'John Smith',   'Batsman', 'Mumbai FC',     25, 'Right-handed', 'Right-arm Medium', '42', 'Yes', playerClasses[0] || ''),
      makeRow('002', 'Alex Johnson', 'Bowler',  'Delhi Tigers',  28, 'Left-handed',  'Left-arm Orthodox', '18', 'No',  playerClasses[1] || playerClasses[0] || ''),
    ];

    // Empty rows for data entry
    for (let i = 0; i < 20; i++) {
      sampleRows.push(makeRow('', '', '', '', '' as any, '', '', '', 'Yes', ''));
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sampleRows);

    // Column widths matching column order
    worksheet['!cols'] = colNames.map(col => {
      if (col === 'Player No')    return { wch: 12 };
      if (col === 'Name')         return { wch: 25 };
      if (col === 'Position')     return { wch: 18 };
      if (col === 'Current Club') return { wch: 30 };
      if (col === 'Age')          return { wch: 8 };
      if (col === 'Batting Style') return { wch: 22 };
      if (col === 'Bowling Style') return { wch: 26 };
      if (col === 'Add (Yes/No)') return { wch: 15 };
      if (col === 'Player Class') return { wch: 20 };
      return { wch: 18 }; // stat fields
    });

    if (!worksheet['!dataValidation']) {
      (worksheet as any)['!dataValidation'] = [];
    }

    const totalRows = sampleRows.length + 1;

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

    // Batting Style dropdown
    if (battingColLetter) {
      const battingFormula = `"${BATTING_STYLES.join(',')}"`;
      for (let i = 2; i <= totalRows; i++) {
        (worksheet as any)['!dataValidation'].push({
          sqref: `${battingColLetter}${i}`,
          type: 'list',
          formula1: battingFormula,
          showErrorMessage: false,
        });
      }
    }

    // Bowling Style dropdown
    if (bowlingColLetter) {
      const bowlingFormula = `"${BOWLING_STYLES.join(',')}"`;
      for (let i = 2; i <= totalRows; i++) {
        (worksheet as any)['!dataValidation'].push({
          sqref: `${bowlingColLetter}${i}`,
          type: 'list',
          formula1: bowlingFormula,
          showErrorMessage: false,
        });
      }
    }

    // Player class dropdown
    if (classColLetter && playerClasses.length > 0) {
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
      { Step: 2, Instruction: `Required columns: Name, Position, Current Club, Add (Yes/No). Optional: Player No (e.g. 001, 002)` },
      { Step: 3, Instruction: 'Set "Add (Yes/No)" to "Yes" for rows you want to import. Rows set to "No" will be skipped.' },
    ];

    let step = 4;
    if (showAge)          instructions.push({ Step: step++, Instruction: 'Age: Enter the player\'s age as a number (optional).' });
    if (showBattingStyle) instructions.push({ Step: step++, Instruction: `Batting Style: Select from dropdown — ${BATTING_STYLES.join(', ')} (optional).` });
    if (showBowlingStyle) instructions.push({ Step: step++, Instruction: `Bowling Style: Select from dropdown — ${BOWLING_STYLES.join(', ')} (optional).` });
    if (statFields.length > 0) instructions.push({ Step: step++, Instruction: `Stat fields: ${statFields.map(sf => sf.label).join(', ')} — enter numeric or text values (optional).` });

    if (playerClasses.length > 0) {
      instructions.push(
        { Step: step++, Instruction: `Select a Player Class from the dropdown: ${playerClasses.join(', ')}` },
        { Step: step++, Instruction: 'TIP: You can use short codes to reduce typos! (e.g., P=Platinum, G=Gold, S=Silver, B=Bronze, E=Elite, Pr=Premium, St=Standard)' },
        { Step: step++, Instruction: 'Short codes are case-insensitive. Examples: "P" or "p" → Platinum, "G" → Gold, "S" → Silver' },
        { Step: step++, Instruction: 'Save the file and upload it back to the application.' },
      );
    } else {
      instructions.push(
        { Step: step++, Instruction: 'This tournament does not use player classes — no class column needed.' },
        { Step: step++, Instruction: 'Save the file and upload it back to the application.' },
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
