import { NextRequest, NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'
import { getUserFromRequest } from '@/lib/request-helpers'

export const maxDuration = 10

/**
 * GET /api/upload/sign?folder=prostream-auction/teams
 *
 * Returns a short-lived Cloudinary signed upload signature so the mobile
 * client can POST the image file directly to Cloudinary's REST API,
 * bypassing Vercel's 4.5 MB route-handler body limit entirely.
 */
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const folder = searchParams.get('folder') || 'prostream-auction'

  const timestamp = Math.round(Date.now() / 1000)
  const paramsToSign = { folder, timestamp }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!,
  )

  return NextResponse.json({
    signature,
    timestamp,
    folder,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
  })
}
