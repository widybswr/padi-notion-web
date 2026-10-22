'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/lib/types';
import { X, Plus, ChevronDown, Check } from 'lucide-react';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (task: Task) => void;
  initialStatus?: TaskStatus;
  initialAssignee?: string | null;
  availableSquads?: string[];
  availableAssignees?: string[];
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

const DEFAULT_SQUADS = [
  'Core',
  'Discovery',
  'Disbursement',
  'eProc',
  'Financing',
  'Fullfilment',
  'Payment',
  'Identity',
  'Transaction',
];

const DEFAULT_ASSIGNEES = ['Dian', 'Sigit', 'Banu', 'Widy', 'Frans'];

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  initialStatus = 'Not started',
  initialAssignee = null,
  availableSquads = DEFAULT_SQUADS,
  availableAssignees = DEFAULT_ASSIGNEES,
}) => {
  if (!isOpen) return null;

  const [entryType, setEntryType] = useState<'task' | 'paid_leave' | 'sick_leave' | 'holiday'>('task');

  // Task form state
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<string>(initialStatus);
  const [priority, setPriority] = useState<string>('Medium');
  const [wbs, setWbs] = useState('');
  const [selectedSquads, setSelectedSquads] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [figmaUrl, setFigmaUrl] = useState('');
  const [prdUrl, setPrdUrl] = useState('');

  // Dropdown options lists (with user-added custom ones)
  const [allSquads, setAllSquads] = useState<string[]>([]);
  const [newSquadInput, setNewSquadInput] = useState('');
  const [isSquadDropdownOpen, setIsSquadDropdownOpen] = useState(false);
  const squadRef = useRef<HTMLDivElement>(null);

  const [allAssignees, setAllAssignees] = useState<string[]>([]);
  const [newAssigneeInput, setNewAssigneeInput] = useState('');
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const assigneeRef = useRef<HTMLDivElement>(null);

  // Leave form state
  const [leaveDesigner, setLeaveDesigner] = useState('Dian');
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');

  // Holiday form state
  const [holidayName, setHolidayName] = useState('');
  const [holidayStartDate, setHolidayStartDate] = useState('');
  const [holidayEndDate, setHolidayEndDate] = useState('');

  // Sync initial props on open
  useEffect(() => {
    if (isOpen) {
      const mergedSquads = Array.from(new Set([...DEFAULT_SQUADS, ...(availableSquads || [])])).filter(Boolean);
      setAllSquads(mergedSquads);

      const mergedAssignees = Array.from(new Set([...DEFAULT_ASSIGNEES, ...(availableAssignees || [])])).filter(Boolean);
      setAllAssignees(mergedAssignees);

      if (initialAssignee) {
        setSelectedAssignees([initialAssignee]);
        setLeaveDesigner(initialAssignee);
      } else {
        setSelectedAssignees([]);
        setLeaveDesigner(mergedAssignees[0] || 'Dian');
      }
    }
  }, [isOpen, initialAssignee, availableSquads, availableAssignees]);

  // Click outside to close dropdowns & Escape key to close modal
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (squadRef.current && !squadRef.current.contains(e.target as Node)) {
        setIsSquadDropdownOpen(false);
      }
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) {
        setIsAssigneeDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSquadDropdownOpen) {
          setIsSquadDropdownOpen(false);
        } else if (isAssigneeDropdownOpen) {
          setIsAssigneeDropdownOpen(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSquadDropdownOpen, isAssigneeDropdownOpen, onClose]);

  const handleAddCustomSquad = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newSquadInput.trim();
    if (val && !allSquads.includes(val)) {
      setAllSquads((prev) => [...prev, val]);
      setSelectedSquads((prev) => [...prev, val]);
      setNewSquadInput('');
    }
  };

  const handleAddCustomAssignee = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newAssigneeInput.trim();
    if (val && !allAssignees.includes(val)) {
      setAllAssignees((prev) => [...prev, val]);
      setSelectedAssignees((prev) => [...prev, val]);
      setNewAssigneeInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (entryType === 'holiday') {
      if (!holidayStartDate || !holidayEndDate) return;
      const hTitle = holidayName.trim() ? `Holiday: ${holidayName.trim()}` : 'Holiday: Libur Nasional';

      const holidayTask: Task = {
        id: crypto.randomUUID(),
        title: hTitle,
        status: 'Holiday',
        priority: 'Low',
        wbs: '',
        squads: ['Holiday'],
        pms: [],
        assignees: [], // Auto-applies to all
        start_date: holidayStartDate,
        end_date: holidayEndDate,
        figma_url: '',
        prd_url: '',
        taiga_url: '',
      };

      onCreate(holidayTask);
      onClose();
      return;
    }

    if (entryType === 'paid_leave' || entryType === 'sick_leave') {
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
      squads: selectedSquads,
      pms: [],
      assignees: selectedAssignees,
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
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
            {entryType === 'task'
              ? 'Create New Task'
              : entryType === 'holiday'
              ? 'Schedule Team Holiday'
              : 'Record Time-Off'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Unboxed, Prominent Radio Options */}
          <div className="flex flex-wrap items-center gap-6 py-1">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <input
                type="radio"
                name="entryType"
                value="task"
                checked={entryType === 'task'}
                onChange={() => setEntryType('task')}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
              <span className="text-sm">Task</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <input
                type="radio"
                name="entryType"
                value="paid_leave"
                checked={entryType === 'paid_leave'}
                onChange={() => setEntryType('paid_leave')}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
              <span className="text-sm">Paid Leave</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <input
                type="radio"
                name="entryType"
                value="sick_leave"
                checked={entryType === 'sick_leave'}
                onChange={() => setEntryType('sick_leave')}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
              <span className="text-sm">Sick Leave</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <input
                type="radio"
                name="entryType"
                value="holiday"
                checked={entryType === 'holiday'}
                onChange={() => setEntryType('holiday')}
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
              <span className="text-sm">Holiday</span>
            </label>
          </div>

          {/* 1. Holiday Form */}
          {entryType === 'holiday' ? (
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-zinc-500 font-medium mb-1">Holiday Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Tahun Baru 2027, Libur Nasional"
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  className="h-9 w-full px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={holidayStartDate}
                    onChange={(e) => {
                      setHolidayStartDate(e.target.value);
                      if (!holidayEndDate || e.target.value > holidayEndDate) {
                        setHolidayEndDate(e.target.value);
                      }
                    }}
                    className="h-9 w-full px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-zinc-500 font-medium mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={holidayEndDate}
                    onChange={(e) => setHolidayEndDate(e.target.value)}
                    className="h-9 w-full px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                  />
                </div>
              </div>
            </div>
          ) : entryType === 'paid_leave' || entryType === 'sick_leave' ? (
            /* 2. Paid Leave / Sick Leave Form */
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-zinc-500 font-medium mb-1">Designer *</label>
                <select
                  value={leaveDesigner}
                  onChange={(e) => setLeaveDesigner(e.target.value)}
                  className="h-9 w-full px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                >
                  {allAssignees.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

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
                    className="h-9 w-full px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-zinc-500 font-medium mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="h-9 w-full px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* 3. Regular Task Form */
            <>
              <div>
                <label className="block text-zinc-500 font-medium mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. [Discovery] Product Recommendation V2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 w-full px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                />
              </div>

              {/* Compact 3-col row: Status, Priority, WBS */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-500 font-medium mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-9 w-full px-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
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
                    className="h-9 w-full px-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                  >
                    {ALL_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-500 font-medium mb-1">WBS Code</label>
                  <input
                    type="text"
                    placeholder="e.g. DSC#1"
                    value={wbs}
                    onChange={(e) => setWbs(e.target.value)}
                    className="h-9 w-full px-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                  />
                </div>
              </div>

              {/* Squad / Funnel Multi-Select Dropdown with chips & add option */}
              <div ref={squadRef} className="relative">
                <label className="block text-zinc-500 font-medium mb-1">Squad / Funnel</label>
                <div
                  onClick={() => setIsSquadDropdownOpen((prev) => !prev)}
                  className="min-h-[36px] w-full px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer flex flex-wrap items-center gap-1.5 justify-between"
                >
                  <div className="flex flex-wrap items-center gap-1.5 flex-1">
                    {selectedSquads.length > 0 ? (
                      selectedSquads.map((sq) => (
                        <span
                          key={sq}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[11px] font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSquads((prev) => prev.filter((s) => s !== sq));
                          }}
                        >
                          {sq}
                          <X className="w-3 h-3 hover:text-red-500 transition-colors" />
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-400 text-xs">Select squads...</span>
                    )}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-1" />
                </div>

                {isSquadDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl p-2 max-h-48 overflow-y-auto space-y-1">
                    <div className="grid grid-cols-2 gap-1 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                      {allSquads.map((sq) => {
                        const isSelected = selectedSquads.includes(sq);
                        return (
                          <button
                            key={sq}
                            type="button"
                            onClick={() => {
                              setSelectedSquads((prev) =>
                                isSelected ? prev.filter((s) => s !== sq) : [...prev, sq]
                              );
                            }}
                            className={`flex items-center justify-between px-2 py-1 rounded text-left text-xs transition-colors ${
                              isSelected
                                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-medium'
                                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <span className="truncate">{sq}</span>
                            {isSelected && <Check className="w-3 h-3 text-blue-600" />}
                          </button>
                        );
                      })}
                    </div>
                    {/* Add new squad input */}
                    <div className="pt-1.5 flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="+ Add new squad..."
                        value={newSquadInput}
                        onChange={(e) => setNewSquadInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomSquad(e);
                          }
                        }}
                        className="h-7 flex-1 px-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomSquad}
                        className="h-7 px-2.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Assignees Multi-Select Dropdown with chips & add option */}
              <div ref={assigneeRef} className="relative">
                <label className="block text-zinc-500 font-medium mb-1">Assignees</label>
                <div
                  onClick={() => setIsAssigneeDropdownOpen((prev) => !prev)}
                  className="min-h-[36px] w-full px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer flex flex-wrap items-center gap-1.5 justify-between"
                >
                  <div className="flex flex-wrap items-center gap-1.5 flex-1">
                    {selectedAssignees.length > 0 ? (
                      selectedAssignees.map((asg) => (
                        <span
                          key={asg}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-[11px] font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAssignees((prev) => prev.filter((a) => a !== asg));
                          }}
                        >
                          {asg}
                          <X className="w-3 h-3 hover:text-red-500 transition-colors" />
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-400 text-xs">Select assignees...</span>
                    )}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-1" />
                </div>

                {isAssigneeDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl p-2 max-h-48 overflow-y-auto space-y-1">
                    <div className="grid grid-cols-2 gap-1 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                      {allAssignees.map((asg) => {
                        const isSelected = selectedAssignees.includes(asg);
                        return (
                          <button
                            key={asg}
                            type="button"
                            onClick={() => {
                              setSelectedAssignees((prev) =>
                                isSelected ? prev.filter((a) => a !== asg) : [...prev, asg]
                              );
                            }}
                            className={`flex items-center justify-between px-2 py-1 rounded text-left text-xs transition-colors ${
                              isSelected
                                ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 font-medium'
                                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <span className="truncate">{asg}</span>
                            {isSelected && <Check className="w-3 h-3 text-purple-600" />}
                          </button>
                        );
                      })}
                    </div>
                    {/* Add new assignee input */}
                    <div className="pt-1.5 flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="+ Add new designer..."
                        value={newAssigneeInput}
                        onChange={(e) => setNewAssigneeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomAssignee(e);
                          }
                        }}
                        className="h-7 flex-1 px-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomAssignee}
                        className="h-7 px-2.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Full-width long URL fields */}
              <div>
                <label className="block text-zinc-500 font-medium mb-1">Figma URL</label>
                <input
                  type="url"
                  placeholder="https://www.figma.com/..."
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  className="h-9 w-full px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                />
              </div>

              <div>
                <label className="block text-zinc-500 font-medium mb-1">PRD URL</label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/..."
                  value={prdUrl}
                  onChange={(e) => setPrdUrl(e.target.value)}
                  className="h-9 w-full px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                />
              </div>
            </>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {entryType === 'task'
                ? 'Create Task'
                : entryType === 'holiday'
                ? 'Save Holiday'
                : 'Record Leave'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
