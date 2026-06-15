'use client';

import React, { useState, useTransition } from 'react';
import { 
  Settings as SettingsIcon, 
  Key, 
  Phone, 
  ShieldCheck, 
  Building,
  Save,
  Loader2,
  AlertTriangle,
  Info,
  Activity, 
  CheckCircle2, 
  ShieldAlert, 
  Smartphone, 
  Sparkles, 
  Link2, 
  BadgeAlert,
  ArrowRight,
  TrendingUp,
  XCircle
} from 'lucide-react';
import { updateSettingsAction, resetNumberHealthAction } from '@/app/actions';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface SettingsClientProps {
  initialSettings: {
    telnyx_api_key: string;
    telnyx_phone_number: string;
    telnyx_webhook_secret: string;
    organization_name: string;
  };
  initialHealthReport: {
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

export default function SettingsClient({ initialSettings, initialHealthReport }: SettingsClientProps) {
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'credentials' | 'health'>('credentials');

  // Transition state
  const [isPending, startTransition] = useTransition();

  // Form states
  const [apiKey, setApiKey] = useState(initialSettings.telnyx_api_key);
  const [phoneNumber, setPhoneNumber] = useState(initialSettings.telnyx_phone_number);
  const [webhookSecret, setWebhookSecret] = useState(initialSettings.telnyx_webhook_secret);
  const [orgName, setOrgName] = useState(initialSettings.organization_name);

  const [isResetPending, setIsResetPending] = useState(false);

  const handleResetHealthLogs = async () => {
    if (!window.confirm('Are you sure you want to delete all SMS message logs and restart Number Health monitoring from a clean slate? This action is irreversible.')) {
      return;
    }

    setIsResetPending(true);
    try {
      await resetNumberHealthAction();
      showSuccessToast('All carrier logs and outbound SMS histories have been deleted successfully. Monitoring starting fresh!', 'Logs Reset');
    } catch (err: any) {
      showErrorToast(err.message || 'Failed to clear deliverability records.', 'Reset Failed');
    } finally {
      setIsResetPending(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        await updateSettingsAction({
          telnyx_api_key: apiKey.trim(),
          telnyx_phone_number: phoneNumber.trim(),
          telnyx_webhook_secret: webhookSecret.trim(),
          organization_name: orgName.trim(),
        });
        showSuccessToast('Configuration details saved successfully. Dynamic services initialized.', 'Settings Updated');
      } catch (err: any) {
        showErrorToast(err.message || 'Failed to update configuration settings.', 'Update Failed');
      }
    });
  };

  // Health report variables
  const {
    totalOutbound,
    deliveredCount,
    sentCount,
    filteredCount,
    failedCount,
    healthScore,
    recentFiltered,
    complianceAudit
  } = initialHealthReport;

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
          <SettingsIcon className="h-5 w-5 text-blue-500" />
          <span>System Settings</span>
        </h1>
        <p className="text-xs text-slate-400">
          Configure organization profiles, messaging gateway credentials, webhooks, and audit number deliverability reputations.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-900 pb-px space-x-8">
        <button
          onClick={() => setActiveTab('credentials')}
          className={cn(
            'pb-4 text-xs font-bold uppercase tracking-wider transition-all duration-200 relative cursor-pointer outline-none',
            activeTab === 'credentials'
              ? 'text-red-400'
              : 'text-zinc-400 hover:text-zinc-200'
          )}
        >
          <span>Inbox & Direct Message Settings</span>
          {activeTab === 'credentials' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={cn(
            'pb-4 text-xs font-bold uppercase tracking-wider transition-all duration-200 relative cursor-pointer outline-none',
            activeTab === 'health'
              ? 'text-red-400'
              : 'text-zinc-400 hover:text-zinc-200'
          )}
        >
          <span>Number Health</span>
          {activeTab === 'health' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444]" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'credentials' ? (
          <div className="max-w-2xl">
            <form onSubmit={handleSaveSettings}>
              <Card className="glass-panel border-slate-800/80 shadow-xl space-y-6">
                <CardHeader className="pb-2 border-b border-slate-850">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-200">
                    Inex Labs SMS CRM Configuration
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Database-backed settings will override environment defaults immediately.
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4 pt-2">
                  {/* Organization name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                      <Building className="h-3.5 w-3.5 text-slate-500" />
                      <span>Organization Name</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Inex Labs"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      disabled={isPending}
                    />
                  </div>

                  {/* Telnyx API Key */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                      <Key className="h-3.5 w-3.5 text-slate-500" />
                      <span>Telnyx API Key</span>
                    </label>
                    <Input
                      type="password"
                      placeholder="KEYxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      disabled={isPending}
                    />
                  </div>

                  {/* Telnyx Phone Number */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                      <Phone className="h-3.5 w-3.5 text-slate-500" />
                      <span>Telnyx Outbound Phone Number (E.164)</span>
                    </label>
                    <Input
                      type="tel"
                      placeholder="e.g. +18885550199"
                      value={phoneNumber}
                      onChange={(e) => {
                        const val = e.target.value;
                        const cleaned = val.replace(/[^\d+]/g, '');
                        const formatted = cleaned.startsWith('+') 
                          ? '+' + cleaned.slice(1).replace(/\+/g, '')
                          : cleaned.replace(/\+/g, '');
                        setPhoneNumber(formatted);
                      }}
                      disabled={isPending}
                    />
                  </div>

                  {/* Webhook Signature secret */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                      <span>Telnyx Webhook Signing Secret</span>
                    </label>
                    <Input
                      type="password"
                      placeholder="Your Telnyx Portal Webhook Signing Secret..."
                      value={webhookSecret}
                      onChange={(e) => setWebhookSecret(e.target.value)}
                      disabled={isPending}
                    />
                  </div>

                  {/* Information alert box */}
                  <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl space-y-2 text-slate-350">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                      <Info className="h-4 w-4 text-blue-400 flex-shrink-0" />
                      <span>Webhook Secret Verification</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Webhooks from Telnyx are verified using pure-cryptographic Ed25519 signatures. Make sure to paste the Webhook Signing Secret found in the Telnyx Developer Portal (under Webhooks setup) to enforce webhook security.
                    </p>
                  </div>

                  {/* Saving Button */}
                  <div className="flex justify-end pt-4 border-t border-slate-850">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      className="px-6 py-2 text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                      isLoading={isPending}
                    >
                      <Save className="h-3.5 w-3.5 mr-2" />
                      <span>Save Configuration</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Reset Logs Action Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-red-950/10 border border-red-500/20 rounded-xl space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center space-x-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Sender Reputation Reset Option</span>
                </h3>
                <p className="text-[10px] text-zinc-400 leading-normal max-w-xl">
                  Clear historical carrier blocks and reset delivery logs to start monitoring with a fresh sender score. This deletes all database message logs.
                </p>
              </div>
              <Button
                onClick={handleResetHealthLogs}
                variant="primary"
                size="sm"
                className="px-4 py-2 text-[9px] uppercase font-bold tracking-wider cursor-pointer border border-red-500/30 bg-red-950/20 text-red-200 hover:bg-red-500/20 flex-shrink-0"
                isLoading={isResetPending}
              >
                <span>Reset Deliverability Logs</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Reputation Ring Dial */}
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
                    <div className={`absolute inset-0 rounded-full ${healthBg} blur-xl animate-pulse duration-[5s]`} />
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

              {/* Statistics Breakdown */}
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
                    <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl space-y-1">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Total Sent</span>
                      <span className="text-2xl font-black text-white">{totalOutbound}</span>
                      <span className="text-[9px] text-zinc-500 block leading-none pt-1">Outbound SMS</span>
                    </div>

                    <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl space-y-1">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block flex items-center space-x-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Delivered</span>
                      </span>
                      <span className="text-2xl font-black text-emerald-400">{deliveredCount}</span>
                      <span className="text-[9px] text-zinc-500 block leading-none pt-1">{deliveryRate}% DLR Success</span>
                    </div>

                    <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl space-y-1">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block flex items-center space-x-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        <span>Carrier Blocked</span>
                      </span>
                      <span className="text-2xl font-black text-amber-400">{filteredCount}</span>
                      <span className="text-[9px] text-zinc-500 block leading-none pt-1">Spam AI Filters</span>
                    </div>

                    <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl space-y-1">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block flex items-center space-x-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        <span>Gateway Failures</span>
                      </span>
                      <span className="text-2xl font-black text-red-500">{failedCount}</span>
                      <span className="text-[9px] text-zinc-500 block leading-none pt-1">API & Network Errors</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
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
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Compliance checklist */}
              <Card className="glass-panel border-zinc-900 bg-zinc-950/20 shadow-xl space-y-6 col-span-1">
                <CardHeader className="pb-2 border-b border-zinc-900">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-350 flex items-center space-x-1.5">
                    <ShieldAlert className="h-4 w-4 text-red-500" />
                    <span>CTIA Compliance Audit</span>
                  </CardTitle>
                  <CardDescription className="text-[10px]">
                    Toll-free number registration status.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
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

                  <div className="flex items-start justify-between p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wide block leading-none flex items-center space-x-1">
                        <Link2 className="h-3.5 w-3.5 text-zinc-400" />
                        <span>URL Randomizer</span>
                      </span>
                      <span className="text-[9px] text-zinc-500 block leading-tight">
                        Appends dynamic parameter blocks.
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold uppercase tracking-wide flex items-center space-x-1">
                      <Sparkles className="h-2.5 w-2.5 text-emerald-400" />
                      <span>Active</span>
                    </span>
                  </div>

                  <div className="flex items-start justify-between p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wide block leading-none flex items-center space-x-1">
                        <Smartphone className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Opt-out Footer</span>
                      </span>
                      <span className="text-[9px] text-zinc-500 block leading-tight">
                        Appends "To stop, reply STOP" on new line.
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold uppercase tracking-wide flex items-center space-x-1">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      <span>Enforced</span>
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Carrier Blocks list */}
              <Card className="glass-panel border-zinc-900 bg-zinc-950/20 shadow-xl space-y-6 lg:col-span-2">
                <CardHeader className="pb-2 border-b border-zinc-900">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-350 flex items-center space-x-1.5">
                    <BadgeAlert className="h-4 w-4 text-red-500 animate-pulse" />
                    <span>Carrier Block Logs</span>
                  </CardTitle>
                  <CardDescription className="text-[10px]">
                    Recent filtered outbound SMS content and rejection codes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {recentFiltered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-zinc-950/40 border border-zinc-900 border-dashed rounded-xl">
                      <CheckCircle2 className="h-6 w-8 text-emerald-400 mb-2" />
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">No Carrier Blocks Found</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-zinc-900 text-[9px] uppercase tracking-wider font-bold text-zinc-500 pb-2">
                            <th className="pb-2 pr-4">Contact</th>
                            <th className="pb-2 pr-4">Message</th>
                            <th className="pb-2 pr-4">Code</th>
                            <th className="pb-2 text-right">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900/60">
                          {recentFiltered.slice(0, 5).map((log) => (
                            <tr key={log.id} className="text-[11px] group">
                              <td className="py-2.5 pr-4 font-bold text-slate-200">
                                <div>{log.contactName}</div>
                                <div className="text-[9px] text-zinc-500 font-normal">{log.phoneNumber}</div>
                              </td>
                              <td className="py-2.5 pr-4 max-w-[180px] truncate text-zinc-400" title={log.body}>
                                {log.body}
                              </td>
                              <td className="py-2.5 pr-4">
                                <span className="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-bold">
                                  {log.errorCode}
                                </span>
                              </td>
                              <td className="py-2.5 text-right text-zinc-500 font-semibold">
                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
