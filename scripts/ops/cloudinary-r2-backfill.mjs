#!/usr/bin/env node
/**
 * Cloudinary -> R2 media backfill for Auction.
 *
 * Commands
 *   --scan     Read-only. Lists every legacy Cloudinary value across Mongo and
 *              reports how many distinct assets need copying. No writes.
 *   --copy     Downloads each distinct legacy asset from Cloudinary and PUTs it
 *              into R2 at a stable, deterministic key. Never touches Mongo.
 *              Resumable: skips any key that already exists in R2.
 *   --verify   Re-downloads each copied R2 object and Cloudinary original and
 *              compares byte length and SHA-256. No writes.
 *   --rewrite  Updates Mongo documents field by field, but only replaces a
 *              value with its R2 URL after independently re-verifying that
 *              exact R2 object is present and byte-identical to Cloudinary at
 *              rewrite time. Never touches values already on R2.
 *
 * This tool intentionally has no bulk delete of Cloudinary or Mongo data. It
 * only adds R2 objects and swaps individual field values to their already-
 * verified replacement.
 */
import { createHash } from 'node:crypto';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  MEDIA_FIELDS,
  cloudinaryOriginalUrl,
  extractCloudinaryPublicId,
  isLegacyCloudinaryValue,
  readFieldValues,
  rewriteArrayField,
} from './cloudinary-r2-backfill-lib.mjs';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

const args = new Set(process.argv.slice(2));
const modes = ['--scan', '--copy', '--verify', '--rewrite'].filter((m) => args.has(m));
const usage = `Usage: node scripts/ops/cloudinary-r2-backfill.mjs [--scan|--copy|--verify|--rewrite]

Run in this order: --scan, --copy, --verify, --rewrite.
Each mode is safe to re-run. --copy and --rewrite never delete anything.`;

if (modes.length !== 1 || args.has('--help') || args.has('-h')) {
  console.error(usage);
  process.exit(modes.length === 0 && (args.has('--help') || args.has('-h')) ? 0 : 2);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const R2_PUBLIC_BASE_URL = requireEnv('R2_PUBLIC_BASE_URL').replace(/\/+$/, '');
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const BACKFILL_PREFIX = 'cloudinary-backfill';

function r2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: requireEnv('R2_ENDPOINT'),
    forcePathStyle: true,
    credentials: {
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
    },
  });
}

function backfillKey(publicId) {
  // Deterministic key: identical Cloudinary source always maps to the same R2
  // object, so re-running --copy or --rewrite is naturally idempotent.
  return `${BACKFILL_PREFIX}/${publicId}`;
}

async function sha256(response) {
  const hash = createHash('sha256');
  const reader = response.body.getReader();
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    hash.update(value);
    bytes += value.byteLength;
  }
  return { digest: hash.digest('hex'), bytes };
}

function fieldsByCollection() {
  const byCollection = new Map();
  for (const descriptor of MEDIA_FIELDS) {
    if (!byCollection.has(descriptor.collection)) byCollection.set(descriptor.collection, []);
    byCollection.get(descriptor.collection).push(descriptor);
  }
  return byCollection;
}

async function withRetries(label, attempt, attempts = 3) {
  for (let index = 1; index <= attempts; index += 1) {
    try {
      return await attempt();
    } catch (error) {
      if (index === attempts) throw error;
      console.warn(`${label} failed (attempt ${index}/${attempts}): ${error.message}. Retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * index));
    }
  }
}

/**
 * Free/shared-tier Atlas connections occasionally drop ("Topology is
 * closed"). Once that happens the existing MongoClient cannot recover by
 * simply retrying a query on it, so this reconnects a brand-new client and
 * re-runs the whole operation from scratch.
 */
async function withMongoReconnect(mongoUri, run, attempts = 3) {
  for (let index = 1; index <= attempts; index += 1) {
    const mongo = new MongoClient(mongoUri, { readPreference: 'secondaryPreferred' });
    try {
      await mongo.connect();
      await mongo.db().command({ ping: 1 });
      return await run(mongo.db());
    } catch (error) {
      if (index === attempts) throw error;
      console.warn(`MongoDB connection lost (attempt ${index}/${attempts}): ${error.message}. Reconnecting...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * index));
    } finally {
      await mongo.close().catch(() => {});
    }
  }
}

