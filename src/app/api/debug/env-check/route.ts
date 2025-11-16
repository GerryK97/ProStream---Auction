import { NextResponse } from 'next/server';

/**
 * Debug endpoint to check environment variables
 * Only works in development (disabled in production)
 * DELETE THIS FILE BEFORE DEPLOYING TO PRODUCTION
 */
export async function GET() {
  // Disable in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  const envVars = {
    // Authentication
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || '❌ NOT SET',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ SET' : '❌ NOT SET',

    // API
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '(empty - using same origin)',
    NODE_ENV: process.env.NODE_ENV,

    // Database
    MONGODB_URI: process.env.MONGODB_URI
      ? `✅ SET (${process.env.MONGODB_URI.substring(0, 50)}...)`
      : '❌ NOT SET',

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '❌ NOT SET',

    // Derived info
    DEPLOYMENT_URL: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'Not on Vercel (localhost)',
  };

  const checks = {
    NEXTAUTH_URL_CORRECT: () => {
      const url = process.env.NEXTAUTH_URL;
      if (!url) return '❌ NOT SET';
      if (url === 'http://localhost:3000') return '⚠️  LOCALHOST (only for development)';
      if (!url.startsWith('http')) return '❌ INVALID (missing http/https)';
      if (!url.includes('vercel.app') && !url.includes('localhost')) {
        return '⚠️  Custom domain (verify it\'s correct)';
      }
      return '✅ LOOKS CORRECT';
    },

    MONGODB_CONNECTED: () => {
      return process.env.MONGODB_URI ? '✅ URI PROVIDED' : '❌ MISSING';
    },

    AUTH_SECRET_SET: () => {
      return process.env.NEXTAUTH_SECRET ? '✅ SECRET SET' : '❌ MISSING';
    },
  };

  return NextResponse.json(
    {
      status: 'Environment Check',
      timestamp: new Date().toISOString(),
      environmentVariables: envVars,
      validationChecks: {
        NEXTAUTH_URL_correct: checks.NEXTAUTH_URL_CORRECT(),
        MongoDB_connected: checks.MONGODB_CONNECTED(),
        Auth_secret_set: checks.AUTH_SECRET_SET(),
      },
      recommendations: generateRecommendations(envVars),
      debugInfo: {
        isDevelopment: process.env.NODE_ENV === 'development',
        isProduction: process.env.NODE_ENV === 'production',
        isVercel: !!process.env.VERCEL_URL,
      },
    },
    { status: 200 }
  );
}

function generateRecommendations(envVars: any): string[] {
  const recommendations = [];

  if (envVars.NEXTAUTH_URL === '❌ NOT SET') {
    recommendations.push('❌ NEXTAUTH_URL not set - this will cause login to fail');
  }

  if (envVars.NEXTAUTH_URL === 'http://localhost:3000' && process.env.NODE_ENV === 'production') {
    recommendations.push('⚠️  NEXTAUTH_URL is set to localhost on PRODUCTION - change to your Vercel domain');
  }

  if (envVars.NEXTAUTH_SECRET === '❌ NOT SET') {
    recommendations.push('❌ NEXTAUTH_SECRET not set - generate with: openssl rand -base64 32');
  }

  if (envVars.MONGODB_URI.includes('❌')) {
    recommendations.push('❌ MONGODB_URI not set - login will fail');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All critical variables appear to be set correctly');
  }

  return recommendations;
}
