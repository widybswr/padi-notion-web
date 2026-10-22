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
    const fetchPromise = supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('Supabase fetch timed out') }), 4000)
    );

    const { data, error } = (await Promise.race([fetchPromise, timeoutPromise])) as any;

    if (error) {
      console.warn('Supabase fetch warning, using local cache:', error.message);
      return localTasksCache;
    }

    if (!data || data.length === 0) {
      return localTasksCache;
    }

    localTasksCache = data as Task[];
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
