import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-utils';
import { findGrievanceById, updateGrievance, addNotification, addAuditLog } from '@/lib/data/store';

export async function POST(req: NextRequest, ctx: any) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const params = await ctx.params;
  const id = params.id;
  const body = await req.json();
  const { officerId } = body;

  const grievance = findGrievanceById(id);
  if (!grievance) return Response.json({ error: 'Not found' }, { status: 404 });

  updateGrievance(id, { assignedOfficerId: officerId, status: 'ASSIGNED' });

  const now = new Date().toISOString();
  addNotification({
    id: `notif-${Date.now()}`,
    userId: officerId,
    title: 'New Assignment',
    message: `Grievance ${id} has been assigned to you.`,
    type: 'new_assignment',
    grievanceId: id,
    read: false,
    createdAt: now
  });

  addAuditLog({
    id: `log-${Date.now()}`,
    action: 'UPDATE',
    entityType: 'GRIEVANCE',
    entityId: id,
    actorId: user.userId,
    actorName: user.name,
    actorRole: user.role as any,
    timestamp: now
  });

  return Response.json({ success: true });
}