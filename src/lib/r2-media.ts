import { randomUUID } from 'node:crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const R2_ALLOWED_FOLDERS = new Set([
  'prostream-auction',
  'prostream-auction/players',
  'prostream-auction/teams',
  'prostream-auction/tournaments',
  'prostream-auction/users',
  'prostream-auction/card-templates',
]);

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export const ALLOWED_IMAGE_TYPES = new Set(Object.keys(EXTENSIONS));
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function isR2MediaEnabled(): boolean {
  return process.env.MEDIA_STORAGE_PROVIDER === 'r2';
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required when MEDIA_STORAGE_PROVIDER=r2`);
  return value;
}

function publicBaseUrl(): string {
  return required('R2_PUBLIC_BASE_URL').replace(/\/+$/, '');
}

function publicUrl(key: string): string {
  return `${publicBaseUrl()}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

function r2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: required('R2_ENDPOINT'),
    forcePathStyle: true,
    credentials: {
      accessKeyId: required('R2_ACCESS_KEY_ID'),
      secretAccessKey: required('R2_SECRET_ACCESS_KEY'),
    },
  });
}

export function assertR2ImageUpload(folder: string, contentType: string, bytes?: number): void {
  if (!R2_ALLOWED_FOLDERS.has(folder)) throw new Error('Unsupported media folder');
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) throw new Error('Only JPEG, PNG, WebP, and GIF images are supported');
  if (bytes !== undefined && bytes > MAX_IMAGE_BYTES) throw new Error('Image exceeds the 10 MB upload limit');
}

export function createR2ObjectKey(folder: string, contentType: string): string {
  assertR2ImageUpload(folder, contentType);
  return `${folder}/${randomUUID()}.${EXTENSIONS[contentType]}`;
}

const cacheControl = 'public, max-age=31536000, immutable';

export async function uploadR2Image({
  folder,
  contentType,
  body,
}: {
  folder: string;
  contentType: string;
  body: Uint8Array;
}): Promise<{ key: string; publicUrl: string }> {
  assertR2ImageUpload(folder, contentType, body.byteLength);
  const key = createR2ObjectKey(folder, contentType);
  await r2Client().send(new PutObjectCommand({
    Bucket: required('R2_BUCKET'),
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: cacheControl,
  }));
  return { key, publicUrl: publicUrl(key) };
}

export async function createR2UploadUrl({
  folder,
  contentType,
}: {
  folder: string;
  contentType: string;
}): Promise<{ key: string; publicUrl: string; uploadUrl: string; expiresInSeconds: number; headers: Record<string, string> }> {
  assertR2ImageUpload(folder, contentType);
  const key = createR2ObjectKey(folder, contentType);
  const expiresInSeconds = 300;
  const uploadUrl = await getSignedUrl(r2Client(), new PutObjectCommand({
    Bucket: required('R2_BUCKET'),
    Key: key,
    ContentType: contentType,
    CacheControl: cacheControl,
  }), { expiresIn: expiresInSeconds });
  return {
    key,
    publicUrl: publicUrl(key),
    uploadUrl,
    expiresInSeconds,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    },
  };
}
