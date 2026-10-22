'use client';

import React, { useState } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/lib/types';
import { X, Calendar } from 'lucide-react';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (task: Task) => void;
  initialStatus?: TaskStatus;
}

const ALL_STATUSES: TaskStatus[] = [
  'Not started',
  'In progress design',
  'In review',
  'In PM review',
  'Need revision',
  'On hold',
  'Done',
];

const ALL_PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'P0 - SUPER HIGH'];

const TEAM_MEMBERS = ['Dian', 'Sigit', 'Banu', 'Widy', 'Frans'];

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  initialStatus = 'Not started',
}) => {
  if (!isOpen) return null;

  const [entryType, setEntryType] = useState<'task' | 'paid_leave' | 'sick_leave'>('task');

  // Task form state
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<string>(initialStatus);
  const [priority, setPriority] = useState<string>('Medium');
  const [wbs, setWbs] = useState('');
  const [squad, setSquad] = useState('');
  const [assignee, setAssignee] = useState('');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [prdUrl, setPrdUrl] = useState('');

  // Leave form state
  const [leaveDesigner, setLeaveDesigner] = useState('Dian');
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (entryType !== 'task') {
      if (!leaveStartDate || !leaveEndDate) return;
      const leaveLabel = entryType === 'paid_leave' ? 'Paid Leave' : 'Sick Leave';

      const leaveTask: Task = {
        id: crypto.randomUUID(),
        title: `${leaveLabel} - ${leaveDesigner}`,
        status: leaveLabel,
        priority: 'Low',
        wbs: '',
        squads: ['Leave'],
        pms: [],
        assignees: [leaveDesigner],
        start_date: leaveStartDate,
        end_date: leaveEndDate,
        figma_url: '',
        prd_url: '',
        taiga_url: '',
      };

      onCreate(leaveTask);
      onClose();
      return;
    }

    if (!title.trim()) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      status,
      priority,
      wbs: wbs.trim(),
      squads: squad.trim() ? [squad.trim()] : [],
      pms: [],
      assignees: assignee.trim() ? [assignee.trim()] : [],
      start_date: null,
      end_date: null,
      figma_url: figmaUrl.trim(),
      prd_url: prdUrl.trim(),
      taiga_url: '',
    };

    onCreate(newTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
            {entryType === 'task' ? 'Create New Task' : 'Record Time-Off'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Radio Button Selector */}
          <div className="flex items-center gap-5 py-2.5 px-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-zinc-800 dark:text-zinc-200">
              <input
                type="radio"
                name="entryType"
                value="task"
                checked={entryType === 'task'}
                onChange={() => setEntryType('task')}
                className="accent-blue-600"
              />
              <span>Task</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-zinc-800 dark:text-zinc-200">
              <input
                type="radio"
                name="entryType"
                value="paid_leave"
                checked={entryType === 'paid_leave'}
                onChange={() => setEntryType('paid_leave')}
                className="accent-blue-600"
              />
              <span>Paid Leave</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-zinc-800 dark:text-zinc-200">
              <input
                type="radio"
                name="entryType"
                value="sick_leave"
                checked={entryType === 'sick_leave'}
                onChange={() => setEntryType('sick_leave')}
                className="accent-blue-600"
              />
              <span>Sick Leave</span>
            </label>
          </div>

          {/* Conditional Form: Leave vs Task */}
          {entryType !== 'task' ? (
            <div className="space-y-4 pt-1">
              {/* Designer */}
              <div>
                <label className="block text-zinc-500 font-medium mb-1">Designer *</label>
                <select
                  value={leaveDesigner}
                  onChange={(e) => setLeaveDesigner(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                >
                  {TEAM_MEMBERS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveStartDate}
                    onChange={(e) => {
                      setLeaveStartDate(e.target.value);
                      if (!leaveEndDate || e.target.value > leaveEndDate) {
                        setLeaveEndDate(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-500 font-medium mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-500 text-[11px]">
                <p>
                  Will create: <strong className="text-zinc-800 dark:text-zinc-200">{entryType === 'paid_leave' ? 'Paid Leave' : 'Sick Leave'} - {leaveDesigner}</strong>
                </p>
                <p className="mt-0.5">
                  Appears in Timeline as toned-down disabled grey and updates their live status on the sidebar.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-zinc-500 font-medium mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. [Discovery] Product Recommendation V2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                  >
                    {ALL_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Squad / Funnel</label>
                  <input
                    type="text"
                    placeholder="e.g. Discovery, Core, Identity"
                    value={squad}
                    onChange={(e) => setSquad(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Assignee</label>
                  <input
                    type="text"
                    placeholder="e.g. Widy, Sigit, Banu"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 font-medium mb-1">Backlog WBS Code</label>
                <input
                  type="text"
                  placeholder="e.g. DSC#1, FUL#2"
                  value={wbs}
                  onChange={(e) => setWbs(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Figma URL</label>
                  <input
                    type="url"
                    placeholder="https://www.figma.com/..."
                    value={figmaUrl}
                    onChange={(e) => setFigmaUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 font-medium mb-1">PRD URL</label>
                  <input
                    type="url"
                    placeholder="https://docs.google.com/..."
                    value={prdUrl}
                    onChange={(e) => setPrdUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {entryType === 'task' ? 'Create Task' : 'Record Leave'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
