import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-utils';
import { store } from '@/lib/data/store';

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { grievanceId, rating, comment } = await req.json();

  const feedback = {
    id: `fdb-${Date.now()}`,
    grievanceId,
    citizenId: user.userId,
    rating,
    comment,
    createdAt: new Date().toISOString()
  };

  store.feedback.push(feedback);
  return Response.json(feedback, { status: 201 });
}