import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUser } from '@/models/User';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRY = '7d'; // 7 days

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare password with hash
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 * Minimum 8 characters: 1 uppercase, 1 lowercase, 1 number
 * Special character is optional for easier testing
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  // Special character is optional for easier testing and user experience

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate JWT token
 */
export function generateToken(user: IUser): string {
  const payload = {
    userId: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from request Authorization header
 */
export function getTokenFromRequest(
  request: Request
): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Extract token from cookies (for middleware)
 */
export function getTokenFromCookies(request: NextRequest): string | null {
  return request.cookies.get('auth_token')?.value || null;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate username format
 */
export function validateUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
  return usernameRegex.test(username);
}

/**
 * Generate user ID with prefix
 */
export function generateUserId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `u-${timestamp}-${random}`;
}
