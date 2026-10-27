'use client';

import React, { useState, useEffect } from 'react';
import { Task } from '@/lib/types';
import { X, Palmtree, HeartPulse, Landmark, Calendar, User } from 'lucide-react';

const DEFAULT_ASSIGNEES = ['Dian', 'Sigit', 'Banu', 'Widy', 'Frans'];

interface AddLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (task: Task) => void;
  initialAssignee?: string | null;
  availableAssignees?: string[];
}

type LeaveType = 'paid_leave' | 'sick_leave' | 'public_holiday';

export const AddLeaveModal: React.FC<AddLeaveModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  initialAssignee,
  availableAssignees,
}) => {
  const [leaveType, setLeaveType] = useState<LeaveType>('paid_leave');
  const [designer, setDesigner] = useState<string>('Dian');
  const [allAssignees, setAllAssignees] = useState<string[]>(DEFAULT_ASSIGNEES);

  // Time off dates
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Public Holiday specific
  const [holidayName, setHolidayName] = useState('');

  // Reset and sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      const mergedAssignees = Array.from(
        new Set([...DEFAULT_ASSIGNEES, ...(availableAssignees || [])])
      ).filter(Boolean);
      setAllAssignees(mergedAssignees);

      if (initialAssignee) {
        setDesigner(initialAssignee);
      } else {
        setDesigner(mergedAssignees[0] || 'Dian');
      }

      setLeaveType('paid_leave');
      setStartDate('');
      setEndDate('');
      setHolidayName('');
    }
  }, [isOpen, initialAssignee, availableAssignees]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (leaveType === 'public_holiday') {
      if (!startDate || !endDate) return;
      const hTitle = holidayName.trim() ? `Public Holiday: ${holidayName.trim()}` : 'Public Holiday';

      const holidayTask: Task = {
        id: crypto.randomUUID(),
        title: hTitle,
        status: 'Public Holiday',
        priority: 'Low',
        wbs: '',
        squads: ['Public Holiday'],
        pms: [],
        assignees: [], // Applies to entire team
        start_date: startDate,
        end_date: endDate,
        figma_url: '',
        prd_url: '',
        taiga_url: '',
      };

      onCreate(holidayTask);
      onClose();
      return;
    }

    // Paid Leave or Sick Leave
    if (!startDate || !endDate) return;
    const leaveLabel = leaveType === 'paid_leave' ? 'Paid Leave' : 'Sick Leave';

    const leaveTask: Task = {
      id: crypto.randomUUID(),
      title: `${leaveLabel} - ${designer}`,
      status: leaveLabel,
      priority: 'Low',
      wbs: '',
      squads: ['Leave'],
      pms: [],
      assignees: [designer],
      start_date: startDate,
      end_date: endDate,
      figma_url: '',
      prd_url: '',
      taiga_url: '',
    };

    onCreate(leaveTask);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-6 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              {leaveType === 'public_holiday' ? 'Record Public Holiday' : 'Record Leave & Time-Off'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Segmented Pill Selector for Leave Type */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Leave / Holiday Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'paid_leave', label: 'Paid Leave', icon: Palmtree },
                { id: 'sick_leave', label: 'Sick Leave', icon: HeartPulse },
                { id: 'public_holiday', label: 'Holiday', icon: Landmark },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = leaveType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setLeaveType(tab.id as LeaveType)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Fields */}
          {leaveType === 'public_holiday' ? (
            /* Public Holiday Fields */
            <div className="space-y-3">
              <div>
                <label className="block text-zinc-500 font-medium mb-1">Public Holiday Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tahun Baru Imlek 2578, Hari Kemerdekaan"
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
                  <label className="block text-zinc-500 font-medium mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9 w-full px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Paid Leave / Sick Leave Fields */
            <div className="space-y-3">
              <div>
                <label className="block text-zinc-500 font-medium mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-400" /> Designer *
                </label>
                <select
                  value={designer}
                  onChange={(e) => setDesigner(e.target.value)}
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
                  <label className="block text-zinc-500 font-medium mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9 w-full px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">
              {leaveType === 'public_holiday'
                ? 'Applies to all designer timelines'
                : `Adding to ${designer}'s schedule`}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-xs"
              >
                {leaveType === 'public_holiday' ? 'Save Public Holiday' : 'Record Leave'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
