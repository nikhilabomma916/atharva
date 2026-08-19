'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, Search } from 'lucide-react';
import { PriorityBadge, StatusBadge, SLAIndicator, LoadingState, EmptyState } from '@/components/civic/shared';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AssignedPage() {
  const router = useRouter();
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // In a real app we'd pass ?assigned=true and it would use the logged in officer's ID
        const res = await fetch('/api/grievances');
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.grievances || []);
          // For now, simulate assigned filter by picking random ones or all
          setGrievances(items.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching assigned grievances:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <LoadingState message="Loading your assignments..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-indigo-500" /> Assigned to Me
          </h1>
          <p className="text-slate-500">Cases currently assigned to you for resolution.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Complaint</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>SLA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grievances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <EmptyState title="No assigned cases" description="You have no active assignments right now." />
                </TableCell>
              </TableRow>
            ) : (
              grievances.map((grievance) => (
                <TableRow 
                  key={grievance.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => router.push(`/officer/grievances/${grievance.id}`)}
                >
                  <TableCell className="font-mono text-xs text-slate-500">
                    {grievance.id.substring(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900 truncate max-w-xs">{grievance.title}</div>
                    <div className="text-xs text-slate-500 truncate max-w-xs">{grievance.location.address}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={grievance.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge level={grievance.priority} />
                  </TableCell>
                  <TableCell>
                    {grievance.slaDeadline ? (
                      <SLAIndicator deadline={grievance.slaDeadline} />
                    ) : (
                      <span className="text-slate-400 text-sm">None</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
