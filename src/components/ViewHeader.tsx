'use client';

import React from 'react';
import { ViewMode } from '@/lib/types';
import { Table, Kanban, Search, Plus, X, Calendar } from 'lucide-react';

interface ViewHeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedAssignee: string | null;
  setSelectedAssignee: (assignee: string | null) => void;
  onNewTask: () => void;
  onAddLeave?: () => void;
}

export const ViewHeader: React.FC<ViewHeaderProps> = ({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  selectedAssignee,
  setSelectedAssignee,
  onNewTask,
  onAddLeave,
}) => {
  return (
    <div className="border-b border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 font-sans">
      <div className="px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: View Switcher Tabs & Active Designer Filter */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 flex items-center gap-1 bg-zinc-100/70 dark:bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800 box-border">
            <button
              onClick={() => setViewMode('timeline')}
              className={`h-7 inline-flex items-center gap-1.5 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`h-7 inline-flex items-center gap-1.5 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>

            <button
              onClick={() => setViewMode('board')}
              className={`h-7 inline-flex items-center gap-1.5 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
          </div>

          {selectedAssignee && (
            <span className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 box-border">
              <span>{selectedAssignee}</span>
              <button
                type="button"
                onClick={() => setSelectedAssignee(null)}
                className="hover:text-zinc-500 text-zinc-400 font-bold leading-none cursor-pointer"
                title="Clear designer filter"
              >
                ×
              </button>
            </span>
          )}
        </div>

        {/* Right: Search Bar and New Task (Same h-8 height, status filter removed) */}
        <div className="flex items-center gap-2">
          {/* Search Bar - Exactly h-8 */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-7 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 w-48 text-zinc-900 dark:text-zinc-100 transition-colors box-border"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* New Task Button - Exactly h-8 */}
          <button
            onClick={onNewTask}
            className="h-8 inline-flex items-center gap-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer box-border"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>

          {/* Add Leave Button - Outline Muted (Placed to the right of New Task) */}
          {onAddLeave && (
            <button
              onClick={onAddLeave}
              className="h-8 inline-flex items-center gap-1.5 px-3 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800 rounded-lg text-xs font-medium transition-colors cursor-pointer box-border"
            >
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Add Leave</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