async function scanLegacyValues(db) {
  const distinctByPublicId = new Map();
  const perField = [];
  const fieldTotals = new Map(MEDIA_FIELDS.map((descriptor) => [descriptor, 0]));
  // One query per collection (not per field) keeps every collection's cursor
  // short-lived, which is far less sensitive to a transient Atlas network
  // blip than holding many long-running cursors open in sequence.
  for (const [collectionName, descriptors] of fieldsByCollection()) {
    const projection = Object.fromEntries(descriptors.map((descriptor) => [descriptor.path, 1]));
    await withRetries(`Scanning ${collectionName}`, async () => {
      const docs = await db.collection(collectionName).find({}, { projection }).toArray();
      for (const doc of docs) {
        for (const descriptor of descriptors) {
          for (const value of readFieldValues(doc, descriptor)) {
            if (!isLegacyCloudinaryValue(value, R2_PUBLIC_BASE_URL)) continue;
            const publicId = extractCloudinaryPublicId(value);
            if (!publicId) {
              console.warn(`Skipping unparseable value in ${descriptor.collection}.${descriptor.path} for doc ${doc._id}: ${value}`);
              continue;
            }
            fieldTotals.set(descriptor, fieldTotals.get(descriptor) + 1);
            if (!distinctByPublicId.has(publicId)) distinctByPublicId.set(publicId, new Set());
            distinctByPublicId.get(publicId).add(`${descriptor.collection}.${descriptor.kind === 'array' ? `${descriptor.path}.${descriptor.field}` : descriptor.path}`);
          }
        }
      }
    });
  }
  for (const descriptor of MEDIA_FIELDS) {
    perField.push({
      field: `${descriptor.collection}.${descriptor.kind === 'array' ? `${descriptor.path}.${descriptor.field}` : descriptor.path}`,
      legacyValues: fieldTotals.get(descriptor),
    });
  }
  return { distinctByPublicId, perField };
}

async function runScan(db) {
  const { distinctByPublicId, perField } = await scanLegacyValues(db);
  console.table(perField);
  console.log(`Distinct Cloudinary assets referenced: ${distinctByPublicId.size}`);
  console.log('Scan complete. No data was read from Cloudinary or written anywhere.');
}

async function runCopy(db) {
  if (!CLOUD_NAME) throw new Error('CLOUDINARY_CLOUD_NAME is required for --copy');
  const { distinctByPublicId } = await scanLegacyValues(db);
  const client = r2Client();
  const bucket = requireEnv('R2_BUCKET');
  let copied = 0;
  let skippedExisting = 0;
  let failed = 0;
  for (const publicId of distinctByPublicId.keys()) {
    const key = backfillKey(publicId);
    const publicUrl = `${R2_PUBLIC_BASE_URL}/${key}`;
    const existing = await fetch(publicUrl, { method: 'HEAD' });
    if (existing.ok) { skippedExisting += 1; continue; }

    const sourceUrl = cloudinaryOriginalUrl(CLOUD_NAME, publicId);
    try {
      const response = await fetch(sourceUrl);
      if (!response.ok) { console.error(`Cloudinary fetch failed (${response.status}) for ${publicId}`); failed += 1; continue; }
      const contentType = response.headers.get('content-type') ?? 'image/jpeg';
      const body = new Uint8Array(await response.arrayBuffer());
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }));
      copied += 1;
      if (copied % 200 === 0) console.log(`Copied ${copied} assets so far...`);
    } catch (error) {
      console.error(`Failed to copy ${publicId}: ${error.message}`);
      failed += 1;
    }
  }
  console.log(`Copy pass complete. Newly copied: ${copied}. Already present in R2: ${skippedExisting}. Failed: ${failed}.`);
  if (failed > 0) process.exitCode = 1;
}

async function runVerify(db) {
  if (!CLOUD_NAME) throw new Error('CLOUDINARY_CLOUD_NAME is required for --verify');
  const { distinctByPublicId } = await scanLegacyValues(db);
  let verified = 0;
  let missing = 0;
  let mismatched = 0;
  for (const publicId of distinctByPublicId.keys()) {
    const key = backfillKey(publicId);
    const r2Url = `${R2_PUBLIC_BASE_URL}/${key}`;
    const sourceUrl = cloudinaryOriginalUrl(CLOUD_NAME, publicId);
    const [r2Response, cloudinaryResponse] = await Promise.all([fetch(r2Url), fetch(sourceUrl)]);
    if (!r2Response.ok) { console.error(`Missing in R2: ${publicId}`); missing += 1; continue; }
    if (!cloudinaryResponse.ok) { console.error(`Cloudinary source unavailable for comparison: ${publicId}`); missing += 1; continue; }
    const [r2Hash, cloudinaryHash] = await Promise.all([sha256(r2Response), sha256(cloudinaryResponse)]);
    if (r2Hash.digest !== cloudinaryHash.digest || r2Hash.bytes !== cloudinaryHash.bytes) {
      console.error(`Byte mismatch for ${publicId}: r2=${r2Hash.bytes}B/${r2Hash.digest.slice(0, 8)} cloudinary=${cloudinaryHash.bytes}B/${cloudinaryHash.digest.slice(0, 8)}`);
      mismatched += 1;
      continue;
    }
    verified += 1;
    if (verified % 200 === 0) console.log(`Verified ${verified} assets so far...`);
  }
  console.log(`Verification complete. Verified identical: ${verified}. Missing: ${missing}. Mismatched: ${mismatched}.`);
  if (missing > 0 || mismatched > 0) process.exitCode = 1;
}

