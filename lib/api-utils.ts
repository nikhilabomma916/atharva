import { cookies } from 'next/headers';
import { verifyToken, JWTPayload } from '@/lib/auth';

export async function getAuthUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}
