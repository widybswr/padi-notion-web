'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskStatus, TaskPriority, TaskAttachment } from '@/lib/types';
import { uploadTaskFile } from '@/lib/supabase';
import { X, Plus, ChevronDown, Check, Paperclip, Loader2, CheckSquare, Palmtree, HeartPulse, Landmark } from 'lucide-react';

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

  const [entryType, setEntryType] = useState<'task' | 'paid_leave' | 'sick_leave' | 'public_holiday'>('task');

  // Task form state
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<string>(initialStatus);
  const [priority, setPriority] = useState<string>('Medium');
  const [wbs, setWbs] = useState('');
  const [selectedSquads, setSelectedSquads] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [figmaUrl, setFigmaUrl] = useState('');
  const [prdUrl, setPrdUrl] = useState('');
  const [otherDocsUrl, setOtherDocsUrl] = useState('');
  const [taigaUrl, setTaigaUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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

      setTitle('');
      setStatus(initialStatus || 'Not started');
      setPriority('Medium');
      setWbs('');
      setSelectedSquads([]);
      setStartDate('');
      setEndDate('');
      setFigmaUrl('');
      setPrdUrl('');
      setOtherDocsUrl('');
      setTaigaUrl('');
      setDescription('');
      setSelectedFiles([]);
      setIsUploading(false);
    }
  }, [isOpen, initialAssignee, initialStatus, availableSquads, availableAssignees]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (entryType === 'public_holiday') {
      if (!holidayStartDate || !holidayEndDate) return;
      const hTitle = holidayName.trim() ? `Public Holiday: ${holidayName.trim()}` : 'Public Holiday';

      const holidayTask: Task = {
        id: crypto.randomUUID(),
        title: hTitle,
        status: 'Public Holiday',
        priority: 'Low',
        wbs: '',
        squads: ['Public Holiday'],
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

    setIsUploading(true);
    const taskId = crypto.randomUUID();
    const uploadedAttachments: TaskAttachment[] = [];

    if (selectedFiles.length > 0) {
      for (const file of selectedFiles) {
        try {
          const att = await uploadTaskFile(taskId, file);
          uploadedAttachments.push(att);
        } catch (err: any) {
          console.error(`Failed to upload ${file.name}:`, err.message);
        }
      }
    }

    const newTask: Task = {
      id: taskId,
      title: title.trim(),
      status,
      priority,
      wbs: wbs.trim(),
      squads: selectedSquads,
      pms: [],
      assignees: selectedAssignees,
      start_date: startDate ? startDate : null,
      end_date: endDate ? endDate : null,
      figma_url: figmaUrl.trim(),
      prd_url: prdUrl.trim(),
      other_docs: otherDocsUrl.trim(),
      taiga_url: taigaUrl.trim(),
      description: description.trim(),
      attachments: uploadedAttachments,
    };

    onCreate(newTask);
    setIsUploading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 md:pt-12 bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-5xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-6 mb-8">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              {entryType === 'task'
                ? 'Create New Task'
                : entryType === 'public_holiday'
                ? 'Record Public Holiday'
                : 'Record Time-Off'}
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
              {entryType.replace('_', ' ')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Column 1: Vertical Selector Pills (Left Side) */}
            <div className="lg:col-span-3 space-y-3 lg:border-r border-zinc-100 dark:border-zinc-800 lg:pr-5">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Entry Type
                </label>
                <div className="flex flex-col gap-1.5">
                  {[
                    { id: 'task', label: 'Design Task', icon: CheckSquare, desc: 'Roadmap & deliverables' },
                    { id: 'paid_leave', label: 'Paid Leave', icon: Palmtree, desc: 'Annual time-off' },
                    { id: 'sick_leave', label: 'Sick Leave', icon: HeartPulse, desc: 'Medical leave' },
                    { id: 'public_holiday', label: 'Public Holiday', icon: Landmark, desc: 'National holiday' },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isSelected = entryType === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setEntryType(tab.id as any)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white font-medium shadow-sm'
                            : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/60'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-zinc-400'}`} />
                        <div className="min-w-0">
                          <div className="font-semibold text-xs truncate">{tab.label}</div>
                          <div className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-zinc-400'}`}>
                            {tab.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Column 2: Main Task Information / Leave Details (Center) */}
            <div className="lg:col-span-4 space-y-4">
              {entryType === 'public_holiday' ? (
                /* Public Holiday Fields */
                <div className="space-y-4">
                  <div>
                    <label className="block text-zinc-500 font-medium mb-1">Public Holiday Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tahun Baru 2027, Hari Kemerdekaan"
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
                /* Paid Leave / Sick Leave Fields */
                <div className="space-y-4">
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
                /* Regular Task Core Details */
                <div className="space-y-4">
                  <div>
                    <label className="block text-zinc-500 font-medium mb-1">Task Title *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. [Discovery] Product Recommendation V2"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs font-medium resize-y min-h-[72px] leading-relaxed"
                    />
                  </div>

                  {/* Squad Multi-Select Dropdown with chips & add option (Full Width) */}
                  <div ref={squadRef} className="relative">
                    <label className="block text-zinc-500 font-medium mb-1">Squad / Funnel</label>
                    <div
                      onClick={() => setIsSquadDropdownOpen((prev) => !prev)}
                      className="min-h-[36px] w-full px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer flex flex-wrap items-center gap-1.5 justify-between"
                    >
                      <div className="flex flex-wrap items-center gap-1 flex-1">
                        {selectedSquads.length > 0 ? (
                          selectedSquads.map((sq) => (
                            <span
                              key={sq}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[10px] font-medium"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSquads((prev) => prev.filter((s) => s !== sq));
                              }}
                            >
                              <span className="truncate max-w-[90px]">{sq}</span>
                              <X className="w-2.5 h-2.5 hover:text-red-500 transition-colors shrink-0" />
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-400 text-xs">Select squads...</span>
                        )}
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-1" />
                    </div>

                    {isSquadDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1 z-30 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl p-2 max-h-52 overflow-y-auto space-y-1">
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
                                {isSelected && <Check className="w-3 h-3 text-blue-600 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                        {/* Add new squad input */}
                        <div className="pt-1.5 flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="+ Add new..."
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
                            className="h-7 px-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Assignees Multi-Select Dropdown with chips & add option (Full Width) */}
                  <div ref={assigneeRef} className="relative">
                    <label className="block text-zinc-500 font-medium mb-1">Assignees</label>
                    <div
                      onClick={() => setIsAssigneeDropdownOpen((prev) => !prev)}
                      className="min-h-[36px] w-full px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer flex flex-wrap items-center gap-1.5 justify-between"
                    >
                      <div className="flex flex-wrap items-center gap-1 flex-1">
                        {selectedAssignees.length > 0 ? (
                          selectedAssignees.map((asg) => (
                            <span
                              key={asg}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-[10px] font-medium"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAssignees((prev) => prev.filter((a) => a !== asg));
                              }}
                            >
                              <span className="truncate max-w-[90px]">{asg}</span>
                              <X className="w-2.5 h-2.5 hover:text-red-500 transition-colors shrink-0" />
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-400 text-xs">Select assignees...</span>
                        )}
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-1" />
                    </div>

                    {isAssigneeDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1 z-30 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl p-2 max-h-52 overflow-y-auto space-y-1">
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
                                {isSelected && <Check className="w-3 h-3 text-purple-600 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                        {/* Add new assignee input */}
                        <div className="pt-1.5 flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="+ Add new..."
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
                            className="h-7 px-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Timeline Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-zinc-500 font-medium mb-1">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (!endDate || e.target.value > endDate) {
                            setEndDate(e.target.value);
                          }
                        }}
                        className="h-9 w-full px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-500 font-medium mb-1">End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-9 w-full px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                      />
                    </div>
                  </div>

                  {/* Divider before Status, Priority, and WBS Section */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
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
                    </div>

                    <div>
                      <label className="block text-zinc-500 font-medium mb-1">WBS Code</label>
                      <input
                        type="text"
                        placeholder="e.g. DSC#1, FUL#2"
                        value={wbs}
                        onChange={(e) => setWbs(e.target.value)}
                        className="h-9 w-full px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Column 3: Deliverables & Links + Files & Attachments + Notes/Description (Right Side) */}
            <div className="lg:col-span-5 space-y-4 lg:border-l border-zinc-100 dark:border-zinc-800 lg:pl-5">
              {entryType === 'task' ? (
                <>
                  {/* Deliverables & Reference Links (All Full Width) */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Deliverables & Reference Links
                    </label>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-zinc-500 font-medium mb-1">Figma URL</label>
                        <input
                          type="url"
                          placeholder="https://www.figma.com/..."
                          value={figmaUrl}
                          onChange={(e) => setFigmaUrl(e.target.value)}
                          className="h-8 w-full px-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-500 font-medium mb-1">PRD Document URL</label>
                        <input
                          type="url"
                          placeholder="https://docs.google.com/..."
                          value={prdUrl}
                          onChange={(e) => setPrdUrl(e.target.value)}
                          className="h-8 w-full px-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-500 font-medium mb-1">Other Docs / Presentation URL</label>
                        <input
                          type="url"
                          placeholder="https://docs.google.com/presentation/..."
                          value={otherDocsUrl}
                          onChange={(e) => setOtherDocsUrl(e.target.value)}
                          className="h-8 w-full px-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-500 font-medium mb-1">Taiga Link URL</label>
                        <input
                          type="url"
                          placeholder="https://taiga.telkom.co.id/..."
                          value={taigaUrl}
                          onChange={(e) => setTaigaUrl(e.target.value)}
                          className="h-8 w-full px-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Divider before Files & Attachments */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Files & Attachments
                    </label>
                    <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-zinc-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-lg cursor-pointer bg-zinc-50/60 dark:bg-zinc-800/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all group">
                      <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                        <Paperclip className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-medium">Choose files or drop here</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 mt-0.5 text-center">
                        PRD, specs, briefs, PDFs, images (max 50MB)
                      </span>
                      <input
                        type="file"
                        multiple
                        disabled={isUploading}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    {/* Selected files list */}
                    {selectedFiles.length > 0 && (
                      <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {selectedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 text-xs"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Paperclip className="w-3 h-3 text-blue-500 shrink-0" />
                              <span className="truncate font-medium text-zinc-800 dark:text-zinc-200 max-w-[200px]">
                                {file.name}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                                ({formatFileSize(file.size)})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              disabled={isUploading}
                              className="p-1 text-zinc-400 hover:text-red-500 rounded transition-colors disabled:opacity-50"
                              title="Remove file"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notes & Description */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Notes & Description
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Add details, specs, meeting notes, or checklist for this task..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs resize-y leading-relaxed font-mono"
                    />
                  </div>
                </>
              ) : (
                /* Information info card for Leaves / Holidays */
                <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60 space-y-2">
                  <h4 className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">
                    {entryType === 'public_holiday' ? 'Holiday Scheduling' : 'Time-off Notice'}
                  </h4>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    {entryType === 'public_holiday'
                      ? 'National and public holidays are automatically highlighted on the team timeline to prevent scheduling overlaps.'
                      : 'Recorded leave blocks are shown on the designer timeline and factored into workload availability calculations.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons footer */}
          <div className="flex items-center justify-between pt-4 mt-6 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-[11px] text-zinc-400">
              {entryType === 'task' ? 'Creating task in backlog' : 'Adding to timeline schedule'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-3.5 py-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors shadow-xs"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading files...</span>
                  </>
                ) : entryType === 'task' ? (
                  'Create Task'
                ) : entryType === 'public_holiday' ? (
                  'Save Public Holiday'
                ) : (
                  'Record Leave'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
