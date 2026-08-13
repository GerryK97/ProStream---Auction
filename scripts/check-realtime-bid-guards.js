const fs = require('fs');

const checks = [
  'src/app/api/auction/bid/route.ts',
  'src/app/api/auction/bid/correct/route.ts',
];

const scopedMutationRoutes = [
  'src/app/api/auction/bid/route.ts',
  'src/app/api/auction/bid/correct/route.ts',
  'src/app/api/auction/edit-player-result/route.ts',
  'src/app/api/auction/mark-unsold/route.ts',
  'src/app/api/auction/re-auction/route.ts',
  'src/app/api/auction/recalculate-balances/route.ts',
  'src/app/api/auction/reset-all/route.ts',
  'src/app/api/auction/reset/route.ts',
  'src/app/api/auction/select-class/route.ts',
  'src/app/api/auction/select-player/route.ts',
  'src/app/api/auction/sell/route.ts',
  'src/app/api/auction/undo/route.ts',
];

const explicitlyAuthorizedLifecycleRoutes = [
  'src/app/api/auction/start/route.ts',
  'src/app/api/auction/restart/route.ts',
  'src/app/api/auction/stop/route.ts',
];

let failed = false;
for (const file of checks) {
  const src = fs.readFileSync(file, 'utf8');
  if (/await\s+triggerBidPlaced\s*\(/.test(src)) {
    console.error(`❌ ${file}: bid Pusher trigger must be fire-and-forget to keep operator bidding latency low.`);
    failed = true;
  }
  if (!/triggerBidPlaced\s*\([\s\S]*?\)\.catch\s*\(/.test(src)) {
    console.error(`❌ ${file}: bid Pusher trigger must handle errors with .catch(...) when fired without awaiting.`);
    failed = true;
  }
  if (!src.includes('after(() => pusherDelivery)')) {
    console.error(`❌ ${file}: in-flight Pusher delivery must be registered with Next after() for serverless reliability.`);
    failed = true;
  }
  if (/\$push\s*:\s*{\s*history\b/.test(src) || /\$push\s*:\s*{[\s\S]*?history\s*:/.test(src)) {
    console.error(`❌ ${file}: active bid routes must not persist bid history; keep only currentBid + winningTeamId in DB.`);
    failed = true;
  }
  if (!/\$inc\s*:\s*{\s*revision\s*:\s*1\s*}/.test(src)) {
    console.error(`❌ ${file}: every accepted bid/correction must increment the monotonic auction revision.`);
    failed = true;
  }
  if (!src.includes('return NextResponse.json(eventAuctionState)')) {
    console.error(`❌ ${file}: HTTP and Pusher must expose the same revision payload so first arrival preserves bid history.`);
    failed = true;
  }
}

const selectPlayerSource = fs.readFileSync('src/app/api/auction/select-player/route.ts', 'utf8');
if (!/\$inc\s*:\s*{\s*revision\s*:\s*1\s*}/.test(selectPlayerSource)) {
  console.error('❌ select-player: every player selection must increment the monotonic auction revision.');
  failed = true;
}

const correctionSource = fs.readFileSync('src/app/api/auction/bid/correct/route.ts', 'utf8');
if (!correctionSource.includes('currentBid: previousBid')) {
  console.error('❌ bid/correct: correction writes must compare-and-swap the previously read currentBid.');
  failed = true;
}

const bidSource = fs.readFileSync('src/app/api/auction/bid/route.ts', 'utf8');
if (!/Promise\.all\s*\(\s*\[\s*connectToDatabase\(\),\s*authenticateAuctionManager\(request\)/s.test(bidSource)) {
  console.error('❌ bid: Mongo connection and authentication must start in parallel on the cold path.');
  failed = true;
}

const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
if (!Array.isArray(vercelConfig.regions) || vercelConfig.regions.length !== 1 || vercelConfig.regions[0] !== 'bom1') {
  console.error('❌ vercel.json: auction functions must run in bom1 beside MongoDB and Pusher ap2.');
  failed = true;
}

const sellSource = fs.readFileSync('src/app/api/auction/sell/route.ts', 'utf8');
if (!sellSource.includes('currentBalance: { $gte: minimumRequiredBalance }')) {
  console.error('❌ sell: atomic team update must preserve reserve budget for remaining squad slots.');
  failed = true;
}

const editResultSource = fs.readFileSync('src/app/api/auction/edit-player-result/route.ts', 'utf8');
if (!editResultSource.includes('withTransaction(')) {
  console.error('❌ edit-player-result: player and affected-team writes must share a transaction.');
  failed = true;
}

for (const file of scopedMutationRoutes) {
  const src = fs.readFileSync(file, 'utf8');
  const usesCombinedGuard = src.includes('authorizeAuctionMutation(request, tournamentId)');
  const usesLowLatencyBidGuard =
    src.includes('authenticateAuctionManager(request)') &&
    src.includes('authorizeAuctionTournament(');
  if (!usesCombinedGuard && !usesLowLatencyBidGuard) {
    console.error(`❌ ${file}: auction mutations must use tournament-scoped authorization.`);
    failed = true;
  }
}

for (const file of explicitlyAuthorizedLifecycleRoutes) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('getUserFromRequest(request)') || !src.includes('canAccessTournament(')) {
    console.error(`❌ ${file}: lifecycle mutations must authenticate and check tournament access.`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('✅ Auction guards passed: realtime bid latency rules and tournament-scoped mutation authorization are enforced.');
