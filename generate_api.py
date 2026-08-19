import os

BASE_DIR = "/Users/arundathiasalla/Documents/MONTH-1/fermentation-chamber/atharva/app/api"

files = {
    "auth/login/route.ts": """import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { findUserByEmail } from '@/lib/data/store';
import { verifyPassword, createToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const user = findUserByEmail(email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const payload = { userId: user.id, email: user.email, name: user.name, role: user.role };
    const token = await createToken(payload);
    
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    });

    return Response.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}""",

    "auth/register/route.ts": """import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { findUserByEmail, store } from '@/lib/data/store';
import { createToken } from '@/lib/auth';
import { hashSync } from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, role } = await req.json();

    if (findUserByEmail(email)) {
      return Response.json({ error: 'Email already exists' }, { status: 400 });
    }

    const userRole = role || 'citizen';
    const newUser = {
      id: `usr-${userRole}-${Date.now()}`,
      name,
      email,
      passwordHash: hashSync(password, 10),
      phone,
      role: userRole as any,
      createdAt: new Date().toISOString()
    };

    store.users.push(newUser);

    const payload = { userId: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role };
    const token = await createToken(payload);
    
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    });

    return Response.json({ user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role } });
  } catch (error) {
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}""",

    "auth/logout/route.ts": """import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
  return Response.json({ success: true });
}""",

    "auth/me/route.ts": """import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return Response.json({ user: { id: user.userId, email: user.email, name: user.name, role: user.role } });
}""",

    "grievances/route.ts": """import { NextRequest } from 'next/server';
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
    filtered = filtered.filter(g => g.assignedOfficerId === user.userId || g.departmentId === officer?.departmentId);
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
    entityType: 'GRIEVANCE',
    entityId: id,
    actorId: user.userId,
    details: 'Grievance submitted',
    timestamp: now
  });

  return Response.json(grievance, { status: 201 });
}""",

    "grievances/[id]/route.ts": """import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-utils';
import {
  findGrievanceById,
  updateGrievance,
  addStatusHistory,
  addAuditLog,
  getAnalysisByGrievance,
  getRecommendationByGrievance,
  getStatusHistory,
  getInternalNotes,
  getCitizenUpdates,
  getFeedbackByGrievance,
  getDuplicatesForGrievance
} from '@/lib/data/store';

export async function GET(req: NextRequest, ctx: any) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const params = await ctx.params;
  const id = params.id;

  const grievance = findGrievanceById(id);
  if (!grievance) return Response.json({ error: 'Not Found' }, { status: 404 });

  const result = {
    ...grievance,
    analysis: getAnalysisByGrievance(id),
    recommendation: getRecommendationByGrievance(id),
    statusHistory: getStatusHistory(id),
    notes: getInternalNotes(id),
    updates: getCitizenUpdates(id),
    feedback: getFeedbackByGrievance(id),
    duplicates: getDuplicatesForGrievance(id)
  };

  return Response.json(result);
}

export async function PATCH(req: NextRequest, ctx: any) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const params = await ctx.params;
  const id = params.id;

  const grievance = findGrievanceById(id);
  if (!grievance) return Response.json({ error: 'Not Found' }, { status: 404 });

  const body = await req.json();
  const now = new Date().toISOString();

  const updated = updateGrievance(id, body);

  if (body.status && body.status !== grievance.status) {
    addStatusHistory({
      id: `hist-${Date.now()}`,
      grievanceId: id,
      previousStatus: grievance.status,
      newStatus: body.status,
      changedBy: user.userId,
      reason: body.reason || 'Status updated',
      timestamp: now
    });
  }

  addAuditLog({
    id: `log-${Date.now()}`,
    action: 'UPDATE',
    entityType: 'GRIEVANCE',
    entityId: id,
    actorId: user.userId,
    details: `Updated grievance fields`,
    timestamp: now
  });

  return Response.json(updated);
}""",

    "grievances/[id]/analyze/route.ts": """import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-utils';
import { findGrievanceById, updateGrievance, addAnalysis, store } from '@/lib/data/store';
import { createAIService } from '@/lib/ai/ai-service';
import { calculatePriority } from '@/lib/ai/priority-engine';
import { findSimilarGrievances } from '@/lib/ai/duplicate-detection';
import { detectIncidents } from '@/lib/ai/incident-detection';

export async function POST(req: NextRequest, ctx: any) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const params = await ctx.params;
  const id = params.id;

  const grievance = findGrievanceById(id);
  if (!grievance) return Response.json({ error: 'Not found' }, { status: 404 });

  const aiService = createAIService();
  const analysisResult = await aiService.analyzeGrievance(grievance.title, grievance.description, grievance.categoryId);
  
  const duplicates = findSimilarGrievances(grievance, store.grievances);
  const priorityBreakdown = calculatePriority(analysisResult, undefined, grievance.affectedCount, duplicates.length);

  const category = store.categories.find(c => c.id === grievance.categoryId);
  const departmentId = category?.departmentId || grievance.departmentId;

  const analysis = {
    id: `ana-${Date.now()}`,
    grievanceId: id,
    urgency: analysisResult.urgency,
    impact: analysisResult.impact,
    safetyRisk: analysisResult.safetyRisk,
    sentiment: analysisResult.sentiment,
    keywords: analysisResult.keywords,
    summary: analysisResult.summary,
    createdAt: new Date().toISOString()
  };
  addAnalysis(analysis);

  updateGrievance(id, {
    status: 'AI_ANALYZED',
    priorityScore: priorityBreakdown.total,
    priorityLevel: priorityBreakdown.level,
    departmentId
  });

  const incidents = detectIncidents(store.grievances, store.categories, store.incidents);

  return Response.json({
    analysis,
    priority: priorityBreakdown,
    duplicates,
    incidents,
    department: departmentId
  });
}""",

    "grievances/[id]/assign/route.ts": """import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-utils';
import { findGrievanceById, updateGrievance, addNotification, addAuditLog } from '@/lib/data/store';

export async function POST(req: NextRequest, ctx: any) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const params = await ctx.params;
  const id = params.id;
  const body = await req.json();
  const { officerId } = body;

  const grievance = findGrievanceById(id);
  if (!grievance) return Response.json({ error: 'Not found' }, { status: 404 });

  updateGrievance(id, { assignedOfficerId: officerId, status: 'ASSIGNED' });

  const now = new Date().toISOString();
  addNotification({
    id: `notif-${Date.now()}`,
    userId: officerId,
    title: 'New Assignment',
    message: `Grievance ${id} has been assigned to you.`,
    type: 'new_assignment',
    grievanceId: id,
    read: false,
    createdAt: now
  });

  addAuditLog({
    id: `log-${Date.now()}`,
    action: 'UPDATE',
    entityType: 'GRIEVANCE',
    entityId: id,
    actorId: user.userId,
    details: `Assigned to ${officerId}`,
    timestamp: now
  });

  return Response.json({ success: true });
}""",

    "grievances/[id]/resolve/route.ts": """import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-utils';
import { findGrievanceById, updateGrievance, addNotification, addAuditLog, store } from '@/lib/data/store';

export async function POST(req: NextRequest, ctx: any) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const params = await ctx.params;
  const id = params.id;
  const { resolution } = await req.json();

  const grievance = findGrievanceById(id);
  if (!grievance) return Response.json({ error: 'Not found' }, { status: 404 });

  const now = new Date().toISOString();
  
  updateGrievance(id, { status: 'RESOLVED', resolvedAt: now });

  store.citizenUpdates.push({
    id: `upd-${Date.now()}`,
    grievanceId: id,
    message: resolution,
    postedBy: user.userId,
    visibility: 'public',
    createdAt: now
  });

  addNotification({
    id: `notif-${Date.now()}`,
    userId: grievance.citizenId,
    title: 'Grievance Resolved',
    message: `Your grievance ${id} has been resolved.`,
    type: 'complaint_resolved',
    grievanceId: id,
    read: false,
    createdAt: now
  });

  addAuditLog({
    id: `log-${Date.now()}`,
    action: 'UPDATE',
    entityType: 'GRIEVANCE',
    entityId: id,
    actorId: user.userId,
    details: `Resolved grievance`,
    timestamp: now
  });

  return Response.json({ success: true });
}""",

    "grievances/[id]/escalate/route.ts": """import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-utils';
import { findGrievanceById, updateGrievance, addAuditLog } from '@/lib/data/store';

export async function POST(req: NextRequest, ctx: any) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const params = await ctx.params;
  const id = params.id;

  const grievance = findGrievanceById(id);
  if (!grievance) return Response.json({ error: 'Not found' }, { status: 404 });

  const now = new Date().toISOString();
  updateGrievance(id, { status: 'ESCALATED' });

  addAuditLog({
    id: `log-${Date.now()}`,
    action: 'UPDATE',
    entityType: 'GRIEVANCE',
    entityId: id,
    actorId: user.userId,
    details: `Escalated grievance`,
    timestamp: now
  });

  return Response.json({ success: true });
}""",

    "grievances/[id]/notes/route.ts": """import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-utils';
import { getInternalNotes, store, addAuditLog } from '@/lib/data/store';

export async function GET(req: NextRequest, ctx: any) {
  const user = await getAuthUser();
  if (!user || user.role === 'citizen') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const params = await ctx.params;
  return Response.json(getInternalNotes(params.id));
}

export async function POST(req: NextRequest, ctx: any) {
  const user = await getAuthUser();
  if (!user || user.role === 'citizen') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const params = await ctx.params;
  const { content } = await req.json();
  const now = new Date().toISOString();

  const note = {
    id: `note-${Date.now()}`,
    grievanceId: params.id,
    authorId: user.userId,
    content,
    createdAt: now
  };
  store.internalNotes.push(note);

  addAuditLog({
    id: `log-${Date.now()}`,
    action: 'CREATE',
    entityType: 'INTERNAL_NOTE',
    entityId: note.id,
    actorId: user.userId,
    details: `Added note to ${params.id}`,
    timestamp: now
  });

  return Response.json(note, { status: 201 });
}""",

    "grievances/[id]/recommendation/route.ts": """import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-utils';
import { getRecommendationByGrievance, addAuditLog } from '@/lib/data/store';

export async function GET(req: NextRequest, ctx: any) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const params = await ctx.params;
  return Response.json(getRecommendationByGrievance(params.id) || null);
}

export async function POST(req: NextRequest, ctx: any) {
  const user = await getAuthUser();
  if (!user || user.role === 'citizen') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const params = await ctx.params;
  const { decision, modification } = await req.json();

  const rec = getRecommendationByGrievance(params.id);
  if (!rec) return Response.json({ error: 'Not found' }, { status: 404 });

  rec.officerDecision = decision;
  if (modification) rec.decisionReason = modification;

  addAuditLog({
    id: `log-${Date.now()}`,
    action: 'UPDATE',
    entityType: 'AI_RECOMMENDATION',
    entityId: rec.id,
    actorId: user.userId,
    details: `Officer decided ${decision} on recommendation`,
    timestamp: new Date().toISOString()
  });

  return Response.json(rec);
}""",

    "departments/route.ts": """import { NextRequest } from 'next/server';
import { store } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  const result = store.departments.map(d => {
    const officers = store.users.filter(u => u.role === 'officer' && u.departmentId === d.id).length;
    const grievances = store.grievances.filter(g => g.departmentId === d.id).length;
    return { ...d, stats: { officers, grievances } };
  });
  return Response.json(result);
}""",

    "officers/route.ts": """import { NextRequest } from 'next/server';
import { store } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('departmentId');

  let officers = store.users.filter(u => u.role === 'officer');
  if (departmentId) {
    officers = officers.filter(o => o.departmentId === departmentId);
  }

  const result = officers.map(o => {
    const openCases = store.grievances.filter(g => g.assignedOfficerId === o.id && g.status !== 'RESOLVED' && g.status !== 'CLOSED').length;
    return { ...o, openCases };
  });

  return Response.json(result);
}""",

    "notifications/route.ts": """import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-utils';
import { store } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const notifications = store.notifications.filter(n => n.userId === user.userId);
  return Response.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, all } = await req.json();
  
  store.notifications.forEach(n => {
    if (n.userId === user.userId && (all || n.id === id)) {
      n.read = true;
    }
  });

  return Response.json({ success: true });
}""",

    "feedback/route.ts": """import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-utils';
import { store } from '@/lib/data/store';

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { grievanceId, rating, comment } = await req.json();

  const feedback = {
    id: `fdb-${Date.now()}`,
    grievanceId,
    citizenId: user.userId,
    rating,
    comment,
    createdAt: new Date().toISOString()
  };

  store.feedback.push(feedback);
  return Response.json(feedback, { status: 201 });
}""",

    "analytics/overview/route.ts": """import { NextRequest } from 'next/server';
import { store } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  const total = store.grievances.length;
  const open = store.grievances.filter(g => g.status === 'SUBMITTED' || g.status === 'ASSIGNED').length;
  const inProgress = store.grievances.filter(g => g.status === 'IN_PROGRESS').length;
  const resolved = store.grievances.filter(g => g.status === 'RESOLVED' || g.status === 'CLOSED').length;
  const escalated = store.grievances.filter(g => g.status === 'ESCALATED').length;
  const overdue = store.grievances.filter(g => g.status === 'SLA_AT_RISK' || g.status === 'SLA_BREACHED').length;

  let scoreSum = 0;
  store.feedback.forEach(f => scoreSum += f.rating);
  const avgSatisfaction = store.feedback.length ? (scoreSum / store.feedback.length).toFixed(1) : 0;

  return Response.json({ total, open, inProgress, resolved, escalated, overdue, avgSatisfaction });
}""",

    "analytics/trends/route.ts": """import { NextRequest } from 'next/server';
import { store } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  const trends: Record<string, number> = {};
  
  store.grievances.forEach(g => {
    const d = g.createdAt.split('T')[0];
    trends[d] = (trends[d] || 0) + 1;
  });

  const data = Object.entries(trends).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
  return Response.json(data);
}""",

    "analytics/incidents/route.ts": """import { NextRequest } from 'next/server';
import { store } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  return Response.json(store.incidents);
}""",

    "audit/route.ts": """import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-utils';
import { store } from '@/lib/data/store';

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  const total = store.auditLogs.length;
  const start = (page - 1) * limit;
  const paginated = store.auditLogs.slice().reverse().slice(start, start + limit);

  return Response.json({ data: paginated, meta: { total, page, limit } });
}"""
}

for path, content in files.items():
    full_path = os.path.join(BASE_DIR, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w") as f:
        f.write(content)
