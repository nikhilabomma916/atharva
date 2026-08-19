import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-utils';
import { getInternalNotes, store, addAuditLog } from '@/lib/data/store';

export async function GET(req: NextRequest, ctx: any) {
  const user = await getAuthUser();
  if (!user || user.role === 'citizen') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const params = await ctx.params;
  return Response.json(getInternalNotes(params.id));
}

export async function POST(req: NextRequest, ctx: any) {
  const user = await getAuthUser();
  if (!user || user.role === 'citizen') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const params = await ctx.params;
  const { content } = await req.json();
  const now = new Date().toISOString();

  const note = {
    id: `note-${Date.now()}`,
    grievanceId: params.id,
    authorId: user.userId,
    authorName: user.name,
    authorRole: user.role as any,
    content,
    createdAt: now
  };
  store.internalNotes.push(note);

  addAuditLog({
    id: `log-${Date.now()}`,
    action: 'CREATE',
    entityType: 'INTERNAL_NOTE',
    entityId: note.id,
    actorId: user.userId,
    actorName: user.name,
    actorRole: user.role as any,
    timestamp: now
  });

  return Response.json(note, { status: 201 });
}