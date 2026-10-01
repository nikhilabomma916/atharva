import { getAuthUser } from '@/lib/api-utils';
import { listActiveOfficers } from '@/lib/data/grievances';
import { isDatabaseConfigured } from '@/lib/db';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') {
    return Response.json({ error: 'Only administrators can view the officer directory.' }, { status: 403 });
  }
  if (!isDatabaseConfigured()) {
    return Response.json({ error: 'The officer database is not configured.' }, { status: 503 });
  }

  try {
    return Response.json(await listActiveOfficers());
  } catch (error) {
    console.error('Active officer lookup failed:', error);
    const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
    if (code === '42P01' || code === '42703') {
      return Response.json({ error: 'The officer workflow migration has not been applied.' }, { status: 503 });
    }
    return Response.json({ error: 'The active officer list could not be loaded.' }, { status: 500 });
  }
}