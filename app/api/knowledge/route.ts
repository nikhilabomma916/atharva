import { NextRequest } from 'next/server';
import { store } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  return Response.json(store.knowledgeDocuments);
}
