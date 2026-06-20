import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OverlayLibraryModel } from '@/models/OverlayLibrary';
import { getUserFromRequest } from '@/lib/request-helpers';

// GET /api/overlay-library/[id] - Get single overlay library item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const { id } = await params;
    const overlay = await OverlayLibraryModel.findById(id);

    if (!overlay) {
      return NextResponse.json(
        { error: 'Overlay not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(overlay);
  } catch (error) {
    console.error('Error fetching overlay:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overlay' },
      { status: 500 }
    );
  }
}

// PUT /api/overlay-library/[id] - Update overlay library item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await params;
    const body = await request.json();

    // Remove _id from update if present
    delete body._id;

    const updatedOverlay = await OverlayLibraryModel.findByIdAndUpdate(
      id,
      body,
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedOverlay) {
      return NextResponse.json(
        { error: 'Overlay not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedOverlay);
  } catch (error) {
    console.error('Error updating overlay:', error);
    return NextResponse.json(
      { error: 'Failed to update overlay' },
      { status: 500 }
    );
  }
}

// DELETE /api/overlay-library/[id] - Delete overlay library item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await params;
    const deletedOverlay = await OverlayLibraryModel.findByIdAndDelete(id);

    if (!deletedOverlay) {
      return NextResponse.json(
        { error: 'Overlay not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Overlay deleted successfully' });
  } catch (error) {
    console.error('Error deleting overlay:', error);
    return NextResponse.json(
      { error: 'Failed to delete overlay' },
      { status: 500 }
    );
  }
}
