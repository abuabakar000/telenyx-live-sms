'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Phone, FileText, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { ContactService } from '@/services/ContactService';
import { createContactAction, getConversations, sendSMSAction } from '@/app/actions';

export default function DirectSendClient() {
  const router = useRouter();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [messageText, setMessageText] = useState('');
  const [charCount, setCharCount] = useState(0);

  const handleSendSMS = (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber.trim() || !messageText.trim()) {
      showErrorToast('Phone Number and Message Text are required fields.', 'Validation Error');
      return;
    }

    startTransition(async () => {
      try {
        const cleanPhone = ContactService.cleanPhoneNumber(phoneNumber);

        // 1. Check if contact exists by phone number, otherwise provision a quick contact
        let contact;
        try {
          // We can query contacts or try creating one. Let's try creating/resolving contact.
          contact = await createContactAction({
            name: `Direct Contact (${cleanPhone})`,
            phoneNumber: cleanPhone,
            notes: 'Created via Direct SMS Sender.',
          });
        } catch (err: any) {
          // If contact already exists, let's fetch contacts to find it
          const allConversations = await getConversations();
          const existingConv = allConversations.find(c => c.contact.phoneNumber === cleanPhone);
          if (existingConv) {
            contact = existingConv.contact;
          } else {
            throw err;
          }
        }

        if (!contact) {
          throw new Error('Failed to resolve contact information.');
        }

        // 2. Send the SMS via our Server Action
        await sendSMSAction(contact.id, messageText.trim());

        showSuccessToast(`SMS sent successfully to ${cleanPhone}! Redirecting to conversation thread...`, 'Message Sent');
        
        // 3. Clear form
        setPhoneNumber('');
        setMessageText('');
        setCharCount(0);

        // 4. Redirect to Inbox to continue conversation
        router.push('/');
        router.refresh();
      } catch (error: any) {
        showErrorToast(error.message || 'Failed to send direct SMS.', 'Transmission Error');
      }
    });
  };

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 items-center justify-center bg-black/20 font-sans">
      <div className="w-full max-w-md animate-fade-in">
        <form onSubmit={handleSendSMS}>
          <Card className="glass-panel border-zinc-900 shadow-2xl space-y-6">
            <CardHeader className="pb-2 border-b border-zinc-900">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow shadow-red-500/10">
                  <Send className="h-4.5 w-4.5 text-red-400" />
                </div>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-white">
                  Direct SMS Quick Sender
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Paste any mobile number and write a message to initiate or continue an SMS conversation.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4 pt-2">
              {/* Recipient Phone Number */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  <span>Recipient Phone Number *</span>
                </label>
                <Input
                  type="tel"
                  required
                  placeholder="e.g. +18885550199 or 8885550199"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isPending}
                />
              </div>

              {/* Message body Composition */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                    <span>Message Text *</span>
                  </label>
                  <div className="text-[9px] text-slate-500 font-semibold">
                    <span>{charCount}</span>
                    <span className="text-slate-600"> / 160</span>
                  </div>
                </div>
                <textarea
                  rows={4}
                  required
                  placeholder="Type or paste your SMS text message here..."
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    setCharCount(e.target.value.length);
                  }}
                  disabled={isPending}
                  className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg p-2.5 text-xs text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-red-500/80 focus:ring-1 focus:ring-red-500/30"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end pt-4 border-t border-zinc-900">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full text-[10px] uppercase font-bold tracking-wider py-2.5 cursor-pointer"
                  isLoading={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5 mr-2" />
                  )}
                  <span>Transmit SMS Broadcast</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
