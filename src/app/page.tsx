'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Task, ViewMode, TaskStatus } from '@/lib/types';
import { getTasks, upsertTask, deleteTask, isSupabaseConfigured } from '@/lib/supabase';
import { Sidebar } from '@/components/Sidebar';
import { ViewHeader } from '@/components/ViewHeader';
import { TableView } from '@/components/TableView';
import { BoardView } from '@/components/BoardView';
import { TimelineView } from '@/components/TimelineView';
import { DashboardView } from '@/components/DashboardView';
import { TaskModal } from '@/components/TaskModal';
import { NewTaskModal } from '@/components/NewTaskModal';
import { PasswordGate } from '@/components/PasswordGate';
import initialTasksData from '@/data/initial-tasks.json';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [tasks, setTasks] = useState<Task[]>(initialTasksData as Task[]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Filter states
  const [activeQuarter, setActiveQuarter] = useState('Q4 2026');
  const [extraQuarters, setExtraQuarters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSquad, setSelectedSquad] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);

  // Check auth upfront
  useEffect(() => {
    const auth = localStorage.getItem('padi_workspace_auth');
    if (auth === 'padi2026') {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('padi_workspace_auth');
    setIsAuthenticated(false);
  };

  // Modals
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTaskInitialStatus, setNewTaskInitialStatus] = useState<TaskStatus>('Not started');

  // Fetch initial tasks (silent background sync)
  useEffect(() => {
    async function load() {
      try {
        const data = await getTasks();
        if (data && data.length > 0) {
          setTasks(data);
        }
      } catch (err) {
        console.warn('Background tasks sync warning:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Compute distinct filter options
  const assigneesList = useMemo(() => {
    const PRIORITY_ORDER = ['dian', 'sigit', 'banu', 'widy', 'frans'];
    const set = new Set<string>();
    tasks.forEach((t) => t.assignees?.forEach((a) => set.add(a)));

    return Array.from(set).sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const aIdx = PRIORITY_ORDER.findIndex((name) => aLower.includes(name));
      const bIdx = PRIORITY_ORDER.findIndex((name) => bLower.includes(name));

      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [tasks]);

  const squadsList = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.squads?.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [tasks]);

  const statusesList = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.status) set.add(t.status);
    });
    return Array.from(set).sort();
  }, [tasks]);

  const quartersList = useMemo(() => {
    const set = new Set<string>(['Q4 2026']);
    tasks.forEach((t) => {
      if (t.quarter) set.add(t.quarter);
    });
    extraQuarters.forEach((q) => set.add(q));
    return Array.from(set).sort();
  }, [tasks, extraQuarters]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Quarter filter (Top level workspace scope)
      if (activeQuarter && (t.quarter || 'Q4 2026') !== activeQuarter) {
        return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesWbs = t.wbs?.toLowerCase().includes(q);
        const matchesSquad = t.squads?.some((s) => s.toLowerCase().includes(q));
        const matchesAssignee = t.assignees?.some((a) => a.toLowerCase().includes(q));
        if (!matchesTitle && !matchesWbs && !matchesSquad && !matchesAssignee) {
          return false;
        }
      }

      // Squad filter
      if (selectedSquad && !t.squads?.includes(selectedSquad)) {
        return false;
      }

      // Status filter
      if (selectedStatus && t.status !== selectedStatus) {
        return false;
      }

      // Assignee filter (e.g. from Sidebar team view)
      if (selectedAssignee && !t.assignees?.includes(selectedAssignee)) {
        return false;
      }

      return true;
    });
  }, [tasks, activeQuarter, searchQuery, selectedSquad, selectedStatus, selectedAssignee]);

  // Handlers
  const handleUpdateTask = async (updated: Task) => {
    // Optimistic UI update
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setActiveTask(updated);

    try {
      await upsertTask(updated);
    } catch (err) {
      console.error('Failed to update task in database:', err);
    }
  };

  const handleCreateTask = async (newTask: Task) => {
    const withQuarter = { ...newTask, quarter: activeQuarter };
    setTasks((prev) => [withQuarter, ...prev]);

    try {
      await upsertTask(withQuarter);
    } catch (err) {
      console.error('Failed to create task in database:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setActiveTask(null);

    try {
      await deleteTask(id);
    } catch (err) {
      console.error('Failed to delete task in database:', err);
    }
  };

  const handleOpenNewInStatus = (status: TaskStatus) => {
    setNewTaskInitialStatus(status);
    setIsNewModalOpen(true);
  };

  // While checking localStorage
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <span className="text-xl animate-pulse">🌾</span>
      </div>
    );
  }

  // Not authenticated: render password prompt upfront
  if (!isAuthenticated) {
    return <PasswordGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-zinc-950 font-sans">
      {/* Notion Sidebar */}
      <Sidebar
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedAssignee={selectedAssignee}
        setSelectedAssignee={setSelectedAssignee}
        assignees={assigneesList}
        totalTasks={tasks.length}
        isSupabaseConnected={isSupabaseConfigured}
        activeQuarter={activeQuarter}
        setActiveQuarter={setActiveQuarter}
        quartersList={quartersList}
        onAddQuarter={(newQ) => {
          setExtraQuarters((prev) => [...prev, newQ]);
          setActiveQuarter(newQ);
        }}
        tasks={tasks}
        onLogout={handleLogout}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <ViewHeader
          viewMode={viewMode}
          setViewMode={setViewMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedSquad={selectedSquad}
          setSelectedSquad={setSelectedSquad}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedAssignee={selectedAssignee}
          setSelectedAssignee={setSelectedAssignee}
          squadOptions={squadsList}
          statusOptions={statusesList}
          designerOptions={assigneesList}
          activeQuarter={activeQuarter}
          onNewTask={() => {
            setNewTaskInitialStatus('Not started');
            setIsNewModalOpen(true);
          }}
          totalFiltered={filteredTasks.length}
        />

        {/* View Content */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-zinc-400 text-xs">
              Loading workspace tasks...
            </div>
          ) : viewMode === 'dashboard' ? (
            <DashboardView
              tasks={filteredTasks}
              allQuarterTasks={tasks.filter((t) => !t.quarter || t.quarter === activeQuarter)}
              onSelectTask={setActiveTask}
              activeQuarter={activeQuarter}
            />
          ) : viewMode === 'table' ? (
            <TableView
              tasks={filteredTasks}
              onSelectTask={setActiveTask}
              onNewTask={() => {
                setNewTaskInitialStatus('Not started');
                setIsNewModalOpen(true);
              }}
            />
          ) : viewMode === 'board' ? (
            <BoardView
              tasks={filteredTasks}
              onSelectTask={setActiveTask}
              onNewTaskWithStatus={handleOpenNewInStatus}
            />
          ) : (
            <TimelineView
              tasks={filteredTasks}
              onSelectTask={setActiveTask}
              onUpdateTask={handleUpdateTask}
              activeQuarter={activeQuarter}
            />
          )}
        </div>
      </main>

      {/* Detail / Side-peek Modal */}
      <TaskModal
        task={activeTask}
        onClose={() => setActiveTask(null)}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
      />

      {/* New Task Creation Modal */}
      <NewTaskModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreate={handleCreateTask}
        initialStatus={newTaskInitialStatus}
        initialAssignee={selectedAssignee}
        availableSquads={squadsList}
        availableAssignees={assigneesList}
      />
    </div>
  );
}
