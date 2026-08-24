'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Clock, CheckCircle2, AlertTriangle, ArrowUpRight, Plus, Building2, ShieldCheck, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetricCard, StatusBadge, PriorityBadge, IssueConditionBadge, LoadingState, EmptyState } from '@/components/civic/shared';
import { DEPARTMENT_NAMES } from '@/lib/constants';

interface Grievance {
  id: string;
  title: string;
  categoryId: string;
  departmentId?: string;
  status: string;
  priorityLevel?: string;
  priorityScore?: number;
  location?: { ward?: string; address?: string };
  createdAt: string;
  slaDeadline?: string;
}

export default function CitizenDashboard() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGrievances = () => {
      fetch('/api/grievances')
        .then((r) => r.json())
        .then((d) => {
          const list = Array.isArray(d) ? d : d?.data ?? [];
          setGrievances(list);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };
    loadGrievances();
    const refreshId = window.setInterval(loadGrievances, 5000);
    return () => window.clearInterval(refreshId);
  }, []);

  const total = grievances.length;
  const pending = grievances.filter((g) => ['SUBMITTED', 'AI_ANALYZED'].includes(g.status)).length;
  const inProgress = grievances.filter((g) => ['ASSIGNED', 'IN_PROGRESS', 'AWAITING_INFORMATION'].includes(g.status)).length;
  const resolved = grievances.filter((g) => ['RESOLVED', 'CLOSED'].includes(g.status)).length;
  const escalated = grievances.filter((g) => ['ESCALATED', 'SLA_AT_RISK'].includes(g.status)).length;

  if (loading) return <LoadingState message="Loading your civic dashboard..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Citizen Grievance & Resolution Dashboard</h1>
          <p className="text-sm text-muted-foreground">Track problem resolution status, issue conditions, and department dispatching</p>
        </div>
        <Link href="/citizen/submit">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
            <Plus className="size-4" />
            Report Civic Issue (Photo & Geolocation)
          </Button>
        </Link>
      </div>

      {/* Metrics: RESOLUTION STATUS BREAKDOWN */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard title="Total Reported Issues" value={total} icon={<FileText className="size-5 text-slate-600" />} />
        <MetricCard title="🟢 Problems Resolved" value={resolved} subtitle="Fixed & Verified" icon={<CheckCircle2 className="size-5 text-emerald-500" />} className="border-l-4 border-l-emerald-500 bg-emerald-50/20" />
        <MetricCard title="🟡 In Repair" value={inProgress} subtitle="Crew On Site" icon={<ArrowUpRight className="size-5 text-amber-500" />} className="border-l-4 border-l-amber-400" />
        <MetricCard title="🔵 Dispatched" value={pending} subtitle="Pending Dispatch" icon={<Clock className="size-5 text-blue-500" />} className="border-l-4 border-l-blue-400" />
        <MetricCard title="🔴 Urgent Hazards" value={escalated} subtitle="Critical SLA" icon={<AlertTriangle className="size-5 text-red-500" />} className="border-l-4 border-l-red-500 bg-red-50/20" />
      </div>

      {/* Grievances List with Issue Condition */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-4 bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h2 className="font-bold text-base">Your Reported Issues & Live Condition</h2>
            <p className="text-xs text-muted-foreground">Monitored for on-the-spot location, department dispatch, and resolution</p>
          </div>
          <Link href="/citizen/grievances" className="text-sm font-semibold text-indigo-600 hover:underline">
            View All Grievances →
          </Link>
        </div>
        {grievances.length === 0 ? (
          <EmptyState
            icon={<FileText className="size-12" />}
            title="No civic issues reported yet"
            description="Upload a photo on the spot to report potholes, water leaks, or hazards"
            action={
              <Link href="/citizen/submit">
                <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="size-4" />
                  Report Issue Now
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {grievances.slice(0, 10).map((g) => {
              const deptName = DEPARTMENT_NAMES[g.departmentId || ''] || 'Department pending review';
              return (
                <Link key={g.id} href={`/citizen/grievances/${g.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-indigo-600">{g.id}</span>
                      <IssueConditionBadge status={g.status} />
                      {g.priorityLevel && <PriorityBadge level={g.priorityLevel as any} />}
                    </div>
                    <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{g.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="size-3.5 text-indigo-500" />
                        Dispatched To: <strong className="text-slate-700 dark:text-slate-300">{deptName}</strong>
                      </span>
                      {g.location?.ward && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3.5 text-slate-400" />
                          {g.location.ward}
                        </span>
                      )}
                      <span>
                        Reported: {new Date(g.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <StatusBadge status={g.status as any} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
