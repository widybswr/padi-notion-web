'use client';

import React from 'react';
import { ViewMode, Task } from '@/lib/types';
import {
  ExternalLink,
  LogOut,
  CheckCircle2,
  LayoutDashboard,
} from 'lucide-react';

interface SidebarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedAssignee: string | null;
  setSelectedAssignee: (assignee: string | null) => void;
  totalTasks: number;
  tasks?: Task[];
  activeQuarter: string;
  dbStatus?: 'connected' | 'syncing' | 'offline';
  onLogout?: () => void;
}

const DESIGNERS = ['Dian', 'Sigit', 'Banu', 'Widy', 'Frans'];

export const Sidebar: React.FC<SidebarProps> = ({
  viewMode,
  setViewMode,
  selectedAssignee,
  setSelectedAssignee,
  totalTasks,
  tasks = [],
  activeQuarter,
  dbStatus = 'connected',
  onLogout,
}) => {
  return (
    <aside className="w-56 border-r border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-col h-screen select-none shrink-0 font-sans">
      {/* Workspace Identity - Title only */}
      <div className="px-4 py-3.5 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
        <span className="font-semibold text-xs tracking-tight text-zinc-900 dark:text-zinc-100">
          PaDi Design Tasks
        </span>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1 text-xs">
        <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Views
        </div>

        {/* Dashboard (above All Tasks) */}
        <button
          type="button"
          onClick={() => {
            setViewMode('dashboard');
            setSelectedAssignee(null);
          }}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
            viewMode === 'dashboard'
              ? 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-2xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>Dashboard</span>
          </div>
        </button>

        {/* All Tasks */}
        <button
          type="button"
          onClick={() => {
            if (viewMode === 'dashboard') setViewMode('timeline');
            setSelectedAssignee(null);
          }}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
            viewMode !== 'dashboard' && selectedAssignee === null
              ? 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-2xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>All Tasks</span>
          </div>
          <span className="text-[10px] font-mono opacity-70">{totalTasks}</span>
        </button>

        {/* Designers list in requested order: Dian, Sigit, Banu, Widy, Frans (hierarchical spacing, no icons, no task count) */}
        {DESIGNERS.map((name) => {
          const isSelected =
            viewMode !== 'dashboard' &&
            selectedAssignee?.toLowerCase() === name.toLowerCase();

          return (
            <button
              key={name}
              type="button"
              onClick={() => {
                if (viewMode === 'dashboard') setViewMode('timeline');
                setSelectedAssignee(isSelected ? null : name);
              }}
              className={`w-full flex items-center pl-7 pr-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-2xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <span className="truncate">{name}</span>
            </button>
          );
        })}
      </div>

      {/* Footer / Resources & Database Status (no icons for daily standup, catalogue, supabase) */}
      <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 text-[11px] space-y-1">
        {/* PaDi Daily Standup */}
        <a
          href="https://teams.cloud.microsoft/l/chat/19:meeting_ZTY2ODVhYzQtMjcxNy00NzgwLTlkZDAtODQ0YjFiMzhkMTlm@thread.v2/conversations?context=%7B%22contextType%22%3A%22chat%22%7D"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between py-1.5 px-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          <span className="truncate font-medium">Daily Standup</span>
          <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
        </a>

        {/* Figma File Catalogue */}
        <a
          href="https://padi-figma-index.vercel.app"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between py-1.5 px-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors border-t border-zinc-200/60 dark:border-zinc-800/60"
        >
          <span className="truncate font-medium">Figma Catalogue</span>
          <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
        </a>

        {/* Supabase Status */}
        <div className="flex items-center justify-between py-1.5 px-2 text-zinc-500 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <span>Supabase</span>
          {dbStatus === 'connected' ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          ) : dbStatus === 'syncing' ? (
            <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              Syncing...
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Local Cache
            </span>
          )}
        </div>

        {/* Lock Workspace */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-between py-1.5 px-2 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors border-t border-zinc-200/60 dark:border-zinc-800/60 cursor-pointer"
          >
            <span>Lock workspace</span>
            <LogOut className="w-3 h-3 shrink-0" />
          </button>
        )}
      </div>
    </aside>
  );
};
