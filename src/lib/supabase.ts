import { createClient } from '@supabase/supabase-js';
import { Task } from './types';
import fallbackData from '@/data/initial-tasks.json';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// In-memory local cache for dev/demo mode when Supabase isn't connected yet
let localTasksCache: Task[] = [...(fallbackData as Task[])];

export async function getTasks(): Promise<Task[]> {
  if (!isSupabaseConfigured || !supabase) {
    return localTasksCache;
  }

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch failed, falling back to cached tasks:', error.message);
      return localTasksCache;
    }

    if (!data || data.length === 0) {
      // If table is empty, return initial tasks
      return localTasksCache;
    }

    return data as Task[];
  } catch (err) {
    console.warn('Error reading from Supabase:', err);
    return localTasksCache;
  }
}

export async function upsertTask(task: Partial<Task> & { id: string }): Promise<Task> {
  if (!isSupabaseConfigured || !supabase) {
    const idx = localTasksCache.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      localTasksCache[idx] = { ...localTasksCache[idx], ...task };
      return localTasksCache[idx];
    } else {
      const newTask = task as Task;
      localTasksCache.unshift(newTask);
      return newTask;
    }
  }

  const { data, error } = await supabase
    .from('tasks')
    .upsert(task, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    localTasksCache = localTasksCache.filter((t) => t.id !== id);
    return;
  }

  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}
