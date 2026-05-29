import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

// POST /api/upload - Upload image to Cloudinary
export async function POST(request: NextRequest) {
  try {
    // Verify Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      // 🛡️ SECURITY: Log the detailed missing config server-side but do not expose
      // internal service requirements (like Cloudinary) to the client.
      console.error('Missing Cloudinary credentials:', {
        cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
        api_key: !!process.env.CLOUDINARY_API_KEY,
        api_secret: !!process.env.CLOUDINARY_API_SECRET
      });
      return NextResponse.json(
        { error: 'Image upload service configuration error.' },
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
    console.error('Upload error:', error);

    // 🛡️ SECURITY: Log detailed errors (like 3rd party API objects) server-side
    // and fail securely by providing only a generic error to the client.
    console.error('Full error details:', {
      message: error?.message || error?.error?.message || 'Failed to upload image',
      details: error?.http_code ? `HTTP ${error.http_code}` : undefined,
      cloudinaryError: error?.error || undefined
    });

    return NextResponse.json(
      { error: 'An error occurred during image upload.' },
      { status: 500 }
    );
  }
}
