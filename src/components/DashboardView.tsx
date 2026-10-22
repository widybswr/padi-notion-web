'use client';

import React from 'react';
import { Task } from '@/lib/types';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Calendar,
  User,
  ExternalLink,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { FigmaIcon } from './FigmaIcon';
import { SquadBadge } from './SquadBadge';

interface DashboardViewProps {
  tasks: Task[];
  allQuarterTasks: Task[];
  onSelectTask: (task: Task) => void;
  activeQuarter: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  allQuarterTasks,
  onSelectTask,
  activeQuarter,
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. KPI Calculations
  const total = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'Done');
  const inProgressTasks = tasks.filter(
    (t) =>
      t.status === 'In progress design' ||
      t.status?.toLowerCase().includes('in progress')
  );
  const inReviewTasks = tasks.filter(
    (t) => t.status === 'In review' || t.status === 'In PM review'
  );
  const onHoldOrRevision = tasks.filter(
    (t) => t.status === 'On hold' || t.status === 'Need revision'
  );

  // Overdue: end_date in past and not Done
  const overdueTasks = tasks.filter((t) => {
    if (!t.end_date || t.status === 'Done') return false;
    const end = new Date(t.end_date);
    return end < today;
  });

  const completionRate = total > 0 ? Math.round((doneTasks.length / total) * 100) : 0;
  const handoffReadyTasks = tasks.filter((t) => !!t.figma_url);
  const handoffRate = total > 0 ? Math.round((handoffReadyTasks.length / total) * 100) : 0;

  // 2. Status Breakdown
  const STATUS_CONFIG: { status: string; label: string; color: string; bg: string }[] = [
    { status: 'Not started', label: 'Not started', color: 'bg-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800' },
    { status: 'In progress design', label: 'In Progress', color: 'bg-sky-500', bg: 'bg-sky-50 dark:bg-sky-950/40' },
    { status: 'In review', label: 'In Review', color: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40' },
    { status: 'In PM review', label: 'In PM Review', color: 'bg-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/40' },
    { status: 'Need revision', label: 'Need Revision', color: 'bg-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/40' },
    { status: 'On hold', label: 'On Hold', color: 'bg-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/40' },
    { status: 'Done', label: 'Done', color: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  ];

  // 3. Team Workload Calculation
  const PRIORITY_ORDER = ['dian', 'sigit', 'banu', 'widy', 'frans'];

  const allAssignees = Array.from(
    new Set(tasks.flatMap((t) => t.assignees || []))
  )
    .filter(Boolean)
    .sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const aIdx = PRIORITY_ORDER.findIndex((name) => aLower.includes(name));
      const bIdx = PRIORITY_ORDER.findIndex((name) => bLower.includes(name));

      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.localeCompare(b);
    });

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

  const teamWorkload = allAssignees.map((name) => {
    const personTasks = tasks.filter((t) => t.assignees?.includes(name));
    const active = personTasks.filter(
      (t) =>
        t.status === 'In progress design' ||
        t.status?.toLowerCase().includes('in progress')
    );
    const done = personTasks.filter((t) => t.status === 'Done');
    const rate = personTasks.length > 0 ? Math.round((done.length / personTasks.length) * 100) : 0;

    const activeLeave = tasks.find((t) => {
      if (
        t.assignees?.includes(name) &&
        (t.status === 'Paid Leave' || t.status === 'Sick Leave' || t.status === 'Cuti') &&
        t.start_date &&
        t.end_date
      ) {
        return todayStr >= t.start_date && todayStr <= t.end_date;
      }
      return false;
    });

    return {
      name,
      total: personTasks.length,
      active,
      done: done.length,
      rate,
      activeLeave,
    };
  });

  // 4. Squad Breakdown
  const squadMap = new Map<string, number>();
  tasks.forEach((t) => {
    t.squads?.forEach((sq) => {
      squadMap.set(sq, (squadMap.get(sq) || 0) + 1);
    });
  });
  const squadBreakdown = Array.from(squadMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // 5. Upcoming Deadlines (within 7 days)
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const upcomingDeadlines = tasks
    .filter((t) => {
      if (!t.end_date || t.status === 'Done') return false;
      const end = new Date(t.end_date);
      return end >= today && end <= sevenDaysFromNow;
    })
    .sort((a, b) => (a.end_date || '').localeCompare(b.end_date || ''));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>{activeQuarter} Overview & Delivery Metrics</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time delivery progress, designer capacity, and handoff health.
          </p>
        </div>
      </div>

      {/* 1. KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Total Tasks */}
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Total Tasks</span>
            <Layers className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {total}
            </span>
            <span className="text-xs text-zinc-400">{activeQuarter}</span>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {completionRate}%
            </span>
            <span className="text-xs text-zinc-400">({doneTasks.length}/{total})</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* In Flight */}
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">In Flight</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-sky-600 dark:text-sky-400 font-mono">
              {inProgressTasks.length + inReviewTasks.length}
            </span>
            <span className="text-xs text-zinc-400">
              ({inProgressTasks.length} dev / {inReviewTasks.length} review)
            </span>
          </div>
        </div>

        {/* At Risk / Overdue */}
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Overdue / Blocked</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
              {overdueTasks.length + onHoldOrRevision.length}
            </span>
            <span className="text-xs text-zinc-400">
              ({overdueTasks.length} late)
            </span>
          </div>
        </div>

        {/* Handoff Ready */}
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Figma Linked</span>
            <FigmaIcon className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono">
              {handoffRate}%
            </span>
            <span className="text-xs text-zinc-400">({handoffReadyTasks.length}/{total})</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${handoffRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Pipeline Stages Funnel */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
          Delivery Pipeline Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {STATUS_CONFIG.map((sc) => {
            const count = tasks.filter((t) => t.status === sc.status).length;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <div
                key={sc.status}
                className={`p-3 rounded-lg border border-zinc-200/60 dark:border-zinc-800 ${sc.bg} flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`w-2 h-2 rounded-full ${sc.color}`} />
                    <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate">
                      {sc.label}
                    </span>
                  </div>
                  <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                    {count}
                  </div>
                </div>
                <div className="text-[10px] text-zinc-400 mt-2 font-mono">
                  {pct}% of tasks
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Team Workload & Upcoming Deadlines (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Workload (Takes 2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Team Capacity & Active Workload
            </h3>
          </div>

          <div className="space-y-3.5">
            {teamWorkload.map((member) => (
              <div
                key={member.name}
                className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800/80"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {member.name.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {member.name}
                    </span>
                    {member.activeLeave ? (
                      <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 font-medium text-[10px] ml-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        {member.activeLeave.status === 'Sick Leave' ? 'Sick Leave' : 'Paid Leave'}
                      </span>
                    ) : !isWorkingHours ? (
                      <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 text-[10px] ml-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                        Off-hours
                      </span>
                    ) : member.active.length > 0 ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[10px] ml-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Working ({member.active.length})
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 text-[10px] ml-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                        Standby
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {member.done}
                    </span>
                    /{member.total} done ({member.rate}%)
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-zinc-200/70 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mb-2.5">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${member.rate}%` }}
                  />
                </div>

                {/* Active in-progress task chips */}
                {member.active.length > 0 ? (
                  <div className="space-y-1">
                    {member.active.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => onSelectTask(task)}
                        className="group flex items-center justify-between text-xs p-1.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 cursor-pointer hover:border-blue-400 transition-colors"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-sky-500 text-xs">⚡</span>
                          <span className="truncate text-zinc-700 dark:text-zinc-200 font-medium">
                            {task.title}
                          </span>
                        </div>
                        {task.end_date && (
                          <span className="text-[10px] text-zinc-400 shrink-0 ml-2 font-mono">
                            Due {task.end_date}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-400 italic">No tasks currently in progress.</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Squad Breakdown & Deadlines */}
        <div className="space-y-6">
          {/* Squad Demand */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              Tasks by Squad
            </h3>
            <div className="space-y-2.5">
              {squadBreakdown.slice(0, 7).map(({ name, count }) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <SquadBadge name={name} />
                      </div>
                      <span className="font-mono text-zinc-500 font-medium">
                        {count} tasks ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-zinc-400 dark:bg-zinc-500 h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Deadlines / Alerts */}
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center justify-between">
              <span>Deadlines (Next 7 Days)</span>
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            </h3>

            {upcomingDeadlines.length > 0 ? (
              <div className="space-y-2">
                {upcomingDeadlines.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800 hover:border-amber-400 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate pr-2">
                        {task.title}
                      </span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono shrink-0 font-semibold">
                        {task.end_date}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                      <span>{task.assignees?.join(', ') || 'Unassigned'}</span>
                      <span>•</span>
                      <span>{task.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic">No tasks ending in the next 7 days.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
