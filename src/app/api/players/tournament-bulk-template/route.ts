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

// ─── Helper: write a list into the Lookup sheet and return the range reference ─
// e.g. writeLookupList(lookup, 'A', ['GK', 'CB', 'ST']) → "Lookup!$A$1:$A$3"
function writeLookupList(
  lookup: ExcelJS.Worksheet,
  colLetter: string,
  values: string[],
  headerLabel: string,
): string {
  lookup.getCell(`${colLetter}1`).value = headerLabel;
  values.forEach((v, i) => { lookup.getCell(`${colLetter}${i + 2}`).value = v; });
  return `Lookup!$${colLetter}$2:$${colLetter}$${values.length + 1}`;
}

// ─── Helper: col index → Excel letter (1=A, 2=B, …, 26=Z, 27=AA …) ───────────
function colIndexToLetter(n: number): string {
  let s = '';
  while (n > 0) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

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

    const sport          = (tournament as any).sport ?? 'cricket';
    const isCricket      = sport === 'cricket';
    const sportLabel     = SPORT_LABELS[sport as keyof typeof SPORT_LABELS] ?? sport;
    const sportPositions = getPositionsForSport(sport);

    const playerClasses      = (tournament.usePlayerClasses && tournament.playerClasses)
      ? tournament.playerClasses.map((c: any) => c.name)
      : [];
    // Also include short codes as alternatives in the dropdown
    const playerClassOptions = (tournament.usePlayerClasses && tournament.playerClasses)
      ? tournament.playerClasses.flatMap((c: any) => c.code ? [c.name, c.code] : [c.name])
      : [];

    const ppf              = tournament.playerProfileFields;
    const showAge          = ppf?.showAge          ?? false;
    const showBattingStyle = isCricket && (ppf?.showBattingStyle ?? false);
    const showBowlingStyle = isCricket && (ppf?.showBowlingStyle ?? false);
    const statFields       = ppf?.statFields ?? [];

    const workbook  = new ExcelJS.Workbook();

    // ── Lookup sheet (hidden — stores all dropdown lists as named ranges) ──────
    const lookup = workbook.addWorksheet('Lookup');
    lookup.state = 'hidden';

    // We'll write lists into columns A, B, C, … of the Lookup sheet
    let lookupCol = 1; // current column index in Lookup sheet
    const ranges: Record<string, string> = {}; // key → Excel range like "Lookup!$A$2:$A$5"

    // Yes/No — always present (inline is fine, only 2 values)
    // Position
    if (sportPositions.length > 0) {
      ranges.position = writeLookupList(lookup, colIndexToLetter(lookupCol++), sportPositions, 'Position');
    }
    // Player Class — includes both full names and short codes
    if (playerClassOptions.length > 0) {
      ranges.playerClass = writeLookupList(lookup, colIndexToLetter(lookupCol++), playerClassOptions, 'Player Class');
    }
    // Batting Style
    if (showBattingStyle) {
      ranges.battingStyle = writeLookupList(lookup, colIndexToLetter(lookupCol++), BATTING_STYLES, 'Batting Style');
    }
    // Bowling Style
    if (showBowlingStyle) {
      ranges.bowlingStyle = writeLookupList(lookup, colIndexToLetter(lookupCol++), BOWLING_STYLES, 'Bowling Style');
    }

    // ── Players sheet ─────────────────────────────────────────────────────────
    const worksheet = workbook.addWorksheet('Players');

    const colDefs: { header: string; key: string; width: number }[] = [
      { header: 'Player No',    key: 'playerNo',    width: 12 },
      { header: 'Name',         key: 'name',        width: 25 },
      { header: 'Position',     key: 'position',    width: 22 },
      { header: 'Current Club', key: 'currentClub', width: 30 },
      ...(showAge          ? [{ header: 'Age',           key: 'age',          width: 8  }] : []),
      ...(showBattingStyle ? [{ header: 'Batting Style', key: 'battingStyle', width: 22 }] : []),
      ...(showBowlingStyle ? [{ header: 'Bowling Style', key: 'bowlingStyle', width: 26 }] : []),
      ...statFields.map((sf: any) => ({ header: sf.label, key: sf.label, width: 18 })),
      { header: 'Add (Yes/No)', key: 'add',         width: 15 },
      ...(playerClasses.length > 0 ? [{ header: 'Player Class', key: 'playerClass', width: 22 }] : []),
    ];
    worksheet.columns = colDefs as Partial<ExcelJS.Column>[];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B3F8C' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    headerRow.height = 20;

    // Sample rows
    const samplePos1 = sportPositions[0] ?? 'Position 1';
    const samplePos2 = sportPositions[1] ?? samplePos1;

    const makeSampleRow = (
      no: string, name: string, pos: string, club: string,
      age: string, batting: string, bowling: string, stat1: string,
      add: string, cls: string,
    ) => {
      const r: any = { playerNo: no, name, position: pos, currentClub: club };
      if (showAge)          r.age          = age;
      if (showBattingStyle) r.battingStyle = batting;
      if (showBowlingStyle) r.bowlingStyle = bowling;
      statFields.forEach((sf: any, i: number) => { r[sf.label] = i === 0 ? stat1 : ''; });
      r.add = add;
      if (playerClasses.length > 0) r.playerClass = cls;
      return r;
    };

    const row1 = worksheet.addRow(makeSampleRow('001', 'John Smith',   samplePos1, 'Team Alpha', '25', BATTING_STYLES[0], BOWLING_STYLES[0], '42', 'Yes', playerClasses[0] || ''));
    const row2 = worksheet.addRow(makeSampleRow('002', 'Alex Johnson', samplePos2, 'Team Beta',  '28', BATTING_STYLES[1], BOWLING_STYLES[3], '18', 'No',  playerClasses[1] || playerClasses[0] || ''));

    // Style sample rows with light tint
    [row1, row2].forEach(r => {
      r.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8F0' } };
        cell.font = { italic: true, color: { argb: 'FF555577' } };
      });
    });

    for (let i = 0; i < 98; i++) {
      worksheet.addRow(makeSampleRow('', '', '', '', '', '', '', '', 'Yes', ''));
    }

    const totalRows = 100 + 1; // header + 2 samples + 98 blank

    // ── Apply data validations using Lookup sheet ranges ──────────────────────

    const addColIdx = colDefs.findIndex(c => c.key === 'add') + 1;
    for (let r = 2; r <= totalRows; r++) {
      worksheet.getCell(r, addColIdx).dataValidation = {
        type: 'list', allowBlank: true,
        formulae: ['"Yes,No"'],
        showErrorMessage: true, error: 'Please select Yes or No', errorTitle: 'Invalid Value',
      };
    }

    if (ranges.position) {
      const posColIdx = colDefs.findIndex(c => c.key === 'position') + 1;
      for (let r = 2; r <= totalRows; r++) {
        worksheet.getCell(r, posColIdx).dataValidation = {
          type: 'list', allowBlank: true,
          formulae: [ranges.position],
          showErrorMessage: false, // soft — custom positions are also allowed
        };
      }
    }

    if (ranges.playerClass) {
      const clsColIdx = colDefs.findIndex(c => c.key === 'playerClass') + 1;
      const classNames = playerClasses.join(', ');
      for (let r = 2; r <= totalRows; r++) {
        worksheet.getCell(r, clsColIdx).dataValidation = {
          type: 'list', allowBlank: false,
          formulae: [ranges.playerClass],
          showErrorMessage: true,
          error: `Select a class: ${classNames}`,
          errorTitle: 'Invalid Player Class',
        };
      }
    }

    if (ranges.battingStyle) {
      const col = colDefs.findIndex(c => c.key === 'battingStyle') + 1;
      for (let r = 2; r <= totalRows; r++) {
        worksheet.getCell(r, col).dataValidation = {
          type: 'list', allowBlank: true, formulae: [ranges.battingStyle],
        };
      }
    }

    if (ranges.bowlingStyle) {
      const col = colDefs.findIndex(c => c.key === 'bowlingStyle') + 1;
      for (let r = 2; r <= totalRows; r++) {
        worksheet.getCell(r, col).dataValidation = {
          type: 'list', allowBlank: true, formulae: [ranges.bowlingStyle],
        };
      }
    }

    // Freeze header row and set column widths for readability
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // ── Instructions sheet ────────────────────────────────────────────────────
    const instructions = workbook.addWorksheet('Instructions');
    instructions.columns = [
      { header: 'Step',        key: 'step',        width: 10 },
      { header: 'Instruction', key: 'instruction', width: 90 },
    ] as Partial<ExcelJS.Column>[];

    // Style instruction header
    const instrHeader = instructions.getRow(1);
    instrHeader.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    });

    const instrRows: { step: string | number; instruction: string }[] = [
      { step: '',  instruction: `🏆 Tournament: ${tournament.name}` },
      { step: '',  instruction: `🎯 Sport: ${sportLabel}` },
      { step: '',  instruction: '' },
      { step: 1,   instruction: 'Go to the "Players" sheet. The first two rows (shaded) are examples — overwrite or delete them.' },
      { step: 2,   instruction: 'Required columns: Name, Position, Current Club, Add (Yes/No).' },
      { step: 3,   instruction: 'Set "Add (Yes/No)" to "Yes" for each player you want to import. Rows with "No" are skipped.' },
      { step: 4,   instruction: 'Player No is optional — leave blank to auto-assign, or enter e.g. 001, 002, 003.' },
    ];

    let stepNum = 5;

    if (sportPositions.length > 0) {
      instrRows.push({ step: stepNum++, instruction: `Position dropdown shows valid ${sportLabel} positions. You may also type a custom value.` });
      instrRows.push({ step: '',        instruction: `  Valid positions: ${sportPositions.join(' | ')}` });
    }

    if (playerClasses.length > 0) {
      instrRows.push({ step: stepNum++, instruction: `Player Class is REQUIRED for this tournament. Select from the dropdown or type the short code.` });
      const classDetail = tournament.playerClasses?.map((c: any) =>
        `  ${c.name}${c.code ? ` (short code: ${c.code})` : ''}${c.basePrice ? ` — base ₹${c.basePrice.toLocaleString()}` : ''}`
      ).join('\n') || '';
      tournament.playerClasses?.forEach((c: any) => {
        instrRows.push({ step: '', instruction: `  • ${c.name}${c.code ? ` → short code: ${c.code}` : ''}${(c as any).basePrice ? ` (base ₹${(c as any).basePrice.toLocaleString()})` : ''}` });
      });
    }

    if (showAge)          instrRows.push({ step: stepNum++, instruction: "Age: optional number." });
    if (showBattingStyle) instrRows.push({ step: stepNum++, instruction: `Batting Style: ${BATTING_STYLES.join(' | ')}` });
    if (showBowlingStyle) instrRows.push({ step: stepNum++, instruction: `Bowling Style: ${BOWLING_STYLES.join(' | ')}` });
    if (statFields.length > 0) instrRows.push({ step: stepNum++, instruction: `Stat columns: ${statFields.map((sf: any) => sf.label).join(', ')}` });

    instrRows.push({ step: '', instruction: '' });
    instrRows.push({ step: '⚠️', instruction: 'Do NOT rename or delete the hidden "Lookup" sheet — it powers the dropdowns.' });
    instrRows.push({ step: '✅', instruction: 'Save the file as .xlsx and upload it back to ProStream.' });

    instrRows.forEach(r => instructions.addRow(r));

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
