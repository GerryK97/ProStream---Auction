#!/usr/bin/env node
/**
 * Finishes the Cloudinary -> R2 media migration for values created after the
 * main backfill ran (for example uploads made through the Vercel deployment,
 * which still writes to Cloudinary).
 *
 * Unlike scripts/ops/cloudinary-r2-backfill.mjs, this tool needs no R2
 * credentials. It uploads through the deployment's own authenticated
 * `/api/upload` endpoint, which already runs with MEDIA_STORAGE_PROVIDER=r2.
 * That keeps bucket secrets inside the deployment where they belong.
 *
 * Commands
 *   --scan     Read-only. Lists every remaining legacy Cloudinary value.
 *   --migrate  For each distinct legacy asset: download the Cloudinary
 *              original, upload it to R2 via the deployment, re-download the
 *              resulting R2 object, and require a byte-identical SHA-256 match
 *              before rewriting that value in Mongo. Never deletes anything.
 *
 * Both modes are safe to re-run. Values already on R2 are skipped.
 */
import { createHash } from 'node:crypto';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
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
const modes = ['--scan', '--migrate'].filter((m) => args.has(m));
const usage = `Usage: node scripts/ops/cloudinary-r2-finish.mjs [--scan|--migrate]

  --scan     read-only report of remaining legacy Cloudinary values
  --migrate  copy each to R2 via the deployment upload API, verify bytes,
             then rewrite the Mongo value

Environment:
  MONGODB_URI              required
  MEDIA_UPLOAD_BASE_URL    deployment that uploads to R2 (default https://auction.prostream.lk)
  MEDIA_UPLOAD_TOKEN       bearer token for that deployment (required for --migrate)
  R2_PUBLIC_BASE_URL       default https://media.prostream.lk
  CLOUDINARY_CLOUD_NAME    required`;

if (modes.length !== 1 || args.has('--help') || args.has('-h')) {
  console.error(usage);
  process.exit(args.has('--help') || args.has('-h') ? 0 : 2);
}

const MODE = modes[0];
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI is required');

const R2_PUBLIC_BASE_URL = (process.env.R2_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL ?? 'https://media.prostream.lk').replace(/\/+$/, '');
const UPLOAD_BASE_URL = (process.env.MEDIA_UPLOAD_BASE_URL ?? 'https://auction.prostream.lk').replace(/\/+$/, '');
const UPLOAD_TOKEN = process.env.MEDIA_UPLOAD_TOKEN;
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
if (!CLOUD_NAME) throw new Error('CLOUDINARY_CLOUD_NAME is required');

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

/** Folder keeps migrated assets recognisable and mirrors the original layout. */
function uploadFolder(publicId) {
  const parts = publicId.split('/');
  return parts.length > 1 ? parts.slice(0, -1).join('/') : 'prostream-auction';
}

async function fetchBinary(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return {
    body: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get('content-type') ?? 'image/jpeg',
  };
}

/** Collects every legacy value and the documents that reference it. */
async function collectLegacy(db) {
  const byValue = new Map();
  for (const descriptor of MEDIA_FIELDS) {
    const projection = { [descriptor.path]: 1 };
    const docs = await db.collection(descriptor.collection).find({}, { projection }).toArray();
    for (const doc of docs) {
      for (const value of readFieldValues(doc, descriptor)) {
        if (!isLegacyCloudinaryValue(value, R2_PUBLIC_BASE_URL)) continue;
        if (!byValue.has(value)) byValue.set(value, []);
        byValue.get(value).push({ descriptor, id: doc._id });
      }
    }
  }
  return byValue;
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();

  try {
    const byValue = await collectLegacy(db);
    const values = [...byValue.keys()];
    const publicIds = new Set(values.map(extractCloudinaryPublicId).filter(Boolean));

    console.log(`Legacy values: ${values.length}`);
    console.log(`Distinct Cloudinary assets: ${publicIds.size}`);

    const byCollection = {};
    for (const [value, refs] of byValue) {
      for (const ref of refs) {
        const key = `${ref.descriptor.collection}.${ref.descriptor.path}`;
        byCollection[key] = (byCollection[key] ?? 0) + 1;
      }
      void value;
    }
    for (const [key, count] of Object.entries(byCollection).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${key}: ${count}`);
    }

    if (MODE === '--scan' || values.length === 0) return;
    if (!UPLOAD_TOKEN) throw new Error('MEDIA_UPLOAD_TOKEN is required for --migrate');

    // Phase 1: copy each distinct asset to R2 and verify it byte for byte.
    const verifiedUrlByPublicId = new Map();
    let copied = 0;
    for (const publicId of publicIds) {
      const original = await fetchBinary(cloudinaryOriginalUrl(CLOUD_NAME, publicId));
      const originalHash = sha256(original.body);

      const form = new FormData();
      form.append('file', new Blob([original.body], { type: original.contentType }), `${publicId.split('/').pop()}`);
      form.append('folder', uploadFolder(publicId));

      const res = await fetch(`${UPLOAD_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${UPLOAD_TOKEN}` },
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`upload failed for ${publicId}: ${res.status} ${JSON.stringify(data)}`);
      if (data.provider !== 'r2' || typeof data.url !== 'string') {
        throw new Error(`deployment did not return an R2 URL for ${publicId}: ${JSON.stringify(data)}`);
      }

      // Fail closed: only trust a stored object we can re-read identically.
      const stored = await fetchBinary(data.url);
      if (sha256(stored.body) !== originalHash || stored.body.length !== original.body.length) {
        throw new Error(`verification failed for ${publicId}; Mongo was not modified`);
      }

      verifiedUrlByPublicId.set(publicId, data.url);
      copied += 1;
      if (copied % 10 === 0) console.log(`  copied+verified ${copied}/${publicIds.size}`);
    }
    console.log(`Copied and verified ${copied} assets.`);

    // Phase 2: rewrite Mongo values, now that every replacement is verified.
    const replacementByValue = new Map();
    for (const value of values) {
      const publicId = extractCloudinaryPublicId(value);
      const url = publicId ? verifiedUrlByPublicId.get(publicId) : undefined;
      if (url) replacementByValue.set(value, url);
    }

    let updated = 0;
    for (const descriptor of MEDIA_FIELDS) {
      const collection = db.collection(descriptor.collection);
      const docs = await collection.find({}, { projection: { [descriptor.path]: 1 } }).toArray();
      for (const doc of docs) {
        if (descriptor.kind === 'scalar') {
          const current = doc[descriptor.path];
          const replacement = typeof current === 'string' ? replacementByValue.get(current) : undefined;
          if (!replacement) continue;
          await collection.updateOne({ _id: doc._id }, { $set: { [descriptor.path]: replacement } });
          updated += 1;
        } else {
          const next = rewriteArrayField(doc[descriptor.path], descriptor, replacementByValue);
          if (!next) continue;
          await collection.updateOne({ _id: doc._id }, { $set: { [descriptor.path]: next } });
          updated += 1;
        }
      }
    }

    console.log(`Rewritten documents: ${updated}`);
    const remaining = await collectLegacy(db);
    console.log(`Remaining legacy values: ${remaining.size}`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
