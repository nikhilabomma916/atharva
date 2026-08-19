'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { DEPARTMENT_NAMES } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';

interface OfficerData {
  id: string;
  name: string;
  email: string;
  departmentId?: string;
  role?: string;
  status?: string;
  openCases: number;
  resolvedToday?: number;
}

export default function OfficersPage() {
  const [officers, setOfficers] = useState<OfficerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        const response = await fetch('/api/officers');
        if (response.ok) {
          const result = await response.json();
          setOfficers(result);
        }
      } catch (error) {
        console.error('Failed to fetch officers', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOfficers();
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
      <h1 className="text-3xl font-bold tracking-tight">Officers Management</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>All Officers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {officers.map((officer) => (
                <TableRow key={officer.id}>
                  <TableCell className="font-medium">{officer.name}</TableCell>
                  <TableCell>{officer.departmentId ? (DEPARTMENT_NAMES[officer.departmentId] || officer.departmentId) : 'General / Field Officer'}</TableCell>
                  <TableCell className="capitalize">{(officer.role || 'Officer').replace('_', ' ')}</TableCell>
                  <TableCell>
                    <Badge variant={(officer.status || 'active') === 'active' ? 'default' : 'secondary'}>
                      {officer.status || 'active'}
                    </Badge>
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
