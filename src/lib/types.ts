export type TaskStatus =
  | 'Not started'
  | 'In progress design'
  | 'In review'
  | 'In PM review'
  | 'Need revision'
  | 'On hold'
  | 'Done'
  | 'Cancelled';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'P0 - SUPER HIGH';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus | string;
  priority: TaskPriority | string;
  wbs: string;
  squads: string[];
  pms: string[];
  assignees: string[];
  start_date: string | null;
  end_date: string | null;
  figma_url: string;
  prd_url: string;
  taiga_url: string;
  userflow_url?: string;
  other_docs?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export type ViewMode = 'table' | 'board' | 'timeline' | 'assignee';
