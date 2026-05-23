'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { 
  Sparkles, 
  Send, 
  Users, 
  FileText, 
  Calendar, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle,
  Play,
  Loader2,
  Tag as TagIcon,
  Clock,
  Plus,
  RefreshCw
} from 'lucide-react';
import { launchCampaignAction } from '@/app/actions';
import { usePusher } from '@/hooks/usePusher';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

interface CampaignsClientProps {
  initialCampaigns: any[];
  allTags: any[];
  allTemplates: any[];
  contactsList: any[];
}

export default function CampaignsClient({ 
  initialCampaigns, 
  allTags, 
  allTemplates,
  contactsList 
}: CampaignsClientProps) {
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [campaigns, setCampaigns] = useState<any[]>(initialCampaigns);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  
  // Transitions
  const [isPending, startTransition] = useTransition();

  // Wizard state
  const [campaignName, setCampaignName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [messageBody, setMessageBody] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Active running campaign progress monitor
  const [activeCampaignProgress, setActiveCampaignProgress] = useState<any | null>(null);
  const [sendingLogs, setSendingLogs] = useState<string[]>([]);

  // 1. Live campaign progress WebSocket subscription
  usePusher('campaigns', 'campaign-progress', (data: {
    campaignId: string;
    sentCount: number;
    failedCount: number;
    totalCount: number;
    progressPercent: number;
    status: string;
    lastRecipientName: string;
    lastRecipientStatus: string;
  }) => {
    setActiveCampaignProgress(data);
    
    // Add real-time log entries
    const logEntry = `[${new Date().toLocaleTimeString()}] Sending SMS to ${data.lastRecipientName}... ${
      data.lastRecipientStatus === 'done' ? '✓ Success' : '✓ Transmitting'
    }`;
    setSendingLogs(prev => [logEntry, ...prev.slice(0, 19)]); // keep last 20 logs

    if (data.progressPercent === 100) {
      showSuccessToast(
        `Campaign "${campaignName || 'Bulk SMS'}" completed! ${data.sentCount} sent successfully.`,
        'Campaign Executed'
      );
      
      // Delay slightly and refresh campaign list in UI
      setTimeout(async () => {
        setActiveCampaignProgress(null);
        setSendingLogs([]);
        window.location.reload(); // Refresh server-rendered lists cleanly
      }, 4000);
    }
  });

  // Calculate recipients count dynamically in real-time
  const getRecipientCount = () => {
    if (selectedTags.length === 0) return contactsList.length; // target all
    
    const matching = contactsList.filter(c => 
      c.tagIds?.some((tid: string) => selectedTags.includes(tid))
    );
    return matching.length;
  };

  const recipientCount = getRecipientCount();

  // Template Quick Insert handler
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tid = e.target.value;
    setSelectedTemplateId(tid);
    if (!tid) return;

    const template = allTemplates.find(t => t.id === tid);
    if (template) {
      setMessageBody(template.body);
      setCharCount(template.body.length);
      showSuccessToast(`Template "${template.title}" loaded.`, 'Composer Updated');
    }
  };

  // Launch Campaign orchestrator
  const handleLaunchCampaign = () => {
    if (!campaignName.trim() || !messageBody.trim()) {
      showErrorToast('Campaign Name and message text are required.', 'Validation Error');
      return;
    }

    if (recipientCount === 0) {
      showErrorToast('No contacts match the selected target tags.', 'Launch Blocked');
      return;
    }

    startTransition(async () => {
      try {
        setSendingLogs([`[${new Date().toLocaleTimeString()}] Initializing Campaign Engine...`]);
        setActiveCampaignProgress({
          progressPercent: 0,
          sentCount: 0,
          failedCount: 0,
          totalCount: recipientCount,
          status: 'sending',
          lastRecipientName: 'Initializing',
          lastRecipientStatus: 'sending'
        });

        // Fire Server Action which creates campaign and triggers background execution instantly!
        await launchCampaignAction(
          campaignName.trim(),
          messageBody.trim(),
          selectedTags
        );

        showSuccessToast('Campaign launched in the background. Monitoring live performance...', 'Campaign Enqueued');
        
        // Reset Wizard
        setActiveStep(1);
        setCampaignName('');
        setSelectedTags([]);
        setMessageBody('');
        setCharCount(0);
        setSelectedTemplateId('');
      } catch (err: any) {
        showErrorToast(err.message || 'Failed to initialize campaign.', 'Launch Failed');
        setActiveCampaignProgress(null);
      }
    });
  };

  const toggleTagSelection = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <span>Bulk SMS Campaigns</span>
          </h1>
          <p className="text-xs text-slate-400">
            Launch high-throughput personalized message campaigns targeting tagged user cohorts in real-time.
          </p>
        </div>
      </div>

      {/* Real-time Progressive sending monitor */}
      {activeCampaignProgress && (
        <Card className="glass-panel border-blue-500/20 bg-blue-950/5 shadow-2xl animate-pulse duration-[4s]">
          <CardHeader className="pb-2 border-b border-slate-850">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4.5 w-4.5 text-blue-400 animate-spin" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Bulk SMS Campaign Executing Live
                </CardTitle>
              </div>
              <Badge variant="info" className="text-[9px] uppercase font-bold tracking-widest px-2.5">
                Sending: {activeCampaignProgress.progressPercent}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Glowing progress bar */}
            <div className="space-y-1.5">
              <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-300 shadow shadow-blue-500/40"
                  style={{ width: `${activeCampaignProgress.progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                <span>Success: <strong className="text-emerald-400">{activeCampaignProgress.sentCount}</strong></span>
                <span>Failed: <strong className="text-red-400">{activeCampaignProgress.failedCount}</strong></span>
                <span>Total Targets: <strong>{activeCampaignProgress.totalCount}</strong></span>
              </div>
            </div>

            {/* In-flight logs */}
            <div className="space-y-1.5 pt-2 border-t border-slate-850">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Activity Stream:</span>
              <div className="h-24 overflow-y-auto bg-slate-955 p-3 rounded-lg border border-slate-850 font-mono text-[10px] text-slate-300 space-y-1 select-none">
                {sendingLogs.map((log, index) => (
                  <p key={index} className={cn(
                    'truncate',
                    log.includes('Failed') ? 'text-red-400' : log.includes('Success') ? 'text-emerald-400' : 'text-slate-350'
                  )}>
                    {log}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Campaign Builder row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wizard Panel (2 cols) */}
        <Card className="glass-panel border-slate-800/80 shadow-xl lg:col-span-2 flex flex-col justify-between min-h-[380px]">
          <CardHeader className="pb-3 border-b border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Campaign Creation Wizard
              </CardTitle>
              <CardDescription className="text-xs">
                Launch a targeted bulk broadcast in 3 simple steps.
              </CardDescription>
            </div>

            {/* Steps pills */}
            <div className="flex items-center space-x-1">
              {[1, 2, 3].map((step) => (
                <div 
                  key={step}
                  className={cn(
                    'h-6 w-6 rounded-full text-[10px] font-bold flex items-center justify-center border transition-all duration-300',
                    activeStep === step
                      ? 'bg-blue-600/10 border-blue-500/30 text-blue-400'
                      : activeStep > step
                      ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  )}
                >
                  {step}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent className="flex-1 py-4">
            {/* STEP 1: Select Targets */}
            {activeStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-250 uppercase tracking-wider">Step 1: Select Target Recipients</h3>
                  <p className="text-[11px] text-slate-400">Choose contact classifications to target. Leave empty to target all registered contacts.</p>
                </div>

                {/* Tag Selection grid */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] text-slate-450 font-bold uppercase tracking-widest block">Available Contact Cohorts:</span>
                  <div className="flex flex-wrap gap-2 p-3 border border-slate-850 bg-slate-950/20 rounded-xl max-h-40 overflow-y-auto">
                    {allTags.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No tags registered in CRM. Target all contacts below.</p>
                    ) : (
                      allTags.map((tag) => {
                        const isSelected = selectedTags.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTagSelection(tag.id)}
                            style={{
                              backgroundColor: isSelected ? `${tag.color}25` : 'transparent',
                              borderColor: `${tag.color}35`,
                              color: isSelected ? tag.color : '#94A3B8'
                            }}
                            className="text-[10px] px-3.5 py-1 rounded-full border transition-all cursor-pointer font-semibold hover:border-slate-500"
                          >
                            {tag.name}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Recipient summary indicator */}
                <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <Users className="h-4.5 w-4.5 text-blue-400" />
                    <span className="font-semibold text-slate-200">Target Contacts Pool Count:</span>
                  </div>
                  <Badge variant="primary" className="text-xs font-bold px-3 py-0.5">
                    {recipientCount} Recipients
                  </Badge>
                </div>
              </div>
            )}

            {/* STEP 2: Compose Message */}
            {activeStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-250 uppercase tracking-wider">Step 2: Compose Broadcast SMS</h3>
                  <p className="text-[11px] text-slate-400">Design your SMS body text. Supports quick template inserts and personalization macros.</p>
                </div>

                {/* Campaign Name */}
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Campaign Title *</label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Lead Follow-Up May 2026"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>

                {/* Quick select template */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Load SMS Template</label>
                  <select
                    value={selectedTemplateId}
                    onChange={handleTemplateChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-250 focus:outline-none focus:border-blue-500/80 cursor-pointer"
                  >
                    <option value="">-- Choose Template --</option>
                    {allTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.category}] {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message body Composition */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Message Text *</label>
                    <span className="text-[9px] text-slate-500 font-semibold italic">Use `{"{{name}}"}` for contact-name interpolation</span>
                  </div>
                  <textarea
                    rows={3}
                    required
                    placeholder="Write campaign SMS body, e.g.: Hi {{name}}, thanks for your lead!"
                    value={messageBody}
                    onChange={(e) => {
                      setMessageBody(e.target.value);
                      setCharCount(e.target.value.length);
                    }}
                    className="w-full bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/20"
                  />
                  <div className="text-[9px] text-slate-500 text-right font-medium tracking-wide">
                    {charCount} / 160 characters ({Math.ceil(charCount / 160)} SMS Segment)
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Confirm & Launch */}
            {activeStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-250 uppercase tracking-wider">Step 3: Confirm Details & Fire</h3>
                  <p className="text-[11px] text-slate-400">Review recipient statistics and broadcast parameters before launching.</p>
                </div>

                {/* Confirmation Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl space-y-1 text-xs">
                    <span className="text-[9px] text-slate-450 font-bold uppercase tracking-widest block">Recipients Count:</span>
                    <span className="text-slate-100 font-bold text-sm">{recipientCount} Contacts</span>
                  </div>
                  <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-xl space-y-1 text-xs">
                    <span className="text-[9px] text-slate-450 font-bold uppercase tracking-widest block">Campaign Title:</span>
                    <span className="text-slate-100 font-bold text-xs truncate block">{campaignName || 'Untitled'}</span>
                  </div>
                </div>

                {/* Mock Template Macro Preview */}
                <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-2">
                  <span className="text-[9px] text-slate-450 font-bold uppercase tracking-widest block">SMS Preview (Abu Bakar):</span>
                  <p className="text-xs text-slate-300 leading-relaxed italic select-none">
                    {messageBody ? messageBody.replace(/\{\{\s*name\s*\}\}/gi, 'Abu Bakar') : 'No text composed yet.'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>

          {/* Wizard Footer controls */}
          <div className="p-4 border-t border-slate-850 bg-slate-950/20 flex items-center justify-between flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              disabled={activeStep === 1 || isPending}
              className="text-[10px] uppercase font-bold tracking-wider cursor-pointer"
              onClick={() => setActiveStep(prev => (prev - 1) as any)}
            >
              Previous
            </Button>

            {activeStep === 3 ? (
              <Button
                variant="primary"
                size="sm"
                className="text-[10px] uppercase font-bold tracking-wider px-6 cursor-pointer"
                isLoading={isPending}
                disabled={!campaignName.trim() || !messageBody.trim() || recipientCount === 0}
                onClick={handleLaunchCampaign}
              >
                <Play className="h-3.5 w-3.5 mr-2" />
                <span>Launch Campaign</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                disabled={
                  (activeStep === 2 && (!campaignName.trim() || !messageBody.trim())) || 
                  (activeStep === 1 && recipientCount === 0)
                }
                onClick={() => setActiveStep(prev => (prev + 1) as any)}
              >
                <span>Next Step</span>
                <ArrowRight className="h-3.5 w-3.5 ml-2" />
              </Button>
            )}
          </div>
        </Card>

        {/* History Catalog (1 col) */}
        <Card className="glass-panel border-slate-800/80 shadow-xl flex flex-col h-[380px]">
          <CardHeader className="pb-2 border-b border-slate-850">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center justify-between">
              <span>Campaigns History</span>
              <RefreshCw className={cn('h-3.5 w-3.5 text-slate-500 hover:text-slate-350 cursor-pointer', isPending && 'animate-spin')} onClick={() => window.location.reload()} />
            </CardTitle>
            <CardDescription className="text-xs">
              Review histories of past broadcast campaign runs.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pt-4 space-y-4 pr-2">
            {campaigns.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                <Clock className="h-6 w-6 text-slate-850 mb-2" />
                <span>No historical campaigns.</span>
              </div>
            ) : (
              campaigns.map((camp) => {
                const rate = camp.totalCount > 0 ? Math.round((camp.sentCount / camp.totalCount) * 100) : 100;
                const isSending = camp.status === 'sending';
                const isCompleted = camp.status === 'completed';

                return (
                  <div key={camp.id} className="flex flex-col space-y-2 p-3 bg-slate-900/20 border border-slate-850 rounded-xl animate-fade-in group hover:border-slate-700/60">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs text-slate-200 group-hover:text-blue-400 truncate pr-2">{camp.name}</span>
                        <span className="text-[9px] text-slate-550 font-medium uppercase mt-0.5">{new Date(camp.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <Badge 
                        variant={isCompleted ? 'success' : isSending ? 'info' : 'danger'}
                        className="text-[9px] px-2"
                      >
                        {camp.status}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {camp.body}
                    </p>

                    {/* Progress details */}
                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-850/60">
                      <span>Delivery rate: <strong className={cn(rate > 90 ? 'text-emerald-400' : 'text-slate-350')}>{rate}%</strong></span>
                      <span>Total: <strong>{camp.totalCount}</strong></span>
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
