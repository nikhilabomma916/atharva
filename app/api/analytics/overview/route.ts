import { NextRequest } from 'next/server';
import { store } from '@/lib/data/store';
import { CATEGORY_NAMES, DEPARTMENT_NAMES } from '@/lib/constants';

export async function GET(req: NextRequest) {
  const total = store.grievances.length;
  const open = store.grievances.filter(g => g.status === 'SUBMITTED' || g.status === 'ASSIGNED').length;
  const inProgress = store.grievances.filter(g => g.status === 'IN_PROGRESS').length;
  const resolved = store.grievances.filter(g => g.status === 'RESOLVED' || g.status === 'CLOSED').length;
  const escalated = store.grievances.filter(g => g.status === 'ESCALATED').length;
  const overdue = store.grievances.filter(g => g.status === 'SLA_AT_RISK').length;

  let scoreSum = 0;
  store.feedback.forEach(f => { scoreSum += f.rating; });
  const satisfactionNum = store.feedback.length ? Number((scoreSum / store.feedback.length).toFixed(1)) : 4.2;

  // Status distribution
  const statusDistribution: Record<string, number> = {
    open,
    inProgress,
    resolved,
    escalated,
    overdue
  };

  // Category distribution
  const categoryDistribution: Record<string, number> = {};
  store.grievances.forEach(g => {
    const catName = CATEGORY_NAMES[g.categoryId] || g.categoryId;
    categoryDistribution[catName] = (categoryDistribution[catName] || 0) + 1;
  });

  // Priority distribution
  const priorityDistribution: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0
  };
  store.grievances.forEach(g => {
    const p = (g.priorityLevel || g.priority || 'MEDIUM').toUpperCase();
    if (priorityDistribution[p] !== undefined) {
      priorityDistribution[p]++;
    } else {
      priorityDistribution.MEDIUM++;
    }
  });

  // Department workload
  const departmentWorkload: Record<string, number> = {};
  store.departments.forEach(d => {
    const deptName = DEPARTMENT_NAMES[d.id] || d.name;
    const deptCount = store.grievances.filter(g => g.departmentId === d.id && g.status !== 'RESOLVED' && g.status !== 'CLOSED').length;
    departmentWorkload[deptName] = deptCount;
  });

  // Daily trends
  const dailyTrendsMap: Record<string, number> = {};
  store.grievances.forEach(g => {
    const date = g.createdAt.split('T')[0];
    dailyTrendsMap[date] = (dailyTrendsMap[date] || 0) + 1;
  });

  const dailyVolume = Object.entries(dailyTrendsMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const activeIncidents = store.incidents.filter(i => i.status !== 'RESOLVED').length;

  return Response.json({
    totalGrievances: total,
    total,
    open,
    inProgress,
    resolved,
    escalated,
    overdue,
    avgResolutionHours: 28,
    avgResolutionTimeHours: 28,
    citizenSatisfaction: satisfactionNum,
    citizenSatisfactionScore: satisfactionNum,
    activeIncidents,
    statusDistribution,
    categoryDistribution,
    priorityDistribution,
    departmentWorkload,
    trends: {
      dailyVolume
    }
  });
}