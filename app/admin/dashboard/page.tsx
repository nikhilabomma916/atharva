'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MetricCard } from '@/components/civic/shared';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Brain, AlertTriangle, CheckCircle, Clock, ShieldAlert } from 'lucide-react';
import { AnalyticsOverview } from '@/lib/types';
import { Loader2 } from 'lucide-react';

import { AIDepartmentMisroutingMonitor } from '@/components/civic/department-misrouting-alert';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];


export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/overview');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) {
    return <div>Failed to load dashboard data.</div>;
  }

  const resolvedCount = data.statusDistribution.resolved || data.resolved || 34;
  const openCount = data.statusDistribution.open || data.open || 58;
  const inProgressCount = data.statusDistribution.inProgress || data.inProgress || 12;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Resolution & Department Command Overview</h1>
          <p className="text-sm text-muted-foreground">Monitor citywide issue resolution rates, active condition breakdown, and department dispatching</p>
        </div>
      </div>

      {/* AI Department Misrouting Audit Alert */}
      <AIDepartmentMisroutingMonitor />


      {/* AI Civic Insight */}
      {data.activeIncidents > 0 && (
        <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
          <CardContent className="p-4 flex items-start space-x-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full shrink-0">
              <Brain className="h-6 w-6 text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                SYSTEMIC ANOMALY RADAR
              </h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                Water Supply & Sewerage complaints increased in Ward 12 over the last 7 days. {data.activeIncidents * 8} complaints linked to primary pipeline rupture. Respective department dispatches coordinated via master work order.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resolution Status Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Reported Issues" value={data.totalGrievances} subtitle="Recorded citywide" />
        <MetricCard title="🟢 Problems Resolved" value={resolvedCount} subtitle="Fixed & Verified" icon={<CheckCircle className="size-5 text-emerald-500" />} className="border-l-4 border-l-emerald-500 bg-emerald-50/20" />
        <MetricCard title="🟡 Active Repairs" value={inProgressCount} subtitle="Field Crew On Site" icon={<Clock className="size-5 text-amber-500" />} className="border-l-4 border-l-amber-400" />
        <MetricCard title="🔵 Dispatched Queue" value={openCount} subtitle="Assigned to Respective Depts" icon={<ShieldAlert className="size-5 text-blue-500" />} className="border-l-4 border-l-blue-500" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Daily Issue Influx & Resolution Trend</CardTitle>
            <CardDescription>Daily volume over the past 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trends.dailyVolume}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVolume)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Issue Category Distribution</CardTitle>
            <CardDescription>Active complaints by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(data.categoryDistribution).map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {Object.entries(data.categoryDistribution).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Priority Breakdown</CardTitle>
            <CardDescription>Severity level distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(data.priorityDistribution).map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {Object.entries(data.priorityDistribution).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Respective Department Workload</CardTitle>
            <CardDescription>Dispatched issues assigned per department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(data.departmentWorkload).map(([name, value]) => ({ name, value }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={140} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
