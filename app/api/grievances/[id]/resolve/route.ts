import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-utils';
import { findGrievanceById, updateGrievance, addNotification, addAuditLog, store } from '@/lib/data/store';

export async function POST(req: NextRequest, ctx: any) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const params = await ctx.params;
  const id = params.id;
  const { resolution } = await req.json();

  const grievance = findGrievanceById(id);
  if (!grievance) return Response.json({ error: 'Not found' }, { status: 404 });

  const now = new Date().toISOString();
  
  updateGrievance(id, { status: 'RESOLVED', resolvedAt: now });

  store.citizenUpdates.push({
    id: `upd-${Date.now()}`,
    grievanceId: id,
    message: resolution,
    
    isPublic: true,
    createdAt: now
  });

  addNotification({
    id: `notif-${Date.now()}`,
    userId: grievance.citizenId,
    title: 'Grievance Resolved',
    message: `Your grievance ${id} has been resolved.`,
    type: 'complaint_resolved',
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