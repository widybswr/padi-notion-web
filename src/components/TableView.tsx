'use client';

import React from 'react';
import { Task } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { SquadBadge } from './SquadBadge';
import { FigmaIcon } from './FigmaIcon';
import { FileText, ExternalLink, Calendar, Plus } from 'lucide-react';

interface TableViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onNewTask?: () => void;
}

export const TableView: React.FC<TableViewProps> = ({ tasks, onSelectTask, onNewTask }) => {
  return (
    <div className="w-full overflow-x-auto border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <table className="w-full text-left text-xs border-collapse min-w-[900px]">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/40 text-zinc-500 font-medium select-none">
            <th className="py-2.5 px-4 font-normal w-12 text-center text-zinc-400">#</th>
            <th className="py-2.5 px-3 font-normal min-w-[280px]">Name</th>
            <th className="py-2.5 px-3 font-normal w-36">Status</th>
            <th className="py-2.5 px-3 font-normal w-32">Priority</th>
            <th className="py-2.5 px-3 font-normal w-36">Squad / Funnel</th>
            <th className="py-2.5 px-3 font-normal w-32">Assigned To</th>
            <th className="py-2.5 px-3 font-normal w-24">WBS Code</th>
            <th className="py-2.5 px-3 font-normal w-40">Date</th>
            <th className="py-2.5 px-4 font-normal w-28 text-right">Links</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {tasks.map((task, idx) => (
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
                <span className="font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                  {task.title}
                </span>
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
                    {task.start_date.slice(5)} {task.end_date ? `→ ${task.end_date.slice(5)}` : ''}
                  </span>
                ) : (
                  <span className="text-zinc-300 dark:text-zinc-600">-</span>
                )}
              </td>

              {/* Quick Link Icons */}
              <td className="py-2.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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
                  New row
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
