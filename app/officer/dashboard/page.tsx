'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Clock, Search, Filter, ArrowUpRight, FolderOpen, UserCheck, Repeat, Building2 } from 'lucide-react';
import { MetricCard, PriorityBadge, StatusBadge, IssueConditionBadge, SLAIndicator, EmptyState, LoadingState } from '@/components/civic/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CATEGORY_NAMES, DEPARTMENT_NAMES } from '@/lib/constants';

export default function OfficerDashboard() {
  const router = useRouter();
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalAll: 0,
    totalOpen: 0,
    totalResolved: 0,
    critical: 0,
    highPriority: 0,
    slaAtRisk: 0,
    escalated: 0,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/grievances');
        if (res.ok) {
          const data = await res.json();
          const items: any[] = Array.isArray(data) ? data : (data.grievances || []);
          setGrievances(items);
          
          const resolved = items.filter((g: any) => ['RESOLVED', 'CLOSED'].includes(g.status));
          const open = items.filter((g: any) => !['RESOLVED', 'CLOSED', 'REJECTED'].includes(g.status));
          const critical = open.filter((g: any) => (g.priorityLevel || g.priority) === 'CRITICAL');
          const high = open.filter((g: any) => (g.priorityLevel || g.priority) === 'HIGH');
          const slaRisk = open.filter((g: any) => g.status === 'SLA_AT_RISK');
          const escalated = items.filter((g: any) => g.status === 'ESCALATED');

          setMetrics({
            totalAll: items.length,
            totalOpen: open.length,
            totalResolved: resolved.length,
            critical: critical.length,
            highPriority: high.length,
            slaAtRisk: slaRisk.length,
            escalated: escalated.length,
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const refreshId = window.setInterval(fetchData, 5000);
    return () => window.clearInterval(refreshId);
  }, []);

  const priorityQueue = [...grievances]
    .filter((g: any) => !['RESOLVED', 'CLOSED', 'REJECTED'].includes(g.status))
    .sort((a: any, b: any) => {
      const priorityWeights: Record<string, number> = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      const aPriority = (a.priorityLevel || a.priority || 'MEDIUM').toUpperCase();
      const bPriority = (b.priorityLevel || b.priority || 'MEDIUM').toUpperCase();
      const aWeight = priorityWeights[aPriority] || 0;
      const bWeight = priorityWeights[bPriority] || 0;
      
      if (aWeight !== bWeight) return bWeight - aWeight;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    })
    .slice(0, 10);

  if (loading) return <LoadingState message="Loading field officer dashboard..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Officer Operations & Dispatch Dashboard</h1>
          <p className="text-slate-500">Monitor issue conditions, resolution status, and field officer actions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/officer/grievances')}>
            View All Grievances
          </Button>
        </div>
      </div>

      {/* Metrics: RESOLVED vs OPEN ISSUE CONDITION */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Total Issues Logged" 
          value={metrics.totalAll.toString()} 
          icon={<FolderOpen className="h-4 w-4 text-indigo-500" />} 
        />
        <MetricCard 
          title="🟢 Problems Resolved" 
          value={metrics.totalResolved.toString()} 
          subtitle="Fixed & Site Verified"
          icon={<CheckCircle className="h-4 w-4 text-emerald-500" />} 
          className="border-emerald-100 bg-emerald-50/30"
        />
        <MetricCard 
          title="🟡 Active Field Repair" 
          value={metrics.totalOpen.toString()} 
          subtitle="Crew Dispatched"
          icon={<Clock className="h-4 w-4 text-amber-500" />} 
          className="border-amber-100 bg-amber-50/30"
        />
        <MetricCard 
          title="🔴 Critical Hazards" 
          value={metrics.critical.toString()} 
          subtitle="4h SLA Intervention"
          icon={<AlertCircle className="h-4 w-4 text-red-500" />} 
          className="border-red-100 bg-red-50/30"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Priority Action & Dispatch Queue
                </CardTitle>
                <CardDescription>Top grievances mapped to respective departments needing action</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => router.push('/officer/grievances')}>
                View Queue <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {priorityQueue.length === 0 ? (
                <EmptyState title="No active priorities" description="All assigned issues resolved." />
              ) : (
                <div className="space-y-4 mt-4">
                  {priorityQueue.map((grievance) => {
                    const deptName = DEPARTMENT_NAMES[grievance.departmentId || ''] || 'Department pending review';
                    return (
                      <div 
                        key={grievance.id} 
                        className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/officer/grievances/${grievance.id}`)}
                      >
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-indigo-600 font-bold">{grievance.id}</span>
                            <IssueConditionBadge status={grievance.status} />
                            <PriorityBadge level={grievance.priorityLevel || grievance.priority} score={grievance.priorityScore} />
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900">{grievance.title}</h4>
                          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Building2 className="size-3 text-indigo-500" />
                              Dept: <strong>{deptName}</strong>
                            </span>
                            <span>📍 {grievance.location?.address || grievance.location?.ward || 'Location not provided'}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap sm:flex-col sm:items-end gap-2 shrink-0">
                          <StatusBadge status={grievance.status} />
                          {grievance.slaDeadline && (
                            <SLAIndicator deadline={grievance.slaDeadline} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Escalations & Hazards</CardTitle>
              <CardDescription>Critical safety risk notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.escalated === 0 && metrics.slaAtRisk === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">No active hazard escalations.</div>
              ) : (
                <div className="space-y-4">
                  {metrics.escalated > 0 && (
                    <div className="flex justify-between items-center p-3 bg-red-50 text-red-900 rounded-md border border-red-100">
                      <span className="font-medium text-sm">Escalated Hazards</span>
                      <Badge className="bg-red-500">{metrics.escalated}</Badge>
                    </div>
                  )}
                  {metrics.slaAtRisk > 0 && (
                    <div className="flex justify-between items-center p-3 bg-amber-50 text-amber-900 rounded-md border border-amber-100">
                      <span className="font-medium text-sm">SLA Risk Warnings</span>
                      <Badge className="bg-amber-500">{metrics.slaAtRisk}</Badge>
                    </div>
                  )}
                  <Button variant="outline" className="w-full text-sm mt-2" onClick={() => router.push('/officer/escalations')}>
                    View All Hazards
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
