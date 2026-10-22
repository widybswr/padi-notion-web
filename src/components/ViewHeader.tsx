'use client';

import React from 'react';
import { ViewMode } from '@/lib/types';
import { Table, Kanban, Search, Filter, Plus, X, Calendar } from 'lucide-react';

interface ViewHeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedSquad: string | null;
  setSelectedSquad: (squad: string | null) => void;
  selectedStatus: string | null;
  setSelectedStatus: (status: string | null) => void;
  squadOptions: string[];
  statusOptions: string[];
  activeQuarter: string;
  onNewTask: () => void;
  totalFiltered: number;
}

export const ViewHeader: React.FC<ViewHeaderProps> = ({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  selectedSquad,
  setSelectedSquad,
  selectedStatus,
  setSelectedStatus,
  squadOptions,
  statusOptions,
  activeQuarter,
  onNewTask,
  totalFiltered,
}) => {
  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
      {/* Title & Stats */}
      <div className="px-6 pt-5 pb-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>🌾</span> {activeQuarter}
            <span className="text-xs font-normal text-zinc-400 ml-2 font-mono">
              ({totalFiltered} items)
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNewTask}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="px-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800/80 py-2">
        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('table')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>

          <button
            onClick={() => setViewMode('board')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'board'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Board</span>
          </button>

          <button
            onClick={() => setViewMode('timeline')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'timeline'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Timeline</span>
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
              className="pl-8 pr-7 py-1 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:border-blue-500 w-48 text-zinc-900 dark:text-zinc-100"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Squad Filter */}
          <select
            value={selectedSquad || ''}
            onChange={(e) => setSelectedSquad(e.target.value || null)}
            className="py-1 px-2.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none text-zinc-700 dark:text-zinc-300"
          >
            <option value="">All Squads</option>
            {squadOptions.map((sq) => (
              <option key={sq} value={sq}>
                {sq}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus || ''}
            onChange={(e) => setSelectedStatus(e.target.value || null)}
            className="py-1 px-2.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none text-zinc-700 dark:text-zinc-300"
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
