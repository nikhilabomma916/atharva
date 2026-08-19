import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-utils';
import { store } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const notifications = store.notifications.filter(n => n.userId === user.userId);
  return Response.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, all } = await req.json();
  
  store.notifications.forEach(n => {
    if (n.userId === user.userId && (all || n.id === id)) {
      n.read = true;
    }
  });

  return Response.json({ success: true });
}