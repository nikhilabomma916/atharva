import { NextRequest } from 'next/server';
import { store } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('departmentId');

  let officers = store.users.filter(u => u.role === 'officer');
  if (departmentId) {
    officers = officers.filter(o => false);
  }

  const result = officers.map(o => {
    const openCases = store.grievances.filter(g => g.assignedOfficerId === o.id && g.status !== 'RESOLVED' && g.status !== 'CLOSED').length;
    return { ...o, openCases };
  });

  return Response.json(result);
}