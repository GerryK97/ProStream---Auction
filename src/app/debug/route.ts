import { NextResponse } from 'next/server';

/**
 * Simple debug endpoint to check environment variables
 * This is a public endpoint (no auth required)
 * DELETE THIS FILE BEFORE DEPLOYING TO PRODUCTION
 */
export async function GET() {
  const envVars = {
    // Authentication
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || '❌ NOT SET',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ SET (hidden for security)' : '❌ NOT SET',

    // API
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '(empty - using same origin)',
    NODE_ENV: process.env.NODE_ENV,

    // Database
    MONGODB_URI: process.env.MONGODB_URI
      ? `✅ SET (${process.env.MONGODB_URI.substring(0, 60)}...)`
      : '❌ NOT SET',

    // Derived info
    DEPLOYMENT_URL: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'Not on Vercel (localhost)',
  };

  // Check if NEXTAUTH_URL is correct
  const nextAuthUrlStatus = () => {
    const url = process.env.NEXTAUTH_URL;
    if (!url) return '❌ NOT SET - This will cause login to fail!';
    if (url === 'http://localhost:3000') return '⚠️  LOCALHOST - Only for development. Change to your Vercel domain for production!';
    if (!url.startsWith('http')) return '❌ INVALID - Missing http/https';
    if (url.includes('localhost')) return '⚠️  LOCALHOST - Change to Vercel domain for production';
    if (url.includes('vercel.app')) return '✅ LOOKS CORRECT - Production Vercel domain detected';
    return '✅ LOOKS CORRECT';
  };

  const recommendations = [];

  if (!process.env.NEXTAUTH_URL) {
    recommendations.push('❌ CRITICAL: NEXTAUTH_URL not set - Login will fail');
  } else if (process.env.NEXTAUTH_URL === 'http://localhost:3000' && process.env.NODE_ENV === 'production') {
    recommendations.push('❌ CRITICAL: NEXTAUTH_URL is localhost on production - Change to your Vercel domain');
  }

  if (!process.env.NEXTAUTH_SECRET) {
    recommendations.push('❌ CRITICAL: NEXTAUTH_SECRET not set');
  }

  if (!process.env.MONGODB_URI) {
    recommendations.push('❌ CRITICAL: MONGODB_URI not set - Database connection will fail');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All critical environment variables are set');
  }

  return NextResponse.json(
    {
      status: '🔍 Environment Variable Check',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',
      isVercel: !!process.env.VERCEL_URL,

      environmentVariables: envVars,

      validationStatus: {
        NEXTAUTH_URL: nextAuthUrlStatus(),
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ SET' : '❌ NOT SET',
        MONGODB_URI: process.env.MONGODB_URI ? '✅ SET' : '❌ NOT SET',
      },

      recommendations,

      debugInfo: {
        message: 'If you see ❌ (NOT SET) for any variable above, that is the problem',
        nextStep: 'Go to Vercel Settings → Environment Variables and set the missing variables',
        waitTime: '⏱️  Wait 2-3 minutes after changing variables for Vercel to redeploy',
      },

      // Simple table format
      summary: `
════════════════════════════════════════════════════════════
ENVIRONMENT VARIABLE STATUS
════════════════════════════════════════════════════════════
NEXTAUTH_URL: ${envVars.NEXTAUTH_URL}
NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? '✅ SET' : '❌ NOT SET'}
MONGODB_URI: ${process.env.MONGODB_URI ? '✅ SET' : '❌ NOT SET'}
NEXT_PUBLIC_API_URL: ${envVars.NEXT_PUBLIC_API_URL}
NODE_ENV: ${process.env.NODE_ENV}
════════════════════════════════════════════════════════════
      `,
    },
    { status: 200 }
  );
}
