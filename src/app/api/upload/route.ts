import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

// POST /api/upload - Upload image to Cloudinary
export async function POST(request: NextRequest) {
  try {
    // Verify Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      // 🛡️ Sentinel Security Fix: Do not expose which specific environment variables are missing
      console.error('Upload service configuration error: Missing required credentials');
      return NextResponse.json(
        // 🛡️ Sentinel Security Fix: Provide a generic error message to avoid information disclosure
        { error: 'Upload service unavailable. Please contact administrator.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'prostream-auction';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary using upload_stream
    // No transformations at upload time - we'll apply them dynamically when fetching
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          // Store original resolution, transform on-the-fly when displaying
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error: any) {
    // 🛡️ Sentinel Security Fix: Log detailed error internally but don't expose stack traces or Cloudinary details to the client
    console.error('Upload error:', error?.message || error, error?.error || '');

    return NextResponse.json(
      // 🛡️ Sentinel Security Fix: Provide a generic error message to the client
      { error: 'Failed to upload image. Please try again later.' },
      { status: 500 }
    );
  }
}
