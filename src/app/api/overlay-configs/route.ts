import { NextRequest, NextResponse } from 'next/server';
import { overlayConfigDB } from '@/lib/db-mongodb';
import { getUserFromRequest } from '@/lib/request-helpers';
import { canPerformAction } from '@/lib/permissions';

// GET /api/overlay-configs - Get all overlay configurations
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to read overlay configs
    if (!canPerformAction(user.role, 'read', 'overlayConfig')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tournamentId = searchParams.get('tournamentId');
    const category = searchParams.get('category');
    const overlayType = searchParams.get('type');
    const templatesOnly = searchParams.get('templates') === 'true';

    let configs;

    if (templatesOnly) {
      configs = await overlayConfigDB.getTemplates();
    } else if (category) {
      configs = await overlayConfigDB.getByCategory(category);
    } else if (overlayType) {
      configs = await overlayConfigDB.getByType(overlayType);
    } else {
      configs = await overlayConfigDB.getAllForUser(
        user.userId,
        user.role,
        tournamentId
      );
    }

    // Apply pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    const paginatedConfigs = configs.slice(skip, skip + limit);
    const total = configs.length;

    return NextResponse.json({
      data: paginatedConfigs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching overlay configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overlay configs' },
      { status: 500 }
    );
  }
}

// POST /api/overlay-configs - Create new overlay configuration
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create overlay configs
    if (!canPerformAction(user.role, 'create', 'overlayConfig')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.overlayType || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, overlayType, category' },
        { status: 400 }
      );
    }

    // Set defaults for required fields if not provided
    const configData = {
      name: body.name,
      description: body.description || '',
      overlayType: body.overlayType,
      category: body.category,
      imageURL: body.imageURL,
      isActive: body.isActive !== undefined ? body.isActive : true,
      isTemplate: body.isTemplate || false,
      position: body.position || { x: 0, y: 0, unit: 'px' },
      size: body.size || {
        width: 1920,
        height: 1080,
        unit: 'px',
        aspectRatioLocked: false,
        preset: 'custom',
      },
      zIndex: body.zIndex || 1000,
      opacity: body.opacity !== undefined ? body.opacity : 100,
      parameters: body.parameters || {},
      animations: body.animations,
      displayRules: body.displayRules || [],
      tournamentId: body.tournamentId || null,
      sceneIds: body.sceneIds || [],
      isLocked: body.isLocked || false,
      allowedRoles: body.allowedRoles || [],
      createdBy: user.userId,
    };

    const newConfig = await overlayConfigDB.create(configData, user.userId);

    return NextResponse.json(newConfig, { status: 201 });
  } catch (error: any) {
    console.error('Error creating overlay config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create overlay config' },
      { status: 400 }
    );
  }
}
