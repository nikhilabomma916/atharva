'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { Grievance } from '@/lib/types';
import { format } from 'date-fns';
import { PriorityBadge, StatusBadge } from '@/components/civic/shared';
import { DEPARTMENT_NAMES, CATEGORY_NAMES } from '@/lib/constants';

export default function GrievancesPage() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrievances = async () => {
      try {
        const response = await fetch('/api/grievances');
        if (response.ok) {
          const result = await response.json();
          setGrievances(result);
        }
      } catch (error) {
        console.error('Failed to fetch grievances', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGrievances();
  }, []);

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {grievances.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-mono text-xs">{g.id.substring(0, 8)}</TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">{g.title}</TableCell>
                  <TableCell>{CATEGORY_NAMES[g.categoryId] || g.categoryId || g.category || 'Other'}</TableCell>
                  <TableCell>{g.departmentId ? (DEPARTMENT_NAMES[g.departmentId] || g.departmentId) : 'Unassigned'}</TableCell>
                  <TableCell><PriorityBadge level={g.priorityLevel || g.priority || 'MEDIUM'} score={g.priorityScore} /></TableCell>
                  <TableCell><StatusBadge status={g.status} /></TableCell>
                  <TableCell>{format(new Date(g.createdAt), 'MMM d, yyyy')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
