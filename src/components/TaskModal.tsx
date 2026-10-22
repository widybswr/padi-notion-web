'use client';

import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { SquadBadge } from './SquadBadge';
import { FigmaIcon } from './FigmaIcon';
import {
  X,
  ExternalLink,
  Calendar,
  User,
  Layers,
  FileText,
  CheckCircle2,
  Tag,
  Trash2,
  Plus,
  Pencil,
  Check,
  Hash,
} from 'lucide-react';

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (updated: Task) => void;
  onDelete?: (id: string) => void;
}

const ALL_STATUSES: TaskStatus[] = [
  'Not started',
  'In progress design',
  'In review',
  'In PM review',
  'Need revision',
  'On hold',
  'Done',
  'Cancelled',
];

const ALL_PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'P0 - SUPER HIGH'];

const PRESET_SQUADS = [
  'Core',
  'Danantara',
  'Disbursement',
  'Discovery',
  'eProc',
  'Financing',
  'Fullfilment',
  'Payment',
  'Identity',
  'Torasera',
  'Transaction',
];

const PRESET_ASSIGNEES = ['Widy', 'Sigit', 'Banu', 'Frans', 'Dian'];

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  onClose,
  onUpdate,
  onDelete,
}) => {
  if (!task) return null;

  const [formData, setFormData] = useState<Task>({ ...task });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Input states for adding new fields
  const [isAddingSquad, setIsAddingSquad] = useState(false);
  const [newSquadInput, setNewSquadInput] = useState('');

  const [isAddingAssignee, setIsAddingAssignee] = useState(false);
  const [newAssigneeInput, setNewAssigneeInput] = useState('');

  const [editingUrl, setEditingUrl] = useState<
    'figma' | 'prd' | 'taiga' | 'other_docs' | null
  >(null);
  const [tempUrlInput, setTempUrlInput] = useState('');

  const [isEditingWbs, setIsEditingWbs] = useState(false);

  useEffect(() => {
    setFormData({ ...task });
  }, [task]);

  // Auto-save helper
  const updateAndSave = (updates: Partial<Task>) => {
    const updated = { ...formData, ...updates };
    setFormData(updated);
    setSaveStatus('saving');
    onUpdate(updated);
    setTimeout(() => {
      setSaveStatus('saved');
    }, 400);
  };

  // Squad management
  const handleAddSquad = (squadName: string) => {
    const trimmed = squadName.trim();
    if (!trimmed || formData.squads?.includes(trimmed)) return;
    const nextSquads = [...(formData.squads || []), trimmed];
    updateAndSave({ squads: nextSquads });
    setNewSquadInput('');
    setIsAddingSquad(false);
  };

  const handleRemoveSquad = (squadName: string) => {
    const nextSquads = (formData.squads || []).filter((s) => s !== squadName);
    updateAndSave({ squads: nextSquads });
  };

  // Assignee management
  const handleAddAssignee = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || formData.assignees?.includes(trimmed)) return;
    const nextAssignees = [...(formData.assignees || []), trimmed];
    updateAndSave({ assignees: nextAssignees });
    setNewAssigneeInput('');
    setIsAddingAssignee(false);
  };

  const handleRemoveAssignee = (name: string) => {
    const nextAssignees = (formData.assignees || []).filter((a) => a !== name);
    updateAndSave({ assignees: nextAssignees });
  };

  // URL management
  const handleSaveUrl = (type: 'figma' | 'prd' | 'taiga' | 'other_docs') => {
    const key =
      type === 'figma'
        ? 'figma_url'
        : type === 'prd'
        ? 'prd_url'
        : type === 'taiga'
        ? 'taiga_url'
        : 'other_docs';

    updateAndSave({ [key]: tempUrlInput.trim() });
    setEditingUrl(null);
    setTempUrlInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Breadcrumb Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>PaDi Design</span>
            <span>/</span>
            <span>Q4 2026</span>
            {formData.wbs && (
              <>
                <span>/</span>
                <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                  {formData.wbs}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-save indicator */}
            <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
              {saveStatus === 'saving' ? (
                <span className="text-amber-500">Saving...</span>
              ) : (
                <span className="text-emerald-500 inline-flex items-center gap-1">
                  <Check className="w-3 h-3" /> Saved
                </span>
              )}
            </span>

            {onDelete && (
              <button
                onClick={() => {
                  if (confirm('Delete this task?')) {
                    onDelete(formData.id);
                    onClose();
                  }
                }}
                className="p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Title (Inline editable like Notion) */}
          <div>
            <input
              type="text"
              placeholder="Untitled task"
              value={formData.title}
              onChange={(e) => updateAndSave({ title: e.target.value })}
              className="w-full text-xl font-bold text-zinc-900 dark:text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 focus:border-blue-500 focus:outline-none transition-all py-1"
            />
          </div>

          {/* Properties Grid (All directly editable & addable) */}
          <div className="space-y-3.5 text-xs">
            {/* Status */}
            <div className="flex items-center gap-4">
              <span className="w-28 text-zinc-400 flex items-center gap-1.5 shrink-0 select-none">
                <CheckCircle2 className="w-3.5 h-3.5" /> Status
              </span>
              <div className="relative inline-block">
                <select
                  value={formData.status}
                  onChange={(e) => updateAndSave({ status: e.target.value })}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <div className="cursor-pointer hover:opacity-80 transition-opacity">
                  <StatusBadge status={formData.status} size="sm" />
                </div>
              </div>
            </div>

            {/* Priority */}
            <div className="flex items-center gap-4">
              <span className="w-28 text-zinc-400 flex items-center gap-1.5 shrink-0 select-none">
                <Tag className="w-3.5 h-3.5" /> Priority
              </span>
              <div className="relative inline-block">
                <select
                  value={formData.priority}
                  onChange={(e) => updateAndSave({ priority: e.target.value })}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                >
                  {ALL_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <div className="cursor-pointer hover:opacity-80 transition-opacity">
                  <PriorityBadge priority={formData.priority} />
                </div>
              </div>
            </div>

            {/* Assignees (Editable & Addable) */}
            <div className="flex items-start gap-4">
              <span className="w-28 pt-1 text-zinc-400 flex items-center gap-1.5 shrink-0 select-none">
                <User className="w-3.5 h-3.5" /> Assignees
              </span>
              <div className="flex flex-wrap items-center gap-1.5 flex-1">
                {formData.assignees && formData.assignees.length > 0 ? (
                  formData.assignees.map((a, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium group"
                    >
                      <span>{a}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAssignee(a)}
                        className="text-zinc-400 hover:text-red-500 rounded p-0.5"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))
                ) : null}

                {/* Add Assignee Button / Dropdown */}
                {isAddingAssignee ? (
                  <div className="inline-flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded p-1">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Name or select..."
                      value={newAssigneeInput}
                      onChange={(e) => setNewAssigneeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAssignee(newAssigneeInput);
                        } else if (e.key === 'Escape') {
                          setIsAddingAssignee(false);
                        }
                      }}
                      className="text-xs bg-transparent focus:outline-none w-28 px-1 text-zinc-900 dark:text-zinc-100"
                    />
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleAddAssignee(e.target.value);
                      }}
                      className="text-[11px] bg-transparent text-zinc-500 focus:outline-none"
                    >
                      <option value="">Choose team</option>
                      {PRESET_ASSIGNEES.filter(
                        (n) => !formData.assignees?.includes(n)
                      ).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAddAssignee(newAssigneeInput)}
                      className="text-blue-600 hover:text-blue-700 px-1 font-semibold"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setIsAddingAssignee(false)}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingAssignee(true)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add assignee</span>
                  </button>
                )}
              </div>
            </div>

            {/* Squad / Funnel (Editable & Addable) */}
            <div className="flex items-start gap-4">
              <span className="w-28 pt-1 text-zinc-400 flex items-center gap-1.5 shrink-0 select-none">
                <Layers className="w-3.5 h-3.5" /> Squad
              </span>
              <div className="flex flex-wrap items-center gap-1.5 flex-1">
                {formData.squads && formData.squads.length > 0 ? (
                  formData.squads.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1">
                      <SquadBadge name={s} />
                      <button
                        type="button"
                        onClick={() => handleRemoveSquad(s)}
                        className="text-zinc-400 hover:text-red-500 rounded p-0.5"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))
                ) : null}

                {/* Add Squad Button / Dropdown */}
                {isAddingSquad ? (
                  <div className="inline-flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded p-1">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Squad name..."
                      value={newSquadInput}
                      onChange={(e) => setNewSquadInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSquad(newSquadInput);
                        } else if (e.key === 'Escape') {
                          setIsAddingSquad(false);
                        }
                      }}
                      className="text-xs bg-transparent focus:outline-none w-28 px-1 text-zinc-900 dark:text-zinc-100"
                    />
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleAddSquad(e.target.value);
                      }}
                      className="text-[11px] bg-transparent text-zinc-500 focus:outline-none"
                    >
                      <option value="">Preset</option>
                      {PRESET_SQUADS.filter((sq) => !formData.squads?.includes(sq)).map(
                        (sq) => (
                          <option key={sq} value={sq}>
                            {sq}
                          </option>
                        )
                      )}
                    </select>
                    <button
                      onClick={() => handleAddSquad(newSquadInput)}
                      className="text-blue-600 hover:text-blue-700 px-1 font-semibold"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setIsAddingSquad(false)}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingSquad(true)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add squad</span>
                  </button>
                )}
              </div>
            </div>

            {/* Backlog WBS Code (Editable & Addable) */}
            <div className="flex items-center gap-4">
              <span className="w-28 text-zinc-400 flex items-center gap-1.5 shrink-0 select-none">
                <Hash className="w-3.5 h-3.5" /> WBS Code
              </span>
              {isEditingWbs ? (
                <div className="inline-flex items-center gap-1.5">
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. FUL#1, DSC#2"
                    value={formData.wbs || ''}
                    onChange={(e) => setFormData({ ...formData, wbs: e.target.value })}
                    onBlur={() => {
                      setIsEditingWbs(false);
                      updateAndSave({ wbs: formData.wbs });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsEditingWbs(false);
                        updateAndSave({ wbs: formData.wbs });
                      }
                    }}
                    className="px-2 py-0.5 rounded bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              ) : formData.wbs ? (
                <span
                  onClick={() => setIsEditingWbs(true)}
                  className="font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  title="Click to edit WBS code"
                >
                  {formData.wbs}
                </span>
              ) : (
                <button
                  onClick={() => setIsEditingWbs(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add WBS code</span>
                </button>
              )}
            </div>

            {/* Timeline / Dates (Editable & Addable) */}
            <div className="flex items-center gap-4">
              <span className="w-28 text-zinc-400 flex items-center gap-1.5 shrink-0 select-none">
                <Calendar className="w-3.5 h-3.5" /> Timeline
              </span>
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                <input
                  type="date"
                  value={formData.start_date || ''}
                  onChange={(e) => updateAndSave({ start_date: e.target.value || null })}
                  className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none"
                />
                <span className="text-zinc-400">→</span>
                <input
                  type="date"
                  value={formData.end_date || ''}
                  onChange={(e) => updateAndSave({ end_date: e.target.value || null })}
                  className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800" />

          {/* Deliverables & Links (All Editable & Addable) */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 select-none">
              Deliverables & Links
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Figma Link */}
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200 font-medium text-xs">
                    <FigmaIcon className="w-4 h-4 text-purple-500" /> Figma Design
                  </span>
                  {formData.figma_url && editingUrl !== 'figma' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingUrl('figma');
                          setTempUrlInput(formData.figma_url);
                        }}
                        className="p-1 text-zinc-400 hover:text-zinc-600 rounded"
                        title="Edit URL"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => updateAndSave({ figma_url: '' })}
                        className="p-1 text-zinc-400 hover:text-red-500 rounded"
                        title="Remove link"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {editingUrl === 'figma' || !formData.figma_url ? (
                  editingUrl === 'figma' ? (
                    <div className="flex items-center gap-1.5 mt-2">
                      <input
                        type="url"
                        autoFocus
                        placeholder="https://www.figma.com/..."
                        value={tempUrlInput}
                        onChange={(e) => setTempUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveUrl('figma')}
                        className="w-full text-xs px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveUrl('figma')}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingUrl(null)}
                        className="p-1 text-zinc-400 hover:text-zinc-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingUrl('figma');
                        setTempUrlInput('');
                      }}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline pt-1"
                    >
                      <Plus className="w-3 h-3" /> Add Figma URL
                    </button>
                  )
                ) : (
                  <a
                    href={formData.figma_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 hover:underline truncate"
                  >
                    <span className="truncate">{formData.figma_url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 ml-1.5 text-zinc-400" />
                  </a>
                )}
              </div>

              {/* PRD Document */}
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200 font-medium text-xs">
                    <FileText className="w-4 h-4 text-blue-500" /> PRD Document
                  </span>
                  {formData.prd_url && editingUrl !== 'prd' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingUrl('prd');
                          setTempUrlInput(formData.prd_url);
                        }}
                        className="p-1 text-zinc-400 hover:text-zinc-600 rounded"
                        title="Edit URL"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => updateAndSave({ prd_url: '' })}
                        className="p-1 text-zinc-400 hover:text-red-500 rounded"
                        title="Remove link"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {editingUrl === 'prd' || !formData.prd_url ? (
                  editingUrl === 'prd' ? (
                    <div className="flex items-center gap-1.5 mt-2">
                      <input
                        type="url"
                        autoFocus
                        placeholder="https://docs.google.com/..."
                        value={tempUrlInput}
                        onChange={(e) => setTempUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveUrl('prd')}
                        className="w-full text-xs px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveUrl('prd')}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingUrl(null)}
                        className="p-1 text-zinc-400 hover:text-zinc-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingUrl('prd');
                        setTempUrlInput('');
                      }}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline pt-1"
                    >
                      <Plus className="w-3 h-3" /> Add PRD URL
                    </button>
                  )
                ) : (
                  <a
                    href={formData.prd_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 hover:underline truncate"
                  >
                    <span className="truncate">{formData.prd_url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 ml-1.5 text-zinc-400" />
                  </a>
                )}
              </div>

              {/* Presentation / Other Docs */}
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200 font-medium text-xs">
                    <FileText className="w-4 h-4 text-amber-500" /> Presentation / Other Docs
                  </span>
                  {formData.other_docs && editingUrl !== 'other_docs' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingUrl('other_docs');
                          setTempUrlInput(formData.other_docs || '');
                        }}
                        className="p-1 text-zinc-400 hover:text-zinc-600 rounded"
                        title="Edit URL"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => updateAndSave({ other_docs: '' })}
                        className="p-1 text-zinc-400 hover:text-red-500 rounded"
                        title="Remove link"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {editingUrl === 'other_docs' || !formData.other_docs ? (
                  editingUrl === 'other_docs' ? (
                    <div className="flex items-center gap-1.5 mt-2">
                      <input
                        type="url"
                        autoFocus
                        placeholder="https://docs.google.com/presentation/..."
                        value={tempUrlInput}
                        onChange={(e) => setTempUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveUrl('other_docs')}
                        className="w-full text-xs px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveUrl('other_docs')}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingUrl(null)}
                        className="p-1 text-zinc-400 hover:text-zinc-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingUrl('other_docs');
                        setTempUrlInput('');
                      }}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline pt-1"
                    >
                      <Plus className="w-3 h-3" /> Add Presentation link
                    </button>
                  )
                ) : (
                  <a
                    href={formData.other_docs}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 hover:underline truncate"
                  >
                    <span className="truncate">{formData.other_docs}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 ml-1.5 text-zinc-400" />
                  </a>
                )}
              </div>

              {/* Taiga URL */}
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200 font-medium text-xs">
                    <Tag className="w-4 h-4 text-emerald-500" /> Taiga Issue
                  </span>
                  {formData.taiga_url && editingUrl !== 'taiga' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingUrl('taiga');
                          setTempUrlInput(formData.taiga_url);
                        }}
                        className="p-1 text-zinc-400 hover:text-zinc-600 rounded"
                        title="Edit URL"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => updateAndSave({ taiga_url: '' })}
                        className="p-1 text-zinc-400 hover:text-red-500 rounded"
                        title="Remove link"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {editingUrl === 'taiga' || !formData.taiga_url ? (
                  editingUrl === 'taiga' ? (
                    <div className="flex items-center gap-1.5 mt-2">
                      <input
                        type="url"
                        autoFocus
                        placeholder="https://taiga.telkom.co.id/..."
                        value={tempUrlInput}
                        onChange={(e) => setTempUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveUrl('taiga')}
                        className="w-full text-xs px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveUrl('taiga')}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingUrl(null)}
                        className="p-1 text-zinc-400 hover:text-zinc-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingUrl('taiga');
                        setTempUrlInput('');
                      }}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline pt-1"
                    >
                      <Plus className="w-3 h-3" /> Add Taiga link
                    </button>
                  )
                ) : (
                  <a
                    href={formData.taiga_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 hover:underline truncate"
                  >
                    <span className="truncate">{formData.taiga_url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 ml-1.5 text-zinc-400" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800" />

          {/* Page Notes / Description (Notion-style Editor) */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 select-none">
              Notes & Description
            </h3>
            <textarea
              rows={4}
              placeholder="Add details, specs, meeting notes, or checklist for this task..."
              value={formData.description || ''}
              onChange={(e) => updateAndSave({ description: e.target.value })}
              className="w-full text-xs p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:outline-none text-zinc-800 dark:text-zinc-200 resize-y leading-relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
