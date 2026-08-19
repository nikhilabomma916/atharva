import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return Response.json({ user: { id: user.userId, email: user.email, name: user.name, role: user.role } });
}