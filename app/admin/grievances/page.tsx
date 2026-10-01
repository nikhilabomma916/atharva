'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { Grievance } from '@/lib/types';
import { format } from 'date-fns';
import { PriorityBadge, StatusBadge } from '@/components/civic/shared';
import { DEPARTMENT_NAMES, CATEGORY_NAMES } from '@/lib/constants';

export default function GrievancesPage() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [officers, setOfficers] = useState<Array<{ id: string; name: string; departmentId?: string }>>([]);
  const [selectedOfficers, setSelectedOfficers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    const fetchGrievances = async () => {
      try {
        const [grievanceResponse, officerResponse] = await Promise.all([
          fetch('/api/grievances'),
          fetch('/api/officers'),
        ]);
        const [grievanceResult, officerResult] = await Promise.all([
          grievanceResponse.json(),
          officerResponse.json(),
        ]);
        if (!grievanceResponse.ok) {
          throw new Error(grievanceResult.error || 'Grievances could not be loaded.');
        }
        if (!officerResponse.ok) {
          throw new Error(officerResult.error || 'Active officers could not be loaded.');
        }
        setGrievances(grievanceResult.data ?? []);
        setOfficers(officerResult);
      } catch (error) {
        console.error('Failed to fetch grievances', error);
        setError(error instanceof Error ? error.message : 'The assignment view could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    fetchGrievances();
  }, []);

  const assignGrievance = async (grievanceId: string) => {
    const grievance = grievances.find((item) => item.id === grievanceId);
    const officerId = selectedOfficers[grievanceId] || grievance?.assignedOfficerId;
    if (!officerId) return;
    setAssigningId(grievanceId);
    setError('');
    try {
      const response = await fetch(`/api/grievances/${grievanceId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officerId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The grievance could not be assigned.');
      setGrievances((current) => current.map((grievance) =>
        grievance.id === grievanceId ? result.grievance : grievance,
      ));
    } catch (error) {
      console.error('Grievance assignment failed', error);
      setError(error instanceof Error ? error.message : 'The grievance could not be assigned.');
    } finally {
      setAssigningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">System Grievances</h1>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      
      <Card>
        <CardHeader>
          <CardTitle>All Grievances</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Assign Officer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grievances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-slate-500">
                    No grievances are available to assign.
                  </TableCell>
                </TableRow>
              ) : grievances.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-mono text-xs">{g.id.substring(0, 8)}</TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">{g.title}</TableCell>
                  <TableCell>{CATEGORY_NAMES[g.categoryId] || g.categoryId || g.category || 'Other'}</TableCell>
                  <TableCell>{g.departmentId ? (DEPARTMENT_NAMES[g.departmentId] || g.departmentId) : 'Unassigned'}</TableCell>
                  <TableCell><PriorityBadge level={g.priorityLevel || g.priority || 'MEDIUM'} score={g.priorityScore} /></TableCell>
                  <TableCell><StatusBadge status={g.status} /></TableCell>
                  <TableCell>{format(new Date(g.createdAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex min-w-[240px] items-center gap-2">
                      <select
                        aria-label={`Officer for grievance ${g.id}`}
                        className="h-9 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 text-sm"
                        value={selectedOfficers[g.id] || g.assignedOfficerId || ''}
                        onChange={(event) => setSelectedOfficers((current) => ({
                          ...current,
                          [g.id]: event.target.value,
                        }))}
                        disabled={!officers.length || g.status === 'RESOLVED' || g.status === 'CLOSED'}
                      >
                        <option value="">Select officer</option>
                        {officers.map((officer) => (
                          <option key={officer.id} value={officer.id}>
                            {officer.name}{officer.departmentId ? ` — ${DEPARTMENT_NAMES[officer.departmentId] || officer.departmentId}` : ''}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        onClick={() => void assignGrievance(g.id)}
                        disabled={(!selectedOfficers[g.id] && !g.assignedOfficerId) || assigningId === g.id || g.status === 'RESOLVED' || g.status === 'CLOSED'}
                      >
                        {assigningId === g.id ? 'Saving…' : g.assignedOfficerId ? 'Reassign' : 'Assign'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
