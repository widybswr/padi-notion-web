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
  onNewTask: () => void;
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
  onNewTask,
  onLogout,
}) => {
  return (
    <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 flex flex-col h-screen select-none shrink-0">
      {/* Workspace Header */}
      <div className="p-4 border-b border-zinc-200/70 dark:border-zinc-800/80">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🌾</span>
          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
            All tasks 2026
          </span>
        </div>
        <p className="text-xs text-zinc-400 pl-7">PaDi Design • Q4</p>
      </div>

      {/* Nav Actions */}
      <div className="p-3 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <button
          onClick={onNewTask}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-lg text-xs font-medium shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
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
                <span>All Tasks (Table)</span>
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
                <span>Status Board</span>
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
                <span>Q4 Timeline</span>
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
                    <span>Tasks {name}</span>
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
