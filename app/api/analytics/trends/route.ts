import { NextRequest } from 'next/server';
import { store } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  const trends: Record<string, number> = {};
  
  store.grievances.forEach(g => {
    const d = g.createdAt.split('T')[0];
    trends[d] = (trends[d] || 0) + 1;
  });

  const data = Object.entries(trends).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
  return Response.json(data);
}