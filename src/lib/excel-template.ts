import * as XLSX from 'xlsx';

/**
 * Generate Excel template for bulk player upload
 * @returns Blob containing the Excel file
 */
export function generatePlayerTemplate(): Blob {
  // Define headers
  const headers = [
    'Player Name',
    'Position',
    'Current Club',
    'Suggested Class',
    'Matches Played',
    'Total Score',
    'Total Wickets',
    'Photo URL',
  ];

  // Define sample data rows
  const sampleData = [
    [
      'Virat Kohli',
      'Batsman',
      'RCB',
      'Platinum',
      120,
      5000,
      0,
      'https://example.com/virat.jpg',
    ],
    [
      'Jasprit Bumrah',
      'Bowler',
      'Mumbai Indians',
      'Platinum',
      85,
      0,
      150,
      'https://example.com/bumrah.jpg',
    ],
    [
      'Hardik Pandya',
      'All-rounder',
      'Gujarat Titans',
      'Gold',
      95,
      2500,
      75,
      '',
    ],
  ];

  // Create worksheet data
  const wsData = [headers, ...sampleData];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // Player Name
    { wch: 18 }, // Position
    { wch: 20 }, // Current Club
    { wch: 16 }, // Suggested Class
    { wch: 16 }, // Matches Played
    { wch: 14 }, // Total Score
    { wch: 15 }, // Total Wickets
    { wch: 30 }, // Photo URL
  ];

  // Style header row (bold, background color)
  const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddress]) continue;

    ws[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: '4F81BD' } },
      alignment: { horizontal: 'center' },
    };
  }

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Players');

  // Add instructions sheet
  const instructionsData = [
    ['Bulk Player Upload Instructions'],
    [''],
    ['Required Fields:'],
    ['• Player Name - Full name of the player (2-100 characters)'],
    ['• Position - Playing position (e.g., Batsman, Bowler, All-rounder, Wicket-keeper)'],
    ['• Current Club - Name of the current club/team (min 2 characters)'],
    [''],
    ['Optional Fields:'],
    ['• Suggested Class - Suggested player class (e.g., Platinum, Gold, Silver, Bronze)'],
    ['• Matches Played - Number of matches played (non-negative integer)'],
    ['• Total Score - Total runs scored (non-negative integer)'],
    ['• Total Wickets - Total wickets taken (non-negative integer)'],
    ['• Photo URL - URL of the player photo (must start with http:// or https://)'],
    [''],
    ['Notes:'],
    ['• Delete the sample data rows before uploading'],
    ['• Each player will be assigned a unique ID automatically (PS001, PS002, etc.)'],
    ['• Photo URL is optional - a placeholder will be used if not provided'],
    ['• Make sure there are no duplicate player names with the same club'],
    [''],
    ['Common Positions:'],
    ['• Batsman'],
    ['• Bowler'],
    ['• All-rounder'],
    ['• Wicket-keeper'],
    ['• Batting All-rounder'],
    ['• Bowling All-rounder'],
    [''],
    ['Suggested Classes:'],
    ['• Platinum - Top tier players'],
    ['• Gold - High-quality players'],
    ['• Silver - Good players'],
    ['• Bronze - Developing players'],
    ['• Emerging - New/young players'],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [{ wch: 80 }];

  // Style title
  if (wsInstructions['A1']) {
    wsInstructions['A1'].s = {
      font: { bold: true, sz: 16 },
      alignment: { horizontal: 'left' },
    };
  }

  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // Write workbook to buffer
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

  // Create blob
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Download the Excel template
 * @param filename - Optional custom filename
 */
export function downloadPlayerTemplate(filename?: string): void {
  const blob = generatePlayerTemplate();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `player-upload-template-${Date.now()}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
