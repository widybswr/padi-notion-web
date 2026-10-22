'use client';

import React from 'react';
import { ViewMode, Task } from '@/lib/types';
import {
  Table,
  Kanban,
  User,
  Users,
  Layers,
  FileText,
  CheckCircle,
  Database,
  ExternalLink,
  Plus,
  LogOut,
  Calendar,
  LayoutDashboard,
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
  tasks?: Task[];
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
  tasks = [],
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
                setViewMode('dashboard');
                setSelectedAssignee(null);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                viewMode === 'dashboard' && !selectedAssignee
                  ? 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </div>
            </button>

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
          <div className="mt-1 space-y-1">
            {assignees.map((name) => {
              const isSelected = selectedAssignee === name;

              // Working hours check in WIB (UTC+7): Mon-Fri 08:00-12:00 & 13:00-17:00
              const now = new Date();
              const utcHours = now.getUTCHours();
              const utcMinutes = now.getUTCMinutes();
              const wibHours = (utcHours + 7) % 24;
              const wibTime = wibHours + utcMinutes / 60;
              const utcDay = now.getUTCDay();
              const wibDay = (utcDay + (utcHours + 7 >= 24 ? 1 : 0)) % 7;
              const isWeekend = wibDay === 0 || wibDay === 6;
              const isWorkingHours =
                !isWeekend &&
                ((wibTime >= 8 && wibTime < 12) || (wibTime >= 13 && wibTime < 17));

              const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

              // Check if today is a team holiday
              const activeHoliday = tasks.find((t) => {
                if (
                  t.status === 'Holiday' &&
                  t.start_date &&
                  t.end_date
                ) {
                  return todayStr >= t.start_date && todayStr <= t.end_date;
                }
                return false;
              });

              // Check if designer is currently on leave
              const activeLeave = tasks.find((t) => {
                if (
                  (!t.quarter || t.quarter === activeQuarter) &&
                  t.assignees?.includes(name) &&
                  (t.status === 'Paid Leave' || t.status === 'Sick Leave' || t.status === 'Cuti') &&
                  t.start_date &&
                  t.end_date
                ) {
                  return todayStr >= t.start_date && todayStr <= t.end_date;
                }
                return false;
              });

              const personActiveTasks = tasks.filter(
                (t) =>
                  (!t.quarter || t.quarter === activeQuarter) &&
                  t.assignees?.includes(name) &&
                  (t.status === 'In progress design' ||
                    t.status?.toLowerCase().includes('in progress'))
              );
              const isDesigning = personActiveTasks.length > 0;

              return (
                <div key={name} className="flex flex-col">
                  <button
                    onClick={() => setSelectedAssignee(isSelected ? null : name)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{name}</span>
                    </div>

                    {activeHoliday ? (
                      <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 font-medium text-[10px] shrink-0 ml-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                        Off-hours
                      </span>
                    ) : activeLeave ? (
                      <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 font-medium text-[10px] shrink-0 ml-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        {activeLeave.status === 'Sick Leave' ? 'Sick Leave' : 'Paid Leave'}
                      </span>
                    ) : !isWorkingHours ? (
                      <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 text-[10px] shrink-0 ml-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                        Off-hours
                      </span>
                    ) : isDesigning ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[10px] shrink-0 ml-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Working
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 text-[10px] shrink-0 ml-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                        Standby
                      </span>
                    )}
                  </button>

                  {/* Bulleted active or leave tasks */}
                  {activeHoliday ? (
                    <div className="pl-7 pr-2 pt-0.5 pb-1">
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate leading-tight font-mono">
                        • {activeHoliday.title}
                      </p>
                    </div>
                  ) : activeLeave ? (
                    <div className="pl-7 pr-2 pt-0.5 pb-1">
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate leading-tight font-mono">
                        • {activeLeave.status} ({activeLeave.start_date} – {activeLeave.end_date})
                      </p>
                    </div>
                  ) : isDesigning ? (
                    <div className="pl-7 pr-2 pt-0.5 pb-1 space-y-0.5">
                      {personActiveTasks.length <= 2 ? (
                        personActiveTasks.map((t) => (
                          <p
                            key={t.id}
                            title={t.title}
                            className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors leading-tight"
                          >
                            • {t.title}
                          </p>
                        ))
                      ) : (
                        <>
                          <p
                            title={personActiveTasks[0].title}
                            className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors leading-tight"
                          >
                            • {personActiveTasks[0].title}
                          </p>
                          <p
                            title={personActiveTasks[1].title}
                            className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors leading-tight"
                          >
                            • {personActiveTasks[1].title}
                          </p>
                          <p
                            className="text-[10px] text-zinc-400/80 dark:text-zinc-500 font-medium pl-2 leading-tight"
                            title={personActiveTasks
                              .slice(2)
                              .map((t) => t.title)
                              .join('\n')}
                          >
                            +{personActiveTasks.length - 2} more
                          </p>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer / Resources & Database Status */}
      <div className="p-3 border-t border-zinc-200/70 dark:border-zinc-800/80 bg-zinc-100/40 dark:bg-zinc-900/40 text-[11px] space-y-1">
        {/* PaDi Daily Standup */}
        <a
          href="https://teams.cloud.microsoft/l/chat/19:meeting_ZTY2ODVhYzQtMjcxNy00NzgwLTlkZDAtODQ0YjFiMzhkMTlm@thread.v2/conversations?context=%7B%22contextType%22%3A%22chat%22%7D"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between py-1.5 px-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate font-medium">PaDi Daily Standup</span>
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
            <span className="truncate font-medium">Figma File Catalogue</span>
          </div>
          <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
        </a>

        {/* PaDi Design Notion */}
        <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 pt-1">
          <a
            href="https://app.notion.com/p/PaDi-Design-2e630a0f809180caaecdeff6a5b4b597?pvs=18"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between py-1 px-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate font-medium">PaDi Design Notion</span>
            </div>
            <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
          </a>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 pl-6 pb-1 font-mono">
            Last synced: 22 Oct 2026, 22:30
          </p>
        </div>

        {/* Supabase Status */}
        <div className="flex items-center justify-between py-1.5 px-1 text-zinc-500 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-zinc-400" />
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
