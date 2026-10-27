'use client';

import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/lib/types';
import { uploadTaskFile } from '@/lib/supabase';
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
  ArrowRight,
  Paperclip,
  Download,
  CornerDownRight,
  FolderTree,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  File,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (updated: Task) => void;
  onDelete?: (id: string) => void;
  availableSquads?: string[];
  availableAssignees?: string[];
  allTasks?: Task[];
  onSelectTask?: (task: Task) => void;
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

const NEXT_STATUS_MAP: Record<string, { next: TaskStatus; label: string }> = {
  'Not started': { next: 'In progress design', label: 'Start Design' },
  'In progress design': { next: 'In review', label: 'Submit for Review' },
  'Need revision': { next: 'In progress design', label: 'Resume Design' },
  'In review': { next: 'In PM review', label: 'Move to PM review' },
  'In PM review': { next: 'Done', label: 'Mark as Done' },
  'On hold': { next: 'In progress design', label: 'Resume Task' },
};

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
  availableSquads,
  availableAssignees,
  allTasks = [],
  onSelectTask,
}) => {
  if (!task) return null;

  const [formData, setFormData] = useState<Task>({ ...task });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  const parentTask = allTasks.find((t) => t.id === formData.parent_id);
  const subTasks = allTasks.filter((t) => t.parent_id === formData.id);

  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const handleModalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploadingFile(true);
    const newFiles = Array.from(e.target.files);
    const currentAttachments = [...(formData.attachments || [])];

    for (const file of newFiles) {
      try {
        const att = await uploadTaskFile(formData.id, file);
        currentAttachments.push(att);
      } catch (err: any) {
        console.error('Failed to upload file:', err.message);
      }
    }

    updateAndSave({ attachments: currentAttachments });
    setIsUploadingFile(false);
  };

  // Squad selection states
  const [isSquadDropdownOpen, setIsSquadDropdownOpen] = useState(false);
  const [newSquadInput, setNewSquadInput] = useState('');
  const [allSquads, setAllSquads] = useState<string[]>(PRESET_SQUADS);
  const squadRef = React.useRef<HTMLDivElement>(null);

  // Assignee selection states
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [newAssigneeInput, setNewAssigneeInput] = useState('');
  const [allAssignees, setAllAssignees] = useState<string[]>(PRESET_ASSIGNEES);
  const assigneeRef = React.useRef<HTMLDivElement>(null);

  const [editingUrl, setEditingUrl] = useState<
    'figma' | 'prd' | 'taiga' | 'other_docs' | null
  >(null);
  const [tempUrlInput, setTempUrlInput] = useState('');

  const [isEditingWbs, setIsEditingWbs] = useState(false);

  useEffect(() => {
    setFormData({ ...task });
  }, [task]);

  // Sync available squads and assignees
  useEffect(() => {
    const mergedSquads = Array.from(
      new Set([...PRESET_SQUADS, ...(availableSquads || []), ...(formData.squads || [])])
    ).filter(Boolean);
    setAllSquads(mergedSquads);
  }, [availableSquads, formData.squads]);

  useEffect(() => {
    const mergedAssignees = Array.from(
      new Set([...PRESET_ASSIGNEES, ...(availableAssignees || []), ...(formData.assignees || [])])
    ).filter(Boolean);
    setAllAssignees(mergedAssignees);
  }, [availableAssignees, formData.assignees]);

  // Click outside to close dropdowns & Escape key to close modal/dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (squadRef.current && !squadRef.current.contains(e.target as Node)) {
        setIsSquadDropdownOpen(false);
      }
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) {
        setIsAssigneeDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSquadDropdownOpen) {
          setIsSquadDropdownOpen(false);
        } else if (isAssigneeDropdownOpen) {
          setIsAssigneeDropdownOpen(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSquadDropdownOpen, isAssigneeDropdownOpen, onClose]);

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

  // Squad toggle & custom add
  const toggleSquad = (sq: string) => {
    const current = formData.squads || [];
    const nextSquads = current.includes(sq)
      ? current.filter((s) => s !== sq)
      : [...current, sq];
    updateAndSave({ squads: nextSquads });
  };

  const handleAddCustomSquad = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSquadInput.trim();
    if (!trimmed) return;
    if (!allSquads.includes(trimmed)) {
      setAllSquads((prev) => [...prev, trimmed]);
    }
    const current = formData.squads || [];
    if (!current.includes(trimmed)) {
      updateAndSave({ squads: [...current, trimmed] });
    }
    setNewSquadInput('');
  };

  const handleRemoveSquad = (squadName: string) => {
    const nextSquads = (formData.squads || []).filter((s) => s !== squadName);
    updateAndSave({ squads: nextSquads });
  };

  // Assignee toggle & custom add
  const toggleAssignee = (asg: string) => {
    const current = formData.assignees || [];
    const nextAssignees = current.includes(asg)
      ? current.filter((a) => a !== asg)
      : [...current, asg];
    updateAndSave({ assignees: nextAssignees });
  };

  const handleAddCustomAssignee = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newAssigneeInput.trim();
    if (!trimmed) return;
    if (!allAssignees.includes(trimmed)) {
      setAllAssignees((prev) => [...prev, trimmed]);
    }
    const current = formData.assignees || [];
    if (!current.includes(trimmed)) {
      updateAndSave({ assignees: [...current, trimmed] });
    }
    setNewAssigneeInput('');
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
        className="relative w-full max-w-6xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
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
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Title (Inline editable like Notion) */}
          <div className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <input
              type="text"
              placeholder="Untitled task"
              value={formData.title}
              onChange={(e) => updateAndSave({ title: e.target.value })}
              className="w-full text-xl font-bold text-zinc-900 dark:text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 focus:border-blue-500 focus:outline-none transition-all py-0.5"
            />
          </div>

          {/* 3-Column Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Column 1: Properties & Hierarchy (Left - 4 cols) */}
            <div className="lg:col-span-4 space-y-4 lg:border-r border-zinc-100 dark:border-zinc-800 lg:pr-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 select-none">
                Properties
              </h3>

              <div className="space-y-3">
                {/* Status with Quick Advance Suggestion */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-zinc-400 flex items-center gap-1.5 text-xs select-none">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Status
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
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

                    {/* Quick Advance / Next Positive State Suggestion */}
                    {NEXT_STATUS_MAP[formData.status] && (
                      <button
                        type="button"
                        onClick={() =>
                          updateAndSave({ status: NEXT_STATUS_MAP[formData.status].next })
                        }
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 hover:bg-blue-50 dark:bg-zinc-800 dark:hover:bg-blue-950/40 text-zinc-600 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400 border border-zinc-200/80 dark:border-zinc-700/80 transition-all shadow-2xs group cursor-pointer"
                        title={`Advance to ${NEXT_STATUS_MAP[formData.status].next}`}
                      >
                        <span>{NEXT_STATUS_MAP[formData.status].label}</span>
                        <ArrowRight className="w-3 h-3 text-zinc-400 group-hover:text-blue-500 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Priority */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-zinc-400 flex items-center gap-1.5 text-xs select-none">
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

                {/* Assignees */}
                <div className="space-y-1.5 py-1">
                  <span className="text-zinc-400 flex items-center gap-1.5 text-xs select-none">
                    <User className="w-3.5 h-3.5" /> Assignees
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {formData.assignees && formData.assignees.length > 0 ? (
                      formData.assignees.map((a, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-xs font-medium"
                        >
                          <span>{a}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAssignee(a)}
                            className="text-purple-400 hover:text-red-500 rounded p-0.5"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-400 text-xs py-0.5">Unassigned</span>
                    )}

                    {/* Add Assignee Popover Trigger */}
                    <div ref={assigneeRef} className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => setIsAssigneeDropdownOpen((prev) => !prev)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>

                      {isAssigneeDropdownOpen && (
                        <div className="absolute left-0 top-full mt-1.5 z-40 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl p-2 max-h-56 overflow-y-auto space-y-1">
                          <div className="text-[10px] uppercase font-semibold text-zinc-400 px-1 pb-1">
                            Select Designer
                          </div>
                          <div className="grid grid-cols-2 gap-1 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                            {allAssignees.map((asg) => {
                              const isSelected = formData.assignees?.includes(asg);
                              return (
                                <button
                                  key={asg}
                                  type="button"
                                  onClick={() => toggleAssignee(asg)}
                                  className={`flex items-center justify-between px-2 py-1 rounded text-left text-xs transition-colors ${
                                    isSelected
                                      ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 font-medium'
                                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                  }`}
                                >
                                  <span className="truncate">{asg}</span>
                                  {isSelected && (
                                    <Check className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          {/* Add new assignee custom input */}
                          <div className="pt-1.5 flex items-center gap-1.5">
                            <input
                              type="text"
                              placeholder="+ Add custom..."
                              value={newAssigneeInput}
                              onChange={(e) => setNewAssigneeInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCustomAssignee();
                                }
                              }}
                              className="h-7 flex-1 px-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-purple-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddCustomAssignee()}
                              className="h-7 px-2.5 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Squad */}
                <div className="space-y-1.5 py-1">
                  <span className="text-zinc-400 flex items-center gap-1.5 text-xs select-none">
                    <Layers className="w-3.5 h-3.5" /> Squad
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
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
                    ) : (
                      <span className="text-zinc-400 text-xs py-0.5">No squad</span>
                    )}

                    {/* Add Squad Popover Trigger */}
                    <div ref={squadRef} className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => setIsSquadDropdownOpen((prev) => !prev)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>

                      {isSquadDropdownOpen && (
                        <div className="absolute left-0 top-full mt-1.5 z-40 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl p-2 max-h-56 overflow-y-auto space-y-1">
                          <div className="text-[10px] uppercase font-semibold text-zinc-400 px-1 pb-1">
                            Select Squad
                          </div>
                          <div className="grid grid-cols-2 gap-1 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                            {allSquads.map((sq) => {
                              const isSelected = formData.squads?.includes(sq);
                              return (
                                <button
                                  key={sq}
                                  type="button"
                                  onClick={() => toggleSquad(sq)}
                                  className={`flex items-center justify-between px-2 py-1 rounded text-left text-xs transition-colors ${
                                    isSelected
                                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-medium'
                                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                  }`}
                                >
                                  <span className="truncate">{sq}</span>
                                  {isSelected && (
                                    <Check className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          {/* Add new squad custom input */}
                          <div className="pt-1.5 flex items-center gap-1.5">
                            <input
                              type="text"
                              placeholder="+ Add custom squad..."
                              value={newSquadInput}
                              onChange={(e) => setNewSquadInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCustomSquad();
                                }
                              }}
                              className="h-7 flex-1 px-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddCustomSquad()}
                              className="h-7 px-2.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Backlog WBS Code */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-zinc-400 flex items-center gap-1.5 text-xs select-none">
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
                        className="px-2 py-0.5 rounded bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none w-24"
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
                      <span>Add WBS</span>
                    </button>
                  )}
                </div>

                {/* Timeline / Dates */}
                <div className="space-y-1.5 py-1">
                  <span className="text-zinc-400 flex items-center gap-1.5 text-xs select-none">
                    <Calendar className="w-3.5 h-3.5" /> Timeline
                  </span>
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                    <input
                      type="date"
                      value={formData.start_date || ''}
                      onChange={(e) => updateAndSave({ start_date: e.target.value || null })}
                      className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none"
                    />
                    <span className="text-zinc-400">→</span>
                    <input
                      type="date"
                      value={formData.end_date || ''}
                      onChange={(e) => updateAndSave({ end_date: e.target.value || null })}
                      className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Parent Task Relation */}
                <div className="space-y-1.5 py-1">
                  <span className="text-zinc-400 flex items-center gap-1.5 text-xs select-none">
                    <FolderTree className="w-3.5 h-3.5" /> Parent Task
                  </span>
                  <div>
                    {parentTask ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectTask && onSelectTask(parentTask)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-zinc-100 dark:bg-zinc-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-zinc-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 border border-zinc-200/80 dark:border-zinc-700/80 transition-colors group cursor-pointer flex-1 min-w-0"
                          title="Open parent task"
                        >
                          <CornerDownRight className="w-3 h-3 text-zinc-400 group-hover:text-blue-500 shrink-0" />
                          {parentTask.wbs && (
                            <span className="font-mono text-[10px] text-zinc-400 font-semibold shrink-0">
                              {parentTask.wbs}
                            </span>
                          )}
                          <span className="font-medium truncate">{parentTask.title}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateAndSave({ parent_id: null })}
                          className="p-1 text-zinc-400 hover:text-red-500 rounded shrink-0"
                          title="Unlink parent task"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              updateAndSave({ parent_id: e.target.value });
                            }
                          }}
                          className="w-full text-xs bg-transparent border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 rounded px-2.5 py-1 text-zinc-500 cursor-pointer focus:outline-none"
                        >
                          <option value="">+ Link to parent task...</option>
                          {allTasks
                            .filter((t) => t.id !== formData.id)
                            .map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.wbs ? `[${t.wbs}] ` : ''}{t.title}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Deliverables & Links + Sub-tasks (Center - 4 cols) */}
            <div className="lg:col-span-4 space-y-4 lg:border-r border-zinc-100 dark:border-zinc-800 lg:pr-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 select-none">
                Deliverables & Links
              </h3>

              <div className="space-y-2.5">
                {/* Figma Link */}
                <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-200 font-medium text-xs">
                      <FigmaIcon className="w-3.5 h-3.5 text-purple-500" /> Figma Design
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
                      <div className="flex items-center gap-1 mt-1.5">
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
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingUrl('figma');
                          setTempUrlInput('');
                        }}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline pt-0.5"
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
                      <ExternalLink className="w-3 h-3 shrink-0 ml-1 text-zinc-400" />
                    </a>
                  )}
                </div>

                {/* PRD Document */}
                <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-200 font-medium text-xs">
                      <FileText className="w-3.5 h-3.5 text-blue-500" /> PRD Document
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
                      <div className="flex items-center gap-1 mt-1.5">
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
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingUrl('prd');
                          setTempUrlInput('');
                        }}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline pt-0.5"
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
                      <ExternalLink className="w-3 h-3 shrink-0 ml-1 text-zinc-400" />
                    </a>
                  )}
                </div>

                {/* Presentation / Other Docs */}
                <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-200 font-medium text-xs">
                      <FileText className="w-3.5 h-3.5 text-amber-500" /> Presentation / Other Docs
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
                      <div className="flex items-center gap-1 mt-1.5">
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
                        className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline pt-0.5"
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
                      <ExternalLink className="w-3 h-3 shrink-0 ml-1 text-zinc-400" />
                    </a>
                  )}
                </div>

                {/* Taiga URL */}
                <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-200 font-medium text-xs">
                      <Tag className="w-3.5 h-3.5 text-emerald-500" /> Taiga Issue
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
                      <div className="flex items-center gap-1 mt-1.5">
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
                        className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline pt-0.5"
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
                      <ExternalLink className="w-3 h-3 shrink-0 ml-1 text-zinc-400" />
                    </a>
                  )}
                </div>
              </div>

              {/* Sub-tasks Section */}
              {subTasks.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 select-none flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5" />
                    Sub-tasks ({subTasks.length})
                  </h3>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50/40 dark:bg-zinc-900/40 max-h-44 overflow-y-auto">
                    {subTasks.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => onSelectTask && onSelectTask(st)}
                        className="flex items-center justify-between p-2 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <CornerDownRight className="w-3.5 h-3.5 text-zinc-400 shrink-0 group-hover:text-blue-500" />
                          {st.wbs && (
                            <span className="font-mono text-[9px] text-zinc-400 font-semibold shrink-0">
                              {st.wbs}
                            </span>
                          )}
                          <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                            {st.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <StatusBadge status={st.status} size="sm" />
                          <ChevronRight className="w-3 h-3 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Column 3: Files & Attachments + Notes & Description (Right - 4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Files & Attachments Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 select-none flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    Attachments ({formData.attachments?.length || 0})
                  </h3>
                  <label className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-blue-600 dark:text-blue-400 bg-blue-50/60 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 cursor-pointer transition-colors font-medium">
                    {isUploadingFile ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        <span>Add file</span>
                      </>
                    )}
                    <input
                      type="file"
                      multiple
                      disabled={isUploadingFile}
                      onChange={handleModalFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {formData.attachments && formData.attachments.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {formData.attachments.map((file, idx) => {
                      const isImage = file.type === 'image' || file.name.match(/\.(png|jpe?g|gif|webp)$/i);
                      const isPdf = file.name.endsWith('.pdf');
                      const isDoc = file.name.match(/\.(docx?|rtf)$/i);
                      const isSheet = file.name.match(/\.(xlsx?|csv)$/i);
                      const isHtml = file.name.match(/\.(html?|js|ts|json)$/i);

                      return (
                        <div
                          key={file.id || idx}
                          className="flex flex-col p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group"
                        >
                          {isImage && (
                            <div className="mb-1.5 rounded overflow-hidden max-h-28 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                              <img
                                src={file.url}
                                alt={file.name}
                                className="object-contain max-h-28 w-full cursor-pointer hover:opacity-95 transition-opacity"
                                onClick={() => window.open(file.url, '_blank')}
                              />
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="p-1 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0">
                                {isPdf ? (
                                  <FileText className="w-3.5 h-3.5 text-red-500" />
                                ) : isDoc ? (
                                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                                ) : isSheet ? (
                                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                                ) : isHtml ? (
                                  <FileCode className="w-3.5 h-3.5 text-purple-500" />
                                ) : isImage ? (
                                  <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                                ) : (
                                  <File className="w-3.5 h-3.5 text-zinc-500" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate" title={file.name}>
                                  {file.name}
                                </p>
                                {file.size && (
                                  <p className="text-[10px] text-zinc-400 font-mono">{file.size}</p>
                                )}
                              </div>
                            </div>
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              download={file.name}
                              className="p-1 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors shrink-0"
                              title="Download file"
                            >
                              <Download className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">No files attached yet. Click &quot;Add file&quot; to upload.</p>
                )}
              </div>

              {/* Notes & Description (Notion-style Editor) */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 select-none">
                  Notes & Description
                </h3>
                <textarea
                  rows={6}
                  placeholder="Add details, specs, meeting notes, or checklist for this task..."
                  value={formData.description || ''}
                  onChange={(e) => updateAndSave({ description: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:outline-none text-zinc-800 dark:text-zinc-200 resize-y leading-relaxed font-mono whitespace-pre-wrap"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
