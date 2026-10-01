import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-utils';
import {
  getGrievanceAnalysis,
  getLatestGrievanceAIDecision,
  getLatestGrievanceRecommendation,
  getGrievanceCitizenUpdates,
  getGrievanceFeedback,
  getGrievanceForUser,
  getGrievanceInternalNotes,
  getGrievanceParticipants,
  getGrievanceStatusHistory,
  isValidGrievanceId,
  updateGrievance,
} from '@/lib/data/grievances';
import { isDatabaseConfigured } from '@/lib/db';
import { grievanceUpdateSchema } from '@/lib/validation/grievance';
import { buildGrievanceAnalysisSummary } from '@/lib/ai/priority-engine';

type RouteContext = { params: Promise<{ id: string }> };

function databaseErrorResponse(error: unknown): Response {
  console.error('Grievance detail database operation failed:', error);
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
  if (code === '42P01') {
    return Response.json({ error: 'The grievance database migration has not been applied.' }, { status: 503 });
  }
  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN' || code === 'ECONNREFUSED' ||
      code === 'ETIMEDOUT' || code === 'ECONNRESET') {
    return Response.json({ error: 'The database is currently unavailable.' }, { status: 503 });
  }
  return Response.json({ error: 'The grievance request could not be completed.' }, { status: 500 });
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isDatabaseConfigured()) {
    return Response.json({ error: 'The grievance database is not configured.' }, { status: 503 });
  }

  const { id } = await ctx.params;
  if (!isValidGrievanceId(id)) return Response.json({ error: 'Not Found' }, { status: 404 });

  try {
    const grievance = await getGrievanceForUser(id, user);
    if (!grievance) return Response.json({ error: 'Not Found' }, { status: 404 });

    const [
      storedAnalysis,
      statusHistory,
      internalNotes,
      citizenUpdates,
      feedback,
      participants,
      recommendation,
      latestDecision,
    ] = await Promise.all([
      getGrievanceAnalysis(id),
      getGrievanceStatusHistory(id),
      user.role === 'citizen' ? Promise.resolve([]) : getGrievanceInternalNotes(id),
      getGrievanceCitizenUpdates(id, user.role === 'citizen'),
      getGrievanceFeedback(id),
      user.role === 'citizen' ? Promise.resolve(undefined) : getGrievanceParticipants(id),
      user.role === 'citizen' ? Promise.resolve(undefined) : getLatestGrievanceRecommendation(id),
      user.role === 'citizen' ? Promise.resolve(undefined) : getLatestGrievanceAIDecision(id),
    ]);
    const analysis = storedAnalysis
      ? {
          ...storedAnalysis,
          summary: buildGrievanceAnalysisSummary(
            storedAnalysis,
            grievance.priorityLevel && grievance.priorityScore !== undefined
              ? { level: grievance.priorityLevel, score: grievance.priorityScore }
              : undefined,
          ),
        }
      : undefined;
    const timeline = statusHistory.map((entry) => ({
      ...entry,
      to: entry.toStatus,
      createdAt: entry.timestamp,
    }));

    return Response.json({
      ...grievance,
      grievance,
      analysis: analysis ?? null,
      recommendation: recommendation ?? null,
      recommendationDecision: recommendation?.id === latestDecision?.recommendationId
        ? latestDecision
        : null,
      statusHistory: timeline,
      notes: internalNotes,
      internalNotes,
      updates: citizenUpdates,
      citizenUpdates,
      feedback: feedback ?? null,
      duplicates: [],
      ...(participants ? {
        citizen: { name: participants.citizenName, ...(participants.citizenPhone ? { phone: participants.citizenPhone } : {}) },
        assignedOfficer: participants.assignedOfficerName
          ? {
              name: participants.assignedOfficerName,
              ...(participants.assignedOfficerEmail ? { email: participants.assignedOfficerEmail } : {}),
              ...(participants.assignedOfficerDepartmentId
                ? { departmentId: participants.assignedOfficerDepartmentId }
                : {}),
            }
          : null,
      } : {}),
    });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') {
    return Response.json({ error: 'Only administrators can update grievance records.' }, { status: 403 });
  }
  if (!isDatabaseConfigured()) {
    return Response.json({ error: 'The grievance database is not configured.' }, { status: 503 });
  }

  const { id } = await ctx.params;
  if (!isValidGrievanceId(id)) return Response.json({ error: 'Not Found' }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  const parsed = grievanceUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({
      error: 'Please provide valid grievance updates.',
      fields: parsed.error.issues.map(({ path, message }) => ({ field: path.join('.'), message })),
    }, { status: 400 });
  }
  try {
    const updated = await updateGrievance(id, user, parsed.data);
    if (!updated) return Response.json({ error: 'Not Found' }, { status: 404 });
    return Response.json({ grievance: updated });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
