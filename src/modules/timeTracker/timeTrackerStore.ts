import { useSyncExternalStore } from 'react';
import { TimeEntry, TimeTrackerState, IdleDetectionNotice, TimeCategory } from './types';

const STORAGE_KEY = 'orbitron_time_tracker_state_v1';
const CATEGORIES_KEY = 'orbitron_time_tracker_categories_v1';
const IDLE_THRESHOLD_SECONDS = 300; // 5 minutes of inactivity

export const DEFAULT_CATEGORIES: TimeCategory[] = [
  { id: 'cat_dev', name: 'Desenvolvimento', color: '#06b6d4' },
  { id: 'cat_estudos', name: 'Estudos', color: '#a855f7' },
  { id: 'cat_financas', name: 'Finanças', color: '#10b981' },
  { id: 'cat_design', name: 'Design', color: '#ec4899' },
  { id: 'cat_reuniao', name: 'Reunião', color: '#f59e0b' },
  { id: 'cat_geral', name: 'Geral', color: '#64748b' },
];

export function formatTimeHoursMinutesSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatHumanDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);

  if (hrs > 0) {
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
  if (mins > 0) {
    return `${mins}m`;
  }
  return `${s}s`;
}

export interface TimeTrackerSnapshot extends TimeTrackerState {
  elapsedSeconds: number;
  formattedTime: string;
  humanDuration: string;
  idleNotice: IdleDetectionNotice | null;
  categories: TimeCategory[];
  version: number;
}

class TimeTrackerStore {
  private state: TimeTrackerState = {
    isRunning: false,
    activeTaskId: null,
    activeTaskTitle: '',
    category: 'Geral',
    projectName: null,
    startedAt: null,
    accumulatedSeconds: 0,
  };

  private categories: TimeCategory[] = DEFAULT_CATEGORIES;
  private version = 0;
  private listeners = new Set<() => void>();
  private tickerInterval: any = null;
  private idleCheckInterval: any = null;
  private idleNotice: IdleDetectionNotice | null = null;
  private lastSnapshot: TimeTrackerSnapshot | null = null;

  constructor() {
    this.loadPersistedState();
    this.loadPersistedCategories();
    if (typeof window !== 'undefined') {
      this.initTicker();
      this.initIdleDetection();
    }
  }

