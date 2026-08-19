'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield, LayoutDashboard, FileText, FolderOpen,
  Bell, User, LogOut, Menu, X, ChevronRight, Bot, Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AIChatWidget } from '@/components/civic/ai-chat-drawer';

const navItems = [
  { href: '/citizen/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/citizen/submit', label: 'Submit Grievance', icon: FileText },
  { href: '/citizen/grievances', label: 'My Grievances', icon: FolderOpen },
  { href: '/citizen/assistant', label: 'AI Civic Mitra', icon: Bot, isNew: true },
  { href: '/citizen/notifications', label: 'Notifications', icon: Bell },
];

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => { if (d.user) setUser(d.user); })
      .catch(() => {});
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((d) => { if (d.notifications) setUnreadCount(d.notifications.filter((n: { read: boolean }) => !n.read).length); })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Shield className="size-4 text-sidebar-primary-foreground" />
          </div>
          <div>
            <span className="text-sm font-bold text-sidebar-foreground">CivicResolve</span>
            <span className="ml-0.5 text-sm font-bold text-sidebar-primary">AI</span>
          </div>
          <Button variant="ghost" size="icon-sm" className="ml-auto text-sidebar-foreground lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="size-4" />
          </Button>
        </div>

        {/* User info */}
        <div className="border-b border-sidebar-border px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
              {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{user?.name || 'Citizen User'}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">Citizen Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className={cn('size-4', isActive ? 'text-sidebar-primary' : '')} />
                {item.label}
                {item.isNew && (
                  <Badge className="ml-auto bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[9px] px-1.5 py-0 border-indigo-500/30">
                    AI Mitra
                  </Badge>
                )}
                {item.label === 'Notifications' && unreadCount > 0 && (
                  <Badge className="ml-auto bg-sidebar-primary text-sidebar-primary-foreground text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
                    {unreadCount}
                  </Badge>
                )}
                {isActive && <ChevronRight className="ml-auto size-3.5 text-sidebar-primary" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <LogOut className="size-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md lg:px-6">
          <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="size-5" />
          </Button>
          <div className="flex-1" />
          <Link href="/citizen/assistant" className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800">
            <Brain className="size-3.5" />
            <span>AI Assistant</span>
          </Link>
          <Link href="/citizen/notifications" className="relative">
            <Bell className="size-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 relative">
          {children}
        </main>
      </div>

      {/* Global Floating AI Chat Widget */}
      <AIChatWidget portalRole="citizen" userName={user?.name} />
    </div>
  );
}
