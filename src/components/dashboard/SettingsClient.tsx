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
  Info
} from 'lucide-react';
import { updateSettingsAction } from '@/app/actions';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

interface SettingsClientProps {
  initialSettings: {
    telnyx_api_key: string;
    telnyx_phone_number: string;
    telnyx_webhook_secret: string;
    organization_name: string;
  };
}

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  
  // Transition state
  const [isPending, startTransition] = useTransition();

  // Form states
  const [apiKey, setApiKey] = useState(initialSettings.telnyx_api_key);
  const [phoneNumber, setPhoneNumber] = useState(initialSettings.telnyx_phone_number);
  const [webhookSecret, setWebhookSecret] = useState(initialSettings.telnyx_webhook_secret);
  const [orgName, setOrgName] = useState(initialSettings.organization_name);

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

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center space-x-2">
          <SettingsIcon className="h-5 w-5 text-blue-500" />
          <span>System Settings</span>
        </h1>
        <p className="text-xs text-slate-400">
          Configure organization profiles, messaging gateway credentials, and webhook signature secrets in real-time.
        </p>
      </div>

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
                  onChange={(e) => setPhoneNumber(e.target.value)}
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
    </div>
  );
}
