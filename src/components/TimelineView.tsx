'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Task } from '@/lib/types';
import { Plus, PanelLeftClose, PanelLeftOpen, Paperclip } from 'lucide-react';

interface TimelineViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onUpdateTask: (updated: Task) => void;
  activeQuarter?: string;
}

const DAY_WIDTH = 38; // px per day
const ROW_HEIGHT = 44; // px per task row
const TASK_COL_WIDTH = 200; // px for tasks column (slim and compact)
const COLLAPSED_COL_WIDTH = 36; // px when collapsed for full-width timeline

function getQuarterRange(quarter: string = 'Q4 2026'): { start: string; end: string } {
  const match = quarter.match(/Q([1-4])\s*(\d{4})/i);
  if (match) {
    const q = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);
    if (q === 1) return { start: `${year}-01-01`, end: `${year}-04-30` };
    if (q === 2) return { start: `${year}-04-01`, end: `${year}-07-31` };
    if (q === 3) return { start: `${year}-07-01`, end: `${year}-10-31` };
    if (q === 4) return { start: `${year}-10-01`, end: `${year + 1}-01-31` };
  }
  return { start: '2026-10-01', end: '2027-01-31' };
}

function parseDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatShortDate(str: string): string {
  if (!str) return '';
  const d = parseDate(str);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function diffInDays(startStr: string, endStr: string): number {
  const s = parseDate(startStr);
  const e = parseDate(endStr);
  const diffTime = e.getTime() - s.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

interface DragState {
  taskId: string;
  type: 'resize-start' | 'resize-end' | 'move';
  startX: number;
  initialStartDate: string;
  initialEndDate: string;
  currentStartDate: string;
  currentEndDate: string;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  tasks,
  onSelectTask,
  onUpdateTask,
  activeQuarter = 'Q4 2026',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const { start: TIMELINE_START, end: TIMELINE_END } = useMemo(
    () => getQuarterRange(activeQuarter),
    [activeQuarter]
  );

  const todayStr = useMemo(() => formatDate(new Date()), []);

  // Generate all calendar days
  const calendarDays = useMemo(() => {
    const days: {
      dateStr: string;
      date: Date;
      dayNum: number;
      dayName: string;
      isWeekend: boolean;
      isToday: boolean;
      monthStr: string;
    }[] = [];
    const curr = parseDate(TIMELINE_START);
    const end = parseDate(TIMELINE_END);

    while (curr <= end) {
      const dateStr = formatDate(curr);
      const dayNum = curr.getDate();
      const dayOfWeek = curr.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
      const monthStr = curr.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });

      days.push({
        dateStr,
        date: new Date(curr),
        dayNum,
        dayName: dayNames[dayOfWeek],
        isWeekend,
        isToday: dateStr === todayStr,
        monthStr,
      });

      curr.setDate(curr.getDate() + 1);
    }
    return days;
  }, [todayStr, TIMELINE_START, TIMELINE_END]);

  // Group days by month for top header
  const monthHeaders = useMemo(() => {
    const groups: { monthStr: string; startIdx: number; count: number }[] = [];
    calendarDays.forEach((day, idx) => {
      const last = groups[groups.length - 1];
      if (!last || last.monthStr !== day.monthStr) {
        groups.push({ monthStr: day.monthStr, startIdx: idx, count: 1 });
      } else {
        last.count += 1;
      }
    });
    return groups;
  }, [calendarDays]);

  // Separate tasks with dates vs unscheduled
  const { scheduledTasks, unscheduledTasks } = useMemo(() => {
    const scheduled: Task[] = [];
    const unscheduled: Task[] = [];

    tasks.forEach((t) => {
      if (t.start_date) {
        scheduled.push(t);
      } else {
        unscheduled.push(t);
      }
    });

    // Sort scheduled by start_date
    scheduled.sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));
    return { scheduledTasks: scheduled, unscheduledTasks: unscheduled };
  }, [tasks]);

  // Dragging event listeners on window
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const deltaDays = Math.round(deltaX / DAY_WIDTH);

      if (dragState.type === 'resize-end') {
        let newEnd = addDays(dragState.initialEndDate, deltaDays);
        if (newEnd < dragState.currentStartDate) {
          newEnd = dragState.currentStartDate;
        }
        setDragState((prev) => (prev ? { ...prev, currentEndDate: newEnd } : null));
      } else if (dragState.type === 'resize-start') {
        let newStart = addDays(dragState.initialStartDate, deltaDays);
        if (newStart > dragState.currentEndDate) {
          newStart = dragState.currentEndDate;
        }
        setDragState((prev) => (prev ? { ...prev, currentStartDate: newStart } : null));
      } else if (dragState.type === 'move') {
        const newStart = addDays(dragState.initialStartDate, deltaDays);
        const newEnd = addDays(dragState.initialEndDate, deltaDays);
        setDragState((prev) =>
          prev
            ? {
                ...prev,
                currentStartDate: newStart,
                currentEndDate: newEnd,
              }
            : null
        );
      }
    };

    const handleMouseUp = () => {
      const targetTask = tasks.find((t) => t.id === dragState.taskId);
      if (
        targetTask &&
        (dragState.currentStartDate !== targetTask.start_date ||
          dragState.currentEndDate !== targetTask.end_date)
      ) {
        onUpdateTask({
          ...targetTask,
          start_date: dragState.currentStartDate,
          end_date: dragState.currentEndDate,
        });
      }
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, tasks, onUpdateTask]);

  // Notion-inspired toned-down, sophisticated pastel bar palette
  const getBarColor = (status: string) => {
    switch (status) {
      case 'Done':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800/80 shadow-emerald-500/10 hover:bg-emerald-100/90 dark:hover:bg-emerald-950/60';
      case 'In progress design':
        return 'bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 border-sky-300 dark:border-sky-800/80 shadow-sky-500/10 hover:bg-sky-100/90 dark:hover:bg-sky-950/60';
      case 'In PM review':
        return 'bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-800/80 shadow-purple-500/10 hover:bg-purple-100/90 dark:hover:bg-purple-950/60';
      case 'In review':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800/80 shadow-amber-500/10 hover:bg-amber-100/90 dark:hover:bg-amber-950/60';
      case 'Need revision':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800/80 shadow-rose-500/10 hover:bg-rose-100/90 dark:hover:bg-rose-950/60';
      case 'On hold':
        return 'bg-pink-50 dark:bg-pink-950/40 text-pink-900 dark:text-pink-200 border-pink-300 dark:border-pink-800/80 shadow-pink-500/10 hover:bg-pink-100/90 dark:hover:bg-pink-950/60';
      case 'Paid Leave':
      case 'Sick Leave':
      case 'Public Holiday':
      case 'Holiday':
      case 'Cuti':
        return 'bg-zinc-100/70 dark:bg-zinc-900/50 text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-700/80 shadow-none hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 opacity-60';
      default:
        return 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 shadow-zinc-500/10 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/90';
    }
  };

  const handleScheduleDefault = (task: Task) => {
    onUpdateTask({
      ...task,
      start_date: '2026-10-15',
      end_date: '2026-10-22',
    });
  };

  const leftWidth = isCollapsed ? COLLAPSED_COL_WIDTH : TASK_COL_WIDTH;
  const trackWidth = calendarDays.length * DAY_WIDTH;
  const todayIdx = useMemo(() => calendarDays.findIndex((d) => d.isToday), [calendarDays]);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-white dark:bg-zinc-950 select-none overflow-hidden font-sans">
      {/* Unified Single Scroll Container: Guarantees 100% vertical sync */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto relative min-h-0 bg-white dark:bg-zinc-950"
      >
        <div
          style={{
            width: `${leftWidth + trackWidth}px`,
            minHeight: '100%',
          }}
          className="relative flex flex-col"
        >
          {/* Vertical grid lines & weekend shading behind all rows */}
          <div
            style={{
              left: `${leftWidth}px`,
              width: `${trackWidth}px`,
            }}
            className="absolute inset-y-0 top-[65px] pointer-events-none flex"
          >
            {calendarDays.map((day) => (
              <div
                key={day.dateStr}
                style={{
                  width: `${DAY_WIDTH}px`,
                  backgroundImage: day.isWeekend
                    ? 'repeating-linear-gradient(45deg, rgba(0,0,0,0.025), rgba(0,0,0,0.025) 4px, transparent 4px, transparent 8px)'
                    : undefined,
                }}
                className={`h-full border-r shrink-0 ${
                  day.isWeekend
                    ? 'bg-zinc-100/70 dark:bg-zinc-900/60 border-zinc-200/70 dark:border-zinc-800/70'
                    : 'border-zinc-200/50 dark:border-zinc-800/40'
                }`}
              />
            ))}
          </div>

          {/* Vertical red line for today's date (on the left border of today's cell) */}
          {todayIdx !== -1 && (
            <div
              style={{
                left: `${leftWidth + todayIdx * DAY_WIDTH}px`,
              }}
              className="absolute top-0 bottom-0 w-[1.5px] bg-red-500 z-20 pointer-events-none"
            />
          )}

          {/* Sticky Top Header: Tasks count & Collapse toggle on left, Months & Days on right */}
          <div className="sticky top-0 z-30 flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-2xs">
            {/* Frozen Left Header */}
            <div
              style={{ width: `${leftWidth}px` }}
              className="sticky left-0 z-40 shrink-0 h-[65px] px-3 flex items-center justify-between border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 transition-all"
            >
              {!isCollapsed ? (
                <>
                  <span className="font-semibold text-xs text-zinc-700 dark:text-zinc-300 truncate">
                    Tasks ({scheduledTasks.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCollapsed(true)}
                    className="p-1 rounded hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer transition-colors"
                    title="Collapse tasks column to give full width to timeline"
                  >
                    <PanelLeftClose className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCollapsed(false)}
                  className="w-full flex items-center justify-center p-1 rounded hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer transition-colors"
                  title="Expand tasks column"
                >
                  <PanelLeftOpen className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right Track Header: Months + Days */}
            <div style={{ width: `${trackWidth}px` }} className="shrink-0 flex flex-col">
              {/* Months row */}
              <div className="flex h-7 border-b border-zinc-200/80 dark:border-zinc-800">
                {monthHeaders.map((m) => (
                  <div
                    key={m.monthStr}
                    style={{ width: `${m.count * DAY_WIDTH}px` }}
                    className="relative border-r border-zinc-200 dark:border-zinc-800 shrink-0"
                  >
                    <div
                      style={{ left: `${leftWidth}px` }}
                      className="sticky inline-flex items-center h-full px-3 text-xs font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-[11px] whitespace-nowrap z-10 bg-zinc-50/95 dark:bg-zinc-900/95"
                    >
                      {m.monthStr}
                    </div>
                  </div>
                ))}
              </div>

              {/* Days row */}
              <div className="flex h-[37px]">
                {calendarDays.map((day) => (
                  <div
                    key={day.dateStr}
                    style={{ width: `${DAY_WIDTH}px` }}
                    className={`flex flex-col items-center justify-center text-[10px] border-r transition-colors shrink-0 ${
                      day.isToday
                        ? 'bg-red-50/60 dark:bg-red-950/25 border-zinc-200/80 dark:border-zinc-800'
                        : day.isWeekend
                        ? 'bg-zinc-200/70 dark:bg-zinc-800/70 border-zinc-200/70 dark:border-zinc-700/70 text-zinc-400'
                        : 'bg-white dark:bg-zinc-950 border-zinc-200/50 dark:border-zinc-800/40 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <span
                      className={`font-semibold flex items-center justify-center ${
                        day.isToday
                          ? 'w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-2xs'
                          : day.isWeekend
                          ? 'text-zinc-500 dark:text-zinc-400'
                          : 'text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {day.dayNum}
                    </span>
                    <span
                      className={`text-[9px] ${
                        day.isToday
                          ? 'text-red-600 dark:text-red-400 font-bold'
                          : day.isWeekend
                          ? 'text-red-500/80 dark:text-red-400/80 font-bold'
                          : 'opacity-70'
                      }`}
                    >
                      {day.dayName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Unified Task Rows: Left title & Right bar in the EXACT SAME row */}
          <div className="flex flex-col">
            {scheduledTasks.map((task) => {
              const isDraggingThis = dragState?.taskId === task.id;
              const startDate = isDraggingThis
                ? dragState.currentStartDate
                : task.start_date || TIMELINE_START;
              const endDate = isDraggingThis
                ? dragState.currentEndDate
                : task.end_date || task.start_date || TIMELINE_START;

              const startOffsetDays = diffInDays(TIMELINE_START, startDate);
              const durationDays = Math.max(1, diffInDays(startDate, endDate) + 1);

              const barLeft = startOffsetDays * DAY_WIDTH;
              const barWidth = durationDays * DAY_WIDTH;

              return (
                <div
                  key={task.id}
                  style={{ height: `${ROW_HEIGHT}px` }}
                  className="flex border-b border-zinc-200/70 dark:border-zinc-800/70 hover:bg-zinc-50/40 dark:hover:bg-zinc-900/30 transition-colors group"
                >
                  {/* Left Frozen Task Title Column */}
                  <div
                    style={{ width: `${leftWidth}px` }}
                    onClick={() => onSelectTask(task)}
                    className="sticky left-0 z-20 shrink-0 h-full bg-white dark:bg-zinc-950 flex items-center px-3 border-r border-zinc-200 dark:border-zinc-800 cursor-pointer overflow-hidden transition-all"
                  >
                    {!isCollapsed ? (
                      <div className="flex items-center gap-1.5 min-w-0">
                        {task.wbs && (
                          <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                            {task.wbs}
                          </span>
                        )}
                        {task.attachments && task.attachments.length > 0 && (
                          <span title={`${task.attachments.length} attachment(s)`} className="text-blue-500 shrink-0">
                            <Paperclip className="w-3 h-3 text-blue-500" />
                          </span>
                        )}
                        <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {task.title}
                        </span>
                      </div>
                    ) : (
                      <div className="w-full flex justify-center text-zinc-400 text-[10px] font-mono">
                        •
                      </div>
                    )}
                  </div>

                  {/* Right Track: Timeline Bar */}
                  <div
                    style={{ width: `${trackWidth}px` }}
                    className="relative shrink-0 flex items-center h-full"
                  >
                    {/* Draggable Task Bar */}
                    <div
                      style={{
                        left: `${barLeft}px`,
                        width: `${barWidth}px`,
                        height: '28px',
                      }}
                      className={`absolute rounded-md flex items-center justify-between text-xs border shadow-xs transition-shadow group/bar select-none ${getBarColor(
                        task.status
                      )} ${
                        isDraggingThis
                          ? 'ring-2 ring-blue-500 ring-offset-1 z-30 opacity-95 shadow-md'
                          : 'z-0'
                      }`}
                    >
                      {/* Left Drag Handle: Hold / Postpone Start Date */}
                      <div
                        title="Drag to hold or postpone start date"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setDragState({
                            taskId: task.id,
                            type: 'resize-start',
                            startX: e.clientX,
                            initialStartDate: startDate,
                            initialEndDate: endDate,
                            currentStartDate: startDate,
                            currentEndDate: endDate,
                          });
                        }}
                        className="w-3 h-full flex items-center justify-center cursor-ew-resize opacity-0 group-hover/bar:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 rounded-l transition-opacity"
                      >
                        <div className="w-1 h-3 border-l-2 border-zinc-500/70 dark:border-zinc-300/70" />
                      </div>

                      {/* Bar Middle: Drag to move entire task window */}
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setDragState({
                            taskId: task.id,
                            type: 'move',
                            startX: e.clientX,
                            initialStartDate: startDate,
                            initialEndDate: endDate,
                            currentStartDate: startDate,
                            currentEndDate: endDate,
                          });
                        }}
                        onClick={() => onSelectTask(task)}
                        className="flex-1 px-2 truncate font-medium flex items-center justify-between gap-1.5 cursor-grab active:cursor-grabbing h-full"
                      >
                        <span className="truncate text-[11px] font-semibold">{task.title}</span>
                        {task.assignees && task.assignees.length > 0 && (
                          <span className="text-[10px] bg-black/5 dark:bg-white/10 px-1.5 py-0.2 rounded font-mono shrink-0">
                            {task.assignees.join(', ')}
                          </span>
                        )}
                      </div>

                      {/* Right Drag Handle: Extend / Shorten End Date */}
                      <div
                        title="Drag to extend or shorten end date"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setDragState({
                            taskId: task.id,
                            type: 'resize-end',
                            startX: e.clientX,
                            initialStartDate: startDate,
                            initialEndDate: endDate,
                            currentStartDate: startDate,
                            currentEndDate: endDate,
                          });
                        }}
                        className="w-3 h-full flex items-center justify-center cursor-ew-resize opacity-0 group-hover/bar:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 rounded-r transition-opacity"
                      >
                        <div className="w-1 h-3 border-r-2 border-zinc-500/70 dark:border-zinc-300/70" />
                      </div>

                      {/* Floating tooltip while dragging */}
                      {isDraggingThis && (
                        <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[11px] px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap pointer-events-none z-50 flex items-center gap-1.5 font-mono">
                          {dragState.type === 'resize-end' && <span>Extend End:</span>}
                          {dragState.type === 'resize-start' && <span>Postpone Start:</span>}
                          {dragState.type === 'move' && <span>Shift Schedule:</span>}
                          <span className="font-bold">
                            {formatShortDate(dragState.currentStartDate)} →{' '}
                            {formatShortDate(dragState.currentEndDate)}
                          </span>
                          <span className="opacity-75">
                            ({diffInDays(dragState.currentStartDate, dragState.currentEndDate) + 1}d)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Unscheduled Tasks Section */}
            {unscheduledTasks.length > 0 && (
              <div className="flex border-b border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/40 dark:bg-zinc-900/30">
                <div
                  style={{ width: `${leftWidth}px` }}
                  className="sticky left-0 z-20 shrink-0 p-3 bg-zinc-50/95 dark:bg-zinc-900/95 border-r border-zinc-200 dark:border-zinc-800 transition-all"
                >
                  {!isCollapsed ? (
                    <>
                      <div className="text-xs text-zinc-400 font-semibold mb-2 truncate">
                        Unscheduled ({unscheduledTasks.length})
                      </div>
                      <div className="space-y-1.5">
                        {unscheduledTasks.map((t) => (
                          <div
                            key={t.id}
                            className="p-1.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs gap-1 shadow-2xs"
                          >
                            <span className="truncate text-zinc-700 dark:text-zinc-300 text-[11px]">
                              {t.title}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleScheduleDefault(t)}
                              className="text-[9px] text-blue-600 dark:text-blue-400 hover:underline font-medium shrink-0 flex items-center gap-0.5 bg-blue-50 dark:bg-blue-950/60 px-1 py-0.5 rounded cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" /> Schedule
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-zinc-400 text-[10px] font-mono">
                      ?
                    </div>
                  )}
                </div>
                <div style={{ width: `${trackWidth}px` }} className="shrink-0" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
