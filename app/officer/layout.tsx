'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Zap, 
  UserCheck, 
  AlertTriangle, 
  Repeat, 
  BarChart3, 
  LogOut,
  Menu,
  Bell,
  ShieldAlert,
  Search,
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AIChatWidget } from '@/components/civic/ai-chat-drawer';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
}

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user.role !== 'officer') {
            router.push(data.user.role === 'admin' ? '/admin/dashboard' : '/login');
          } else {
            setUser(data.user);
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/officer/dashboard' },
    { name: 'Grievances', icon: FolderOpen, href: '/officer/grievances' },
    { name: 'Priority Queue', icon: Zap, href: '/officer/dashboard#priority-queue' },
    { name: 'AI Copilot', icon: Brain, href: '/officer/copilot', isAI: true },
    { name: 'Assigned to Me', icon: UserCheck, href: '/officer/assigned' },
    { name: 'Escalations', icon: AlertTriangle, href: '/officer/escalations' },
    { name: 'Recurring Issues', icon: Repeat, disabled: true },
    { name: 'Analytics', icon: BarChart3, disabled: true },
    { name: 'Profile', icon: UserCheck, disabled: true },
  ];

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-background"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 py-4 border-b border-sidebar-border bg-sidebar">
          <Link href="/officer/dashboard" className="flex items-center space-x-2">
            <ShieldAlert className="h-6 w-6 text-indigo-500" />
            <span className="text-xl font-bold text-white tracking-tight">CivicResolve</span>
          </Link>
          <Badge variant="secondary" className="bg-indigo-900/50 text-indigo-300 border-indigo-800/50 text-[10px] uppercase hidden sm:flex">Officer Portal</Badge>
        </div>

        <div className="p-4">
          <div className="mb-6 rounded-lg bg-slate-800/50 p-3 border border-slate-700/50">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 border border-slate-600">
                <AvatarFallback className="bg-indigo-900 text-indigo-100">{user?.name?.charAt(0) || 'O'}</AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-medium text-white">{user?.name || 'Officer'}</p>
                <p className="truncate text-xs text-slate-400">{user?.department || 'Department not assigned'}</p>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.href
                ? pathname === item.href.split('#')[0] || pathname.startsWith(`${item.href.split('#')[0]}/`)
                : false;
              const className = `flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                  : item.disabled
                    ? 'cursor-not-allowed text-slate-600'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`;
              const contents = (
                <>
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span>{item.name}</span>
                  {item.isAI && (
                    <Badge className="ml-auto bg-indigo-500/20 text-indigo-300 text-[9px] px-1.5 py-0 border-indigo-500/30">
                      Copilot
                    </Badge>
                  )}
                  {item.disabled && (
                    <Badge variant="secondary" className="ml-auto text-[9px]">Coming soon</Badge>
                  )}
                </>
              );
              return item.href ? (
                <Link
                  key={item.name}
                  href={item.href}
                  className={className}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {contents}
                </Link>
              ) : (
                <div key={item.name} className={className} aria-disabled="true">
                  {contents}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full border-t border-slate-800 p-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-400 hover:bg-slate-800 hover:text-white"
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/');
            }}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6 shadow-sm z-10">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="mr-4 text-slate-500 hover:text-slate-700 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden sm:flex items-center text-sm text-slate-500 font-medium">
              <span className="text-indigo-600 uppercase text-xs tracking-wider font-bold bg-indigo-50 px-2 py-1 rounded">Officer Portal</span>
              <span className="mx-2">•</span>
              <span>{user?.department || 'Field Response Unit'}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              href="/officer/copilot"
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-200 hover:bg-indigo-100 transition-colors"
            >
              <Brain className="size-3.5 text-indigo-600" />
              <span>AI Copilot</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8 relative">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Global Officer AI Copilot Floating Drawer */}
      <AIChatWidget portalRole="officer" userName={user?.name} />
    </div>
  );
}
