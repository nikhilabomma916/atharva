import { NextRequest } from 'next/server';
import { store, addGrievance, addAuditLog, addNotification } from '@/lib/data/store';
import { getAuthUser } from '@/lib/api-utils';
import { Grievance } from '@/lib/types';

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const priority = searchParams.get('priority');
  const departmentId = searchParams.get('department');
  const citizenId = searchParams.get('citizenId');
  const officerId = searchParams.get('officerId');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  let filtered = store.grievances;

  if (user.role === 'citizen') {
    filtered = filtered.filter(g => g.citizenId === user.userId);
  } else if (user.role === 'officer') {
    const officer = store.users.find(u => u.id === user.userId);
    filtered = filtered.filter(g => g.assignedOfficerId === user.userId || false);
  }

  if (status) filtered = filtered.filter(g => g.status === status);
  if (category) filtered = filtered.filter(g => g.categoryId === category);
  if (priority) filtered = filtered.filter(g => g.priorityLevel === priority);
  if (departmentId) filtered = filtered.filter(g => g.departmentId === departmentId);
  if (citizenId) filtered = filtered.filter(g => g.citizenId === citizenId);
  if (officerId) filtered = filtered.filter(g => g.assignedOfficerId === officerId);
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(g => g.title.toLowerCase().includes(s) || g.description.toLowerCase().includes(s));
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return Response.json({ data: paginated, meta: { total, page, limit } });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { title, description, categoryId, location, duration, affectedCount, previousComplaintId } = body;

  const id = `GRV-${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();

  const grievance: any = {
    id,
    title,
    description,
    categoryId,
    departmentId: '', // To be updated later or via logic
    location,
    citizenId: user.userId,
    status: 'SUBMITTED',
    createdAt: now,
    updatedAt: now,
  };

  if (affectedCount) grievance.affectedCount = affectedCount;

  addGrievance(grievance as any);

  addAuditLog({
    id: `log-${Date.now()}`,
    action: 'CREATE',
    timestamp: now,
    entityType: 'GRIEVANCE',
    entityId: id,
    actorId: user.userId,
    actorName: user.name,
    actorRole: user.role as any,
  });

  return Response.json(grievance, { status: 201 });
}