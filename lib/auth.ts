import { SignJWT, jwtVerify } from 'jose';
import { compareSync } from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || 'civicresolve-dev-secret-key-change-in-production');

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: 'citizen' | 'officer' | 'admin';
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export function verifyPassword(password: string, hash: string): boolean {
  return compareSync(password, hash);
}

export async function getSession(cookieValue?: string): Promise<JWTPayload | null> {
  if (!cookieValue) return null;
  return verifyToken(cookieValue);
}
