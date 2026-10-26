'use client';

import React from 'react';
import { ViewMode } from '@/lib/types';
import { Table, Kanban, Search, Plus, X, Calendar, ChevronDown } from 'lucide-react';

interface ViewHeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedStatus: string | null;
  setSelectedStatus: (status: string | null) => void;
  selectedAssignee: string | null;
  setSelectedAssignee: (assignee: string | null) => void;
  statusOptions: string[];
  activeQuarter: string;
  setActiveQuarter: (quarter: string) => void;
  quartersList: string[];
  onAddQuarter: (quarter: string) => void;
  onNewTask: () => void;
  totalFiltered: number;
}

export const ViewHeader: React.FC<ViewHeaderProps> = ({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  selectedAssignee,
  setSelectedAssignee,
  statusOptions,
  activeQuarter,
  setActiveQuarter,
  quartersList,
  onAddQuarter,
  onNewTask,
  totalFiltered,
}) => {
  return (
    <div className="border-b border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 font-sans">
      {/* Top Bar: Quarter Selector & New Task button (Title removed from table side) */}
      <div className="px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Quarter selector & active scope details */}
        <div className="flex items-center gap-2.5">
          <div className="relative inline-flex items-center">
            <select
              value={activeQuarter}
              onChange={(e) => {
                if (e.target.value === '__add_new__') {
                  const promptVal = window.prompt('Enter new quarter name (e.g. Q1 2027):');
                  if (promptVal && promptVal.trim()) {
                    onAddQuarter(promptVal.trim());
                    setActiveQuarter(promptVal.trim());
                  }
                } else {
                  setActiveQuarter(e.target.value);
                }
              }}
              className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-100/90 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md py-1.5 pl-3 pr-7 appearance-none focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer transition-colors shadow-2xs"
            >
              {quartersList.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
              <option value="__add_new__">+ Add quarter...</option>
            </select>
            <div className="pointer-events-none absolute right-2 flex items-center text-zinc-400">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>

          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
            ({totalFiltered} items)
          </span>

          {selectedAssignee && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
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

        {/* Action: New Task */}
        <div className="flex items-center gap-2">
          <button
            onClick={onNewTask}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-md text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="px-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800/80 py-2">
        {/* View Switcher Tabs: Timeline (1st default), Table, Board (last) */}
        <div className="flex items-center gap-1 bg-zinc-100/70 dark:bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800">
          <button
            onClick={() => setViewMode('timeline')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
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
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
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
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              viewMode === 'board'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Board</span>
          </button>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-7 py-1 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-400 w-48 text-zinc-900 dark:text-zinc-100 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus || ''}
            onChange={(e) => setSelectedStatus(e.target.value || null)}
            className="py-1 px-2.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-700 dark:text-zinc-300 cursor-pointer"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
