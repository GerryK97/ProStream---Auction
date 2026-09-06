import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { getUserFromRequest } from '@/lib/request-helpers';
import { createR2UploadUrl, isR2MediaEnabled, R2_ALLOWED_FOLDERS } from '@/lib/r2-media';

export const maxDuration = 10;

/**
 * GET /api/upload/sign?folder=prostream-auction/tournaments&contentType=image/jpeg
 *
 * Cloudinary mode returns its legacy signed form fields. R2 mode returns a
 * short-lived signed PUT URL and the public media URL. The explicit provider
 * field lets the Expo client support both during the rollback-safe transition.
 */
export async function GET(request: NextRequest) {
  if (!await getUserFromRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const requested = (new URL(request.url).searchParams.get('folder') ?? '').trim();
  const folder = R2_ALLOWED_FOLDERS.has(requested) ? requested : 'prostream-auction';

  try {
    if (isR2MediaEnabled()) {
      const contentType = (new URL(request.url).searchParams.get('contentType') ?? 'image/jpeg').trim().toLowerCase();
      const signed = await createR2UploadUrl({ folder, contentType });
      return NextResponse.json({
        provider: 'r2',
        key: signed.key,
        publicUrl: signed.publicUrl,
        uploadUrl: signed.uploadUrl,
        headers: signed.headers,
        contentType,
        expiresInSeconds: signed.expiresInSeconds,
      });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Upload service is not configured. Please contact support.' }, { status: 500 });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request({ folder, timestamp }, apiSecret);
    return NextResponse.json({
      provider: 'cloudinary',
      signature,
      timestamp,
      folder,
      apiKey,
      cloudName,
    });
  } catch (error: any) {
    console.error('[upload/sign] Failed to create media upload credentials:', error);
    return NextResponse.json({ error: error?.message ?? 'Could not create upload credentials.' }, { status: 500 });
  }
}
