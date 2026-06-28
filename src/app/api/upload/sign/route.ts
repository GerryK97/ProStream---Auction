import { NextRequest, NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'
import { getUserFromRequest } from '@/lib/request-helpers'

export const maxDuration = 10

// Folders the mobile app is allowed to upload into.
const ALLOWED_FOLDERS = new Set([
  'prostream-auction',
  'prostream-auction/players',
  'prostream-auction/teams',
  'prostream-auction/tournaments',
  'prostream-auction/users',
  'prostream-auction/card-templates',
])

/**
 * GET /api/upload/sign?folder=prostream-auction/tournaments
 *
 * Returns a short-lived Cloudinary signed upload signature so the mobile
 * client can POST the image file directly to Cloudinary's REST API,
 * bypassing Vercel's 4.5 MB route-handler body limit entirely.
 *
 * Upload flow:
 *   1. Expo calls GET /api/upload/sign?folder=prostream-auction/tournaments
 *   2. Server returns { signature, timestamp, folder, apiKey, cloudName }
 *   3. Expo POSTs directly to https://api.cloudinary.com/v1_1/{cloudName}/image/upload
 */
export async function GET(request: NextRequest) {
  // 1. Auth check
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Validate Cloudinary env vars before doing anything — missing vars cause
  //    silent upload failures on the client side.
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    console.error('[upload/sign] Missing Cloudinary env vars:', {
      CLOUDINARY_CLOUD_NAME: !!cloudName,
      CLOUDINARY_API_KEY: !!apiKey,
      CLOUDINARY_API_SECRET: !!apiSecret,
    })
    return NextResponse.json(
      { error: 'Upload service is not configured. Please contact support.' },
      { status: 500 },
    )
  }

  // 3. Validate and sanitise the requested folder.
  const requested = (new URL(request.url).searchParams.get('folder') ?? '').trim()
  const folder = ALLOWED_FOLDERS.has(requested) ? requested : 'prostream-auction'

  // 4. Generate a short-lived Cloudinary signature.
  //    Only sign { folder, timestamp } — no extra params.
  //    The XHR in Expo sends exactly these same params (plus file/api_key which
  //    Cloudinary always excludes from signature validation).
  const timestamp = Math.round(Date.now() / 1000)
  const paramsToSign = { folder, timestamp }

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret)

  return NextResponse.json({
    signature,
    timestamp,
    folder,
    apiKey,
    cloudName,
  })
}
