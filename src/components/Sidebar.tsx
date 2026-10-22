'use client';

import React from 'react';
import { ViewMode } from '@/lib/types';
import {
  Table,
  Kanban,
  User,
  CheckCircle,
  Database,
  ExternalLink,
  Plus,
  LogOut,
  Calendar,
} from 'lucide-react';

interface SidebarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedAssignee: string | null;
  setSelectedAssignee: (assignee: string | null) => void;
  assignees: string[];
  totalTasks: number;
  isSupabaseConnected: boolean;
  activeQuarter: string;
  setActiveQuarter: (quarter: string) => void;
  quartersList: string[];
  onAddQuarter: (quarter: string) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  viewMode,
  setViewMode,
  selectedAssignee,
  setSelectedAssignee,
  assignees,
  totalTasks,
  isSupabaseConnected,
  activeQuarter,
  setActiveQuarter,
  quartersList,
  onAddQuarter,
  onLogout,
}) => {
  return (
    <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 flex flex-col h-screen select-none shrink-0">
      {/* Workspace Header */}
      <div className="p-3.5 border-b border-zinc-200/70 dark:border-zinc-800/80">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🌾</span>
          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">
            PaDi Design Tasks
          </span>
        </div>

        {/* Quarter Dropdown Selector */}
        <div className="relative flex items-center">
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
            className="w-full text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 rounded-md py-1.5 pl-2.5 pr-7 appearance-none focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer shadow-2xs"
          >
            {quartersList.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
            <option value="__add_new__">+ Add quarter...</option>
          </select>
          <div className="pointer-events-none absolute right-2 flex items-center text-zinc-400">
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 text-xs">
        {/* Views */}
        <div>
          <span className="px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Views
          </span>
          <div className="mt-1 space-y-0.5">
            <button
              onClick={() => {
                setViewMode('table');
                setSelectedAssignee(null);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                viewMode === 'table' && !selectedAssignee
                  ? 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Table className="w-3.5 h-3.5" />
                <span>Table</span>
              </div>
              <span className="text-[10px] font-mono opacity-70">{totalTasks}</span>
            </button>

            <button
              onClick={() => {
                setViewMode('board');
                setSelectedAssignee(null);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                viewMode === 'board' && !selectedAssignee
                  ? 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Kanban className="w-3.5 h-3.5" />
                <span>Board</span>
              </div>
            </button>

            <button
              onClick={() => {
                setViewMode('timeline');
                setSelectedAssignee(null);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                viewMode === 'timeline' && !selectedAssignee
                  ? 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Timeline</span>
              </div>
            </button>
          </div>
        </div>

        {/* Team Assignee Views (Matches Notion Views: Tasks Widy, Task Sigit, etc.) */}
        <div>
          <span className="px-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Team Views
          </span>
          <div className="mt-1 space-y-0.5">
            {assignees.map((name) => {
              const isSelected = selectedAssignee === name;
              return (
                <button
                  key={name}
                  onClick={() => setSelectedAssignee(isSelected ? null : name)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer / Database Status */}
      <div className="p-3 border-t border-zinc-200/70 dark:border-zinc-800/80 bg-zinc-100/40 dark:bg-zinc-900/40 text-[11px]">
        <div className="flex items-center justify-between text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            <span>Supabase</span>
          </div>
          {isSupabaseConnected ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Local Cache
            </span>
          )}
        </div>
        <a
          href="https://app.notion.com/p/3ec30a0f80918060b6ace35432418190?v=12a30a0f809183149a5808b855188683"
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex items-center justify-between text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors pt-2 border-t border-zinc-200/40 dark:border-zinc-800/40"
        >
          <span>Original Notion</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full mt-2 flex items-center justify-between text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors pt-2 border-t border-zinc-200/40 dark:border-zinc-800/40"
          >
            <span>Lock workspace</span>
            <LogOut className="w-3 h-3" />
          </button>
        )}
      </div>
    </aside>
  );
};
