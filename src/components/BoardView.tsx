'use client';

import React from 'react';
import { Task, TaskStatus } from '@/lib/types';
import { PriorityBadge } from './PriorityBadge';
import { SquadBadge } from './SquadBadge';
import { FigmaIcon } from './FigmaIcon';
import { FileText, Calendar, Plus } from 'lucide-react';

interface BoardViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onNewTaskWithStatus?: (status: TaskStatus) => void;
}

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'Not started', label: 'Not started', color: 'border-zinc-300 dark:border-zinc-700' },
  { status: 'In progress design', label: 'In progress design', color: 'border-sky-400 dark:border-sky-600' },
  { status: 'In review', label: 'In review', color: 'border-amber-400 dark:border-amber-600' },
  { status: 'In PM review', label: 'In PM review', color: 'border-purple-400 dark:border-purple-600' },
  { status: 'Need revision', label: 'Need revision', color: 'border-rose-400 dark:border-rose-600' },
  { status: 'On hold', label: 'On hold', color: 'border-pink-400 dark:border-pink-600' },
  { status: 'Done', label: 'Done', color: 'border-emerald-400 dark:border-emerald-600' },
];

export const BoardView: React.FC<BoardViewProps> = ({
  tasks,
  onSelectTask,
  onNewTaskWithStatus,
}) => {
  return (
    <div className="flex gap-4 p-4 overflow-x-auto min-h-[calc(100vh-140px)] bg-zinc-50/50 dark:bg-zinc-950">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);

        return (
          <div
            key={col.status}
            className="w-72 shrink-0 flex flex-col bg-zinc-100/60 dark:bg-zinc-900/50 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-3.5 py-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full border-2 ${col.color}`} />
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  {col.label}
                </span>
                <span className="text-[11px] font-mono bg-zinc-200/70 dark:bg-zinc-800 px-1.5 py-0.2 rounded text-zinc-500">
                  {colTasks.length}
                </span>
              </div>
              {onNewTaskWithStatus && (
                <button
                  onClick={() => onNewTaskWithStatus(col.status)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded transition-colors"
                  title="Add task in this column"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Column Tasks */}
            <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
              {colTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200/70 dark:border-zinc-800 shadow-2xs hover:shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer group"
                >
                  {/* WBS & Priority */}
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    {task.wbs ? (
                      <span className="font-mono text-[10px] text-zinc-400">
                        {task.wbs}
                      </span>
                    ) : (
                      <span />
                    )}
                    <PriorityBadge priority={task.priority} />
                  </div>

                  {/* Title */}
                  <h4 className="text-xs font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                    {task.title}
                  </h4>

                  {/* Squads */}
                  {task.squads && task.squads.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {task.squads.map((s, i) => (
                        <SquadBadge key={i} name={s} />
                      ))}
                    </div>
                  )}

                  {/* Bottom info: Date, Assignee, links */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                    <div className="flex items-center gap-1.5">
                      {task.assignees && task.assignees.length > 0 ? (
                        <div className="flex -space-x-1">
                          {task.assignees.map((a, i) => (
                            <span
                              key={i}
                              title={a}
                              className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 border border-white dark:border-zinc-900 text-blue-800 dark:text-blue-200 text-[10px] flex items-center justify-center font-bold"
                            >
                              {a[0]}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-600">-</span>
                      )}

                      {task.start_date && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 ml-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {task.start_date.slice(5)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {task.figma_url && (
                        <a
                          href={task.figma_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-zinc-400 hover:text-purple-600 transition-colors p-0.5"
                        >
                          <FigmaIcon className="w-3 h-3" />
                        </a>
                      )}
                      {task.prd_url && (
                        <a
                          href={task.prd_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-zinc-400 hover:text-blue-600 transition-colors p-0.5"
                        >
                          <FileText className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
