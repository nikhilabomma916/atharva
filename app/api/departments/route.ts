import { NextRequest } from 'next/server';
import { store } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  const result = store.departments.map(d => {
    const deptGrievances = store.grievances.filter(g => g.departmentId === d.id);
    const totalGrievances = deptGrievances.length;
    const openGrievances = deptGrievances.filter(g => g.status !== 'RESOLVED' && g.status !== 'CLOSED').length;
    const headOfficer = store.users.find(u => u.id === d.headOfficerId);

    return {
      ...d,
      headId: headOfficer?.name || d.headOfficerId || 'Unassigned',
      headOfficerName: headOfficer?.name || 'Unassigned',
      metrics: {
        totalGrievances,
        openGrievances,
        avgResolutionTimeHours: 24,
      },
      stats: {
        officers: store.users.filter(u => u.role === 'officer').length,
        grievances: totalGrievances,
      }
    };
  });
  return Response.json(result);
}