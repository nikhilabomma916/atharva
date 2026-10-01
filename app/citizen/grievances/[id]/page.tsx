'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Brain, MapPin, Clock, Users, Building2,
  AlertTriangle, CheckCircle2, MessageSquare, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { PriorityBadge, StatusBadge, SLAIndicator, LoadingState, ErrorState } from '@/components/civic/shared';
import { buildGrievanceAnalysisSummary } from '@/lib/ai/priority-engine';
import type { PriorityLevel, UrgencyLevel } from '@/lib/types';

interface GrievanceDetail {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  status: string;
  priorityScore?: number;
  priorityLevel?: PriorityLevel;
  location: { address?: string; area?: string; ward?: string; city?: string };
  duration?: string;
  affectedCount?: number;
  slaDeadline?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  departmentId?: string;
}

interface Analysis {
  summary: string;
  category: string;
  urgency: UrgencyLevel;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  safetyRisk: boolean;
  reasoning: string[];
  confidence?: number;
  aiProvider?: 'ollama' | 'fallback';
}

interface StatusEntry {
  toStatus: string;
  timestamp: string;
  note?: string;
}

interface Update {
  message: string;
  createdAt: string;
}

const categoryNames: Record<string, string> = {
  'cat-water': 'Water Supply', 'cat-roads': 'Roads & Infrastructure', 'cat-electricity': 'Electricity',
  'cat-waste': 'Waste Management', 'cat-sanitation': 'Sanitation', 'cat-safety': 'Public Safety',
  'cat-transport': 'Transport', 'cat-healthcare': 'Healthcare', 'cat-education': 'Education',
  'cat-permits': 'Permits & Licenses', 'cat-infrastructure': 'Infrastructure', 'cat-benefits': 'Government Benefits', 'cat-other': 'Other',
};

const deptNames: Record<string, string> = {
  'dept-water': 'Water Supply Department', 'dept-roads': 'Roads & Infrastructure', 'dept-sanitation': 'Sanitation Department',
  'dept-electrical': 'Electrical Department', 'dept-safety': 'Public Safety', 'dept-healthcare': 'Healthcare Services',
  'dept-education': 'Education Department', 'dept-transport': 'Transport Authority',
};

