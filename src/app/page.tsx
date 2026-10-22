'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Task, ViewMode, TaskStatus } from '@/lib/types';
import { getTasks, upsertTask, deleteTask, isSupabaseConfigured } from '@/lib/supabase';
import { Sidebar } from '@/components/Sidebar';
import { ViewHeader } from '@/components/ViewHeader';
import { TableView } from '@/components/TableView';
import { BoardView } from '@/components/BoardView';
import { TaskModal } from '@/components/TaskModal';
import { NewTaskModal } from '@/components/NewTaskModal';

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSquad, setSelectedSquad] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);

  // Modals
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTaskInitialStatus, setNewTaskInitialStatus] = useState<TaskStatus>('Not started');

  // Fetch initial tasks
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await getTasks();
        setTasks(data);
      } catch (err) {
        console.error('Failed to load tasks:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Compute distinct filter options
  const assigneesList = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.assignees?.forEach((a) => set.add(a)));
    return Array.from(set).sort();
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

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
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
  }, [tasks, searchQuery, selectedSquad, selectedStatus, selectedAssignee]);

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
    setTasks((prev) => [newTask, ...prev]);

    try {
      await upsertTask(newTask);
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
        onNewTask={() => {
          setNewTaskInitialStatus('Not started');
          setIsNewModalOpen(true);
        }}
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
          squadOptions={squadsList}
          statusOptions={statusesList}
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
          ) : viewMode === 'table' ? (
            <TableView
              tasks={filteredTasks}
              onSelectTask={setActiveTask}
              onNewTask={() => {
                setNewTaskInitialStatus('Not started');
                setIsNewModalOpen(true);
              }}
            />
          ) : (
            <BoardView
              tasks={filteredTasks}
              onSelectTask={setActiveTask}
              onNewTaskWithStatus={handleOpenNewInStatus}
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
      />
    </div>
  );
}
