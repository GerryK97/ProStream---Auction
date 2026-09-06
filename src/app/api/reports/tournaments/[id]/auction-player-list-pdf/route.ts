import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction, canAccessTournament } from '@/lib/permissions';
import { TournamentModel } from '@/models/Tournament';
import { PlayerModel } from '@/models/Player';
import { buildImageUrl } from '@/lib/cloudinaryUtils';

export const runtime = 'nodejs';

/**
 * GET /api/reports/tournaments/[id]/auction-player-list-pdf
 *
 * "Auction Player List" — a pre-auction roster of every player with their basic
 * details (Player No, Name, Category, Position, club, batting/bowling, age) plus
 * the player photo and an ICONIC flag. Laid out as a photo grid, A4 portrait,
 * 25 players per page (5 columns x 5 rows).
 */

type ReportPlayer = {
  _id: string;
  playerNo?: string;
  name: string;
  position?: string;
  currentClub?: string;
  photoURL?: string;
  playerClass?: string;
  age?: number;
  isIconic?: boolean;
  battingStyle?: string;
  bowlingStyle?: string;
};

type PlayerClass = { name: string; color: string };

const PAGE_MARGIN = 32;
const PAGE_SIZE: [number, number] = [595.28, 841.89]; // A4 portrait in points
const CONTENT_WIDTH = PAGE_SIZE[0] - PAGE_MARGIN * 2;
const CONTENT_TOP = PAGE_MARGIN + 54; // below header
const CONTENT_BOTTOM = PAGE_SIZE[1] - PAGE_MARGIN - 16; // above footer

// 5 columns x 5 rows = 25 players per page.
const COLS = 5;
const ROWS = 5;
const GRID_GAP = 8;
const CARD_W = (CONTENT_WIDTH - GRID_GAP * (COLS - 1)) / COLS;
const GRID_H = CONTENT_BOTTOM - CONTENT_TOP;
const CARD_H = (GRID_H - GRID_GAP * (ROWS - 1)) / ROWS;
const PHOTO_H = CARD_H - 34; // leave room for name + detail lines

function sanitizeFileName(input: string): string {
  return input.replace(/[^a-z0-9-_]+/gi, '_');
}

function drawPageHeader(doc: PDFKit.PDFDocument, tournamentName: string, subtitle: string) {
  doc
    .fillColor('#0F172A')
    .font('Helvetica-Bold')
    .fontSize(15)
    .text(tournamentName, PAGE_MARGIN, PAGE_MARGIN, { width: CONTENT_WIDTH, ellipsis: true });
  doc
    .fillColor('#475569')
    .font('Helvetica')
    .fontSize(10)
    .text(subtitle, PAGE_MARGIN, PAGE_MARGIN + 20, { width: CONTENT_WIDTH, ellipsis: true });
  doc.moveTo(PAGE_MARGIN, PAGE_MARGIN + 44).lineTo(PAGE_MARGIN + CONTENT_WIDTH, PAGE_MARGIN + 44).stroke('#CBD5E1');
}

function drawPageFooter(doc: PDFKit.PDFDocument, pageNumber: number, totalPlayers: number) {
  const footerY = PAGE_SIZE[1] - PAGE_MARGIN - 10;
  doc.fillColor('#64748B').font('Helvetica').fontSize(8).text(
    `Auction Player List  ·  ${totalPlayers} players`,
    PAGE_MARGIN,
    footerY,
    { width: CONTENT_WIDTH, align: 'left' }
  );
  doc.fillColor('#64748B').font('Helvetica').fontSize(8).text(
    `Page ${pageNumber}`,
    PAGE_MARGIN,
    footerY,
    { width: CONTENT_WIDTH, align: 'right' }
  );
}

