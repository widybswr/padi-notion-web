import { createClient } from '@supabase/supabase-js';
import { Task, TaskAttachment } from './types';
import fallbackData from '@/data/initial-tasks.json';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// In-memory local cache for dev/demo mode when Supabase isn't connected yet
let localTasksCache: Task[] = [...(fallbackData as Task[])];

let currentDbStatus: 'connected' | 'syncing' | 'offline' = isSupabaseConfigured ? 'syncing' : 'offline';

export function getDbStatus(): 'connected' | 'syncing' | 'offline' {
  return currentDbStatus;
}

export async function getTasks(): Promise<Task[]> {
  if (!isSupabaseConfigured || !supabase) {
    currentDbStatus = 'offline';
    return localTasksCache;
  }

  currentDbStatus = 'syncing';
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
      currentDbStatus = 'offline';
      return localTasksCache;
    }

    if (!data || data.length === 0) {
      currentDbStatus = 'connected';
      return localTasksCache;
    }

    currentDbStatus = 'connected';
    localTasksCache = data as Task[];
    return data as Task[];
  } catch (err) {
    console.warn('Error reading from Supabase:', err);
    currentDbStatus = 'offline';
    return localTasksCache;
  }
}

export async function upsertTask(task: Partial<Task> & { id: string }): Promise<Task> {
  if (!isSupabaseConfigured || !supabase) {
    currentDbStatus = 'offline';
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

  currentDbStatus = 'syncing';
  try {
    const { data, error } = await supabase
      .from('tasks')
      .upsert(task, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      currentDbStatus = 'offline';
      throw error;
    }
    currentDbStatus = 'connected';
    return data as Task;
  } catch (err) {
    currentDbStatus = 'offline';
    throw err;
  }
}

export async function deleteTask(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    currentDbStatus = 'offline';
    localTasksCache = localTasksCache.filter((t) => t.id !== id);
    return;
  }

  currentDbStatus = 'syncing';
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      currentDbStatus = 'offline';
      throw error;
    }
    currentDbStatus = 'connected';
  } catch (err) {
    currentDbStatus = 'offline';
    throw err;
  }
}

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KiB', 'MiB', 'GiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export async function uploadTaskFile(taskId: string, file: File): Promise<TaskAttachment> {
  const sanitizedName = file.name.replace(/[^\w.-]/g, '_');
  const path = `${taskId}/${sanitizedName}`;

  if (!isSupabaseConfigured || !supabase) {
    const localUrl = URL.createObjectURL(file);
    return {
      id: crypto.randomUUID(),
      name: file.name,
      size: formatBytes(file.size),
      type: file.type.startsWith('image/') ? 'image' : 'file',
      url: localUrl,
    };
  }

  const { error: uploadError } = await supabase.storage
    .from('task-attachments')
    .upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: pubData } = supabase.storage
    .from('task-attachments')
    .getPublicUrl(path);

  return {
    id: crypto.randomUUID(),
    name: file.name,
    size: formatBytes(file.size),
    type: file.type.startsWith('image/') ? 'image' : 'file',
    url: pubData.publicUrl,
  };
}
