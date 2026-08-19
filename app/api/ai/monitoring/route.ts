import { NextRequest } from 'next/server';
import { aiMonitoring } from '@/lib/ai/monitoring-service';
import { store } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  if (type === 'predictions') {
    return Response.json(aiMonitoring.getSLAPredictions());
  }

  if (type === 'events') {
    return Response.json(aiMonitoring.getEvents(50));
  }

  const stats = aiMonitoring.getStats();
  const events = aiMonitoring.getEvents(20);
  const predictions = aiMonitoring.getSLAPredictions();

  return Response.json({
    stats,
    events,
    predictions,
    activeIncidents: store.incidents,
    duplicateCount: store.duplicateLinks.length,
    totalGrievances: store.grievances.length
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    if (action === 'SIMULATE_EVENT') {
      const wards = ['12', '7', '4', '8', '3', '15'];
      const categories = ['cat-water-supply', 'cat-hazards', 'cat-potholes', 'cat-garbage', 'cat-streetlights'];
      const ward = payload?.ward || wards[Math.floor(Math.random() * wards.length)];
      const category = payload?.category || categories[Math.floor(Math.random() * categories.length)];

      const isCritical = category === 'cat-hazards';

      const simulatedEvent = aiMonitoring.addEvent({
        type: isCritical ? 'SAFETY_ESCALATION' : 'TRIAGE',
        title: isCritical 
          ? `High-Risk Incident Auto-Escalated in Ward ${ward}`
          : `Grievance Auto-Triaged in Ward ${ward}`,
        description: isCritical 
          ? `Urgent civic defect detected. Prioritized to CRITICAL with 4h resolution target.`
          : `Classified under ${category} with geospatial zone verification. Routed to municipal field team.`,
        severity: isCritical ? 'CRITICAL' : 'HIGH',
        ward,
        meta: { automated: true }
      });

      return Response.json({ success: true, event: simulatedEvent });
    }

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message || 'Action failed' }, { status: 500 });
  }
}
