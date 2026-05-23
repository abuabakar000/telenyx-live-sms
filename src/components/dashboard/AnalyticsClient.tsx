'use client';

import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Send, 
  Inbox, 
  TrendingUp, 
  MessageSquare, 
  ArrowUpRight,
  Clock,
  ArrowDownLeft,
  Calendar,
  Sparkles
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface AnalyticsClientProps {
  analytics: {
    sentToday: number;
    receivedToday: number;
    deliveryRate: number;
    activeConversations: number;
    recentActivity: any[];
    chartData: any[];
  };
}

export default function AnalyticsClient({ analytics }: AnalyticsClientProps) {
  const stats = [
    {
      name: 'Messages Sent Today',
      value: analytics.sentToday,
      change: '+12% from yesterday',
      changeType: 'increase',
      icon: Send,
      gradient: 'from-blue-600/20 to-indigo-600/10 border-blue-500/20 text-blue-400',
    },
    {
      name: 'Messages Received Today',
      value: analytics.receivedToday,
      change: '+8% from yesterday',
      changeType: 'increase',
      icon: Inbox,
      gradient: 'from-emerald-600/20 to-teal-600/10 border-emerald-500/20 text-emerald-400',
    },
    {
      name: 'Delivery Rate',
      value: `${analytics.deliveryRate}%`,
      change: 'Constant (High)',
      changeType: 'neutral',
      icon: TrendingUp,
      gradient: 'from-purple-600/20 to-fuchsia-600/10 border-purple-500/20 text-purple-400',
    },
    {
      name: 'Active Conversations',
      value: analytics.activeConversations,
      change: '24h active chats count',
      changeType: 'info',
      icon: MessageSquare,
      gradient: 'from-amber-600/20 to-orange-600/10 border-amber-500/20 text-amber-400',
    },
  ];

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 space-y-6">
      {/* Welcome banner header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-blue-500 animate-pulse" />
            <span>CRM Analytics Overview</span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time statistics on inbound/outbound SMS throughput, delivery performance, and recent inbox activity.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/40 border border-slate-800/60 px-3 py-1.5 rounded-lg backdrop-blur-sm self-start">
          <Calendar className="h-4 w-4 text-slate-500" />
          <span className="font-semibold uppercase tracking-wider text-[10px]">Active Session</span>
        </div>
      </div>

      {/* Summary stats grid layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.name} className={cn('glass-panel hover:scale-[1.02] transition-transform duration-300 flex flex-col justify-between border', item.gradient)}>
              <div className="flex items-center justify-between pb-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {item.name}
                </span>
                <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/30">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-extrabold tracking-tight text-slate-100 block">
                  {item.value}
                </span>
                <span className="text-[10px] text-slate-500 font-medium block mt-1">
                  {item.change}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Chart and Recent activity split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts chart area (2 cols) */}
        <Card className="glass-panel border-slate-800/80 shadow-xl lg:col-span-2 flex flex-col justify-between h-[360px]">
          <CardHeader className="pb-2 border-b border-slate-850">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-200">
              SMS Throughput History (Past 7 Days)
            </CardTitle>
            <CardDescription className="text-xs">
              Daily chart metrics comparing Sent (outbound) vs Received (inbound) messages.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-60 pt-4 pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.3} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1E293B', borderRadius: '10px' }}
                  labelStyle={{ fontSize: '10px', color: '#94A3B8', fontWeight: 'bold' }}
                  itemStyle={{ fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="sent" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorSent)" name="Sent SMS" />
                <Area type="monotone" dataKey="received" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRec)" name="Received SMS" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent CRM activity panel (1 col) */}
        <Card className="glass-panel border-slate-800/80 shadow-xl flex flex-col h-[360px]">
          <CardHeader className="pb-2 border-b border-slate-850">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Recent Message Log
            </CardTitle>
            <CardDescription className="text-xs">
              Live updates of the last 6 messages across all conversations.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pt-4 space-y-3.5 pr-2">
            {analytics.recentActivity.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                <Clock className="h-6 w-6 text-slate-800 mb-2" />
                <span>No recent messaging logs.</span>
              </div>
            ) : (
              analytics.recentActivity.map((activity) => {
                const isInbound = activity.direction === 'INBOUND';
                const contactName = activity.conversation?.contact?.name || 'Unknown';
                return (
                  <div key={activity.id} className="flex items-start space-x-2.5 text-xs animate-fade-in group">
                    <div className={cn(
                      'p-1.5 rounded-lg border flex-shrink-0 mt-0.5',
                      isInbound 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    )}>
                      {isInbound ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-slate-200 group-hover:text-blue-400 truncate pr-2">{contactName}</span>
                        <span className="text-[9px] text-slate-500 flex-shrink-0 uppercase font-medium">{formatRelativeTime(activity.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate leading-relaxed mt-0.5">
                        {activity.body}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
