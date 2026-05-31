import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/db-mongodb';

// GET /api/seed - Initialize database with seed data
export async function GET() {
  try {
    await seedDatabase();
    return NextResponse.json({
      message: 'Database seeded successfully'
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}
