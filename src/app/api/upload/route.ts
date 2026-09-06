import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { getUserFromRequest } from '@/lib/request-helpers';
import { isR2MediaEnabled, uploadR2Image } from '@/lib/r2-media';

export const maxDuration = 30;

// POST /api/upload - Authenticated browser upload. R2 is enabled only by the
// explicit MEDIA_STORAGE_PROVIDER=r2 feature flag, so Cloudinary remains a
// rollback path until every deployment has the scoped R2 credentials.
export async function POST(request: NextRequest) {
  try {
    if (!await getUserFromRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file');
    const folder = (formData.get('folder') as string) || 'prostream-auction';

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (isR2MediaEnabled()) {
      const result = await uploadR2Image({
        folder,
        contentType: file.type,
        body: new Uint8Array(await file.arrayBuffer()),
      });
      return NextResponse.json({
        success: true,
        provider: 'r2',
        url: result.publicUrl,
        // R2 values are full URLs. This deliberately distinguishes them from
        // legacy Cloudinary bare public IDs already stored in Mongo/Postgres.
        publicId: result.publicUrl,
        key: result.key,
      });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: 'Media storage is not configured.' }, { status: 500 });
    }

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => error ? reject(error) : resolve(result),
      );
      file.arrayBuffer().then((bytes) => uploadStream.end(Buffer.from(bytes))).catch(reject);
    });

    return NextResponse.json({
      success: true,
      provider: 'cloudinary',
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to upload image' }, { status: 500 });
  }
}
