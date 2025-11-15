import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Create sample data with proper structure
    const templateData = [
      {
        'Name': 'Virat Kohli',
        'Position': 'Batsman',
        'Current Club': 'Royal Challengers Bangalore',
        'Photo URL': 'https://example.com/virat.jpg',
        'Matches Played': 223,
        'Total Score': 7263,
        'Total Wickets': 4,
        'Suggested Class': 'Premium'
      },
      {
        'Name': 'Jasprit Bumrah',
        'Position': 'Bowler',
        'Current Club': 'Mumbai Indians',
        'Photo URL': '',
        'Matches Played': 120,
        'Total Score': 56,
        'Total Wickets': 145,
        'Suggested Class': 'Elite'
      },
      {
        'Name': 'Ravindra Jadeja',
        'Position': 'All-rounder',
        'Current Club': 'Chennai Super Kings',
        'Photo URL': '',
        'Matches Played': 210,
        'Total Score': 2500,
        'Total Wickets': 132,
        'Suggested Class': 'Premium'
      }
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    const columnWidths = [
      { wch: 20 }, // Name
      { wch: 15 }, // Position
      { wch: 30 }, // Current Club
      { wch: 40 }, // Photo URL
      { wch: 15 }, // Matches Played
      { wch: 15 }, // Total Score
      { wch: 15 }, // Total Wickets
      { wch: 15 }  // Suggested Class
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Master Players');

    // Add instructions sheet
    const instructions = [
      { 'Field': 'Name', 'Required': 'YES', 'Description': 'Full name of the player' },
      { 'Field': 'Position', 'Required': 'YES', 'Description': 'Player position: Batsman | Bowler | All-rounder | Wicket-keeper' },
      { 'Field': 'Current Club', 'Required': 'YES', 'Description': 'Current IPL or cricket team' },
      { 'Field': 'Photo URL', 'Required': 'NO', 'Description': 'URL to player photo (optional)' },
      { 'Field': 'Matches Played', 'Required': 'NO', 'Description': 'Total career matches played (optional)' },
      { 'Field': 'Total Score', 'Required': 'NO', 'Description': 'Total career runs scored (optional)' },
      { 'Field': 'Total Wickets', 'Required': 'NO', 'Description': 'Total career wickets taken (optional)' },
      { 'Field': 'Suggested Class', 'Required': 'NO', 'Description': 'Player class suggestion (e.g., Elite, Premium, Standard)' }
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    instructionsSheet['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return file as download
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="master_players_template.xlsx"'
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
