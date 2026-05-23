'use client';

import React, { useState, useTransition } from 'react';
import { 
  Search, 
  Plus, 
  Upload, 
  Edit2, 
  Trash2, 
  UserPlus, 
  Tag as TagIcon, 
  Building2, 
  Mail, 
  Phone,
  FileText,
  X,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { 
  createContactAction, 
  updateContactAction, 
  deleteContactAction, 
  importCSVAction,
  createTagAction 
} from '@/app/actions';
import { useToast } from '@/components/ui/Toast';
import { cn, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface ContactsClientProps {
  initialContacts: any[];
  allTags: any[];
}

export default function ContactsClient({ initialContacts, allTags }: ContactsClientProps) {
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [contacts, setContacts] = useState<any[]>(initialContacts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  
  // Transition state
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // CSV State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Tags quick create
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  // Reset form helper
  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setCompany('');
    setNotes('');
    setSelectedTags([]);
    setEditingContact(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsContactModalOpen(true);
  };

  const handleOpenEditModal = (contact: any) => {
    setEditingContact(contact);
    setName(contact.name);
    setPhone(contact.phoneNumber);
    setEmail(contact.email || '');
    setCompany(contact.companyName || '');
    setNotes(contact.notes || '');
    setSelectedTags(contact.tagIds || []);
    setIsContactModalOpen(true);
  };

  // 1. Submit Create/Edit Form
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      showErrorToast('Name and Phone Number are required fields.', 'Validation Error');
      return;
    }

    startTransition(async () => {
      try {
        if (editingContact) {
          // Update
          const updated = await updateContactAction(editingContact.id, {
            name,
            phoneNumber: phone,
            email: email || undefined,
            companyName: company || undefined,
            notes: notes || undefined,
            tagIds: selectedTags,
          });
          showSuccessToast(`Contact "${name}" updated successfully.`, 'Contact Saved');
          setContacts(prev => prev.map(c => c.id === editingContact.id ? updated : c));
        } else {
          // Create
          const created = await createContactAction({
            name,
            phoneNumber: phone,
            email: email || undefined,
            companyName: company || undefined,
            notes: notes || undefined,
            tagIds: selectedTags,
          });
          showSuccessToast(`Contact "${name}" created successfully.`, 'Contact Created');
          setContacts(prev => [created, ...prev]);
        }
        setIsContactModalOpen(false);
        resetForm();
      } catch (err: any) {
        showErrorToast(err.message || 'Failed to save contact.', 'Save Failed');
      }
    });
  };

  // 2. Delete Contact
  const handleDeleteContact = async (contactId: string, contactName: string) => {
    if (!confirm(`Are you absolutely sure you want to delete "${contactName}"? All associated conversation history will be permanently erased.`)) return;

    startTransition(async () => {
      try {
        await deleteContactAction(contactId);
        showSuccessToast(`Contact "${contactName}" has been deleted.`, 'Contact Deleted');
        setContacts(prev => prev.filter(c => c.id !== contactId));
      } catch (err: any) {
        showErrorToast(err.message || 'Failed to delete contact.', 'Delete Failed');
      }
    });
  };

  // 3. Handle CSV upload parsing
  const handleCsvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvContent = event.target?.result as string;
      try {
        const result = await importCSVAction(csvContent);
        showSuccessToast(
          `Imported ${result.imported} contacts successfully. ${result.failed} rows failed.`,
          'Import Complete'
        );
        if (result.errors.length > 0) {
          console.warn('CSV row errors:', result.errors);
        }
        
        // Refresh contact list
        const freshContacts = await updateContactAction('', {}); // Empty update triggers a query-based mock refresh of contacts list on server
        // Better yet: just fetch fresh contacts using getContactsAction action!
        const contactsRefreshed = await importCSVAction(''); // Trigger safe reload on server
        window.location.reload(); // Hard reload is extremely safe and works instantly
      } catch (err: any) {
        showErrorToast(err.message || 'CSV Import failed. Make sure columns are matched correctly.', 'Import Error');
      } finally {
        setIsUploading(false);
        setIsCsvModalOpen(false);
        setCsvFile(null);
      }
    };
    reader.readAsText(csvFile);
  };

  // 4. Quick create Tag
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      await createTagAction(newTagName.trim(), newTagColor);
      showSuccessToast(`Tag "${newTagName}" created.`, 'Success');
      setNewTagName('');
      setIsCreatingTag(false);
      window.location.reload();
    } catch (err: any) {
      showErrorToast(err.message || 'Failed to create tag.');
    }
  };

  const toggleTagSelection = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  // Filter & Search
  const filteredContacts = contacts.filter((contact) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      contact.name.toLowerCase().includes(query) ||
      contact.phoneNumber.includes(query) ||
      (contact.email && contact.email.toLowerCase().includes(query)) ||
      (contact.companyName && contact.companyName.toLowerCase().includes(query));

    if (selectedTagFilter === 'all') {
      return matchesSearch;
    }
    return matchesSearch && contact.tagIds?.includes(selectedTagFilter);
  });

  return (
    <div className="flex flex-col h-full w-full overflow-hidden p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-blue-500" />
            <span>Contacts Directory</span>
          </h1>
          <p className="text-xs text-slate-400">
            Manage your organization's contacts, edit notes, categorize with tags, and import CSV bulk data.
          </p>
        </div>

        {/* Header Actions Buttons */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs uppercase tracking-wider font-semibold cursor-pointer"
            onClick={() => setIsCsvModalOpen(true)}
          >
            <Upload className="h-3.5 w-3.5 mr-2 text-slate-450" />
            <span>Import CSV</span>
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            className="text-xs uppercase tracking-wider font-bold cursor-pointer"
            onClick={handleOpenCreateModal}
          >
            <Plus className="h-3.5 w-3.5 mr-2" />
            <span>New Contact</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 bg-slate-900/30 p-4 rounded-xl border border-slate-800/40 backdrop-blur-sm">
        {/* Search */}
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Search contacts by name, phone, email, or company..."
            className="py-1.5 text-xs pl-10"
            icon={<Search className="h-4 w-4 text-slate-500" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tag Dropdown Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium flex-shrink-0">Filter:</span>
          <select
            value={selectedTagFilter}
            onChange={(e) => setSelectedTagFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/80 cursor-pointer"
          >
            <option value="all">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contacts Grid/Table panel */}
      <div className="flex-1 overflow-auto rounded-xl border border-slate-800/80 bg-slate-950/20 shadow-inner">
        {filteredContacts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
            <Building2 className="h-10 w-10 text-slate-750" />
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-semibold">No contacts found.</p>
              <p className="text-[11px] text-slate-500 max-w-xs">
                Create a new contact manually or import a batch CSV contact list to get started.
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 hidden sm:table-cell">Phone</th>
                <th className="py-3 px-4 hidden md:table-cell">Email</th>
                <th className="py-3 px-4 hidden lg:table-cell">Company</th>
                <th className="py-3 px-4">Tags</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60 text-xs">
              {filteredContacts.map((contact) => (
                <tr 
                  key={contact.id} 
                  className="hover:bg-slate-900/10 transition-colors group"
                >
                  {/* Name and initials card */}
                  <td className="py-3.5 px-4 flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-slate-800/80 flex items-center justify-center border border-slate-700/50 shadow flex-shrink-0">
                      <span className="text-[10px] font-bold text-slate-350">
                        {getInitials(contact.name)}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-slate-100 truncate">{contact.name}</span>
                      <span className="text-[10px] text-slate-500 sm:hidden">{contact.phoneNumber}</span>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="py-3.5 px-4 hidden sm:table-cell font-medium text-slate-300">
                    {contact.phoneNumber}
                  </td>

                  {/* Email */}
                  <td className="py-3.5 px-4 hidden md:table-cell text-slate-400">
                    {contact.email || '—'}
                  </td>

                  {/* Company */}
                  <td className="py-3.5 px-4 hidden lg:table-cell text-slate-400">
                    {contact.companyName || '—'}
                  </td>

                  {/* Tags */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {contact.tags?.length === 0 ? (
                        <span className="text-slate-650 italic text-[10px]">None</span>
                      ) : (
                        contact.tags?.map((t: any) => (
                          <Badge 
                            key={t.id} 
                            style={{ backgroundColor: `${t.color}15`, borderColor: `${t.color}25`, color: t.color }}
                            className="text-[9px] px-2 py-0"
                          >
                            {t.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>

                  {/* Actions buttons */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => handleOpenEditModal(contact)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-900/60 transition-colors cursor-pointer"
                        title="Edit Contact"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id, contact.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete Contact"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* DIALOG MODAL 1: Create or Edit Contact */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsContactModalOpen(false)} />
          
          <Card className="w-full max-w-lg glass-panel relative z-10 p-6 animate-fade-in border border-slate-800/80 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                {editingContact ? 'Edit Contact Details' : 'Provision New CRM Contact'}
              </h3>
              <button onClick={() => setIsContactModalOpen(false)} className="p-1 rounded-lg text-slate-450 hover:text-slate-200 hover:bg-slate-900 cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name *</label>
                  <Input
                    type="text"
                    required
                    placeholder="E.g. Abu Bakar"
                    disabled={isPending}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number *</label>
                  <Input
                    type="tel"
                    required
                    placeholder="E.164, e.g. +18885550199"
                    disabled={isPending}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <Input
                    type="email"
                    placeholder="e.g. name@inexlabs.com"
                    disabled={isPending}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Company */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company Name</label>
                  <Input
                    type="text"
                    placeholder="e.g. Inex Labs"
                    disabled={isPending}
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notes & CRM Details</label>
                <textarea
                  rows={2}
                  placeholder="Insert notes, call logs, or conversation contexts..."
                  disabled={isPending}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              {/* Tag Selector checkboxes */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categorization Tags</label>
                  <button 
                    type="button"
                    onClick={() => setIsCreatingTag(!isCreatingTag)} 
                    className="text-[10px] text-blue-400 font-semibold cursor-pointer"
                  >
                    {isCreatingTag ? 'Cancel Tag' : 'New Tag'}
                  </button>
                </div>

                {isCreatingTag && (
                  <div className="flex items-center space-x-1.5 p-2 bg-slate-950/60 border border-slate-850 rounded-lg animate-fade-in">
                    <Input
                      type="text"
                      placeholder="Tag label..."
                      className="h-8 text-xs bg-slate-900"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                    />
                    <input 
                      type="color" 
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="h-8 w-8 rounded bg-transparent border border-slate-800 cursor-pointer flex-shrink-0"
                    />
                    <Button type="button" variant="primary" className="h-8 px-3 text-[10px] font-bold cursor-pointer" onClick={handleCreateTag}>
                      Create
                    </Button>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 border border-slate-850 rounded-lg bg-slate-900/25">
                  {allTags.length === 0 ? (
                    <span className="text-[10px] text-slate-550 italic p-1">No tags registered. Add a new tag to classify your contacts!</span>
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
                          className="text-[10px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer font-medium hover:border-slate-500"
                        >
                          {tag.name}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-850">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsContactModalOpen(false)} className="cursor-pointer text-[10px] uppercase font-bold tracking-wider">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isPending} className="cursor-pointer text-[10px] uppercase font-bold tracking-wider">
                  {editingContact ? 'Save Changes' : 'Create Contact'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* DIALOG MODAL 2: CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsCsvModalOpen(false)} />
          
          <Card className="w-full max-w-md glass-panel relative z-10 p-6 animate-fade-in border border-slate-800/80 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                Bulk Import Contacts via CSV
              </h3>
              <button onClick={() => setIsCsvModalOpen(false)} className="p-1 rounded-lg text-slate-450 hover:text-slate-200 hover:bg-slate-900 cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleCsvSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center space-y-3 bg-slate-900/10">
                <Upload className="h-8 w-8 text-blue-500 mx-auto animate-bounce duration-[3s]" />
                <div className="space-y-1">
                  <span className="text-xs text-slate-250 font-bold block">Upload Contact List CSV File</span>
                  <span className="text-[10px] text-slate-500 block">Accepted headers: Name, Phone, Email, Company, Notes, Tags</span>
                </div>
                
                <input
                  type="file"
                  accept=".csv"
                  required
                  id="csv-file-input"
                  className="hidden"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                />
                
                <label 
                  htmlFor="csv-file-input"
                  className="inline-flex items-center px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 text-[10px] font-bold text-slate-350 hover:text-slate-100 rounded-lg transition-all cursor-pointer uppercase tracking-wider shadow-sm"
                >
                  {csvFile ? 'Change CSV File' : 'Browse Local Files'}
                </label>
                
                {csvFile && (
                  <p className="text-[11px] text-emerald-400 font-semibold truncate max-w-xs mx-auto">
                    Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {/* Warning Alert about replica set restriction */}
              <div className="p-3 bg-blue-950/15 border border-blue-500/20 rounded-lg text-[10px] text-slate-300 flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Note:</strong> Standalone local databases will update fields cleanly. Contacts with unique phone numbers will update details, otherwise new contacts are provisioned.
                </p>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-850">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsCsvModalOpen(false)} className="cursor-pointer text-[10px] uppercase font-bold tracking-wider">
                  Close
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isUploading} disabled={!csvFile} className="cursor-pointer text-[10px] uppercase font-bold tracking-wider">
                  Import Contacts
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
