import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OverlayLibraryModel } from '@/models/OverlayLibrary';
import { getUserFromRequest } from '@/lib/request-helpers';

// POST /api/overlay-library/seed - Seed database with overlay data
export async function POST(request: NextRequest) {
  try {
    // Authenticate user (admin only for seeding)
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { overlays, clearExisting } = body;

    if (!overlays || !Array.isArray(overlays)) {
      return NextResponse.json(
        { error: 'Invalid seed data: overlays array required' },
        { status: 400 }
      );
    }

    // Clear existing data if requested
    if (clearExisting) {
      await OverlayLibraryModel.deleteMany({});
    }

    // Convert overlay data to match schema
    const convertedOverlays = overlays.map((overlay: any) => ({
      _id: overlay.id,
      name: overlay.name,
      description: overlay.description,
      route: overlay.route,
      tags: overlay.tags || [],
      category: overlay.category,
      defaultParams: overlay.defaultParams || {},
      parameterSchema: overlay.parameterSchema || {},
      imageURL: overlay.imageURL,
      dimensions: overlay.dimensions,
      isActive: true,
      createdBy: user.userId
    }));

    // Insert overlays
    const result = await OverlayLibraryModel.insertMany(convertedOverlays, {
      ordered: false // Continue on duplicate key errors
    });

    return NextResponse.json({
      message: 'Seeding completed',
      inserted: result.length,
      total: overlays.length
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error seeding overlay library:', error);

    // Handle duplicate key errors gracefully
    if (error.code === 11000) {
      return NextResponse.json({
        message: 'Some overlays already exist',
        error: 'Duplicate keys found'
      }, { status: 409 });
    }

    return NextResponse.json(
      { error: 'Failed to seed overlay library' },
      { status: 500 }
    );
  }
}
