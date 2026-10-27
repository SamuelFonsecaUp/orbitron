export type TimeWorkType =
  | 'Profissional - Contratado'
  | 'Profissional - Freela'
  | 'Projeto Pessoal';

export const TIME_WORK_TYPES: TimeWorkType[] = [
  'Profissional - Contratado',
  'Profissional - Freela',
  'Projeto Pessoal',
];

export interface TimeEntry {
  id: string;
  taskId?: string | null;
  taskTitle: string;
  category?: string;
  workType?: TimeWorkType;
  projectName?: string | null;
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  isPomodoro: boolean;
  isManual: boolean;
  notes?: string;
  createdAt: string;
}

export interface TimeTrackerState {
  isRunning: boolean;
  activeTaskId?: string | null;
  activeTaskTitle: string;
  category: string;
  workType?: TimeWorkType;
  projectName?: string | null;
  startedAt?: number | null; // Unix timestamp in ms
  accumulatedSeconds: number;
}

export interface TimeTrackerStats {
  totalSeconds: number;
  totalEntries: number;
  todaySeconds: number;
  weekSeconds: number;
  byCategory: Array<{ category: string; seconds: number; count: number }>;
  topTasks: Array<{ task_title: string; task_id?: string | null; seconds: number; count: number }>;
}

export interface TimeCategory {
  id: string;
  name: string;
  color: string;
}

export interface IdleDetectionNotice {
  detectedAt: number;
  idleSeconds: number;
  taskTitle: string;
}
