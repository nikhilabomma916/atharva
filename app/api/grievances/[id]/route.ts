import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-utils';
import {
  findGrievanceById,
  updateGrievance,
  addStatusHistory,
  addAuditLog,
  getAnalysisByGrievance,
  getRecommendationByGrievance,
  getStatusHistory,
  getInternalNotes,
  getCitizenUpdates,
  getFeedbackByGrievance,
  getDuplicatesForGrievance
} from '@/lib/data/store';

export async function GET(req: NextRequest, ctx: any) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const params = await ctx.params;
  const id = params.id;

  const grievance = findGrievanceById(id);
  if (!grievance) return Response.json({ error: 'Not Found' }, { status: 404 });

  const result = {
    ...grievance,
    analysis: getAnalysisByGrievance(id),
    recommendation: getRecommendationByGrievance(id),
    statusHistory: getStatusHistory(id),
    notes: getInternalNotes(id),
    updates: getCitizenUpdates(id),
    feedback: getFeedbackByGrievance(id),
    duplicates: getDuplicatesForGrievance(id)
  };

  return Response.json(result);
}

export async function PATCH(req: NextRequest, ctx: any) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const params = await ctx.params;
  const id = params.id;

  const grievance = findGrievanceById(id);
  if (!grievance) return Response.json({ error: 'Not Found' }, { status: 404 });

  const body = await req.json();
  const now = new Date().toISOString();

  const updated = updateGrievance(id, body);

  if (body.status && body.status !== grievance.status) {
    addStatusHistory({
      id: `hist-${Date.now()}`,
      grievanceId: id,
      fromStatus: grievance.status,
      toStatus: body.status,
      changedBy: user.userId,
      changedByRole: user.role as any,
      note: body.reason || 'Status updated',
      timestamp: now
    });
  }

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

  return Response.json(updated);
}