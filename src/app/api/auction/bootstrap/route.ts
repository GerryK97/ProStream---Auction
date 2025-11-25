import { NextResponse } from 'next/server';

// GET /api/auction/bootstrap - Lightweight bootstrap/ping endpoint
export async function GET() {
  return NextResponse.json({ ok: true });
}

