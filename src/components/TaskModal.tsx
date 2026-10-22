'use client';

import React, { useState } from 'react';
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
  Save,
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

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  onClose,
  onUpdate,
  onDelete,
}) => {
  if (!task) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Task>({ ...task });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(formData);
      setIsEditing(false);
    } catch (err) {
      alert('Failed to save changes: ' + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
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
          <div className="flex items-center gap-2">
            {isEditing ? (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
              >
                Edit
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

        {/* Content body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            {isEditing ? (
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full text-xl font-bold text-zinc-900 dark:text-zinc-100 bg-transparent border-b border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-blue-500 pb-1"
              />
            ) : (
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {formData.title}
              </h2>
            )}
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6 text-sm">
            {/* Status */}
            <div className="flex items-center gap-3">
              <span className="w-24 text-xs text-zinc-400 flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" /> Status
              </span>
              {isEditing ? (
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <StatusBadge status={formData.status} />
              )}
            </div>

            {/* Priority */}
            <div className="flex items-center gap-3">
              <span className="w-24 text-xs text-zinc-400 flex items-center gap-1.5 shrink-0">
                <Tag className="w-3.5 h-3.5" /> Priority
              </span>
              {isEditing ? (
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1"
                >
                  {ALL_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              ) : (
                <PriorityBadge priority={formData.priority} />
              )}
            </div>

            {/* Assignees */}
            <div className="flex items-center gap-3">
              <span className="w-24 text-xs text-zinc-400 flex items-center gap-1.5 shrink-0">
                <User className="w-3.5 h-3.5" /> Assignee
              </span>
              <div className="flex flex-wrap gap-1">
                {formData.assignees && formData.assignees.length > 0 ? (
                  formData.assignees.map((a, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
                    >
                      {a}
                    </span>
                  ))
                ) : (
                  <span className="text-zinc-400 text-xs">Empty</span>
                )}
              </div>
            </div>

            {/* Squad */}
            <div className="flex items-center gap-3">
              <span className="w-24 text-xs text-zinc-400 flex items-center gap-1.5 shrink-0">
                <Layers className="w-3.5 h-3.5" /> Squad
              </span>
              <div className="flex flex-wrap gap-1">
                {formData.squads && formData.squads.length > 0 ? (
                  formData.squads.map((s, i) => <SquadBadge key={i} name={s} />)
                ) : (
                  <span className="text-zinc-400 text-xs">Empty</span>
                )}
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-3 sm:col-span-2">
              <span className="w-24 text-xs text-zinc-400 flex items-center gap-1.5 shrink-0">
                <Calendar className="w-3.5 h-3.5" /> Timeline
              </span>
              <div className="text-xs text-zinc-600 dark:text-zinc-300">
                {formData.start_date ? (
                  <span>
                    {formData.start_date} {formData.end_date ? `→ ${formData.end_date}` : ''}
                  </span>
                ) : (
                  <span className="text-zinc-400">No date specified</span>
                )}
              </div>
            </div>
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800" />

          {/* Connected Documents & Tools */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Deliverables & Links
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {formData.figma_url && (
                <a
                  href={formData.figma_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-all text-xs group"
                >
                  <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200 font-medium">
                    <FigmaIcon className="w-4 h-4 text-purple-500" /> Figma Design
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-blue-600 transition-colors" />
                </a>
              )}

              {formData.prd_url && (
                <a
                  href={formData.prd_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-all text-xs group"
                >
                  <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200 font-medium">
                    <FileText className="w-4 h-4 text-blue-500" /> PRD Document
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-blue-600 transition-colors" />
                </a>
              )}

              {formData.other_docs && (
                <a
                  href={formData.other_docs}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 transition-all text-xs group"
                >
                  <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200 font-medium">
                    <FileText className="w-4 h-4 text-amber-500" /> Presentation / Other Docs
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-600 transition-colors" />
                </a>
              )}

              {formData.taiga_url && (
                <a
                  href={formData.taiga_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all text-xs group"
                >
                  <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200 font-medium">
                    <Tag className="w-4 h-4 text-emerald-500" /> Taiga Issue
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-600 transition-colors" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
