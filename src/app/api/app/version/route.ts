import { NextResponse } from 'next/server';
import { pgDb } from '@/lib/pg/db';
import { appConfig } from '@/lib/pg/users-schema';
import { inArray } from 'drizzle-orm';

/**
 * GET /api/app/version
 *
 * Public (no auth) — the app calls this on launch, possibly before login, to
 * decide whether to show the "Update Available" popup. Returns the advertised
 * latest version and update metadata from app_config.
 */
export async function GET() {
  try {
    const rows = await pgDb
      .select()
      .from(appConfig)
      .where(inArray(appConfig.key, [
        'latest_version',
        'min_supported_version',
        'update_url',
        'update_message',
        'force_update',
      ]));

    const map = new Map(rows.map((r) => [r.key, r.value]));

    return NextResponse.json({
      latestVersion: map.get('latest_version') ?? null,
      minSupportedVersion: map.get('min_supported_version') ?? null,
      updateUrl: map.get('update_url') ?? 'https://play.google.com/store/apps/details?id=com.prostream.auction',
      message: map.get('update_message') ?? null,
      forceUpdate: (map.get('force_update') ?? 'false') === 'true',
    });
  } catch (err) {
    console.error('[app/version]', err);
    // Fail open — never block the app because the version check errored.
    return NextResponse.json({
      latestVersion: null,
      minSupportedVersion: null,
      updateUrl: 'https://play.google.com/store/apps/details?id=com.prostream.auction',
      message: null,
      forceUpdate: false,
    });
  }
}
