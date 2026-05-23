'use client';

import React, { useState, useTransition } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Sparkles, 
  Tag as TagIcon, 
  Calendar,
  X,
  PlusCircle
} from 'lucide-react';
import { createTemplateAction, deleteTemplateAction } from '@/app/actions';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface TemplatesClientProps {
  initialTemplates: any[];
  categories: string[];
}

export default function TemplatesClient({ initialTemplates, categories }: TemplatesClientProps) {
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [templates, setTemplates] = useState<any[]>(initialTemplates);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Transition state
  const [isPending, startTransition] = useTransition();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Follow-up');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCat, setIsCustomCat] = useState(false);

  // 1. Submit template
  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      showErrorToast('Title and Template body are required.', 'Validation Error');
      return;
    }

    const finalCategory = isCustomCat ? customCategory.trim() : category;
    if (!finalCategory) {
      showErrorToast('Please select or specify a category.', 'Validation Error');
      return;
    }

    startTransition(async () => {
      try {
        const created = await createTemplateAction({
          title: title.trim(),
          body: body.trim(),
          category: finalCategory,
        });

        showSuccessToast(`Template "${title}" created successfully.`, 'Template Saved');
        setTemplates(prev => [created, ...prev]);
        setIsModalOpen(false);
        
        // Reset form
        setTitle('');
        setBody('');
        setCustomCategory('');
        setIsCustomCat(false);
      } catch (err: any) {
        showErrorToast(err.message || 'Failed to create template.', 'Create Failed');
      }
    });
  };

  // 2. Delete template
  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete template "${name}"?`)) return;

    startTransition(async () => {
      try {
        await deleteTemplateAction(id);
        showSuccessToast(`Template "${name}" has been deleted.`, 'Template Deleted');
        setTemplates(prev => prev.filter(t => t.id !== id));
      } catch (err: any) {
        showErrorToast(err.message || 'Failed to delete template.', 'Delete Failed');
      }
    });
  };

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  // Re-aggregate categories in real-time based on local state templates
  const allCategories = Array.from(new Set(['all', ...templates.map(t => t.category)]));

  return (
    <div className="flex flex-col h-full w-full overflow-hidden p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <span>SMS Message Templates</span>
          </h1>
          <p className="text-xs text-slate-400">
            Design and pre-populate reusable message templates with placeholder support for contact details.
          </p>
        </div>

        <Button 
          variant="primary" 
          size="sm" 
          className="text-xs uppercase tracking-wider font-bold cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-2" />
          <span>New Template</span>
        </Button>
      </div>

      {/* Categories Tabs row */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800/60 pb-3 flex-shrink-0">
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer',
              selectedCategory === cat
                ? 'bg-blue-600/15 border-blue-500/25 text-blue-400 font-bold shadow'
                : 'bg-slate-900/40 border-slate-800 text-slate-450 hover:text-slate-200'
            )}
          >
            {cat === 'all' ? 'All Templates' : cat}
          </button>
        ))}
      </div>

      {/* Templates cards catalog list */}
      <div className="flex-1 overflow-y-auto pr-1 py-1">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/10 rounded-xl border border-dashed border-slate-800 space-y-3">
            <FileText className="h-10 w-10 text-slate-750 mx-auto" />
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-semibold">No templates found in this category.</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Create a quick template with custom macros to automate your outbound SMS workflows!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card 
                key={template.id} 
                className="glass-panel border-slate-800/80 shadow-md relative hover:border-slate-700/60 flex flex-col justify-between h-48 animate-fade-in group"
              >
                {/* Header card info */}
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="info" className="text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5">
                      {template.category}
                    </Badge>
                    
                    <button
                      onClick={() => handleDeleteTemplate(template.id, template.title)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-450 hover:text-red-400 hover:bg-red-500/15 transition-all duration-200 cursor-pointer"
                      title="Delete Template"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <h3 className="font-bold text-xs text-slate-200 truncate">{template.title}</h3>
                  
                  {/* Body preview with highlighted macros */}
                  <p className="text-xs text-slate-400 leading-relaxed mt-2.5 line-clamp-3">
                    {template.body.split(/(\{\{\s*name\s*\}\})/gi).map((part: string, index: number) => {
                      if (part.toLowerCase().includes('name')) {
                        return (
                          <span 
                            key={index} 
                            className="bg-blue-500/15 border border-blue-500/25 px-1 py-0.5 rounded text-[10px] font-bold text-blue-400 mx-0.5"
                          >
                            name
                          </span>
                        );
                      }
                      return part;
                    })}
                  </p>
                </div>

                {/* Footer card date */}
                <div className="text-[9px] text-slate-500 font-medium uppercase tracking-wider flex items-center space-x-1.5 pt-3 border-t border-slate-850 mt-4">
                  <Calendar className="h-3.5 w-3.5 text-slate-600" />
                  <span>Created {new Date(template.createdAt).toLocaleDateString()}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* DIALOG MODAL: Create Template */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <Card className="w-full max-w-md glass-panel relative z-10 p-6 animate-fade-in border border-slate-800/80 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                Design New Message Template
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-450 hover:text-slate-200 hover:bg-slate-900 cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleTemplateSubmit} className="space-y-4">
              {/* Category */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Template Category</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCat(!isCustomCat)}
                    className="text-[10px] text-blue-400 font-semibold cursor-pointer"
                  >
                    {isCustomCat ? 'Select Existing' : 'Create Custom'}
                  </button>
                </div>
                
                {isCustomCat ? (
                  <Input
                    type="text"
                    required
                    placeholder="Custom category label, e.g. Billing"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                  />
                ) : (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-250 focus:outline-none focus:border-blue-500/80 cursor-pointer"
                  >
                    {categories.filter(c => c !== 'all').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    {categories.length <= 1 && (
                      <>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Introduction">Introduction</option>
                        <option value="Support">Support</option>
                      </>
                    )}
                  </select>
                )}
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Template Title *</label>
                <Input
                  type="text"
                  required
                  placeholder="E.g. Follow-Up After First Contact"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Body */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Message Body *</label>
                  <span className="text-[9px] text-slate-500 italic">Use `{"{{name}}"}` for contacts full name</span>
                </div>
                <textarea
                  rows={4}
                  required
                  placeholder="Insert template message text here, e.g.: Hi {{name}}, thanks for your recent message!"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-850">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsModalOpen(false)} className="cursor-pointer text-[10px] uppercase font-bold tracking-wider">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isPending} className="cursor-pointer text-[10px] uppercase font-bold tracking-wider">
                  Create Template
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
