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

export interface FreelaProject {
  id: string;
  name: string;
  clientName: string;
  contractAmountCents: number;
  targetHourlyRateCents: number;
  estimatedHours: number;
  status: 'active' | 'completed' | 'archived';
  notes?: string;
  trackedSeconds: number;
  trackedHours: number;
  sessionCount: number;
  receivedCents: number;
  effectiveHourlyRateCents: number;
  marginPercent: number | null;
  hoursProgress: number;
  matchingTransactionsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TimeBudgetSettings {
  contratadoWeeklyTarget: number; // in hours, default 40
  freelaWeeklyLimit: number; // in hours, default 15
  pessoalWeeklyTarget: number; // in hours, default 5
  maxDailyHours: number; // in hours, default 10
}

export const DEFAULT_TIME_BUDGETS: TimeBudgetSettings = {
  contratadoWeeklyTarget: 40,
  freelaWeeklyLimit: 15,
  pessoalWeeklyTarget: 5,
  maxDailyHours: 10,
};
