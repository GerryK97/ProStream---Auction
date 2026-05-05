import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction, canAccessTournament } from '@/lib/permissions';
import { TournamentModel } from '@/models/Tournament';
import { TeamModel } from '@/models/Team';
import { PlayerModel } from '@/models/Player';

export const runtime = 'nodejs';

type ReportPlayer = {
  _id: string;
  playerNo?: string;
  name: string;
  isSold?: boolean;
  isUnsold?: boolean;
  finalPrice?: number;
  winningTeamId?: string;
};

type ReportTeam = {
  _id: string;
  name: string;
  shortCode?: string;
  initialBudget?: number;
  currentBalance?: number;
};

const PAGE_MARGIN = 40;
const PAGE_SIZE: [number, number] = [595.28, 841.89]; // A4 portrait in points
const CONTENT_WIDTH = PAGE_SIZE[0] - PAGE_MARGIN * 2;
const ROW_HEIGHT = 22;

function formatCurrency(amount: number): string {
  return `LKR ${amount.toLocaleString('en-US')}`;
}

function sanitizeFileName(input: string): string {
  return input.replace(/[^a-z0-9-_]+/gi, '_');
}

function getPlayerStatus(player: ReportPlayer): 'Sold' | 'Unsold' | 'Available' {
  if (player.isSold) return 'Sold';
  if (player.isUnsold) return 'Unsold';
  return 'Available';
}

function drawPageHeader(doc: PDFKit.PDFDocument, tournamentName: string, sectionName: string) {
  doc
    .fillColor('#0F172A')
    .font('Helvetica-Bold')
    .fontSize(15)
    .text(tournamentName, PAGE_MARGIN, PAGE_MARGIN, { width: CONTENT_WIDTH, ellipsis: true });
  doc
    .fillColor('#475569')
    .font('Helvetica')
    .fontSize(10)
    .text(sectionName, PAGE_MARGIN, PAGE_MARGIN + 20, { width: CONTENT_WIDTH, ellipsis: true });
  doc.moveTo(PAGE_MARGIN, PAGE_MARGIN + 40).lineTo(PAGE_MARGIN + CONTENT_WIDTH, PAGE_MARGIN + 40).stroke('#CBD5E1');
}

function drawTableHeader(
  doc: PDFKit.PDFDocument,
  y: number,
  cols: Array<{ key: string; label: string; width: number; align?: 'left' | 'right' | 'center' }>
) {
  let x = PAGE_MARGIN;
  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, ROW_HEIGHT).fill('#1E293B');
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
  for (const col of cols) {
    doc.text(col.label, x + 6, y + 6, { width: col.width - 12, align: col.align || 'left' });
    x += col.width;
  }
}

function drawTableRow(
  doc: PDFKit.PDFDocument,
  y: number,
  rowIndex: number,
  values: Array<{ text: string; width: number; align?: 'left' | 'right' | 'center' }>
) {
  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, ROW_HEIGHT).fill(rowIndex % 2 === 0 ? '#FFFFFF' : '#F8FAFC');
  doc.fillColor('#0F172A').font('Helvetica').fontSize(9);
  let x = PAGE_MARGIN;
  for (const value of values) {
    doc.text(value.text, x + 6, y + 6, { width: value.width - 12, align: value.align || 'left', ellipsis: true });
    x += value.width;
  }
}

