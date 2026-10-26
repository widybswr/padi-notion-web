'use client';

import React, { useState, useMemo } from 'react';
import { Task } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { SquadBadge } from './SquadBadge';
import { FigmaIcon } from './FigmaIcon';
import {
  FileText,
  ExternalLink,
  Calendar,
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Paperclip,
  CornerDownRight,
} from 'lucide-react';

interface TableViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onNewTask?: () => void;
}

type SortField =
  | 'title'
  | 'status'
  | 'priority'
  | 'squads'
  | 'assignees'
  | 'wbs'
  | 'date';

type SortDirection = 'asc' | 'desc';

const PRIORITY_ORDER: Record<string, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  'P0 - SUPER HIGH': 4,
};

const STATUS_ORDER: Record<string, number> = {
  'Not started': 1,
  'In progress design': 2,
  'In review': 3,
  'In PM review': 4,
  'Need revision': 5,
  'On hold': 6,
  Done: 7,
  Cancelled: 8,
};

export const TableView: React.FC<TableViewProps> = ({
  tasks,
  onSelectTask,
  onNewTask,
}) => {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTasks = useMemo(() => {
    if (!sortField) return tasks;

    return [...tasks].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'status':
          const statA = STATUS_ORDER[a.status] || 99;
          const statB = STATUS_ORDER[b.status] || 99;
          comparison = statA - statB;
          break;
        case 'priority':
          const prioA = PRIORITY_ORDER[a.priority] || 99;
          const prioB = PRIORITY_ORDER[b.priority] || 99;
          comparison = prioA - prioB;
          break;
        case 'squads':
          const sqA = a.squads?.[0] || 'zzz';
          const sqB = b.squads?.[0] || 'zzz';
          comparison = sqA.localeCompare(sqB);
          break;
        case 'assignees':
          const assA = a.assignees?.[0] || 'zzz';
          const assB = b.assignees?.[0] || 'zzz';
          comparison = assA.localeCompare(assB);
          break;
        case 'wbs':
          comparison = (a.wbs || 'zzz').localeCompare(b.wbs || 'zzz');
          break;
        case 'date':
          const dateA = a.start_date || '9999-99-99';
          const dateB = b.start_date || '9999-99-99';
          comparison = dateA.localeCompare(dateB);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [tasks, sortField, sortDirection]);

  const renderSortIndicator = (field: SortField) => {
    if (sortField === field) {
      return sortDirection === 'asc' ? (
        <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
      ) : (
        <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
      );
    }
    return (
      <ArrowUpDown className="w-3 h-3 text-zinc-300 dark:text-zinc-600 group-hover/th:text-zinc-500 transition-colors shrink-0" />
    );
  };

  return (
    <div className="w-full overflow-x-auto border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <table className="w-full text-left text-xs border-collapse min-w-[900px]">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/40 text-zinc-500 font-medium select-none">
            <th className="py-2.5 px-4 font-normal w-12 text-center text-zinc-400">
              #
            </th>

            {/* Name */}
            <th
              onClick={() => handleSort('title')}
              className="py-2.5 px-3 font-normal min-w-[280px] cursor-pointer group/th hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span>Name</span>
                {renderSortIndicator('title')}
              </div>
            </th>

            {/* Status */}
            <th
              onClick={() => handleSort('status')}
              className="py-2.5 px-3 font-normal w-36 cursor-pointer group/th hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span>Status</span>
                {renderSortIndicator('status')}
              </div>
            </th>

            {/* Priority */}
            <th
              onClick={() => handleSort('priority')}
              className="py-2.5 px-3 font-normal w-32 cursor-pointer group/th hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span>Priority</span>
                {renderSortIndicator('priority')}
              </div>
            </th>

            {/* Squad / Funnel */}
            <th
              onClick={() => handleSort('squads')}
              className="py-2.5 px-3 font-normal w-36 cursor-pointer group/th hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span>Squad / Funnel</span>
                {renderSortIndicator('squads')}
              </div>
            </th>

            {/* Assigned To */}
            <th
              onClick={() => handleSort('assignees')}
              className="py-2.5 px-3 font-normal w-32 cursor-pointer group/th hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span>Assigned To</span>
                {renderSortIndicator('assignees')}
              </div>
            </th>

            {/* WBS Code */}
            <th
              onClick={() => handleSort('wbs')}
              className="py-2.5 px-3 font-normal w-28 cursor-pointer group/th hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span>WBS Code</span>
                {renderSortIndicator('wbs')}
              </div>
            </th>

            {/* Date */}
            <th
              onClick={() => handleSort('date')}
              className="py-2.5 px-3 font-normal w-40 cursor-pointer group/th hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span>Date</span>
                {renderSortIndicator('date')}
              </div>
            </th>

            {/* Attachments Column */}
            <th className="py-2.5 px-3 font-normal min-w-[150px] text-zinc-500">
              <div className="flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                <span>Attachments</span>
              </div>
            </th>

            {/* Links */}
            <th className="py-2.5 px-4 font-normal w-24 text-right">Links</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {sortedTasks.map((task, idx) => (
            <tr
              key={task.id}
              onClick={() => onSelectTask(task)}
              className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 transition-colors cursor-pointer group"
            >
              {/* Row index */}
              <td className="py-2.5 px-4 text-center text-zinc-400 font-mono text-[11px]">
                {idx + 1}
              </td>

              {/* Title & icon */}
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-1.5 min-w-0">
                  {task.parent_id && (
                    <span title="Sub-task">
                      <CornerDownRight className="w-3 h-3 text-zinc-400 shrink-0" />
                    </span>
                  )}
                  {task.attachments && task.attachments.length > 0 && (
                    <span title={`${task.attachments.length} attachment(s)`} className="text-blue-500 shrink-0">
                      <Paperclip className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <span className="font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                    {task.title}
                  </span>
                </div>
              </td>

              {/* Status */}
              <td className="py-2.5 px-3 whitespace-nowrap">
                <StatusBadge status={task.status} />
              </td>

              {/* Priority */}
              <td className="py-2.5 px-3 whitespace-nowrap">
                <PriorityBadge priority={task.priority} />
              </td>

              {/* Squads */}
              <td className="py-2.5 px-3">
                <div className="flex flex-wrap gap-1">
                  {task.squads && task.squads.length > 0 ? (
                    task.squads.map((s, i) => <SquadBadge key={i} name={s} />)
                  ) : (
                    <span className="text-zinc-300 dark:text-zinc-600">-</span>
                  )}
                </div>
              </td>

              {/* Assignees */}
              <td className="py-2.5 px-3">
                <div className="flex flex-wrap gap-1">
                  {task.assignees && task.assignees.length > 0 ? (
                    task.assignees.map((a, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
                      >
                        {a}
                      </span>
                    ))
                  ) : (
                    <span className="text-zinc-300 dark:text-zinc-600">-</span>
                  )}
                </div>
              </td>

              {/* WBS */}
              <td className="py-2.5 px-3 font-mono text-zinc-500 text-[11px]">
                {task.wbs || '-'}
              </td>

              {/* Date */}
              <td className="py-2.5 px-3 text-zinc-500 whitespace-nowrap text-[11px]">
                {task.start_date ? (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-400" />
                    {task.start_date.slice(5)}{' '}
                    {task.end_date ? `→ ${task.end_date.slice(5)}` : ''}
                  </span>
                ) : (
                  <span className="text-zinc-300 dark:text-zinc-600">-</span>
                )}
              </td>

              {/* Attachments */}
              <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                {task.attachments && task.attachments.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1">
                    {task.attachments.map((file, fIdx) => (
                      <a
                        key={file.id || fIdx}
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        download={file.name}
                        title={`${file.name} (${file.size || ''}) - Click to download`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 transition-colors max-w-[170px]"
                      >
                        <Paperclip className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <span className="text-zinc-300 dark:text-zinc-600">-</span>
                )}
              </td>

              {/* Quick Link Icons */}
              <td
                className="py-2.5 px-4 text-right whitespace-nowrap"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="inline-flex items-center gap-1.5 justify-end">
                  {task.figma_url && (
                    <a
                      href={task.figma_url}
                      target="_blank"
                      rel="noreferrer"
                      title="Open Figma"
                      className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-purple-600 transition-colors"
                    >
                      <FigmaIcon className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {task.prd_url && (
                    <a
                      href={task.prd_url}
                      target="_blank"
                      rel="noreferrer"
                      title="Open PRD"
                      className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-blue-600 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {task.other_docs && (
                    <a
                      href={task.other_docs}
                      target="_blank"
                      rel="noreferrer"
                      title="Open Other Docs"
                      className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-amber-600 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </td>
            </tr>
          ))}

          {/* Add row button at bottom */}
          {onNewTask && (
            <tr>
              <td colSpan={9} className="py-2 px-4">
                <button
                  onClick={onNewTask}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors py-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New task
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
