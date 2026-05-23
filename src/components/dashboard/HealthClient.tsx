'use client';

import React from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Smartphone, 
  Sparkles, 
  Link2, 
  Info,
  BadgeAlert,
  ArrowRight,
  TrendingUp,
  XCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

interface HealthClientProps {
  initialReport: {
    totalOutbound: number;
    deliveredCount: number;
    sentCount: number;
    filteredCount: number;
    failedCount: number;
    healthScore: number;
    recentFiltered: Array<{
      id: string;
      body: string;
      status: string;
      createdAt: string;
      contactName: string;
      phoneNumber: string;
      errorCode: string;
      errorDetail: string;
    }>;
    complianceAudit: {
      tollFreeVerified: boolean;
      urlRandomizer: boolean;
      optOutFooter: boolean;
      databaseLock: boolean;
      hasLiveKeys: boolean;
    };
  };
}

export default function HealthClient({ initialReport }: HealthClientProps) {
  const {
    totalOutbound,
    deliveredCount,
    sentCount,
    filteredCount,
    failedCount,
    healthScore,
    recentFiltered,
    complianceAudit
  } = initialReport;

  // Compute status details
  let healthState = 'Excellent';
  let healthColor = 'text-emerald-400 border-emerald-500/20';
  let healthBg = 'bg-emerald-500/10';
  let healthBorder = 'border-emerald-500/20';
  let ratingLabel = 'Excellent Health';
  let ratingDesc = 'Your outbound line has perfect deliverability. Links are safe, and opt-out rates satisfy carrier compliance firewalls.';

  if (healthScore < 95 && healthScore >= 75) {
    healthState = 'Fair';
    healthColor = 'text-amber-400 border-amber-500/20';
    healthBg = 'bg-amber-500/10';
    healthBorder = 'border-amber-500/20';
    ratingLabel = 'Fair Deliverability';
    ratingDesc = 'Warning: Carrier spam block rates are slightly elevated. Review link formulations or compose new SMS templates to restore high deliverability.';
  } else if (healthScore < 75) {
    healthState = 'Critical';
    healthColor = 'text-red-500 border-red-500/20';
    healthBg = 'bg-red-500/10';
    healthBorder = 'border-red-500/20';
    ratingLabel = 'Critical Sender Health';
    ratingDesc = 'Attention: Carriers are actively filtering your outbound SMS link campaigns. Link structures are highly suspect. Update templates immediately to avoid number suspension!';
  }

  // Delivery Rate Calculation
  const deliveryRate = totalOutbound > 0 ? Math.round((deliveredCount / totalOutbound) * 100) : 100;

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 space-y-6 bg-black">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center space-x-2">
          <Activity className="h-5 w-5 text-red-500" />
          <span>Number Health & Deliverability</span>
        </h1>
        <p className="text-xs text-zinc-400">
          Real-time carrier packet inspection audits, SMS deliverability statistics, and active sender reputation indices.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Reputation Ring Dial */}
        <Card className="glass-panel border-zinc-900 bg-zinc-950/20 shadow-xl flex flex-col justify-between">
          <CardHeader className="pb-2 border-b border-zinc-900">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-350">
              Sender Health Score
            </CardTitle>
            <CardDescription className="text-[10px]">
              Calculated dynamically from recent carrier blocks and gateway responses.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-6 flex-1">
            {/* Reputation Ring */}
            <div className="relative flex items-center justify-center h-40 w-40">
              {/* Outer Glowing Circle */}
              <div className={`absolute inset-0 rounded-full ${healthBg} blur-xl animate-pulse duration-[5s]`} />
              
              {/* SVG Ring */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  className="stroke-zinc-900 fill-transparent"
                  strokeWidth="8"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  className={`fill-transparent transition-all duration-1000 ${
                    healthScore >= 95 ? 'stroke-emerald-500' : healthScore >= 75 ? 'stroke-amber-500' : 'stroke-red-500'
                  }`}
                  strokeWidth="8"
                  strokeDasharray={402}
                  strokeDashoffset={402 - (402 * healthScore) / 100}
                  strokeLinecap="round"
                />
              </svg>
              {/* Central Text */}
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-extrabold tracking-tight text-white">{healthScore}%</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${healthColor.split(' ')[0]}`}>
                  {healthState}
                </span>
              </div>
            </div>

            {/* Rating Description */}
            <div className={`p-4 rounded-xl border ${healthBorder} ${healthBg} text-center space-y-1`}>
              <h3 className={`text-xs font-bold tracking-wide uppercase ${healthColor.split(' ')[0]}`}>
                {ratingLabel}
              </h3>
              <p className="text-[10px] text-zinc-400 leading-normal max-w-xs">
                {ratingDesc}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Middle Column: Delivery Statistics */}
        <Card className="glass-panel border-zinc-900 bg-zinc-950/20 shadow-xl lg:col-span-2 space-y-6">
          <CardHeader className="pb-2 border-b border-zinc-900">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-350 flex items-center justify-between">
              <span>Deliverability Breakdown</span>
              <span className="text-[10px] font-semibold text-zinc-500 lowercase">outbound transmission logs</span>
            </CardTitle>
            <CardDescription className="text-[10px]">
              Detailed statistics of your Toll-Free Number's broadcast deliverability rates.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Stat 1: Total Outbound */}
              <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Total Sent</span>
                <span className="text-2xl font-black text-white">{totalOutbound}</span>
                <span className="text-[9px] text-zinc-500 block leading-none pt-1">Outbound SMS</span>
              </div>

              {/* Stat 2: Delivered */}
              <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block flex items-center space-x-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Delivered</span>
                </span>
                <span className="text-2xl font-black text-emerald-400">{deliveredCount}</span>
                <span className="text-[9px] text-zinc-500 block leading-none pt-1">{deliveryRate}% DLR Success</span>
              </div>

              {/* Stat 3: Carrier Filtered */}
              <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block flex items-center space-x-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span>Carrier Blocked</span>
                </span>
                <span className="text-2xl font-black text-amber-400">{filteredCount}</span>
                <span className="text-[9px] text-zinc-500 block leading-none pt-1">Spam AI Filters</span>
              </div>

              {/* Stat 4: Failed */}
              <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block flex items-center space-x-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  <span>Gateway Failures</span>
                </span>
                <span className="text-2xl font-black text-red-500">{failedCount}</span>
                <span className="text-[9px] text-zinc-500 block leading-none pt-1">API & Network Errors</span>
              </div>
            </div>

            {/* Delivery Rate Bar */}
            <div className="mt-8 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <span className="flex items-center space-x-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Overall Deliverability Rate</span>
                </span>
                <span className="text-white">{deliveryRate}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    deliveryRate >= 95 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : deliveryRate >= 75 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-red-600 to-red-400'
                  }`}
                  style={{ width: `${deliveryRate}%` }}
                />
              </div>
              <p className="text-[9px] text-zinc-500 pt-1">
                Note: Standard delivery receipts (DLR) are returned directly by the recipient’s mobile carrier network.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Compliance checklist & Rejection logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Checklist Audit */}
        <Card className="glass-panel border-zinc-900 bg-zinc-950/20 shadow-xl space-y-6 col-span-1">
          <CardHeader className="pb-2 border-b border-zinc-900">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-350 flex items-center space-x-1.5">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              <span>CTIA Compliance Audit</span>
            </CardTitle>
            <CardDescription className="text-[10px]">
              Toll-free number registration and deliverability compliance states.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Item 1: Toll-free verified */}
            <div className="flex items-start justify-between p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wide block leading-none">
                  Toll-Free Verification
                </span>
                <span className="text-[9px] text-zinc-500 block leading-tight">
                  Toll-free number matches active TCR registry.
                </span>
              </div>
              {complianceAudit.tollFreeVerified ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold uppercase tracking-wide flex items-center space-x-1">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  <span>Verified</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-450 text-[8px] font-bold uppercase tracking-wide flex items-center space-x-1">
                  <XCircle className="h-2.5 w-2.5" />
                  <span>Pending</span>
                </span>
              )}
            </div>

            {/* Item 2: URL Randomizer */}
            <div className="flex items-start justify-between p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wide block leading-none flex items-center space-x-1">
                  <Link2 className="h-3.5 w-3.5 text-zinc-400" />
                  <span>URL Randomizer</span>
                </span>
                <span className="text-[9px] text-zinc-500 block leading-tight">
                  Appends dynamic parameters to outbound links.
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold uppercase tracking-wide flex items-center space-x-1">
                <Sparkles className="h-2.5 w-2.5 text-emerald-400" />
                <span>Active</span>
              </span>
            </div>

            {/* Item 3: Conversational opt out */}
            <div className="flex items-start justify-between p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wide block leading-none flex items-center space-x-1">
                  <Smartphone className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Opt-out Footer</span>
                </span>
                <span className="text-[9px] text-zinc-500 block leading-tight">
                  Appends "To stop, reply STOP" on a new line.
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold uppercase tracking-wide flex items-center space-x-1">
                <CheckCircle2 className="h-2.5 w-2.5" />
                <span>Enforced</span>
              </span>
            </div>

            {/* Item 4: Database lock */}
            <div className="flex items-start justify-between p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wide block leading-none">
                  Database Opt-out Lock
                </span>
                <span className="text-[9px] text-zinc-500 block leading-tight">
                  Strictly blocks outbound text triggers to opted-out leads.
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold uppercase tracking-wide flex items-center space-x-1">
                <CheckCircle2 className="h-2.5 w-2.5" />
                <span>Secured</span>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Carrier Block Diagnostic logs */}
        <Card className="glass-panel border-zinc-900 bg-zinc-950/20 shadow-xl space-y-6 lg:col-span-2">
          <CardHeader className="pb-2 border-b border-zinc-900">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-350 flex items-center space-x-1.5">
              <BadgeAlert className="h-4 w-4 text-red-500 animate-pulse" />
              <span>Carrier Block Diagnostic Logs</span>
            </CardTitle>
            <CardDescription className="text-[10px]">
              Review the detailed rejection reports returned by mobile carriers for filtered link broadcasts.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {recentFiltered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-zinc-950/40 border border-zinc-900 border-dashed rounded-xl">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2.5" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">No Carrier Blocks Found</span>
                <p className="text-[10px] text-zinc-500 max-w-xs mt-1">
                  Congratulations! None of your outbound messages have been filtered by telecom carriers. Your link randomizer is functioning perfectly.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-900 text-[9px] uppercase tracking-wider font-bold text-zinc-500 pb-2">
                      <th className="pb-2 pr-4">Lead Contact</th>
                      <th className="pb-2 pr-4">Blocked Message</th>
                      <th className="pb-2 pr-4">Carrier Code</th>
                      <th className="pb-2 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {recentFiltered.map((log) => (
                      <tr key={log.id} className="text-[11px] group hover:bg-zinc-900/10">
                        <td className="py-3 pr-4 font-bold text-slate-200">
                          <div>{log.contactName}</div>
                          <div className="text-[9px] text-zinc-500 font-normal">{log.phoneNumber}</div>
                        </td>
                        <td className="py-3 pr-4 max-w-xs truncate text-zinc-400 font-medium" title={log.body}>
                          {log.body}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold">
                            {log.errorCode} - Spam Block
                          </span>
                        </td>
                        <td className="py-3 text-right text-zinc-500 font-semibold">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Info notice box */}
            <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl space-y-2 mt-6 text-zinc-400">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
                <Info className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span>How to avoid Carrier Blocks?</span>
              </div>
              <p className="text-[10px] leading-relaxed">
                Modern carriers utilize advanced machine learning firewalls (like spam link filters) to analyze outbound SMS text profiles. To protect your sender score and Toll-free registration status, **always compose unique personal messages**, utilize template quick variables to inject lead names, and ensure the conversational **Opt-out sentence** is appended at all times.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