const statusOrder = ['SUBMITTED', 'AI_ANALYZED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default function GrievanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<{
    grievance: GrievanceDetail;
    analysis?: Analysis;
    statusHistory: StatusEntry[];
    citizenUpdates: Update[];
    feedback?: { rating: number; comment?: string };
    duplicates?: { grievanceId: string; similarity: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/grievances/${params.id}`)
      .then((r) => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then((d) => {
        const payload = d?.grievance ? d : { grievance: d };
        const normalized = {
          grievance: payload.grievance,
          analysis: payload.analysis,
          statusHistory: payload.statusHistory ?? [],
          citizenUpdates: payload.citizenUpdates ?? payload.updates ?? [],
          feedback: payload.feedback,
          duplicates: payload.duplicates ?? []
        };

        setData(normalized);
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [params.id]);

  const handleFeedback = async () => {
    if (feedbackRating === 0 || !data) return;
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grievanceId: data.grievance.id, rating: feedbackRating, comment: feedbackComment }),
      });
      setFeedbackSubmitted(true);
    } catch { /* ignore */ }
  };

  if (loading) return <LoadingState message="Loading grievance details..." />;
  if (error || !data) return <ErrorState title="Grievance not found" message="The grievance could not be loaded" onRetry={() => router.back()} />;

  const g = data.grievance;
  const currentStepIndex = statusOrder.indexOf(g.status);

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-primary">{g.id}</span>
            <StatusBadge status={g.status as any} />
            {g.priorityLevel && <PriorityBadge level={g.priorityLevel as any} score={g.priorityScore} />}
          </div>
          <h1 className="mt-1 text-xl font-bold">{g.title}</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Complaint */}
          <Card>
            <CardHeader><CardTitle className="text-base">Complaint Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">{g.description}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2"><span className="text-muted-foreground">Category:</span><span className="font-medium">{categoryNames[g.categoryId] || g.categoryId}</span></div>
                {g.location?.ward && <div className="flex items-center gap-2"><MapPin className="size-3.5 text-muted-foreground" /><span>{g.location.ward}, {g.location.area || g.location.city}</span></div>}
                {g.duration && <div className="flex items-center gap-2"><Clock className="size-3.5 text-muted-foreground" /><span>{g.duration}</span></div>}
                {g.affectedCount && <div className="flex items-center gap-2"><Users className="size-3.5 text-muted-foreground" /><span>{g.affectedCount} affected</span></div>}
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis */}
          {data.analysis && (
            <Card className="border-primary/20 bg-primary/[0.02]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="size-4 text-primary" />
                  AI Analysis
                  {data.analysis.aiProvider && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-normal text-primary">
                      {data.analysis.aiProvider === 'ollama' ? 'AI' : 'Rule-based'}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {buildGrievanceAnalysisSummary(data.analysis, g.priorityLevel && g.priorityScore !== undefined
                    ? { level: g.priorityLevel, score: g.priorityScore }
                    : undefined)}
                </p>
                {data.analysis.safetyRisk && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-400">
                    <AlertTriangle className="size-4" />
                    Safety risk identified
                  </div>
                )}
                {data.analysis.reasoning.length > 0 && (
                  <ul className="space-y-1">
                    {data.analysis.reasoning.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-0.5 text-primary">•</span>{r}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          {/* Duplicates */}
          {data.duplicates && data.duplicates.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="size-4" />
                  Similar Complaints Detected ({data.duplicates.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your complaint appears similar to {data.duplicates.length} other{data.duplicates.length > 1 ? ' complaints' : ' complaint'}.
                  This may indicate a wider issue being tracked by the department.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Updates */}
          {data.citizenUpdates.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="size-4" /> Updates</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.citizenUpdates.map((u, i) => (
                    <div key={i} className="rounded-lg bg-muted/50 p-3">
                      <p className="text-sm">{u.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feedback */}
          {g.status === 'RESOLVED' && !data.feedback && !feedbackSubmitted && (
            <Card>
              <CardHeader><CardTitle className="text-base">Was your issue resolved?</CardTitle></CardHeader>
              <CardContent>
                {!showFeedback ? (
                  <Button variant="outline" onClick={() => setShowFeedback(true)} className="gap-2">
                    <Star className="size-4" /> Give Feedback
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} onClick={() => setFeedbackRating(n)} className={`flex size-10 items-center justify-center rounded-lg border text-lg transition-all ${feedbackRating >= n ? 'border-amber-400 bg-amber-50 text-amber-500' : 'hover:border-amber-300'}`}>
                          ★
                        </button>
                      ))}
                    </div>
                    <Textarea placeholder="Additional comments (optional)" value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} rows={3} />
                    <Button onClick={handleFeedback} disabled={feedbackRating === 0}>Submit Feedback</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {feedbackSubmitted && (
            <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10">
              <CardContent className="flex items-center gap-3 py-4">
                <CheckCircle2 className="size-5 text-emerald-500" />
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Thank you for your feedback!</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status Timeline */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Status Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-0">
                {statusOrder.map((status, i) => {
                  const reached = i <= currentStepIndex;
                  const entry = data.statusHistory.find((h) => h.toStatus === status);
                  return (
                    <div key={status} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`flex size-6 items-center justify-center rounded-full ${reached ? 'bg-primary text-primary-foreground' : 'border-2 bg-background'}`}>
                          {reached && <CheckCircle2 className="size-3.5" />}
                        </div>
                        {i < statusOrder.length - 1 && (
                          <div className={`w-0.5 flex-1 min-h-[24px] ${i < currentStepIndex ? 'bg-primary' : 'bg-border'}`} />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className={`text-sm font-medium ${reached ? '' : 'text-muted-foreground'}`}>
                          {status.replace(/_/g, ' ')}
                        </p>
                        {entry && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* SLA */}
          {g.slaDeadline && (
            <Card>
              <CardHeader><CardTitle className="text-sm">SLA Deadline</CardTitle></CardHeader>
              <CardContent>
                <SLAIndicator deadline={g.slaDeadline} />
                <p className="mt-2 text-xs text-muted-foreground">
                  Deadline: {new Date(g.slaDeadline).toLocaleString('en-IN')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Department */}
          {g.departmentId && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Assigned Department</CardTitle></CardHeader>
              <CardContent className="flex items-center gap-2 text-sm">
                <Building2 className="size-4 text-primary" />
                <span className="font-medium">{deptNames[g.departmentId] || g.departmentId}</span>
              </CardContent>
            </Card>
          )}

          {/* Info */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Submitted</span><span>{new Date(g.createdAt).toLocaleDateString('en-IN')}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">Last Updated</span><span>{new Date(g.updatedAt).toLocaleDateString('en-IN')}</span></div>
              {g.resolvedAt && <>
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">Resolved</span><span>{new Date(g.resolvedAt).toLocaleDateString('en-IN')}</span></div>
              </>}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            AI assists authorized officers. Final decisions remain with authorized human officials.
          </p>
        </div>
      </div>
    </div>
  );
}