/** Re-verifies one R2 object is present and byte-identical before it can ever be written to Mongo. */
async function verifyOneForRewrite(publicId) {
  const key = backfillKey(publicId);
  const r2Url = `${R2_PUBLIC_BASE_URL}/${key}`;
  const sourceUrl = cloudinaryOriginalUrl(CLOUD_NAME, publicId);
  const [r2Response, cloudinaryResponse] = await Promise.all([fetch(r2Url), fetch(sourceUrl)]);
  if (!r2Response.ok || !cloudinaryResponse.ok) return null;
  const [r2Hash, cloudinaryHash] = await Promise.all([sha256(r2Response), sha256(cloudinaryResponse)]);
  if (r2Hash.digest !== cloudinaryHash.digest || r2Hash.bytes !== cloudinaryHash.bytes) return null;
  return r2Url;
}

async function runRewrite(db) {
  if (!CLOUD_NAME) throw new Error('CLOUDINARY_CLOUD_NAME is required for --rewrite');
  const { distinctByPublicId } = await scanLegacyValues(db);
  console.log(`Re-verifying ${distinctByPublicId.size} distinct assets before any Mongo write...`);
  const valueMap = new Map();
  let verifyFailures = 0;
  for (const publicId of distinctByPublicId.keys()) {
    const r2Url = await verifyOneForRewrite(publicId);
    if (!r2Url) { console.error(`Refusing to rewrite references to unverified asset: ${publicId}`); verifyFailures += 1; continue; }
    valueMap.set(publicId, r2Url);
  }
  if (verifyFailures > 0) {
    throw new Error(`${verifyFailures} asset(s) failed re-verification. Run --copy and --verify again before --rewrite.`);
  }

  // A stored value may be a bare public_id or a full Cloudinary URL for the
  // same asset. Map every legacy value form to its verified R2 URL.
  const valueByLegacyValue = new Map();
  for (const [collectionName, descriptors] of fieldsByCollection()) {
    const projection = Object.fromEntries(descriptors.map((descriptor) => [descriptor.path, 1]));
    await withRetries(`Mapping legacy values in ${collectionName}`, async () => {
      const docs = await db.collection(collectionName).find({}, { projection }).toArray();
      for (const doc of docs) {
        for (const descriptor of descriptors) {
          for (const value of readFieldValues(doc, descriptor)) {
            if (!isLegacyCloudinaryValue(value, R2_PUBLIC_BASE_URL)) continue;
            const publicId = extractCloudinaryPublicId(value);
            if (publicId && valueMap.has(publicId)) valueByLegacyValue.set(value, valueMap.get(publicId));
          }
        }
      }
    });
  }

  let documentsUpdated = 0;
  let fieldsUpdated = 0;
  for (const [collectionName, descriptors] of fieldsByCollection()) {
    const collection = db.collection(collectionName);
    const docs = await withRetries(`Loading ${collectionName} for rewrite`, () => collection.find({}).toArray());
    for (const doc of docs) {
      for (const descriptor of descriptors) {
        if (descriptor.kind === 'scalar') {
          const current = doc[descriptor.path];
          const replacement = typeof current === 'string' ? valueByLegacyValue.get(current) : undefined;
          if (replacement === undefined) continue;
          await withRetries(`Updating ${collectionName} ${doc._id}.${descriptor.path}`, () => collection.updateOne({ _id: doc._id }, { $set: { [descriptor.path]: replacement } }));
          documentsUpdated += 1;
          fieldsUpdated += 1;
          continue;
        }
        const rewritten = rewriteArrayField(doc[descriptor.path], descriptor, valueByLegacyValue);
        if (rewritten === null) continue;
        await withRetries(`Updating ${collectionName} ${doc._id}.${descriptor.path}`, () => collection.updateOne({ _id: doc._id }, { $set: { [descriptor.path]: rewritten } }));
        documentsUpdated += 1;
        fieldsUpdated += rewritten.filter((item, index) => item !== doc[descriptor.path][index]).length;
      }
    }
  }
  console.log(`Rewrite complete. Documents updated: ${documentsUpdated}. Field values rewritten: ${fieldsUpdated}.`);
  console.log('Original Cloudinary assets were left untouched and remain available for rollback.');
}

async function main() {
  const mode = modes[0];
  const mongoUri = requireEnv('MONGODB_URI');
  // --rewrite's updateOne calls are idempotent (they always set the same
  // deterministically computed value), so reconnecting and restarting the
  // whole mode after a dropped connection cannot double-apply a change.
  return withMongoReconnect(mongoUri, async (db) => {
    if (mode === '--scan') return runScan(db);
    if (mode === '--copy') return runCopy(db);
    if (mode === '--verify') return runVerify(db);
    if (mode === '--rewrite') return runRewrite(db);
  });
}

main().catch((error) => {
  console.error(`Backfill failed safely: ${error.message}`);
  if (process.env.BACKFILL_DEBUG) console.error(error.stack);
  process.exitCode = 1;
});
