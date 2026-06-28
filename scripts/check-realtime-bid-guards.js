const fs = require('fs');

const checks = [
  'src/app/api/auction/bid/route.ts',
  'src/app/api/auction/bid/correct/route.ts',
];

let failed = false;
for (const file of checks) {
  const src = fs.readFileSync(file, 'utf8');
  if (!/await\s+triggerBidPlaced\s*\(/.test(src)) {
    console.error(`❌ ${file}: bid Pusher trigger must be awaited for real-time overlay delivery.`);
    failed = true;
  }
  if (/triggerBidPlaced\s*\([\s\S]*?\)\.catch\s*\(/.test(src)) {
    console.error(`❌ ${file}: bid Pusher trigger must not be fire-and-forget.`);
    failed = true;
  }
  if (/\$push\s*:\s*{\s*history\b/.test(src) || /\$push\s*:\s*{[\s\S]*?history\s*:/.test(src)) {
    console.error(`❌ ${file}: active bid routes must not persist bid history; keep only currentBid + winningTeamId in DB.`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('✅ Realtime bid guard passed: bid Pusher triggers are awaited and DB history is not persisted.');
