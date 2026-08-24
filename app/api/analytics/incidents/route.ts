import { NextRequest } from 'next/server';
import { store } from '@/lib/data/store';
import { detectIncidents } from '@/lib/ai/incident-detection';

export async function GET(req: NextRequest) {
  return Response.json(detectIncidents(store.grievances));
}