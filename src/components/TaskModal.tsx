'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
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
];

const ALL_PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'P0 - SUPER HIGH'];

const NEXT_STATUS_MAP: Record<string, { next: TaskStatus; label: string }> = {
  'Not started': { next: 'In progress design', label: 'Start Design' },
  'In progress design': { next: 'In review', label: 'Request Review' },
  'In review': { next: 'In PM review', label: 'Send to PM' },
  'In PM review': { next: 'Done', label: 'Mark Done' },
  'Need revision': { next: 'In progress design', label: 'Resume Work' },
  'On hold': { next: 'In progress design', label: 'Resume Work' },
};

const PRESET_SQUADS = [
  'Core',
  'Discovery',
  'Disbursement',
  'eProc',
  'Financing',
  'Fullfilment',
  'Payment',
  'Identity',
  'Transaction',
];

const PRESET_ASSIGNEES = ['Dian', 'Sigit', 'Banu', 'Widy', 'Frans'];

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

  // View only vs Edit mode
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<Task>({ ...task });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  const parentTask = allTasks.find((t) => t.id === formData.parent_id);
  const subTasks = allTasks.filter((t) => t.parent_id === formData.id);

  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Dropdown states for edit mode
  const [isSquadDropdownOpen, setIsSquadDropdownOpen] = useState(false);
  const [newSquadInput, setNewSquadInput] = useState('');
  const [allSquads, setAllSquads] = useState<string[]>(PRESET_SQUADS);
  const squadRef = useRef<HTMLDivElement>(null);

  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [newAssigneeInput, setNewAssigneeInput] = useState('');
  const [allAssignees, setAllAssignees] = useState<string[]>(PRESET_ASSIGNEES);
  const assigneeRef = useRef<HTMLDivElement>(null);

  // Reset form and mode when a new task is opened
  useEffect(() => {
    setFormData({ ...task });
    setIsEditing(false);
  }, [task?.id]);

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

  // Click outside & Escape handling
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
        } else if (isEditing) {
          setIsEditing(false);
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
  }, [isSquadDropdownOpen, isAssigneeDropdownOpen, isEditing, onClose]);

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

  // Squad handlers
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

  // Assignee handlers
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

  // File upload handler
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

  const handleDeleteAttachment = (fileUrl: string) => {
    const updated = (formData.attachments || []).filter((a) => a.url !== fileUrl);
    updateAndSave({ attachments: updated });
  };

  const formatFileSize = (bytes?: number | string): string => {
    if (!bytes) return '0 B';
    const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (isNaN(num) || num === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(num) / Math.log(k));
    return parseFloat((num / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext || '')) {
      return <ImageIcon className="w-3.5 h-3.5 text-blue-500" />;
    }
    if (['csv', 'xlsx', 'xls', 'tsv'].includes(ext || '')) {
      return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />;
    }
    if (['json', 'ts', 'js', 'html', 'css'].includes(ext || '')) {
      return <FileCode className="w-3.5 h-3.5 text-amber-500" />;
    }
    return <File className="w-3.5 h-3.5 text-zinc-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>PaDi Design</span>
            <span>/</span>
            <span>Q4 2026</span>
            {formData.wbs && (
              <>
                <span>/</span>
                <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-700 dark:text-zinc-300 font-semibold">
                  {formData.wbs}
                </span>
              </>
            )}
            {isEditing && (
              <span className="ml-1.5 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                Edit Mode
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Auto-save indicator in Edit Mode */}
            {isEditing && (
              <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono mr-1">
                {saveStatus === 'saving' ? (
                  <span className="text-amber-500">Saving...</span>
                ) : (
                  <span className="text-emerald-500 inline-flex items-center gap-1">
                    <Check className="w-3 h-3" /> Saved
                  </span>
                )}
              </span>
            )}

            {/* Toggle Edit Button vs Done Button */}
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="h-7 inline-flex items-center gap-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Task</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="h-7 inline-flex items-center gap-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Done Editing</span>
              </button>
            )}

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
          {/* ============================================================== */}
          {/* 1. VIEW-ONLY MODE                                               */}
          {/* ============================================================== */}
          {!isEditing ? (
            <div className="space-y-5">
              {/* Title & Badges Bar (Status move action is still active!) */}
              <div className="pb-3 border-b border-zinc-100 dark:border-zinc-800 space-y-2.5">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 py-0.5 leading-snug">
                  {formData.title || 'Untitled task'}
                </h2>

                {/* Status, Priority, WBS in 1 line with Status still movable */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status with Quick Advance (Interactive & movable) */}
                  <div className="flex items-center gap-1.5">
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
                      <div className="cursor-pointer hover:opacity-80 transition-opacity" title="Click to change status">
                        <StatusBadge status={formData.status} size="sm" />
                      </div>
                    </div>

                    {NEXT_STATUS_MAP[formData.status] && (
                      <button
                        type="button"
                        onClick={() =>
                          updateAndSave({ status: NEXT_STATUS_MAP[formData.status].next })
                        }
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 hover:bg-blue-50 dark:bg-zinc-800 dark:hover:bg-blue-950/40 text-zinc-600 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400 border border-zinc-200/80 dark:border-zinc-700/80 transition-all shadow-2xs group cursor-pointer"
                        title={`Advance to ${NEXT_STATUS_MAP[formData.status].next}`}
                      >
                        <span>{NEXT_STATUS_MAP[formData.status].label}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-zinc-400 group-hover:text-blue-500 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    )}
                  </div>

                  {/* Priority Badge */}
                  <PriorityBadge priority={formData.priority} />

                  {/* WBS Code */}
                  {formData.wbs && (
                    <span className="inline-flex items-center gap-1 font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-xs">
                      <Hash className="w-3 h-3 text-zinc-400" />
                      {formData.wbs}
                    </span>
                  )}
                </div>
              </div>

              {/* 2-Column Read-Only Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Column 1: Core Details, People, Dates & Hierarchy */}
                <div className="space-y-4">
                  {/* Squad */}
                  <div className="space-y-1.5 py-1">
                    <span className="text-zinc-400 flex items-center gap-1.5 text-xs select-none">
                      <Layers className="w-3.5 h-3.5" /> Squad / Funnel
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {formData.squads && formData.squads.length > 0 ? (
                        formData.squads.map((s, i) => <SquadBadge key={i} name={s} />)
                      ) : (
                        <span className="text-zinc-400 text-xs py-0.5">No squad assigned</span>
                      )}
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
                            className="inline-flex items-center px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-xs font-medium"
                          >
                            {a}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-400 text-xs py-0.5">Unassigned</span>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-1.5 py-1">
                    <span className="text-zinc-400 flex items-center gap-1.5 text-xs select-none">
                      <Calendar className="w-3.5 h-3.5" /> Timeline
                    </span>
                    <div className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                      {formData.start_date || formData.end_date ? (
                        <span>
                          {formData.start_date || 'TBD'} → {formData.end_date || 'TBD'}
                        </span>
                      ) : (
                        <span className="text-zinc-400 font-normal">No timeline scheduled</span>
                      )}
                    </div>
                  </div>

                  {/* Parent Task Relation */}
                  {parentTask && (
                    <div className="space-y-1.5 py-1">
                      <span className="text-zinc-400 flex items-center gap-1.5 text-xs select-none">
                        <FolderTree className="w-3.5 h-3.5" /> Parent Task
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectTask && onSelectTask(parentTask)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-zinc-100 dark:bg-zinc-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-zinc-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 border border-zinc-200/80 dark:border-zinc-700/80 transition-colors group cursor-pointer"
                      >
                        {parentTask.wbs && (
                          <span className="font-mono text-[10px] text-zinc-400 font-semibold">{parentTask.wbs}</span>
                        )}
                        <span className="font-medium truncate">{parentTask.title}</span>
                        <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-blue-500" />
                      </button>
                    </div>
                  )}

                  {/* Sub-tasks */}
                  {subTasks.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 select-none flex items-center gap-1.5">
                        <FolderTree className="w-3.5 h-3.5" />
                        Sub-tasks ({subTasks.length})
                      </span>
                      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50/40 dark:bg-zinc-900/40 max-h-40 overflow-y-auto">
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

                {/* Column 2: Deliverables & Links, Files, Notes */}
                <div className="space-y-4 lg:border-l border-zinc-100 dark:border-zinc-800 lg:pl-8">
                  {/* Deliverables & Links */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Deliverables & Reference Links
                    </label>
                    <div className="space-y-1.5">
                      {/* Figma Link */}
                      {formData.figma_url ? (
                        <a
                          href={formData.figma_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors group"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FigmaIcon className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            <span className="text-zinc-800 dark:text-zinc-200 font-medium truncate">Figma Design File</span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-purple-600 shrink-0" />
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 p-2 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400">
                          <FigmaIcon className="w-3.5 h-3.5 opacity-40 shrink-0" />
                          <span>No Figma link</span>
                        </div>
                      )}

                      {/* PRD Document */}
                      {formData.prd_url ? (
                        <a
                          href={formData.prd_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors group"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="text-zinc-800 dark:text-zinc-200 font-medium truncate">PRD Document</span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-blue-600 shrink-0" />
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 p-2 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400">
                          <FileText className="w-3.5 h-3.5 opacity-40 shrink-0" />
                          <span>No PRD attached</span>
                        </div>
                      )}

                      {/* Other Docs */}
                      {formData.other_docs ? (
                        <a
                          href={formData.other_docs}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors group"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="text-zinc-800 dark:text-zinc-200 font-medium truncate">Documentation</span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-600 shrink-0" />
                        </a>
                      ) : null}

                      {/* Taiga / Jira */}
                      {formData.taiga_url ? (
                        <a
                          href={formData.taiga_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors group"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Tag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="text-zinc-800 dark:text-zinc-200 font-medium truncate">Taiga / Jira Task</span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-600 shrink-0" />
                        </a>
                      ) : null}
                    </div>
                  </div>

                  {/* Files & Attachments */}
                  <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Files & Attachments
                    </label>
                    {formData.attachments && formData.attachments.length > 0 ? (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {formData.attachments.map((att, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {getFileIcon(att.name)}
                              <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[180px]">
                                {att.name}
                              </span>
                              <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                                ({formatFileSize(att.size)})
                              </span>
                            </div>
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              download={att.name}
                              className="p-1 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                              title="Download / view file"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-zinc-400 text-xs py-1">No files attached</div>
                    )}
                  </div>

                  {/* Notes & Description */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Notes & Description
                    </label>
                    <div className="p-3 rounded-lg bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap min-h-[50px]">
                      {formData.description || (
                        <span className="text-zinc-400 italic">No notes or description provided.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* 2. EDIT TASK MODE (Layout exactly identical to Create Task)     */
            /* ============================================================== */
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Column 1: Core Details, Status, People & Dates (Left Side) */}
                <div className="space-y-4">
                  {/* Task Title (Textarea) */}
                  <div>
                    <label className="block text-zinc-500 font-medium mb-1">Task Title *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. [Discovery] Product Recommendation V2"
                      value={formData.title}
                      onChange={(e) => updateAndSave({ title: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs font-medium resize-y min-h-[72px] leading-relaxed"
                    />
                  </div>

                  {/* Status, Priority & WBS Section (Directly below Title) */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-zinc-500 font-medium mb-1">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => updateAndSave({ status: e.target.value })}
                          className="h-9 w-full px-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-zinc-500 font-medium mb-1">Priority</label>
                        <select
                          value={formData.priority}
                          onChange={(e) => updateAndSave({ priority: e.target.value })}
                          className="h-9 w-full px-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                        >
                          {ALL_PRIORITIES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-zinc-500 font-medium mb-1">WBS Code</label>
                      <input
                        type="text"
                        placeholder="e.g. DSC#1, FUL#2"
                        value={formData.wbs || ''}
                        onChange={(e) => updateAndSave({ wbs: e.target.value })}
                        className="h-9 w-full px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Divider after Status, Priority & WBS */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                    {/* Squad Multi-Select Dropdown with chips & add option (Full Width) */}
                    <div ref={squadRef} className="relative">
                      <label className="block text-zinc-500 font-medium mb-1">Squad / Funnel</label>
                      <div
                        onClick={() => setIsSquadDropdownOpen((prev) => !prev)}
                        className="min-h-[36px] w-full px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer flex flex-wrap items-center gap-1.5 justify-between"
                      >
                        <div className="flex flex-wrap items-center gap-1 flex-1">
                          {formData.squads && formData.squads.length > 0 ? (
                            formData.squads.map((sq) => (
                              <span
                                key={sq}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[10px] font-medium"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSquad(sq);
                                }}
                              >
                                <span className="truncate max-w-[90px]">{sq}</span>
                                <X className="w-2.5 h-2.5 hover:text-red-500 transition-colors shrink-0" />
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-400 text-xs">Select squads...</span>
                          )}
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-1" />
                      </div>

                      {isSquadDropdownOpen && (
                        <div className="absolute left-0 top-full mt-1 z-30 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl p-2 max-h-52 overflow-y-auto space-y-1">
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
                                  {isSelected && <Check className="w-3 h-3 text-blue-600 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                          {/* Add new squad input */}
                          <div className="pt-1.5 flex items-center gap-1.5">
                            <input
                              type="text"
                              placeholder="+ Add new..."
                              value={newSquadInput}
                              onChange={(e) => setNewSquadInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCustomSquad(e);
                                }
                              }}
                              className="h-7 flex-1 px-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleAddCustomSquad}
                              className="h-7 px-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Assignees Multi-Select Dropdown with chips & add option (Full Width) */}
                    <div ref={assigneeRef} className="relative">
                      <label className="block text-zinc-500 font-medium mb-1">Assignees</label>
                      <div
                        onClick={() => setIsAssigneeDropdownOpen((prev) => !prev)}
                        className="min-h-[36px] w-full px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer flex flex-wrap items-center gap-1.5 justify-between"
                      >
                        <div className="flex flex-wrap items-center gap-1 flex-1">
                          {formData.assignees && formData.assignees.length > 0 ? (
                            formData.assignees.map((asg) => (
                              <span
                                key={asg}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-[10px] font-medium"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAssignee(asg);
                                }}
                              >
                                <span className="truncate max-w-[90px]">{asg}</span>
                                <X className="w-2.5 h-2.5 hover:text-red-500 transition-colors shrink-0" />
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-400 text-xs">Select assignees...</span>
                          )}
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-1" />
                      </div>

                      {isAssigneeDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1 z-30 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl p-2 max-h-52 overflow-y-auto space-y-1">
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
                                  {isSelected && <Check className="w-3 h-3 text-purple-600 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                          {/* Add new assignee input */}
                          <div className="pt-1.5 flex items-center gap-1.5">
                            <input
                              type="text"
                              placeholder="+ Add new..."
                              value={newAssigneeInput}
                              onChange={(e) => setNewAssigneeInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCustomAssignee(e);
                                }
                              }}
                              className="h-7 flex-1 px-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleAddCustomAssignee}
                              className="h-7 px-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timeline Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-zinc-500 font-medium mb-1">Start Date</label>
                        <input
                          type="date"
                          value={formData.start_date || ''}
                          onChange={(e) => {
                            const newStart = e.target.value || null;
                            const newEnd =
                              !formData.end_date || (newStart && newStart > formData.end_date)
                                ? newStart
                                : formData.end_date;
                            updateAndSave({ start_date: newStart, end_date: newEnd });
                          }}
                          className="h-9 w-full px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-500 font-medium mb-1">End Date</label>
                        <input
                          type="date"
                          value={formData.end_date || ''}
                          onChange={(e) => updateAndSave({ end_date: e.target.value || null })}
                          className="h-9 w-full px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Deliverables & Links + Files & Attachments + Notes/Description (Right Side) */}
                <div className="space-y-4 lg:border-l border-zinc-100 dark:border-zinc-800 lg:pl-8">
                  {/* Deliverables & Reference Links (All Full Width) */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Deliverables & Reference Links
                    </label>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-zinc-500 font-medium mb-1">Figma URL</label>
                        <input
                          type="url"
                          placeholder="https://www.figma.com/..."
                          value={formData.figma_url || ''}
                          onChange={(e) => updateAndSave({ figma_url: e.target.value })}
                          className="h-8 w-full px-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-500 font-medium mb-1">PRD Document URL</label>
                        <input
                          type="url"
                          placeholder="https://docs.google.com/... or Notion PRD"
                          value={formData.prd_url || ''}
                          onChange={(e) => updateAndSave({ prd_url: e.target.value })}
                          className="h-8 w-full px-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-500 font-medium mb-1">Other Documentation URL</label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={formData.other_docs || ''}
                          onChange={(e) => updateAndSave({ other_docs: e.target.value })}
                          className="h-8 w-full px-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-500 font-medium mb-1">Taiga / Jira Task URL</label>
                        <input
                          type="url"
                          placeholder="https://taiga... or issue tracker"
                          value={formData.taiga_url || ''}
                          onChange={(e) => updateAndSave({ taiga_url: e.target.value })}
                          className="h-8 w-full px-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Upload Files & Attachments */}
                  <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Files & Attachments
                    </label>
                    <div className="border border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-center hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors bg-zinc-50/40 dark:bg-zinc-800/40">
                      <input
                        type="file"
                        id="edit-modal-file-upload"
                        multiple
                        onChange={handleModalFileUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="edit-modal-file-upload"
                        className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        {isUploadingFile ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading files...</span>
                          </>
                        ) : (
                          <>
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>Choose files to attach</span>
                          </>
                        )}
                      </label>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Images, PDFs, or design assets</p>
                    </div>

                    {/* Existing Attachments List */}
                    {formData.attachments && formData.attachments.length > 0 && (
                      <div className="space-y-1.5 max-h-28 overflow-y-auto pt-1">
                        {formData.attachments.map((att, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-1.5 bg-zinc-100 dark:bg-zinc-800/80 rounded border border-zinc-200 dark:border-zinc-700/80 text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              {getFileIcon(att.name)}
                              <span className="truncate font-medium text-zinc-700 dark:text-zinc-200 max-w-[170px]">
                                {att.name}
                              </span>
                              <span className="text-[10px] text-zinc-400 shrink-0">
                                ({formatFileSize(att.size)})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(att.url)}
                              className="text-zinc-400 hover:text-red-500 rounded p-0.5 ml-2 shrink-0 transition-colors"
                              title="Delete attachment"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notes & Description */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <label className="block text-zinc-500 font-medium mb-1">Notes & Description</label>
                    <textarea
                      rows={3}
                      placeholder="Additional context, notes, or requirements..."
                      value={formData.description || ''}
                      onChange={(e) => updateAndSave({ description: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs resize-y"
                    />
                  </div>
                </div>
              </div>

              {/* Edit Mode Footer Actions */}
              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400">
                  Editing task properties (auto-saved)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors font-medium"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
