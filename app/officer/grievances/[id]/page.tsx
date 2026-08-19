'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { 
  ArrowLeft, Brain, Check, AlertTriangle, FileText, 
  MapPin, Clock, Users, Zap, Shield, Repeat, Plus, AlertCircle
} from 'lucide-react';
import { PriorityBadge, StatusBadge, SLAIndicator, LoadingState, EmptyState } from '@/components/civic/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function GrievanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [modification, setModification] = useState('');
  const [showModification, setShowModification] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/grievances/${id}`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (error) {
        console.error('Error fetching grievance:', error);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/grievances/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setData((prev: any) => ({ ...prev, grievance: updated.grievance }));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/grievances/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent, isInternal: true })
      });
      if (res.ok) {
        setNoteContent('');
        // Refetch to get updated notes
        const freshRes = await fetch(`/api/grievances/${id}`);
        if (freshRes.ok) {
          setData(await freshRes.json());
        }
      }
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAiDecision = async (decision: 'ACCEPT' | 'MODIFY' | 'REJECT') => {
    if (decision === 'MODIFY' && !showModification) {
      setShowModification(true);
      return;
    }

    setActionLoading(true);
    try {
      const payload: any = { decision };
      if (decision === 'MODIFY') payload.modification = modification;

      const res = await fetch(`/api/grievances/${id}/recommendation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setShowModification(false);
        // Refresh data
        const freshRes = await fetch(`/api/grievances/${id}`);
        if (freshRes.ok) setData(await freshRes.json());
      }
    } catch (error) {
      console.error('Error processing AI decision:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingState message="Loading grievance details..." />;
  if (!data || !data.grievance) return <EmptyState title="Not Found" description="The grievance could not be found." />;

  const { grievance, analysis, recommendation, internalNotes, statusHistory, duplicates } = data;
  const score = analysis?.priorityScore || 0;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      {/* 1. Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-500 font-mono">
              <span>{grievance.id}</span>
              <span>•</span>
              <span>{format(new Date(grievance.createdAt), 'MMM d, yyyy h:mm a')}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{grievance.title}</h1>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex gap-2">
              <PriorityBadge level={grievance.priority} score={score} />
              <StatusBadge status={grievance.status} />
            </div>
            {grievance.slaDeadline && <SLAIndicator deadline={grievance.slaDeadline} />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* 2. Complaint Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-500" />
                Complaint Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-md text-slate-700 whitespace-pre-wrap text-sm border border-slate-100">
                {grievance.description}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 font-medium">Category</div>
                  <div className="text-sm font-medium">{grievance.category}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 font-medium">Location</div>
                  <div className="text-sm font-medium flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span className="truncate" title={grievance.location.address}>{grievance.location.address}</span>
                  </div>
                </div>
                {grievance.metadata?.duration && (
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500 font-medium">Duration</div>
                    <div className="text-sm font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {grievance.metadata.duration}
                    </div>
                  </div>
                )}
                {grievance.metadata?.affectedCount && (
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500 font-medium">Affected</div>
                    <div className="text-sm font-medium flex items-center gap-1">
                      <Users className="h-3 w-3 text-slate-400" />
                      ~{grievance.metadata.affectedCount}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 3 & 4. AI Summary and Priority Breakdown */}
          {analysis && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card className="border-indigo-100 bg-indigo-50/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-indigo-900">
                    <Brain className="h-4 w-4 text-indigo-500" /> AI Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700 mb-3">{analysis.summary}</p>
                  <div className="space-y-1">
                    {analysis.keyFindings?.map((finding: string, i: number) => (
                      <div key={i} className="flex gap-2 text-xs text-slate-600">
                        <span className="text-indigo-400">•</span> {finding}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" /> Priority Score: {score}/100
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Severity</span>
                      <span className="font-medium text-red-600">High</span>
                    </div>
                    <Progress value={85} className="h-1.5 bg-slate-100 [&>div]:bg-red-500" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Impact</span>
                      <span className="font-medium text-amber-600">Medium</span>
                    </div>
                    <Progress value={60} className="h-1.5 bg-slate-100 [&>div]:bg-amber-500" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Urgency</span>
                      <span className="font-medium text-red-600">High</span>
                    </div>
                    <Progress value={75} className="h-1.5 bg-slate-100 [&>div]:bg-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 7. AI Resolution Assistant (KEY FEATURE) */}
          {recommendation && (
            <Card className="border-indigo-200 shadow-sm overflow-hidden">
              <div className="bg-indigo-600 px-4 py-3 text-white flex justify-between items-center">
                <div className="flex items-center gap-2 font-medium">
                  <Brain className="h-5 w-5" />
                  AI Resolution Assistant
                </div>
                {recommendation.confidence && (
                  <div className="flex items-center gap-1.5 text-xs bg-indigo-500/50 px-2 py-1 rounded">
                    <span>Confidence:</span>
                    <span className="font-bold">{Math.round(recommendation.confidence * 100)}%</span>
                  </div>
                )}
              </div>
              
              <CardContent className="p-0">
                <div className="p-5 space-y-5">
                  <div className="bg-indigo-50/50 p-4 rounded-md border border-indigo-100 text-sm text-indigo-900">
                    {recommendation.summary}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Recommended Actions</h4>
                      <div className="space-y-3">
                        {recommendation.recommendedActions?.map((action: any, i: number) => (
                          <div key={i} className="flex gap-3 text-sm">
                            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200">
                              {i + 1}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{action.action}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{action.department}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {recommendation.suggestedCitizenResponse && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Draft Citizen Response</h4>
                          <div className="bg-slate-50 p-3 rounded text-sm text-slate-700 italic border border-slate-100 relative">
                            "{recommendation.suggestedCitizenResponse}"
                          </div>
                        </div>
                      )}

                      {recommendation.escalationRecommended && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded text-sm">
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                          <div>
                            <div className="font-semibold text-red-800">Escalation Recommended</div>
                            <div className="text-red-700 text-xs mt-1">{recommendation.escalationReason}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {showModification && (
                    <div className="mt-4 p-4 border border-amber-200 bg-amber-50 rounded-lg">
                      <h4 className="text-sm font-medium text-amber-800 mb-2">Modification Instructions</h4>
                      <Textarea 
                        placeholder="E.g., Require site visit before dispatching repair crew, or update citizen response to mention a 48-hour delay."
                        className="bg-white text-sm min-h-[100px]"
                        value={modification}
                        onChange={(e) => setModification(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                
                <div className="bg-slate-50 border-t border-slate-100 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 max-w-sm">
                    <Shield className="h-3 w-3" />
                    AI assists authorized officers. Final decisions remain with authorized human officials.
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleAiDecision('REJECT')}
                      disabled={actionLoading}
                    >
                      Reject
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                      onClick={() => handleAiDecision('MODIFY')}
                      disabled={actionLoading}
                    >
                      Modify
                    </Button>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleAiDecision('ACCEPT')}
                      disabled={actionLoading}
                    >
                      <Check className="mr-2 h-4 w-4" /> Accept & Apply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 10. Internal Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Internal Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {internalNotes?.length > 0 ? (
                <div className="space-y-4">
                  {internalNotes.map((note: any, i: number) => (
                    <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                        {note.authorId?.substring(0, 2).toUpperCase() || 'O'}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-sm font-medium text-slate-900">Officer {note.authorId}</span>
                          <span className="text-xs text-slate-500">{format(new Date(note.createdAt), 'MMM d, h:mm a')}</span>
                        </div>
                        <p className="text-sm text-slate-700">{note.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-slate-500">No internal notes yet.</div>
              )}

              <div className="pt-2">
                <Textarea 
                  placeholder="Add an internal note (not visible to citizen)..." 
                  className="mb-2 text-sm"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleAddNote} disabled={actionLoading || !noteContent.trim()}>
                    <Plus className="mr-2 h-4 w-4" /> Add Note
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* 11. Status Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant={grievance.status === 'IN_PROGRESS' ? 'secondary' : 'outline'} 
                className="w-full justify-start"
                onClick={() => handleStatusChange('IN_PROGRESS')}
                disabled={actionLoading || grievance.status === 'IN_PROGRESS'}
              >
                <Clock className="mr-2 h-4 w-4 text-blue-500" /> Mark In Progress
              </Button>
              <Button 
                variant={grievance.status === 'RESOLVED' ? 'secondary' : 'outline'} 
                className="w-full justify-start"
                onClick={() => handleStatusChange('RESOLVED')}
                disabled={actionLoading || grievance.status === 'RESOLVED'}
              >
                <Check className="mr-2 h-4 w-4 text-emerald-500" /> Resolve Issue
              </Button>
              <Button 
                variant={grievance.status === 'ESCALATED' ? 'secondary' : 'outline'} 
                className="w-full justify-start border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={() => handleStatusChange('ESCALATED')}
                disabled={actionLoading || grievance.status === 'ESCALATED'}
              >
                <AlertTriangle className="mr-2 h-4 w-4 text-red-500" /> Escalate
              </Button>
            </CardContent>
          </Card>

          {/* 9. Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-500" /> Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-medium">Department</div>
                <div className="text-sm font-medium">{grievance.department || 'Unassigned'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-medium">Officer</div>
                <div className="text-sm font-medium">{grievance.assignedTo || 'Unassigned'}</div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-2">
                Reassign
              </Button>
            </CardContent>
          </Card>

          {/* 5. Similar Complaints */}
          {duplicates && duplicates.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-slate-500" /> Similar Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {duplicates.map((dup: any) => (
                    <div key={dup.id} className="flex flex-col p-2 bg-slate-50 rounded border border-slate-100 text-sm cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => router.push(`/officer/grievances/${dup.id}`)}>
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs text-slate-500">{dup.id.substring(0, 8)}</span>
                        <Badge variant="outline" className="text-[10px]">{Math.round(dup.similarity * 100)}% match</Badge>
                      </div>
                      <span className="truncate font-medium mt-1 text-slate-900">{dup.title}</span>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-slate-500 truncate max-w-[120px]">{dup.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* 12. Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {statusHistory?.map((history: any, i: number) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded border border-slate-200 bg-white shadow-sm">
                      <div className="flex justify-between mb-1">
                        <div className="font-semibold text-slate-900 text-sm">{history.to}</div>
                        <time className="font-mono text-xs text-slate-500">{format(new Date(history.createdAt), 'MMM d')}</time>
                      </div>
                      <div className="text-xs text-slate-500">Status updated</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
