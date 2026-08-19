import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-utils';
import { aiService, AIChatMessage } from '@/lib/ai/ai-service';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    const body = await req.json();
    const { messages = [] }: { messages: AIChatMessage[] } = body;

    const userContext = {
      role: user?.role || 'citizen',
      userId: user?.userId,
      name: user?.name || 'Citizen'
    };

    const reply = await aiService.chat(messages, userContext);
    return Response.json({ message: reply });
  } catch (error: any) {
    return Response.json({ error: error.message || 'Failed to process AI chat message' }, { status: 500 });
  }
}
