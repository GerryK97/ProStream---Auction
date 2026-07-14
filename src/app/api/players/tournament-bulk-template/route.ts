import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { TournamentModel } from '@/models/Tournament';
import { Tournament } from '@/types';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { getPositionsForSport, SPORT_LABELS } from '@/lib/sportPositions';

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
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    if (!tournamentId) return NextResponse.json({ error: 'tournamentId is required' }, { status: 400 });

    const tournament = await TournamentModel.findById(tournamentId).lean() as Tournament | null;
    if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });

    const sport           = (tournament as any).sport ?? 'cricket';
    const isCricket       = sport === 'cricket';
    const sportLabel      = SPORT_LABELS[sport as keyof typeof SPORT_LABELS] ?? sport;
    const sportPositions  = getPositionsForSport(sport);

    const playerClasses = (tournament.usePlayerClasses && tournament.playerClasses)
      ? tournament.playerClasses.map((c: any) => c.name)
      : [];

    const ppf              = tournament.playerProfileFields;
    const showAge          = ppf?.showAge          ?? false;
    // Batting/Bowling style columns only make sense for cricket
    const showBattingStyle = isCricket && (ppf?.showBattingStyle  ?? false);
    const showBowlingStyle = isCricket && (ppf?.showBowlingStyle  ?? false);
    const statFields       = ppf?.statFields        ?? [];

    const workbook  = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Players');

    // Build ordered column list
    const colDefs: { header: string; key: string; width: number }[] = [
      { header: 'Player No',    key: 'playerNo',    width: 12 },
      { header: 'Name',         key: 'name',        width: 25 },
      { header: 'Position',     key: 'position',    width: 22 },
      { header: 'Current Club', key: 'currentClub', width: 30 },
      ...(showAge          ? [{ header: 'Age',           key: 'age',          width: 8  }] : []),
      ...(showBattingStyle ? [{ header: 'Batting Style', key: 'battingStyle', width: 22 }] : []),
      ...(showBowlingStyle ? [{ header: 'Bowling Style', key: 'bowlingStyle', width: 26 }] : []),
      ...statFields.map((sf: any) => ({ header: sf.label, key: sf.label, width: 18 })),
      { header: 'Add (Yes/No)',  key: 'add',         width: 15 },
      ...(playerClasses.length > 0 ? [{ header: 'Player Class', key: 'playerClass', width: 20 }] : []),
    ];
    worksheet.columns = colDefs as Partial<ExcelJS.Column>[];

    // Sample rows — use sport-appropriate position examples
    const samplePos1 = sportPositions[0] ?? 'Position 1';
    const samplePos2 = sportPositions[1] ?? sportPositions[0] ?? 'Position 2';

    const makeSampleRow = (no: string, name: string, pos: string, club: string,
      age: string, batting: string, bowling: string, stat1: string, add: string, cls: string) => {
      const r: any = { playerNo: no, name, position: pos, currentClub: club };
      if (showAge)          r.age          = age;
      if (showBattingStyle) r.battingStyle = batting;
      if (showBowlingStyle) r.bowlingStyle = bowling;
      statFields.forEach((sf: any, i: number) => { r[sf.label] = i === 0 ? stat1 : ''; });
      r.add = add;
      if (playerClasses.length > 0) r.playerClass = cls;
      return r;
    };

    worksheet.addRow(makeSampleRow('001', 'John Smith',   samplePos1, 'Team Alpha', '25', 'Right-handed', 'Right-arm Medium', '42', 'Yes', playerClasses[0] || ''));
    worksheet.addRow(makeSampleRow('002', 'Alex Johnson', samplePos2, 'Team Beta',  '28', 'Left-handed',  'Left-arm Orthodox', '18', 'No',  playerClasses[1] || playerClasses[0] || ''));
    for (let i = 0; i < 20; i++) {
      worksheet.addRow(makeSampleRow('', '', '', '', '', '', '', '', 'Yes', ''));
    }

    const totalRows = 22 + 1;

    // Add (Yes/No) dropdown
    const addColIdx = colDefs.findIndex(c => c.key === 'add') + 1;
    for (let r = 2; r <= totalRows; r++) {
      worksheet.getCell(r, addColIdx).dataValidation = {
        type: 'list', allowBlank: true,
        formulae: ['"Yes,No"'],
        showErrorMessage: true, error: 'Please select Yes or No', errorTitle: 'Invalid Value',
      };
    }

    // Position dropdown — only when positions list is short enough for Excel (≤ ~255 chars)
    if (sportPositions.length > 0) {
      const posStr = sportPositions.join(',');
      if (posStr.length <= 255) {
        const posColIdx = colDefs.findIndex(c => c.key === 'position') + 1;
        for (let r = 2; r <= totalRows; r++) {
          worksheet.getCell(r, posColIdx).dataValidation = {
            type: 'list', allowBlank: true,
            formulae: [`"${posStr}"`],
            showErrorMessage: false, // allow free-text too for flexibility
          };
        }
      }
    }

    // Batting Style
    if (showBattingStyle) {
      const col = colDefs.findIndex(c => c.key === 'battingStyle') + 1;
      for (let r = 2; r <= totalRows; r++) {
        worksheet.getCell(r, col).dataValidation = {
          type: 'list', allowBlank: true,
          formulae: [`"${BATTING_STYLES.join(',')}"`],
        };
      }
    }

    // Bowling Style
    if (showBowlingStyle) {
      const col = colDefs.findIndex(c => c.key === 'bowlingStyle') + 1;
      for (let r = 2; r <= totalRows; r++) {
        worksheet.getCell(r, col).dataValidation = {
          type: 'list', allowBlank: true,
          formulae: [`"${BOWLING_STYLES.join(',')}"`],
        };
      }
    }

    // Player Class
    if (playerClasses.length > 0) {
      const col = colDefs.findIndex(c => c.key === 'playerClass') + 1;
      for (let r = 2; r <= totalRows; r++) {
        worksheet.getCell(r, col).dataValidation = {
          type: 'list', allowBlank: true,
          formulae: [`"${playerClasses.join(',')}"`],
          showErrorMessage: true,
          error: `Select from: ${playerClasses.join(', ')}`, errorTitle: 'Invalid Player Class',
        };
      }
    }

    // Instructions sheet
    const instructions = workbook.addWorksheet('Instructions');
    instructions.columns = [
      { header: 'Step',        key: 'step',        width: 12 },
      { header: 'Instruction', key: 'instruction', width: 80 },
    ] as Partial<ExcelJS.Column>[];

    const rows: { step: string | number; instruction: string }[] = [
      { step: '',           instruction: `Sport: ${sportLabel}` },
      { step: '',           instruction: `Tournament: ${tournament.name}` },
      { step: '',           instruction: '' },
      { step: 1,            instruction: 'Fill in player details in the "Players" sheet. The first two rows are examples — replace with real data.' },
      { step: 2,            instruction: 'Required: Name, Position, Current Club, Add (Yes/No). Player No is optional.' },
      { step: 3,            instruction: 'Set "Add (Yes/No)" to "Yes" to import a row. Rows set to "No" will be skipped.' },
    ];

    let step = 4;
    if (sportPositions.length > 0) {
      rows.push({ step: step++, instruction: `Position — valid values for ${sportLabel}: ${sportPositions.join(', ')}` });
      rows.push({ step: step++, instruction: 'You may also type a custom position if not in the list.' });
    }
    if (showAge)          rows.push({ step: step++, instruction: "Age: Enter the player's age as a number (optional)." });
    if (showBattingStyle) rows.push({ step: step++, instruction: `Batting Style: Select from dropdown — ${BATTING_STYLES.join(', ')}` });
    if (showBowlingStyle) rows.push({ step: step++, instruction: `Bowling Style: Select from dropdown — ${BOWLING_STYLES.join(', ')}` });
    if (statFields.length > 0) rows.push({ step: step++, instruction: `Stat fields: ${statFields.map((sf: any) => sf.label).join(', ')}` });
    if (playerClasses.length > 0) {
      rows.push({ step: step++, instruction: `Player Class: select from — ${playerClasses.join(', ')}` });
      const classCodes = tournament.playerClasses?.map((c: any) => `${c.code} (${c.name})`).join(', ') || '';
      rows.push({ step: step++, instruction: `Short codes accepted: ${classCodes}` });
    }

    rows.forEach(r => instructions.addRow(r));

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer as unknown as BodyInit, {
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
