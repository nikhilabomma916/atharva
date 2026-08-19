import { NextRequest } from 'next/server';
import { store } from '@/lib/data/store';
import { checkDepartmentMisrouting, rerouteGrievance } from '@/lib/ai/department-monitor';

export async function GET(req: NextRequest) {
  const audit = checkDepartmentMisrouting(store.grievances);
  return Response.json(audit);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { grievanceId, targetDepartmentId } = body;

    if (!grievanceId || !targetDepartmentId) {
      return Response.json({ error: 'Missing grievanceId or targetDepartmentId' }, { status: 400 });
    }

    const success = rerouteGrievance(grievanceId, targetDepartmentId);
    if (!success) {
      return Response.json({ error: 'Grievance not found or failed to reroute' }, { status: 404 });
    }

    return Response.json({
      success: true,
      message: `Grievance ${grievanceId} auto-rerouted to target department successfully.`
    });
  } catch (error: any) {
    return Response.json({ error: error.message || 'Reroute failed' }, { status: 500 });
  }
}