/** Fetch a player photo as a pdfkit-compatible buffer (JPEG). Returns null on any failure. */
async function fetchPhoto(photoURL: string | undefined): Promise<Buffer | null> {
  if (!photoURL) return null;
  // Force a square JPEG at 2x display size for crisp print; pdfkit can't decode webp.
  const url = buildImageUrl(photoURL, { width: 220, height: 220, fit: 'fill', format: 'jpg' });
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') ?? '';
    if (!/image\/(jpe?g|png)/i.test(type)) return null;
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  } catch {
    return null;
  }
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
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

    const players = await PlayerModel.find({ tournamentId }).lean() as unknown as ReportPlayer[];

    // Pre-auction roster order: by player number, then name.
    players.sort((a, b) => {
      const an = a.playerNo || '';
      const bn = b.playerNo || '';
      if (an && bn) return an.localeCompare(bn, undefined, { numeric: true });
      if (an) return -1;
      if (bn) return 1;
      return a.name.localeCompare(b.name);
    });

    const classColorMap = new Map<string, string>(
      ((tournament.playerClasses as PlayerClass[] | undefined) ?? []).map((c) => [c.name, c.color]),
    );

    // Fetch all photos up-front (bounded concurrency via Promise.all on the set).
    const photos = await Promise.all(players.map((p) => fetchPhoto(p.photoURL)));

    const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const perPage = COLS * ROWS; // 25
    const totalPages = Math.max(1, Math.ceil(players.length / perPage));
    let pageNumber = 1;

    const iconicCount = players.filter((p) => p.isIconic).length;
    const subtitleBase = `${players.length} players`
      + (iconicCount ? `  ·  ${iconicCount} iconic` : '')
      + `  ·  25 per page`;

    if (players.length === 0) {
      drawPageHeader(doc, `${tournament.name} (${tournament.year})`, 'Auction Player List');
      doc.fillColor('#64748B').font('Helvetica-Oblique').fontSize(11)
        .text('No players registered for this tournament yet.', PAGE_MARGIN, CONTENT_TOP + 10);
      drawPageFooter(doc, 1, 0);
    }

    for (let i = 0; i < players.length; i += 1) {
      const idxOnPage = i % perPage;
      if (idxOnPage === 0) {
        if (i > 0) {
          drawPageFooter(doc, pageNumber, players.length);
          doc.addPage();
          pageNumber += 1;
        }
        drawPageHeader(
          doc,
          `${tournament.name} (${tournament.year})`,
          totalPages > 1
            ? `Auction Player List  —  ${subtitleBase}  ·  Page ${pageNumber} of ${totalPages}`
            : `Auction Player List  —  ${subtitleBase}`,
        );
      }

      const col = idxOnPage % COLS;
      const rowInPage = Math.floor(idxOnPage / COLS);
      const x = PAGE_MARGIN + col * (CARD_W + GRID_GAP);
      const y = CONTENT_TOP + rowInPage * (CARD_H + GRID_GAP);

      const player = players[i];
      const accent = (player.playerClass && classColorMap.get(player.playerClass)) || '#1E293B';

      // Card border
      doc.roundedRect(x, y, CARD_W, CARD_H, 6).lineWidth(0.8).stroke('#E2E8F0');

      // Photo (or initials placeholder)
      const photoBuf = photos[i];
      const photoX = x + 4;
      const photoY = y + 4;
      const photoW = CARD_W - 8;
      if (photoBuf) {
        try {
          doc.save();
          doc.roundedRect(photoX, photoY, photoW, PHOTO_H, 4).clip();
          doc.image(photoBuf, photoX, photoY, { width: photoW, height: PHOTO_H, align: 'center', valign: 'center' });
          doc.restore();
        } catch {
          doc.restore();
          doc.rect(photoX, photoY, photoW, PHOTO_H).fill('#F1F5F9');
        }
      } else {
        doc.rect(photoX, photoY, photoW, PHOTO_H).fill('#F1F5F9');
        doc.fillColor('#94A3B8').font('Helvetica-Bold').fontSize(20)
          .text(initials(player.name), photoX, photoY + PHOTO_H / 2 - 12, { width: photoW, align: 'center' });
      }

      // Player-number chip (top-left over photo)
      if (player.playerNo) {
        const chipW = 30;
        doc.roundedRect(photoX + 3, photoY + 3, chipW, 14, 3).fill('#0F172A');
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8)
          .text(player.playerNo, photoX + 3, photoY + 6, { width: chipW, align: 'center' });
      }

      // ICONIC ribbon (top-right over photo)
      if (player.isIconic) {
        const ribW = 44;
        doc.roundedRect(photoX + photoW - ribW - 3, photoY + 3, ribW, 14, 3).fill('#B45309');
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7)
          .text('ICONIC', photoX + photoW - ribW - 3, photoY + 6.5, { width: ribW, align: 'center' });
      }

      // Text block below photo
      const textY = photoY + PHOTO_H + 3;
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(8.5)
        .text(player.name, x + 5, textY, { width: CARD_W - 10, align: 'center', ellipsis: true });

      // Category + position line
      const detailBits = [player.playerClass, player.position].filter(Boolean).join(' · ');
      if (detailBits) {
        doc.fillColor(accent).font('Helvetica').fontSize(7)
          .text(detailBits, x + 5, textY + 11, { width: CARD_W - 10, align: 'center', ellipsis: true });
      }

      // Extra details line (club / batting / bowling / age)
      const extraBits = [
        player.currentClub,
        [player.battingStyle, player.bowlingStyle].filter(Boolean).join('/'),
        player.age ? `${player.age}y` : '',
      ].filter(Boolean).join(' · ');
      if (extraBits) {
        doc.fillColor('#64748B').font('Helvetica').fontSize(6.5)
          .text(extraBits, x + 5, textY + 20, { width: CARD_W - 10, align: 'center', ellipsis: true });
      }
    }

    if (players.length > 0) {
      drawPageFooter(doc, pageNumber, players.length);
    }

    const endPromise = new Promise<void>((resolve) => doc.on('end', resolve));
    doc.end();
    await endPromise;

    const pdfBuffer = Buffer.concat(chunks);
    const fileName = sanitizeFileName(`${tournament.name}_${tournament.year}_auction_player_list`) + '.pdf';

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('Generate auction player list PDF error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate auction player list PDF' },
      { status: 500 }
    );
  }
}
