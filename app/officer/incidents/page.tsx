'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Repeat, Users, MapPin, AlertCircle, ArrowRight } from 'lucide-react';
import { LoadingState, EmptyState } from '@/components/civic/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function IncidentsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/analytics/incidents');
        if (res.ok) {
          const data = await res.json();
          setIncidents(data.incidents || []);
        } else {
          // Mock data if endpoint not fully ready
          setIncidents([
            {
              id: 'inc-1',
              title: 'Major Water Pipe Burst',
              description: 'Multiple reports of flooding and no water pressure in Downtown area.',
              status: 'ACTIVE',
              severity: 'CRITICAL',
              category: 'Water Supply',
              complaintCount: 14,
              estimatedAffected: 500,
              location: 'Downtown District',
              relatedGrievanceIds: ['g1', 'g2', 'g3']
            },
            {
              id: 'inc-2',
              title: 'Streetlight Outage',
              description: 'Entire block on Maple St is dark.',
              status: 'INVESTIGATING',
              severity: 'MEDIUM',
              category: 'Electricity',
              complaintCount: 5,
              estimatedAffected: 50,
              location: 'Maple St, Westside',
              relatedGrievanceIds: ['g4', 'g5']
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching incidents:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <LoadingState message="Detecting recurring incidents..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Repeat className="h-6 w-6 text-indigo-500" /> Recurring Incidents
          </h1>
          <p className="text-slate-500">AI-detected clusters of related grievances representing larger issues.</p>
        </div>
        <Button>Create Master Incident</Button>
      </div>

      {incidents.length === 0 ? (
        <EmptyState 
          icon={<Repeat className="h-10 w-10 text-slate-300" />}
          title="No recurring incidents detected" 
          description="The AI hasn't found any significant clusters of related grievances."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {incidents.map((incident) => (
            <Card key={incident.id} className="border-slate-200 overflow-hidden">
              <div className={`h-2 w-full ${
                incident.severity === 'CRITICAL' ? 'bg-red-500' : 
                incident.severity === 'HIGH' ? 'bg-orange-500' : 
                'bg-amber-500'
              }`} />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="mb-2">{incident.category}</Badge>
                  <Badge variant={incident.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {incident.status}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{incident.title}</CardTitle>
                <CardDescription className="text-slate-700 mt-2 line-clamp-2">
                  {incident.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">{incident.location}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Reports</span>
                    <span className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                      {incident.complaintCount} <AlertCircle className="h-4 w-4 text-amber-500" />
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Est. Affected</span>
                    <span className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                      ~{incident.estimatedAffected} <Users className="h-4 w-4 text-blue-500" />
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 border-t border-slate-100 p-4">
                <Button variant="outline" className="w-full" onClick={() => router.push(`/officer/grievances?incident=${incident.id}`)}>
                  View {incident.complaintCount} Related Reports <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
