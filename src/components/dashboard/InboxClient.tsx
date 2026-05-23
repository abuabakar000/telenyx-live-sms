'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Send, 
  User as UserIcon, 
  Phone, 
  Mail, 
  Building2, 
  FileText, 
  Tag as TagIcon, 
  Check, 
  CheckCheck, 
  AlertCircle, 
  Sparkles,
  Wifi,
  WifiOff,
  Plus,
  Loader2,
  ChevronRight,
  ChevronLeft,
  MessageSquare
} from 'lucide-react';
import { 
  getMessages, 
  sendSMSAction, 
  updateContactAction, 
  getConversations,
  listTagsAction,
  createTagAction,
  getCarrierAlertStatusAction
} from '@/app/actions';
import { usePusher } from '@/hooks/usePusher';
import { useToast } from '@/components/ui/Toast';
import { cn, formatRelativeTime, formatExactTime, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, ConversationListSkeleton, MessageThreadSkeleton } from '@/components/ui/Skeletons';

interface InboxClientProps {
  initialConversations: any[];
  initialTags: any[];
  initialTemplates: any[];
  initialCarrierAlert: { isActive: boolean; filteredCount: number };
}

export default function InboxClient({ 
  initialConversations, 
  initialTags, 
  initialTemplates,
  initialCarrierAlert
}: InboxClientProps) {
  const queryClient = useQueryClient();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  
  // State
  const [conversations, setConversations] = useState<any[]>(initialConversations);
  const [carrierAlert, setCarrierAlert] = useState<{ isActive: boolean; filteredCount: number }>(initialCarrierAlert);

  const checkCarrierAlert = async () => {
    try {
      const status = await getCarrierAlertStatusAction();
      setCarrierAlert(status);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    checkCarrierAlert();
  }, []);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    initialConversations.length > 0 ? initialConversations[0].id : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');
  
  // Composer state
  const [messageBody, setMessageBody] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [isTemplatesDropdownOpen, setIsTemplatesDropdownOpen] = useState(false);
  
  // Contact details local state for blur autosave
  const [contactNotes, setContactNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  
  // Transitions
  const [isPending, startTransition] = useTransition();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Selected active conversation detail
  const selectedConversation = conversations.find(c => c.id === selectedConvId);
  const activeContact = selectedConversation?.contact;

  // Sync initial conversations state when props change
  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  // Sync notes text when selected contact changes
  useEffect(() => {
    if (activeContact) {
      setContactNotes(activeContact.notes || '');
    }
  }, [activeContact]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Fetch Messages history via Tanstack Query
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', selectedConvId],
    queryFn: () => getMessages(selectedConvId!),
    enabled: !!selectedConvId,
  });

  // Scroll on messages loaded
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // 2. Real-Time WebSockets Integration (Pusher Hooks)
  
  // Handle inbound message
  usePusher('conversations', 'message-received', (data: { message: any; conversation: any }) => {
    const { message, conversation } = data;

    // Update conversation list
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== conversation.id);
      return [conversation, ...filtered];
    });

    // If active conversation matches, append message instantly
    if (selectedConvId === conversation.id) {
      queryClient.setQueryData(['messages', selectedConvId], (old: any[] = []) => {
        // Prevent duplicate appending
        if (old.some(m => m.id === message.id)) return old;
        return [...old, message];
      });
      // Mark as read immediately since user is actively viewing
      startTransition(() => {
        getMessages(selectedConvId!); // Trigger unread reset on server
      });
    } else {
      showSuccessToast(
        `New SMS from ${conversation.contact.name}: "${message.body.substring(0, 30)}..."`,
        'Message Received'
      );
    }
  });

  // Handle outbound message optimistic UI update
  usePusher('conversations', 'message-sent', (data: { message: any; conversation: any }) => {
    const { message, conversation } = data;

    // Update conversation list item to the top
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== conversation.id);
      return [conversation, ...filtered];
    });

    // If active, add or update status in messages list
    if (selectedConvId === conversation.id) {
      queryClient.setQueryData(['messages', selectedConvId], (old: any[] = []) => {
        if (old.some(m => m.id === message.id)) return old;
        return [...old, message];
      });
    }
  });

  // Handle delivery status update
  usePusher('conversations', 'message-status-updated', (data: { message: any }) => {
    const { message } = data;

    // Update message state in thread list
    queryClient.setQueryData(['messages', message.conversationId], (old: any[] = []) => {
      return old.map((m) => (m.id === message.id || (m.telnyxId && m.telnyxId === message.telnyxId) ? message : m));
    });

    // Show 100% assurance toast alerts for outbound message updates
    if (message.direction === 'OUTBOUND') {
      if (message.status === 'delivered') {
        showSuccessToast('Text successfully delivered to recipient handset.', '100% Delivered');
      } else if (message.status === 'filtered') {
        showErrorToast('Carrier AI blocked your SMS due to link filtering.', 'Carrier Filter Blocked');
      } else if (message.status === 'failed') {
        showErrorToast('Text failed to transmit through gateway.', 'Transmission Failed');
      }
    }

    // Check if the status update triggers or clears carrier blocks
    checkCarrierAlert();
  });

  // 3. Send SMS Mutation
  const sendSMSMutation = useMutation({
    mutationFn: async () => {
      const res = await sendSMSAction(activeContact.id, messageBody);
      if (!res.success) {
        throw new Error(res.error);
      }
      return res.message;
    },
    onMutate: async () => {
      const tempMsgBody = messageBody;
      setMessageBody(''); // clear composer instantly
      setCharCount(0);

      // Create a local optimistic message object to display instantly
      const optimisticMessage = {
        id: `optimistic-${Date.now()}`,
        conversationId: selectedConvId!,
        direction: 'OUTBOUND',
        body: tempMsgBody,
        status: 'sending',
        createdAt: new Date().toISOString(),
      };

      // Optimistically insert message
      queryClient.setQueryData(['messages', selectedConvId], (old: any[] = []) => [
        ...old,
        optimisticMessage,
      ]);

      setTimeout(scrollToBottom, 50);
      return { tempMsgBody };
    },
    onError: (err: any, _, context) => {
      showErrorToast(err.message || 'Could not send SMS.', 'Failed to Send');
      // Rollback text into composer
      if (context?.tempMsgBody) {
        setMessageBody(context.tempMsgBody);
        setCharCount(context.tempMsgBody.length);
      }
      // Remove optimistic sending message or mark it failed
      queryClient.setQueryData(['messages', selectedConvId], (old: any[] = []) => {
        return old.map(m => m.id.startsWith('optimistic-') ? { ...m, status: 'failed' } : m);
      });
    },
    onSuccess: () => {
      showSuccessToast('SMS sent successfully.', 'Delivered to Gateway');
      // Refetch conversations list to sync latest lastMessage fields
      startTransition(async () => {
        const freshConvs = await getConversations();
        setConversations(freshConvs);
      });
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim() || !activeContact) return;
    sendSMSMutation.mutate();
  };

  // Composer segment calculation
  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessageBody(val);
    setCharCount(val.length);
  };

  // Template Quick-Insert Selector
  const handleInsertTemplate = (templateBody: string) => {
    let finalBody = templateBody;
    if (activeContact) {
      finalBody = templateBody.replace(/\{\{\s*name\s*\}\}/gi, activeContact.name);
    }
    setMessageBody(finalBody);
    setCharCount(finalBody.length);
    setIsTemplatesDropdownOpen(false);
    showSuccessToast('Template inserted into composer.', 'Template Selected');
  };

  // 4. Contact Notes Autosave on Blur
  const handleNotesBlur = async () => {
    if (!activeContact || contactNotes === (activeContact.notes || '')) return;
    
    setIsSavingNotes(true);
    try {
      await updateContactAction(activeContact.id, { notes: contactNotes });
      showSuccessToast('Contact notes updated automatically.', 'Autosaved');
      
      // Update contact details in local conversations array
      setConversations((prev) => 
        prev.map((c) => {
          if (c.contact.id === activeContact.id) {
            return {
              ...c,
              contact: { ...c.contact, notes: contactNotes }
            };
          }
          return c;
        })
      );
    } catch (err: any) {
      showErrorToast(err.message || 'Failed to save notes.', 'Notes Error');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // 5. Tags management
  const handleRemoveTag = async (tagIdToRemove: string) => {
    if (!activeContact) return;
    
    const updatedTagIds = activeContact.tagIds.filter((tid: string) => tid !== tagIdToRemove);
    try {
      await updateContactAction(activeContact.id, { tagIds: updatedTagIds });
      showSuccessToast('Tag removed from contact.', 'Tags Updated');
      
      // Update local state
      setConversations((prev) => 
        prev.map((c) => {
          if (c.contact.id === activeContact.id) {
            return {
              ...c,
              contact: { 
                ...c.contact, 
                tagIds: updatedTagIds,
                tags: c.contact.tags.filter((t: any) => t.id !== tagIdToRemove)
              }
            };
          }
          return c;
        })
      );
    } catch (err: any) {
      showErrorToast(err.message || 'Failed to update tags.', 'Tag Error');
    }
  };

  const handleAddTag = async (tagIdToAdd: string) => {
    if (!activeContact) return;
    if (activeContact.tagIds.includes(tagIdToAdd)) return;

    const updatedTagIds = [...activeContact.tagIds, tagIdToAdd];
    try {
      await updateContactAction(activeContact.id, { tagIds: updatedTagIds });
      showSuccessToast('Tag applied to contact.', 'Tags Updated');

      // Fetch all tags to get the full Tag object
      const allTags = await listTagsAction();
      const addedTag = allTags.find((t: any) => t.id === tagIdToAdd);

      // Update local state
      setConversations((prev) => 
        prev.map((c) => {
          if (c.contact.id === activeContact.id) {
            return {
              ...c,
              contact: { 
                ...c.contact, 
                tagIds: updatedTagIds,
                tags: addedTag ? [...c.contact.tags, addedTag] : c.contact.tags
              }
            };
          }
          return c;
        })
      );
    } catch (err: any) {
      showErrorToast(err.message || 'Failed to apply tag.', 'Tag Error');
    }
  };

  const handleCreateNewTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim() || !activeContact) return;

    try {
      const newTag = await createTagAction(newTagName.trim(), newTagColor);
      showSuccessToast(`Tag "${newTagName}" created successfully.`, 'Tag Created');
      
      setNewTagName('');
      setIsAddingTag(false);

      // Apply newly created tag
      await handleAddTag(newTag.id);
    } catch (err: any) {
      showErrorToast(err.message || 'Failed to create new tag.', 'Tag Creation Error');
    }
  };

  // Search & Filter computation
  const filteredConversations = conversations.filter((c) => {
    const nameMatch = c.contact.name.toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = c.contact.phoneNumber.includes(searchQuery);
    const searchMatch = nameMatch || phoneMatch;

    if (filterMode === 'unread') {
      return searchMatch && c.unreadCount > 0;
    }
    return searchMatch;
  });

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Carrier Filtering Alert Banner */}
      {carrierAlert.isActive && (
        <div className="bg-red-950/70 border-b border-red-500/20 text-red-200 px-6 py-2.5 flex items-center justify-between text-xs font-semibold backdrop-blur-md animate-fade-in shadow-lg shadow-red-500/5 z-40 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="h-4.5 w-4.5 text-red-500 animate-pulse flex-shrink-0" />
            <span>
              <strong>CRITICAL SENDER HEALTH WARNING:</strong> Carriers are actively blocking your SMS links. Rewrite your message template or check your link immediately to avoid permanent number suspension.
            </span>
          </div>
          <Badge variant="danger" className="text-[9px] uppercase tracking-widest bg-red-500/10 text-red-400 border-red-500/20 py-0.5 px-2">
            Filtered ({carrierAlert.filteredCount}/5)
          </Badge>
        </div>
      )}

      <div className="flex flex-1 h-full w-full overflow-hidden">
      {/* COLUMN 1: Conversation List Panel */}
      <section className={cn(
        "w-full md:w-80 border-r border-zinc-900 bg-black/20 flex flex-col h-full flex-shrink-0",
        selectedConvId ? "hidden md:flex" : "flex"
      )}>
        {/* Search & Header */}
        <div className="p-4 space-y-4 border-b border-zinc-900/60">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">Conversations</h2>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by name or number..."
              className="py-1.5 text-xs bg-zinc-950/60"
              icon={<Search className="h-3.5 w-3.5 text-slate-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters tabs */}
          <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-zinc-900/40">
            <button
              onClick={() => setFilterMode('all')}
              className={cn(
                'flex-1 text-center py-1 text-xs font-semibold rounded-md transition-all cursor-pointer',
                filterMode === 'all'
                  ? 'bg-zinc-800 text-slate-100 shadow-inner'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              All Messages
            </button>
            <button
              onClick={() => setFilterMode('unread')}
              className={cn(
                'flex-1 text-center py-1 text-xs font-semibold rounded-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer',
                filterMode === 'unread'
                  ? 'bg-zinc-800 text-slate-100 shadow-inner'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <span>Unread</span>
              {conversations.some(c => c.unreadCount > 0) && (
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Conversations scroll index */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/40 px-2 py-3 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <MessageSquare className="h-8 w-8 text-zinc-700 mx-auto" />
              <p className="text-xs text-zinc-500 font-medium">No conversations found.</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === selectedConvId;
              const hasUnread = conv.unreadCount > 0;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setSelectedConvId(conv.id);
                    // Reset unread locally
                    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
                  }}
                  className={cn(
                    'flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 group relative',
                    isActive 
                      ? 'bg-zinc-900/80 border border-zinc-800 shadow-md' 
                      : 'hover:bg-zinc-900/30 border border-transparent'
                  )}
                >
                  {/* Initials badge */}
                  <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-800 flex-shrink-0 shadow relative">
                    <span className="text-xs font-bold text-slate-350">
                      {getInitials(conv.contact.name)}
                    </span>
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-red-600 text-[9px] font-bold text-white flex items-center justify-center border border-black animate-bounce shadow">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Body text */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <h4 className={cn('text-xs font-semibold truncate', hasUnread ? 'text-slate-100 font-bold' : 'text-slate-200')}>
                        {conv.contact.name}
                      </h4>
                      <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                        {formatRelativeTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <p className={cn('text-[11px] truncate', hasUnread ? 'text-slate-300 font-medium' : 'text-slate-400')}>
                      {conv.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* COLUMN 2: Message Thread Panel (Center) */}
      <section className={cn(
        "flex-1 flex flex-col h-full bg-black/10 overflow-hidden relative",
        selectedConvId ? "flex w-full" : "hidden md:flex"
      )}>
        {!selectedConversation ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-900/60 flex items-center justify-center text-zinc-400 shadow">
              <MessageSquare className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-200">No active conversation</h3>
              <p className="text-xs text-slate-550 max-w-xs mx-auto">
                Select a conversation from the left sidebar to start messaging.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <header className="px-4 md:px-6 h-16 border-b border-zinc-900/60 flex items-center justify-between bg-black/20 backdrop-blur-sm z-10 flex-shrink-0">
              <div className="flex items-center space-x-3 overflow-hidden">
                {/* Back to conversations list button on mobile */}
                <button
                  onClick={() => setSelectedConvId(null)}
                  className="md:hidden p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer mr-1"
                  title="Back to conversations list"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-800 flex-shrink-0">
                  <UserIcon className="h-4.5 w-4.5 text-slate-300" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <h3 className="text-xs font-semibold text-slate-100 truncate">{activeContact.name}</h3>
                  <span className="text-[10px] text-zinc-400 font-medium leading-none mt-0.5">{activeContact.phoneNumber}</span>
                </div>
              </div>

              {/* Header Tags list */}
              <div className="hidden lg:flex items-center space-x-1.5 overflow-hidden max-w-sm">
                {activeContact.tags?.map((tag: any) => (
                  <Badge 
                    key={tag.id} 
                    style={{ backgroundColor: `${tag.color}15`, borderColor: `${tag.color}30`, color: tag.color }}
                    className="text-[10px]"
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </header>

            {/* Scrollable messages container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoadingMessages ? (
                <MessageThreadSkeleton />
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                  <Sparkles className="h-7 w-7 text-zinc-700" />
                  <p className="text-xs text-zinc-500 font-medium">This is the start of your message thread.</p>
                </div>
              ) : (
                messages.map((msg: any) => {
                  const isInbound = msg.direction === 'INBOUND';
                  const isSent = msg.status === 'sent';
                  const isDelivered = msg.status === 'delivered';
                  const isFailed = msg.status === 'failed';
                  const isSending = msg.status === 'sending';
                  const isFiltered = msg.status === 'filtered';

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex w-full items-end space-x-2 animate-fade-in',
                        isInbound ? 'justify-start' : 'justify-end'
                      )}
                    >
                      {/* Avatar for inbound messages */}
                      {isInbound && (
                        <div className="h-7 w-7 rounded-full bg-zinc-850 border border-zinc-800 flex items-center justify-center text-[10px] text-slate-350 font-bold flex-shrink-0 shadow">
                          {getInitials(activeContact.name)}
                        </div>
                      )}

                      <div className="flex flex-col space-y-1 max-w-[70%]">
                        {/* Bubble */}
                        <div
                          className={cn(
                            'px-4 py-2.5 rounded-2xl text-xs backdrop-blur-md relative border',
                            isInbound
                              ? 'bg-zinc-900/60 border-zinc-800 text-slate-100 rounded-bl-none shadow-sm'
                              : 'bg-gradient-to-tr from-[#dc2626] to-[#ef4444] border-none text-white rounded-br-none shadow-md shadow-red-500/10'
                          )}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                        </div>

                        {/* Timestamp & Status checks */}
                        <div className={cn('flex items-center space-x-1.5 px-1', isInbound ? 'justify-start' : 'justify-end')}>
                          <span className="text-[9px] text-zinc-550 font-medium">
                            {formatExactTime(msg.createdAt)}
                          </span>
                          {!isInbound && (
                            <div className="flex items-center flex-shrink-0">
                              {isSending && (
                                <span className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1">
                                  <Loader2 className="h-3 w-3 text-zinc-500 animate-spin" />
                                  Sending...
                                </span>
                              )}
                              {isSent && (
                                <span className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1">
                                  <Check className="h-3 w-3 text-zinc-450" />
                                  Sent to Gateway
                                </span>
                              )}
                              {isDelivered && (
                                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCheck className="h-3 w-3 text-emerald-450" />
                                  Delivered to Handset
                                </span>
                              )}
                              {isFailed && (
                                <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3 text-red-500" />
                                  Failed to Send
                                </span>
                              )}
                              {isFiltered && (
                                <span className="text-[10px] text-red-650 font-extrabold flex items-center gap-1 animate-pulse">
                                  <AlertCircle className="h-3 w-3 text-red-650" />
                                  Carrier Blocked
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Composer panel */}
            <footer className="p-4 border-t border-zinc-900 bg-black/20 flex-shrink-0">
              {activeContact.optedOut ? (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-2.5 text-xs text-red-300 backdrop-blur-md animate-fade-in shadow-inner shadow-red-500/5">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <span>This contact has opted out of SMS messaging via compliance keyword (e.g. <strong>STOP</strong>). You cannot reply.</span>
                </div>
              ) : (
                <form onSubmit={handleSend} className="space-y-3">
                  {/* Formatting Tools & Templates Dropdown */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsTemplatesDropdownOpen(!isTemplatesDropdownOpen)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg border border-zinc-800 transition-all cursor-pointer shadow-sm font-semibold uppercase tracking-wider text-[10px]"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-red-400" />
                        <span>Quick Templates</span>
                      </button>

                      {isTemplatesDropdownOpen && (
                        <div className="absolute bottom-full left-0 mb-2 w-64 max-h-56 bg-black border border-zinc-800 rounded-xl shadow-2xl p-2 overflow-y-auto z-30 animate-fade-in">
                          <h4 className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest px-2 py-1.5 border-b border-zinc-900 mb-1">
                            Select Template
                          </h4>
                          {initialTemplates.length === 0 ? (
                            <p className="text-[10px] text-slate-500 p-3 italic">No templates available. Create some in the Templates panel.</p>
                          ) : (
                            initialTemplates.map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => handleInsertTemplate(t.body)}
                                className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer group flex flex-col space-y-0.5"
                              >
                                <span className="font-semibold text-zinc-200 group-hover:text-red-400">{t.title}</span>
                                <span className="text-[10px] text-zinc-400 truncate w-full">{t.body}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Character Segment Counter */}
                    <div className={cn(
                      'text-[10px] font-semibold uppercase tracking-wider',
                      charCount > 140 ? 'text-amber-400' : 'text-zinc-400'
                    )}>
                      <span>{charCount}</span>
                      <span className="text-zinc-650"> / 160</span>
                      <span className="text-[9px] text-zinc-500 font-medium ml-1">
                        ({Math.ceil(charCount / 160)} SMS segment)
                      </span>
                    </div>
                  </div>

                  {/* Textarea composition */}
                  <div className="flex items-end space-x-2">
                    <textarea
                      rows={3}
                      value={messageBody}
                      onChange={handleBodyChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e);
                        }
                      }}
                      placeholder={`Reply to ${activeContact.name}...`}
                      className="flex-1 bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 resize-none max-h-48 min-h-[110px] focus:outline-none focus:border-red-500/80 focus:ring-1 focus:ring-red-500/20"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      className="h-[38px] w-[38px] rounded-xl flex-shrink-0 cursor-pointer mb-[2px]"
                      disabled={!messageBody.trim() || sendSMSMutation.isPending}
                    >
                      {sendSMSMutation.isPending ? (
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </footer>
          </>
        )}
      </section>

      {/* COLUMN 3: Contact details & Notes Panel (Right) */}
      <aside className="hidden xl:flex xl:flex-col w-72 border-l border-slate-800/60 bg-slate-950/20 h-full overflow-y-auto p-6 space-y-6 flex-shrink-0">
        {!activeContact ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No contact details loaded.
          </div>
        ) : (
          <>
            {/* Contact Card details */}
            <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-zinc-900">
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center border border-zinc-800 shadow shadow-black/10">
                <span className="text-xl font-bold text-slate-200">
                  {getInitials(activeContact.name)}
                </span>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-100">{activeContact.name}</h4>
                <p className="text-xs text-zinc-400 font-medium">{activeContact.phoneNumber}</p>
                {activeContact.optedOut && (
                  <div className="mt-1.5 animate-fade-in">
                    <Badge variant="danger" className="text-[9px] uppercase tracking-widest font-bold py-0.5 px-2">
                      Opted Out
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Quick stats info fields */}
            <div className="space-y-4">
              <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Contact Information
              </h5>
              
              <div className="space-y-3 text-xs">
                {activeContact.email && (
                  <div className="flex items-center space-x-2.5 text-slate-350 truncate">
                    <Mail className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    <span className="truncate">{activeContact.email}</span>
                  </div>
                )}
                {activeContact.companyName && (
                  <div className="flex items-center space-x-2.5 text-slate-350 truncate">
                    <Building2 className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    <span className="truncate">{activeContact.companyName}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2.5 text-slate-350">
                  <Phone className="h-4 w-4 text-slate-500 flex-shrink-0" />
                  <span>SMS Channel Enabled</span>
                </div>
              </div>
            </div>

            {/* Notes auto-saving textbox */}
            <div className="space-y-2 flex-1 flex flex-col min-h-[150px]">
              <div className="flex justify-between items-center">
                <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center space-x-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-550" />
                  <span>Contact Notes</span>
                </h5>
                {isSavingNotes && (
                  <span className="text-[9px] text-slate-500 font-medium uppercase animate-pulse">
                    Autosaving...
                  </span>
                )}
              </div>
              <textarea
                value={contactNotes}
                onChange={(e) => setContactNotes(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Write dynamic CRM details or log notes here... (autosaves on blur)"
                className="flex-1 w-full bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/20"
              />
            </div>

            {/* Tags Applied panel */}
            <div className="space-y-3 pt-6 border-t border-slate-800/60">
              <div className="flex justify-between items-center">
                <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center space-x-1.5">
                  <TagIcon className="h-3.5 w-3.5 text-slate-550" />
                  <span>Tags applied</span>
                </h5>
                <button 
                  onClick={() => setIsAddingTag(!isAddingTag)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                >
                  {isAddingTag ? 'Cancel' : 'Manage'}
                </button>
              </div>

              {/* Tag selector interface */}
              {isAddingTag && (
                <div className="space-y-3 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 animate-fade-in">
                  <p className="text-[10px] text-slate-400 font-semibold">APPLY EXISTING TAG:</p>
                  <div className="flex flex-wrap gap-1">
                    {initialTags.length === 0 ? (
                      <span className="text-[10px] text-slate-500 italic">No tags. Create one below.</span>
                    ) : (
                      initialTags.map((tag) => {
                        const isApplied = activeContact.tagIds.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            onClick={() => isApplied ? handleRemoveTag(tag.id) : handleAddTag(tag.id)}
                            style={{ 
                              backgroundColor: isApplied ? `${tag.color}25` : 'transparent',
                              borderColor: `${tag.color}35`, 
                              color: isApplied ? tag.color : '#94A3B8' 
                            }}
                            className="text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer font-medium hover:border-zinc-500"
                          >
                            <span>{tag.name}</span>
                            {isApplied && <span className="ml-1">✓</span>}
                          </button>
                        );
                      })
                    )}
                  </div>
                  
                  {/* Create tag inline */}
                  <form onSubmit={handleCreateNewTag} className="space-y-2 pt-2 border-t border-zinc-900">
                    <p className="text-[10px] text-slate-400 font-semibold">CREATE NEW TAG:</p>
                    <div className="flex items-center space-x-1">
                      <Input
                        type="text"
                        placeholder="Tag name..."
                        className="h-7 text-[10px] px-2 bg-zinc-950/80"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                      />
                      <input 
                        type="color" 
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="h-7 w-7 rounded bg-transparent border border-zinc-800 cursor-pointer flex-shrink-0"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        className="h-7 w-7 rounded flex items-center justify-center p-0 cursor-pointer"
                        disabled={!newTagName.trim()}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Renders applied tags */}
              <div className="flex flex-wrap gap-1.5">
                {activeContact.tags?.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">No tags applied yet.</span>
                ) : (
                  activeContact.tags?.map((tag: any) => (
                    <div 
                      key={tag.id} 
                      style={{ backgroundColor: `${tag.color}15`, borderColor: `${tag.color}30`, color: tag.color }}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-sm group"
                    >
                      <span>{tag.name}</span>
                      <button 
                        onClick={() => handleRemoveTag(tag.id)}
                        className="ml-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="Remove Tag"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </aside>
      </div>
    </div>
  );
}