function drawPageFooter(doc: PDFKit.PDFDocument, pageNumber: number) {
  const footerY = PAGE_SIZE[1] - PAGE_MARGIN - 12;
  doc.fillColor('#64748B').font('Helvetica').fontSize(8).text(
    `Page ${pageNumber}`,
    PAGE_MARGIN,
    footerY,
    { width: CONTENT_WIDTH, align: 'right' }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canPerformAction(user.role, 'read', 'tournament')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: tournamentId } = await params;
    await connectToDatabase();

    const tournament = await TournamentModel.findById(tournamentId).lean() as any;
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    if (!canAccessTournament(user.userId, user.role, tournament, user.assignedTournaments)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const teams = await TeamModel.find({ tournamentId }).lean() as unknown as ReportTeam[];
    const players = await PlayerModel.find({ tournamentId }).lean() as unknown as ReportPlayer[];

    const soldPlayers = players.filter(player => player.isSold);
    const teamWiseSold = teams.map(team => ({
      team,
      players: soldPlayers
        .filter(player => player.winningTeamId === team._id)
        .sort((a, b) => (a.playerNo || '').localeCompare(b.playerNo || '')),
    }));

    const combinedTailPlayers = players
      .filter(player => !player.isSold)
      .sort((a, b) => {
        const statusOrder = { Unsold: 0, Available: 1 };
        const sa = statusOrder[getPlayerStatus(a) as 'Unsold' | 'Available'];
        const sb = statusOrder[getPlayerStatus(b) as 'Unsold' | 'Available'];
        if (sa !== sb) return sa - sb;
        return (a.playerNo || '').localeCompare(b.playerNo || '');
      });

    const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    let pageNumber = 1;
    let isFirstPage = true;

    const teamCols = [
      { key: 'playerNo', label: 'Player No', width: 80 },
      { key: 'name', label: 'Player Name', width: 220 },
      { key: 'status', label: 'Status', width: 90, align: 'center' as const },
      { key: 'price', label: 'Final Price', width: 125, align: 'right' as const },
    ];

    for (const section of teamWiseSold) {
      if (!isFirstPage) {
        drawPageFooter(doc, pageNumber);
        doc.addPage();
        pageNumber += 1;
      }
      isFirstPage = false;

      drawPageHeader(
        doc,
        `${tournament.name} (${tournament.year})`,
        `Team: ${section.team.name}${section.team.shortCode ? ` (${section.team.shortCode})` : ''}`
      );

      const teamSpend = section.players.reduce((sum, player) => sum + (player.finalPrice || 0), 0);
      const budgetLine =
        section.team.initialBudget !== undefined && section.team.currentBalance !== undefined
          ? ` | Budget: ${formatCurrency(section.team.initialBudget)} | Balance: ${formatCurrency(section.team.currentBalance)}`
          : '';
      doc.fillColor('#334155').font('Helvetica').fontSize(10).text(
        `Sold Players: ${section.players.length} | Team Spend: ${formatCurrency(teamSpend)}${budgetLine}`,
        PAGE_MARGIN,
        PAGE_MARGIN + 48
      );

      let y = PAGE_MARGIN + 74;
      drawTableHeader(doc, y, teamCols);
      y += ROW_HEIGHT;

      if (section.players.length === 0) {
        doc.fillColor('#64748B').font('Helvetica-Oblique').fontSize(10).text(
          'No sold players for this team.',
          PAGE_MARGIN,
          y + 8
        );
      } else {
        for (let i = 0; i < section.players.length; i += 1) {
          const player = section.players[i];
          if (y + ROW_HEIGHT > PAGE_SIZE[1] - PAGE_MARGIN - 20) {
            drawPageFooter(doc, pageNumber);
            doc.addPage();
            pageNumber += 1;
            drawPageHeader(
              doc,
              `${tournament.name} (${tournament.year})`,
              `Team: ${section.team.name} (continued)`
            );
            y = PAGE_MARGIN + 74;
            drawTableHeader(doc, y, teamCols);
            y += ROW_HEIGHT;
          }
          drawTableRow(doc, y, i, [
            { text: player.playerNo || '-', width: teamCols[0].width },
            { text: player.name, width: teamCols[1].width },
            { text: 'Sold', width: teamCols[2].width, align: 'center' },
            { text: player.finalPrice ? formatCurrency(player.finalPrice) : '-', width: teamCols[3].width, align: 'right' },
          ]);
          y += ROW_HEIGHT;
        }
      }
    }

    // Final combined Unsold + Available section
    if (!isFirstPage) {
      drawPageFooter(doc, pageNumber);
      doc.addPage();
      pageNumber += 1;
    }
    drawPageHeader(
      doc,
      `${tournament.name} (${tournament.year})`,
      'Combined Unsold and Available Players'
    );

    const tailCols = [
      { key: 'playerNo', label: 'Player No', width: 80 },
      { key: 'name', label: 'Player Name', width: 240 },
      { key: 'status', label: 'Status', width: 90, align: 'center' as const },
      { key: 'price', label: 'Final Price', width: 105, align: 'right' as const },
    ];
    let y = PAGE_MARGIN + 74;
    drawTableHeader(doc, y, tailCols);
    y += ROW_HEIGHT;

    if (combinedTailPlayers.length === 0) {
      doc.fillColor('#64748B').font('Helvetica-Oblique').fontSize(10).text(
        'No unsold or available players.',
        PAGE_MARGIN,
        y + 8
      );
    } else {
      for (let i = 0; i < combinedTailPlayers.length; i += 1) {
        const player = combinedTailPlayers[i];
        if (y + ROW_HEIGHT > PAGE_SIZE[1] - PAGE_MARGIN - 20) {
          drawPageFooter(doc, pageNumber);
          doc.addPage();
          pageNumber += 1;
          drawPageHeader(
            doc,
            `${tournament.name} (${tournament.year})`,
            'Combined Unsold and Available Players (continued)'
          );
          y = PAGE_MARGIN + 74;
          drawTableHeader(doc, y, tailCols);
          y += ROW_HEIGHT;
        }
        drawTableRow(doc, y, i, [
          { text: player.playerNo || '-', width: tailCols[0].width },
          { text: player.name, width: tailCols[1].width },
          { text: getPlayerStatus(player), width: tailCols[2].width, align: 'center' },
          { text: player.finalPrice ? formatCurrency(player.finalPrice) : '-', width: tailCols[3].width, align: 'right' },
        ]);
        y += ROW_HEIGHT;
      }
    }

    drawPageFooter(doc, pageNumber);

    const endPromise = new Promise<void>((resolve) => doc.on('end', resolve));
    doc.end();
    await endPromise;

    const pdfBuffer = Buffer.concat(chunks);
    const fileName = sanitizeFileName(`${tournament.name}_${tournament.year}_teamwise_auction_report`) + '.pdf';

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('Generate team-wise auction PDF error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate team-wise auction report PDF' },
      { status: 500 }
    );
  }
}
