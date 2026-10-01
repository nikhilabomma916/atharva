import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-utils';
import { createGrievance, listGrievances } from '@/lib/data/grievances';
import { isDatabaseConfigured } from '@/lib/db';
import { grievanceCreateSchema, GRIEVANCE_STATUSES, PRIORITY_LEVELS } from '@/lib/validation/grievance';

function databaseErrorResponse(error: unknown): Response {
  console.error('Grievance database operation failed:', error);
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
  if (code === '42P01') {
    return Response.json({ error: 'The grievance database migration has not been applied.' }, { status: 503 });
  }
  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN' || code === 'ECONNREFUSED' ||
      code === 'ETIMEDOUT' || code === 'ECONNRESET') {
    return Response.json({ error: 'The database is currently unavailable.' }, { status: 503 });
  }
  return Response.json({ error: 'The grievance could not be saved. Please try again.' }, { status: 500 });
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isDatabaseConfigured()) {
    return Response.json({ error: 'The grievance database is not configured.' }, { status: 503 });
  }

  const searchParams = req.nextUrl.searchParams;
  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || 50);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return Response.json({ error: 'Page must be positive and limit must be between 1 and 100.' }, { status: 400 });
  }

  const statusParam = searchParams.get('status');
  if (statusParam && !GRIEVANCE_STATUSES.includes(statusParam as typeof GRIEVANCE_STATUSES[number])) {
    return Response.json({ error: 'Invalid grievance status filter.' }, { status: 400 });
  }
  const priorityParam = searchParams.get('priority');
  if (priorityParam && !PRIORITY_LEVELS.includes(priorityParam as typeof PRIORITY_LEVELS[number])) {
    return Response.json({ error: 'Invalid grievance priority filter.' }, { status: 400 });
  }

  try {
    const result = await listGrievances({
      page,
      limit,
      role: user.role,
      userId: user.userId,
      ...(statusParam ? { status: statusParam as typeof GRIEVANCE_STATUSES[number] } : {}),
      ...(searchParams.get('category') ? { categoryId: searchParams.get('category')! } : {}),
      ...(priorityParam ? { priorityLevel: priorityParam as typeof PRIORITY_LEVELS[number] } : {}),
      ...(searchParams.get('department') ? { departmentId: searchParams.get('department')! } : {}),
      ...(user.role === 'admin' && searchParams.get('citizenId')
        ? { citizenId: searchParams.get('citizenId')! }
        : {}),
      ...(user.role === 'admin' && searchParams.get('officerId')
        ? { officerId: searchParams.get('officerId')! }
        : {}),
      ...(searchParams.get('search') ? { search: searchParams.get('search')!.slice(0, 200) } : {}),
    });
    return Response.json({ data: result.data, meta: { total: result.total, page, limit } });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'citizen') return Response.json({ error: 'Only citizens can submit grievances.' }, { status: 403 });
  if (!isDatabaseConfigured()) {
    return Response.json({ error: 'The grievance database is not configured.' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = grievanceCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({
      error: 'Please correct the grievance details.',
      fields: parsed.error.issues.map(({ path, message }) => ({ field: path.join('.'), message })),
    }, { status: 400 });
  }

  try {
    const grievance = await createGrievance(user.userId, user.name, parsed.data);
    return Response.json({ grievance }, { status: 201 });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