  private loadPersistedState() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.state = {
          isRunning: Boolean(parsed.isRunning),
          activeTaskId: parsed.activeTaskId || null,
          activeTaskTitle: parsed.activeTaskTitle || '',
          category: parsed.category || 'Geral',
          projectName: parsed.projectName || null,
          startedAt: parsed.startedAt || null,
          accumulatedSeconds: Number(parsed.accumulatedSeconds) || 0,
        };
      }
    } catch {}
  }

  private loadPersistedCategories() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(CATEGORIES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.categories = parsed;
        }
      }
    } catch {}
  }

  private persistState() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {}
  }

  private persistCategories() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(this.categories));
    } catch {}
  }

  private notify() {
    this.version++;
    this.lastSnapshot = null;
    this.persistState();
    this.updateDesktopTitleAndTray();
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Error in time tracker store listener:', err);
      }
    });
  }

  private updateDesktopTitleAndTray() {
    if (typeof window === 'undefined' || !window.electronAPI?.updateTrayTimer) return;
    try {
      if (this.state.isRunning && this.state.activeTaskTitle) {
        const elapsed = this.getElapsedSeconds();
        const timeStr = formatTimeHoursMinutesSeconds(elapsed);
        window.electronAPI.updateTrayTimer(`[${timeStr}] ${this.state.activeTaskTitle}`);
      } else {
        window.electronAPI.updateTrayTimer('');
      }
    } catch {}
  }

  public tick() {
    if (!this.state.isRunning) return;
    const elapsed = this.getElapsedSeconds();
    // Only notify when elapsed whole second actually changes
    if (!this.lastSnapshot || this.lastSnapshot.elapsedSeconds !== elapsed) {
      this.version++;
      this.lastSnapshot = null;
      this.updateDesktopTitleAndTray();
      this.listeners.forEach((l) => {
        try {
          l();
        } catch (err) {
          console.error('Error in time tracker tick listener:', err);
        }
      });
    }
  }

  private initTicker() {
    if (this.tickerInterval) clearInterval(this.tickerInterval);
    // 500ms ticker for responsive second transitions without drift
    this.tickerInterval = setInterval(() => {
      this.tick();
    }, 500);
  }

  private initIdleDetection() {
    if (this.idleCheckInterval) clearInterval(this.idleCheckInterval);
    // Check every 30 seconds
    this.idleCheckInterval = setInterval(async () => {
      if (!this.state.isRunning || !window.electronAPI?.getSystemIdleTime) return;
      try {
        const idleSec = await window.electronAPI.getSystemIdleTime();
        if (idleSec >= IDLE_THRESHOLD_SECONDS && !this.idleNotice) {
          this.idleNotice = {
            detectedAt: Date.now(),
            idleSeconds: idleSec,
            taskTitle: this.state.activeTaskTitle,
          };
          window.dispatchEvent(
            new CustomEvent('orbitron:time-tracker-idle', {
              detail: this.idleNotice,
            })
          );
          this.notify();
        }
      } catch {}
    }, 30000);
  }

  // --- Core Public API ---

  public getSnapshot = (): TimeTrackerSnapshot => {
    // If snapshot for current version is already cached, return it directly for React referential stability
    if (this.lastSnapshot && this.lastSnapshot.version === this.version) {
      return this.lastSnapshot;
    }
    const elapsedSeconds = this.getElapsedSeconds();
    const snap: TimeTrackerSnapshot = {
      ...this.state,
      elapsedSeconds,
      formattedTime: formatTimeHoursMinutesSeconds(elapsedSeconds),
      humanDuration: formatHumanDuration(elapsedSeconds),
      idleNotice: this.idleNotice,
      categories: this.categories,
      version: this.version,
    };
    this.lastSnapshot = snap;
    return snap;
  };

  public getState(): TimeTrackerState {
    return this.state;
  }

  public getCategories(): TimeCategory[] {
    return [...this.categories];
  }

  public addCategory(name: string, color: string = '#06b6d4'): TimeCategory {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('O nome da categoria não pode ser vazio.');
    const existing = this.categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const newCat: TimeCategory = {
      id: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      color: color || '#06b6d4',
    };
    this.categories = [...this.categories, newCat];
    this.persistCategories();
    this.notify();
    return newCat;
  }

  public deleteCategory(nameOrId: string): boolean {
    const initialLen = this.categories.length;
    this.categories = this.categories.filter(
      (c) => c.id !== nameOrId && c.name.toLowerCase() !== nameOrId.toLowerCase()
    );
    if (this.categories.length === 0) {
      this.categories = [...DEFAULT_CATEGORIES];
    }
    const removed = this.categories.length !== initialLen;
    if (removed) {
      this.persistCategories();
      this.notify();
    }
    return removed;
  }

  public getIdleNotice(): IdleDetectionNotice | null {
    return this.idleNotice;
  }

  public clearIdleNotice() {
    this.idleNotice = null;
    this.notify();
  }

  public getElapsedSeconds(): number {
    let currentChunk = 0;
    if (this.state.isRunning && this.state.startedAt) {
      currentChunk = Math.max(0, Math.floor((Date.now() - this.state.startedAt) / 1000));
    }
    return this.state.accumulatedSeconds + currentChunk;
  }

  public async startTracking(
    taskTitle: string,
    taskId?: string | null,
    category: string = 'Geral',
    projectName?: string | null
  ) {
    const trimmedTitle = taskTitle.trim() || 'Tarefa Sem Título';

    // If already running for another task, save current session first
    if (this.state.isRunning && this.state.activeTaskTitle && this.state.activeTaskTitle !== trimmedTitle) {
      await this.stopAndSave();
    }

    this.state = {
      isRunning: true,
      activeTaskId: taskId || null,
      activeTaskTitle: trimmedTitle,
      category: category || 'Geral',
      projectName: projectName || null,
      startedAt: Date.now(),
      accumulatedSeconds: this.state.activeTaskId === taskId && taskId ? this.state.accumulatedSeconds : 0,
    };
    this.idleNotice = null;
    this.notify();
  }

  public pauseTracking() {
    if (!this.state.isRunning) return;
    const currentChunk = this.state.startedAt
      ? Math.max(0, Math.floor((Date.now() - this.state.startedAt) / 1000))
      : 0;

    this.state = {
      ...this.state,
      isRunning: false,
      startedAt: null,
      accumulatedSeconds: this.state.accumulatedSeconds + currentChunk,
    };
    this.notify();
  }

  public resumeTracking() {
    if (this.state.isRunning) return;
    this.state = {
      ...this.state,
      isRunning: true,
      startedAt: Date.now(),
    };
    this.notify();
  }

  public async stopAndSave(notes: string = ''): Promise<TimeEntry | null> {
    const totalSeconds = this.getElapsedSeconds();
    if (totalSeconds < 2 && !this.state.activeTaskTitle) {
      this.discard();
      return null;
    }

    const endedAt = Date.now();
    const startedAt = endedAt - totalSeconds * 1000;
    const taskTitle = this.state.activeTaskTitle || 'Tarefa Geral';
    const taskId = this.state.activeTaskId;
    const category = this.state.category || 'Geral';
    const projectName = this.state.projectName;

    let savedEntry: TimeEntry | null = null;
    if (typeof window !== 'undefined' && window.electronAPI?.createTimeEntry) {
      try {
        savedEntry = await window.electronAPI.createTimeEntry({
          taskId,
          taskTitle,
          category,
          projectName,
          startedAt,
          endedAt,
          durationSeconds: totalSeconds,
          isPomodoro: false,
          isManual: false,
          notes,
        });
      } catch (err) {
        console.error('Failed to save time entry to SQLite:', err);
      }
    }

    // Reset tracker state
    this.state = {
      isRunning: false,
      activeTaskId: null,
      activeTaskTitle: '',
      category: 'Geral',
      projectName: null,
      startedAt: null,
      accumulatedSeconds: 0,
    };
    this.idleNotice = null;
    this.notify();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('orbitron:time-entry-saved', {
          detail: { entry: savedEntry, totalSeconds, taskTitle, taskId },
        })
      );
    }

    return savedEntry;
  }

  public discard() {
    this.state = {
      isRunning: false,
      activeTaskId: null,
      activeTaskTitle: '',
      category: 'Geral',
      projectName: null,
      startedAt: null,
      accumulatedSeconds: 0,
    };
    this.idleNotice = null;
    this.notify();
  }

  public discardIdleSeconds(secondsToDiscard: number) {
    if (secondsToDiscard <= 0) {
      this.clearIdleNotice();
      return;
    }
    const currentTotal = this.getElapsedSeconds();
    const adjustedTotal = Math.max(0, currentTotal - secondsToDiscard);

    this.state = {
      ...this.state,
      startedAt: this.state.isRunning ? Date.now() : null,
      accumulatedSeconds: adjustedTotal,
    };
    this.clearIdleNotice();
    this.notify();
  }

  public subscribe = (callback: () => void) => {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  };
}

export const timeTrackerStore = new TimeTrackerStore();

export function useTimeTracker() {
  const snapshot = useSyncExternalStore(
    timeTrackerStore.subscribe,
    timeTrackerStore.getSnapshot,
    timeTrackerStore.getSnapshot
  );

  return {
    ...snapshot,
    startTracking: (title: string, taskId?: string | null, cat?: string, proj?: string | null) =>
      timeTrackerStore.startTracking(title, taskId, cat, proj),
    pauseTracking: () => timeTrackerStore.pauseTracking(),
    resumeTracking: () => timeTrackerStore.resumeTracking(),
    stopAndSave: (notes?: string) => timeTrackerStore.stopAndSave(notes),
    discard: () => timeTrackerStore.discard(),
    clearIdleNotice: () => timeTrackerStore.clearIdleNotice(),
    discardIdleSeconds: (sec: number) => timeTrackerStore.discardIdleSeconds(sec),
    addCategory: (name: string, color?: string) => timeTrackerStore.addCategory(name, color),
    deleteCategory: (nameOrId: string) => timeTrackerStore.deleteCategory(nameOrId),
  };
}
