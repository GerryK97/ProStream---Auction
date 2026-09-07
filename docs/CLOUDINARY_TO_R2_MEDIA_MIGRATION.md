# Cloudinary → Cloudflare R2 Media Migration

## Status: Complete (2026-09-06)

Auction's image storage and delivery moved from Cloudinary to Cloudflare R2 +
Cloudflare Images transformations. Cloudinary is no longer used for new
uploads, and every historical reference has been migrated.

## Why

Cloudinary's free-tier bandwidth/transformation limits were being hit during
active auctions. R2 has no egress fees, and Cloudflare Images transformations
give the same on-the-fly resize/crop/format behavior at a small fraction of
the cost (roughly $4–7/month at current auction volume, vs. Cloudinary's paid
tiers starting much higher).

## What changed

- **Storage:** `prostream-media` R2 bucket, publicly served at
  `https://media.prostream.lk` via an R2 custom domain.
- **Delivery:** Cloudflare Images URL transformations
  (`/cdn-cgi/image/width=…,height=…,fit=…,format=auto,onerror=redirect/…`),
  configured with `media.prostream.lk` as an explicit allowed source origin.
- **New uploads:** `MEDIA_STORAGE_PROVIDER=r2` in production. Web uploads go
  through `/api/upload`; Expo uploads a presigned R2 PUT URL obtained from
  `/api/upload/sign` (`src/lib/r2-media.ts`).
- **URL compatibility:** `src/lib/cloudinaryUtils.ts` and
  `src/lib/imageOptimization.ts` transparently handle three value shapes —
  legacy bare Cloudinary public IDs, legacy full Cloudinary URLs, and new full
  R2 public URLs — so old and new records render correctly side by side.
  Mirrored in the Expo app at `lib/cloudinaryUrl.ts` and
  `lib/auctionMediaUpload.ts`.

## Historical backfill (2026-09-06)

`scripts/ops/cloudinary-r2-backfill.mjs` migrated every pre-existing
Cloudinary-referenced image across `players`, `teams`, and `tournaments`
(photos, logos, official photos, wheel-center images, player-card templates).

Fail-closed, four-phase, resumable design:

1. `--scan` — read-only. Lists every legacy value and distinct asset count.
2. `--copy` — downloads each distinct Cloudinary asset once and PUTs it to R2
   under `cloudinary-backfill/<public_id>`. Skips assets already present.
   Never touches Mongo.
3. `--verify` — read-only. Re-downloads each R2 object and its Cloudinary
   original and compares SHA-256 + byte length.
4. `--rewrite` — for every legacy value, independently re-verifies its R2
   copy is present and byte-identical *at rewrite time*, then updates only
   that Mongo field to the verified R2 URL. Values already on R2 are left
   alone. Cloudinary originals are never deleted.

Result: **5,640 distinct assets** copied and verified byte-identical
(0 missing, 0 mismatched). **5,651 field values** rewritten across
`players.photoURL`, `players.secondaryImageURL`, `teams.logoURL`,
`teams.officials[].photoURL`, `tournaments.logoURL`,
`tournaments.wheelCenterImageURL`, and
`tournaments.playerCardTemplates[].pngUrl`. Re-running `--rewrite` afterward
confirms 0 remaining legacy values (idempotent, verified by re-run).

Cloudinary account still holds the original assets as a rollback path and can
be cancelled after a confidence window.

## Post-backfill stragglers (2026-09-07)

The Vercel deployment still ran `MEDIA_STORAGE_PROVIDER=cloudinary`, so uploads
made through it after the backfill wrote new Cloudinary references. A census on
2026-09-07 found **43** such values (41 player photos in
`BERUWALA PREMIER LEAGUE -2026`, plus one tournament logo and one wheel-center
image).

`scripts/ops/cloudinary-r2-finish.mjs` (`npm run media:finish:scan` /
`npm run media:finish:migrate`) closes this gap. It needs **no R2 credentials**:
it uploads through the R2-enabled deployment's authenticated `/api/upload`
endpoint, so bucket secrets stay inside the deployment. Per asset it downloads
the Cloudinary original, uploads it, re-downloads the stored R2 object, and
requires a byte-identical SHA-256 match before rewriting that Mongo value.

Result: 43/43 copied and verified, 43 documents rewritten, re-scan reports 0
remaining. Whole-database census afterwards: **5,689 R2 values, 0 Cloudinary**
(209 unrelated external/placeholder URLs are untouched by design). All 41
BERUWALA photo URLs return HTTP 200 from `media.prostream.lk` on both
deployments.

Note: both deployments read the same MongoDB, so this fix is visible from
Vercel and Dokploy alike. Until Vercel is set to `MEDIA_STORAGE_PROVIDER=r2`
(or retired), **new** uploads made through Vercel will again land on
Cloudinary; re-running `media:finish:migrate` is safe and idempotent.

## Rollback

Setting `MEDIA_STORAGE_PROVIDER=cloudinary` reverts new uploads to Cloudinary
immediately. Rewritten Mongo values point at R2, not Cloudinary, so a full
rollback of already-migrated references would require re-running a variant of
`--copy`/`--rewrite` in reverse, or restoring from a pre-rewrite Mongo backup.
No such rollback has been necessary; verification passed cleanly before any
write.
