import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { MasterPlayerModel } from '@/models/MasterPlayer';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Fetch all master players
    const masterPlayers = await MasterPlayerModel.find({})
      .select('_id name position currentClub shortCode photoURL careerStats suggestedClass')
      .sort({ name: 1 })
      .lean();

    if (masterPlayers.length === 0) {
      return NextResponse.json(
        { error: 'No master players found to export' },
        { status: 400 }
      );
    }

    // Create template data for Excel
    const templateData = masterPlayers.map(player => {
      return {
        'Player ID': player._id,
        'Name': player.name,
        'Position': player.position,
        'Current Club': player.currentClub,
        'Short Code': player.shortCode || '',
        'Photo URL': player.photoURL || '',
        'Matches Played': player.careerStats?.matchesPlayed || 0,
        'Total Score': player.careerStats?.totalScore || 0,
        'Total Wickets': player.careerStats?.totalWickets || 0,
        'Suggested Class': player.suggestedClass || '',
      };
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    const columnWidths = [
      { wch: 15 }, // Player ID
      { wch: 25 }, // Name
      { wch: 12 }, // Position
      { wch: 25 }, // Current Club
      { wch: 12 }, // Short Code
      { wch: 30 }, // Photo URL
      { wch: 14 }, // Matches Played
      { wch: 12 }, // Total Score
      { wch: 13 }, // Total Wickets
      { wch: 15 }, // Suggested Class
    ];

    worksheet['!cols'] = columnWidths;

    // Add main sheet
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Players');

    // Create summary sheet
    const summaryData = [
      { 'Summary': 'Master Players Export' },
      { 'Summary': '' },
      { 'Summary': 'Total Players', 'Count': masterPlayers.length },
      { 'Summary': 'Export Date', 'Count': new Date().toLocaleString() },
      { 'Summary': 'Positions', 'Count': [...new Set(masterPlayers.map(p => p.position))].length },
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="master_players_export_${Date.now()}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Master players export error:', error);
    return NextResponse.json(
      { error: `Failed to export master players: ${error.message}` },
      { status: 500 }
    );
  }
}
