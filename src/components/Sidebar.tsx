'use client';

import React from 'react';
import { ViewMode, Task } from '@/lib/types';
import {
  User,
  Users,
  Layers,
  Database,
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
      {/* Workspace Identity */}
      <div className="p-3.5 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 font-bold text-xs tracking-tight shadow-2xs">
            P
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-xs tracking-tight text-zinc-900 dark:text-zinc-100">
              PaDi Design
            </span>
            <span className="text-[10px] text-zinc-400">Workspace</span>
          </div>
        </div>
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
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
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
            if (viewMode === 'dashboard') setViewMode('table');
            setSelectedAssignee(null);
          }}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
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

        {/* Designers list in requested order: Dian, Sigit, Banu, Widy, Frans */}
        {DESIGNERS.map((name) => {
          const isSelected =
            viewMode !== 'dashboard' &&
            selectedAssignee?.toLowerCase() === name.toLowerCase();
          const count = tasks.filter(
            (t) =>
              (!t.quarter || t.quarter === activeQuarter) &&
              t.assignees?.some((a) => a.toLowerCase() === name.toLowerCase())
          ).length;

          return (
            <button
              key={name}
              type="button"
              onClick={() => {
                if (viewMode === 'dashboard') setViewMode('table');
                setSelectedAssignee(isSelected ? null : name);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                isSelected
                  ? 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-2xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">{name}</span>
              </div>
              <span className="text-[10px] font-mono opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Footer / Resources & Database Status */}
      <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 text-[11px] space-y-1">
        {/* PaDi Daily Standup */}
        <a
          href="https://teams.cloud.microsoft/l/chat/19:meeting_ZTY2ODVhYzQtMjcxNy00NzgwLTlkZDAtODQ0YjFiMzhkMTlm@thread.v2/conversations?context=%7B%22contextType%22%3A%22chat%22%7D"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between py-1.5 px-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate font-medium">Daily Standup</span>
          </div>
          <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
        </a>

        {/* Figma File Catalogue */}
        <a
          href="https://padi-figma-index.vercel.app"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between py-1.5 px-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors border-t border-zinc-200/60 dark:border-zinc-800/60"
        >
          <div className="flex items-center gap-2 truncate">
            <Layers className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate font-medium">Figma Catalogue</span>
          </div>
          <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
        </a>

        {/* Supabase Status */}
        <div className="flex items-center justify-between py-1.5 px-1 text-zinc-500 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-zinc-400" />
            <span>Supabase</span>
          </div>
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
            className="w-full flex items-center justify-between py-1.5 px-1 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors border-t border-zinc-200/60 dark:border-zinc-800/60"
          >
            <span>Lock workspace</span>
            <LogOut className="w-3 h-3 shrink-0" />
          </button>
        )}
      </div>
    </aside>
  );
};
