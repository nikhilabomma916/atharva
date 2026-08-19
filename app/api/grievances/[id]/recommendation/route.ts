import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-utils';
import { getRecommendationByGrievance, addAuditLog } from '@/lib/data/store';

export async function GET(req: NextRequest, ctx: any) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const params = await ctx.params;
  return Response.json(getRecommendationByGrievance(params.id) || null);
}

export async function POST(req: NextRequest, ctx: any) {
  const user = await getAuthUser();
  if (!user || user.role === 'citizen') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const params = await ctx.params;
  const { decision, modification } = await req.json();

  const rec = getRecommendationByGrievance(params.id);
  if (!rec) return Response.json({ error: 'Not found' }, { status: 404 });

  

  addAuditLog({
    id: `log-${Date.now()}`,
    action: 'UPDATE',
    entityType: 'AI_RECOMMENDATION',
    entityId: rec.id,
    actorId: user.userId,
    actorName: user.name,
    actorRole: user.role as any,
    timestamp: new Date().toISOString()
  });

  return Response.json(rec);
}