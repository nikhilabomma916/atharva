'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FolderOpen, Building2, Users, Repeat, BarChart3, Clock, BookOpen, FileText, Menu, Settings, Bell, Search, Brain, Activity, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AIChatWidget } from '@/components/civic/ai-chat-drawer';

const navItems = [
  { title: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'AI Monitoring', href: '/admin/monitoring', icon: Activity, isAI: true },
  { title: 'Grievances', href: '/admin/grievances', icon: FolderOpen },
  { title: 'Departments', href: '/admin/departments', icon: Building2 },
  { title: 'Officers', href: '/admin/officers', icon: Users },
  { title: 'Recurring Issues', href: '/admin/incidents', icon: Repeat },
  { title: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { title: 'SLA Management', href: '/admin/sla', icon: Clock },
  { title: 'Knowledge Base', href: '/admin/knowledge', icon: BookOpen },
  { title: 'Audit Logs', href: '/admin/audit', icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function verifyAdmin() {
      try {
        const response = await fetch('/api/auth/me');
        const result = await response.json();
        if (!response.ok || result.user?.role !== 'admin') {
          router.replace(result.user?.role === 'officer' ? '/officer/dashboard' : '/login');
          return;
        }
        setIsAdmin(true);
      } catch (error) {
        console.error('Admin authorization check failed:', error);
        router.replace('/login');
      } finally {
        setAuthLoading(false);
      }
    }
    void verifyAdmin();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center">Loading admin portal...</div>;
  }
  if (!isAdmin) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar (Mobile) */}
      <div className={cn("fixed inset-0 z-50 bg-black/50 lg:hidden", sidebarOpen ? "block" : "hidden")} onClick={() => setSidebarOpen(false)} />
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0 flex flex-col", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-16 items-center px-6 border-b border-slate-800 shrink-0">
          <Brain className="h-6 w-6 text-blue-400 mr-2" />
          <h1 className="text-xl font-bold">CivicResolve</h1>
        </div>
        <div className="px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center text-sm font-bold mr-3">
              A
            </div>
            <div>
              <p className="text-sm font-medium">System Admin</p>
              <p className="text-xs text-slate-400">Admin Command Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-slate-800 text-white font-semibold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className={cn("h-5 w-5 mr-3 shrink-0", isActive ? "text-blue-400" : "text-slate-400")} />
                <span className="flex-1">{item.title}</span>
                {item.isAI && (
                  <Badge className="bg-indigo-500/20 text-indigo-300 text-[9px] px-1.5 py-0 border-indigo-500/30">
                    Live
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-800">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-slate-400 hover:bg-slate-800 hover:text-white text-sm"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b bg-background flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
          <div className="flex items-center flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mr-4"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="max-w-md w-full hidden sm:block relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search system grievances or anomalies..."
                className="w-full pl-9 bg-slate-100 dark:bg-slate-800 border-none"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="/admin/monitoring"
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800"
            >
              <Activity className="size-3.5 text-indigo-600 animate-pulse" />
              <span>AI Monitoring Center</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 relative">
          {children}
        </div>

        {/* Global Admin Copilot Floating Drawer */}
        <AIChatWidget portalRole="admin" userName="System Admin" />
      </main>
    </div>
  );
}
