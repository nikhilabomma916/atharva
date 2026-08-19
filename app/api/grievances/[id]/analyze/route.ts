import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-utils';
import { findGrievanceById, updateGrievance, addAnalysis, store } from '@/lib/data/store';
import { createAIService } from '@/lib/ai/ai-service';
import { calculatePriority } from '@/lib/ai/priority-engine';
import { findSimilarGrievances } from '@/lib/ai/duplicate-detection';
import { detectIncidents } from '@/lib/ai/incident-detection';

export async function POST(req: NextRequest, ctx: any) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const params = await ctx.params;
  const id = params.id;

  const grievance = findGrievanceById(id);
  if (!grievance) return Response.json({ error: 'Not found' }, { status: 404 });

  const aiService = await createAIService();
  const analysisResult = await aiService.analyzeGrievance(grievance.title, grievance.description, grievance.categoryId);
  
  const duplicates = findSimilarGrievances(grievance, store.grievances);

  const severityScore = analysisResult.impact === 'HIGH' ? 80 : analysisResult.impact === 'MEDIUM' ? 50 : 20;
  const publicImpactScore = analysisResult.impact === 'HIGH' ? 80 : analysisResult.impact === 'MEDIUM' ? 50 : 20;
  const urgencyScore = analysisResult.urgency === 'CRITICAL' ? 100 : analysisResult.urgency === 'HIGH' ? 75 : analysisResult.urgency === 'MEDIUM' ? 50 : 25;
  const durationScore = grievance.duration ? 50 : 10;
  const recurrenceScore = duplicates.length > 0 ? Math.min(duplicates.length * 20, 100) : 0;

  const priorityBreakdown = calculatePriority(
    severityScore,
    publicImpactScore,
    urgencyScore,
    durationScore,
    analysisResult.safetyRisk,
    recurrenceScore
  );

  const category = store.categories.find(c => c.id === grievance.categoryId);
  const departmentId = category?.departmentId || grievance.departmentId;

  const analysis: any = {
    id: `ana-${Date.now()}`,
    grievanceId: id,
    urgency: analysisResult.urgency,
    impact: analysisResult.impact,
    safetyRisk: analysisResult.safetyRisk,
    summary: analysisResult.summary,
    category: analysisResult.category,
    reasoning: analysisResult.reasoning,
    confidence: 0.8,
    aiProvider: 'fallback',
    createdAt: new Date().toISOString()
  };
  addAnalysis(analysis);

  updateGrievance(id, {
    status: 'AI_ANALYZED',
    priorityScore: priorityBreakdown.score,
    priorityLevel: priorityBreakdown.level,
    departmentId
  });

  const incidents = detectIncidents(store.grievances);

  return Response.json({
    analysis,
    priority: priorityBreakdown,
    duplicates,
    incidents,
    department: departmentId
  });
}