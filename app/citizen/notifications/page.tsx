'use client';

import { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, FileText, UserCheck, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingState, EmptyState } from '@/components/civic/shared';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  grievanceId?: string;
  read: boolean;
  createdAt: string;
}

const typeIcons: Record<string, any> = {
  complaint_received: FileText,
  complaint_assigned: UserCheck,
  status_updated: ArrowUpRight,
  info_requested: AlertTriangle,
  complaint_resolved: CheckCircle2,
  complaint_escalated: AlertTriangle,
  sla_warning: AlertTriangle,
  new_assignment: UserCheck,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((d) => { setNotifications(d.notifications || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (loading) return <LoadingState message="Loading notifications..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">{notifications.filter((n) => !n.read).length} unread</p>
        </div>
        {notifications.some((n) => !n.read) && (
          <Button variant="outline" size="sm" onClick={markAllRead}>Mark All Read</Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={<Bell className="size-12" />} title="No notifications" description="You'll be notified when there are updates to your grievances" />
      ) : (
        <div className="rounded-xl border bg-card shadow-sm divide-y">
          {notifications.map((n) => {
            const Icon = typeIcons[n.type] || Bell;
            return (
              <div key={n.id} className={cn('flex gap-3 px-5 py-4 transition-colors', !n.read && 'bg-primary/[0.03]')}>
                <div className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full', !n.read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm', !n.read ? 'font-semibold' : 'font-medium')}>{n.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString('en-IN')}</p>
                </div>
                {n.grievanceId && (
                  <Link href={`/citizen/grievances/${n.grievanceId}`} className="self-center text-xs font-medium text-primary hover:underline">
                    View →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
