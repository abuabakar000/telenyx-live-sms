'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  MessageSquare, 
  Send,
  LogOut, 
  Menu, 
  X,
  User
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeletons';
import { Logo } from '@/components/ui/Logo';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'SMS Inbox', href: '/', icon: MessageSquare },
    { name: 'Direct SMS', href: '/send', icon: Send },
  ];

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  const isLoading = status === 'loading';

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 glass-panel border-r border-zinc-900 z-20 flex-shrink-0">
        {/* Brand Header */}
        <div className="flex items-center px-6 h-16 border-b border-zinc-900 bg-black/20">
          <Logo size="sm" />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 group relative border',
                  isActive
                    ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border-transparent'
                )}
              >
                <Icon className={cn('h-4 w-4 transition-transform duration-200 group-hover:scale-110', isActive ? 'text-red-400' : 'text-zinc-400 group-hover:text-zinc-300')} />
                <span>{item.name}</span>
                {isActive && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-red-500 shadow-md shadow-red-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-950/40 backdrop-blur-md">
          {isLoading ? (
            <div className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-2 w-28" />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center border border-slate-700/50 shadow flex-shrink-0">
                  <span className="text-sm font-semibold text-slate-200">
                    {getInitials(session?.user?.name || 'Inex Admin')}
                  </span>
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-semibold text-slate-200 truncate leading-none mb-1">
                    {session?.user?.name || 'Inex Admin'}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate leading-none font-medium">
                    {session?.user?.email || 'admin@inexlabs.com'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        <header className="flex md:hidden items-center justify-between px-6 h-16 border-b border-zinc-900 glass-panel z-30 flex-shrink-0">
          <div className="flex items-center">
            <Logo size="sm" />
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition-colors cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Content Drawer */}
            <div className="relative flex flex-col w-72 max-w-xs bg-slate-950 border-r border-slate-800/80 p-6 z-50 animate-slide-in-right">
              <div className="flex items-center justify-between mb-8">
                <span className="font-bold text-sm tracking-wide uppercase text-slate-100">Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 space-y-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 border',
                        isActive
                          ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border-transparent'
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* User Profile / Logout */}
              <div className="pt-6 border-t border-slate-800/60 mt-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700/60">
                      <User className="h-4.5 w-4.5 text-slate-300" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-semibold text-slate-200 truncate leading-none mb-1">
                        {session?.user?.name || 'Inex Admin'}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate leading-none">
                        {session?.user?.email || 'admin@inexlabs.com'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20 transition-all text-xs font-semibold uppercase tracking-wider cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Main Area */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}
