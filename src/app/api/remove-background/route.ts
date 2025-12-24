import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://bg-remover-job3.onrender.com/remove_background';

export async function POST(request: NextRequest) {
  console.log('🎨 Background removal API called');

  try {
    const formData = await request.formData();
    const image = formData.get('image');

    if (!image) {
      console.error('❌ No image file provided');
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    console.log('📤 Forwarding request to external API:', API_URL);

    // Forward the request to the external API with a longer timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout

    const externalFormData = new FormData();
    externalFormData.append('image', image);

    const response = await fetch(API_URL, {
      method: 'POST',
      body: externalFormData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('📥 External API response status:', response.status);

    if (!response.ok) {
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        console.error('❌ External API error (JSON):', errorData);
        return NextResponse.json(
          { error: errorData.error || `External API returned ${response.status}: The service may be warming up. Please wait 60 seconds and try again.` },
          { status: response.status }
        );
      }

      const errorText = await response.text();
      console.error('❌ External API error:', response.status, errorText);

      return NextResponse.json(
        { error: `The background removal service is currently unavailable (${response.status}). It may be warming up. Please wait 60 seconds and try again.` },
        { status: response.status }
      );
    }

    // Return the processed image
    const blob = await response.blob();
    console.log('✅ Successfully processed image, size:', blob.size, 'bytes');

    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="transparent_image.png"',
      },
    });
  } catch (error: any) {
    console.error('❌ Background removal error:', error.message);

    if (error.name === 'AbortError') {
      return NextResponse.json(
        {
          error: 'Request timed out after 2 minutes. The service may be warming up. Please try again.'
        },
        { status: 504 }
      );
    }

    if (error.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: 'Cannot connect to background removal service. The service may be down.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to process image' },
      { status: 500 }
    );
  }
}
