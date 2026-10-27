import { useSyncExternalStore } from 'react';
import { PomodoroMode, PomodoroSettings, PomodoroState } from './types';
import { playPomodoroChime } from './audio';

const STORAGE_KEY = 'orbitron_pomodoro_state';

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  soundEnabled: true,
  autoStartBreaks: false,
  autoStartFocus: false,
  pinnedInNavbar: true,
};

export function formatPomodoroTime(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.floor(Math.max(0, seconds) % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export class PomodoroStore {
  private mode: PomodoroMode = 'focus';
  private timeLeft: number = 25 * 60;
  private duration: number = 25 * 60;
  private isRunning: boolean = false;
  private sessionsCompletedToday: number = 0;
  private totalFocusSecondsToday: number = 0;
  private linkedTaskId: string | null = null;
  private linkedTaskTitle: string | null = null;
  private settings: PomodoroSettings = DEFAULT_SETTINGS;

  private timerId: any = null;
  private targetEndTime: number | null = null;
  private lastSavedDate: string = new Date().toISOString().slice(0, 10);
  private listeners = new Set<() => void>();
  private snapshotCache: PomodoroState | null = null;

  constructor() {
    this.loadState();
  }

  private emit() {
    this.snapshotCache = null;
    this.listeners.forEach((l) => l());
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public getSnapshot = (): PomodoroState => {
    if (!this.snapshotCache) {
      this.snapshotCache = {
        mode: this.mode,
        timeLeft: this.timeLeft,
        duration: this.duration,
        isRunning: this.isRunning,
        sessionsCompletedToday: this.sessionsCompletedToday,
        totalFocusSecondsToday: this.totalFocusSecondsToday,
        linkedTaskId: this.linkedTaskId,
        linkedTaskTitle: this.linkedTaskTitle,
        settings: { ...this.settings },
      };
    }
    return this.snapshotCache;
  };

  private loadState() {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        this.duration = 25 * 60;
        this.timeLeft = 25 * 60;
        return;
      }
      const today = new Date().toISOString().slice(0, 10);
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.settings) {
          this.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
        }
        if (parsed.date === today) {
          this.sessionsCompletedToday = parsed.sessionsCompletedToday || 0;
          this.totalFocusSecondsToday = parsed.totalFocusSecondsToday || 0;
        } else {
          this.sessionsCompletedToday = 0;
          this.totalFocusSecondsToday = 0;
          this.lastSavedDate = today;
        }
        if (parsed.mode && ['focus', 'shortBreak', 'longBreak'].includes(parsed.mode)) {
          this.mode = parsed.mode;
        }
        if (parsed.linkedTaskId) {
          this.linkedTaskId = parsed.linkedTaskId;
          this.linkedTaskTitle = parsed.linkedTaskTitle || null;
        }
      }
      this.duration = this.getDurationForMode(this.mode);
      this.timeLeft = this.duration;
    } catch {
      this.duration = 25 * 60;
      this.timeLeft = 25 * 60;
    }
  }

  private saveState() {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
      const today = new Date().toISOString().slice(0, 10);
      const payload = {
        date: today,
        settings: this.settings,
        sessionsCompletedToday: this.sessionsCompletedToday,
        totalFocusSecondsToday: this.totalFocusSecondsToday,
        mode: this.mode,
        linkedTaskId: this.linkedTaskId,
        linkedTaskTitle: this.linkedTaskTitle,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}
  }

  private getDurationForMode(mode: PomodoroMode): number {
    switch (mode) {
      case 'shortBreak':
        return Math.max(1, this.settings.shortBreakMinutes) * 60;
      case 'longBreak':
        return Math.max(1, this.settings.longBreakMinutes) * 60;
      case 'focus':
      default:
        return Math.max(1, this.settings.focusMinutes) * 60;
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.targetEndTime = Date.now() + this.timeLeft * 1000;

    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      this.tick();
    }, 250); // High precision tick

    this.emit();
  }

  public pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.targetEndTime = null;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.saveState();
    this.emit();
  }

  public toggle() {
    if (this.isRunning) this.pause();
    else this.start();
  }

  public reset() {
    this.pause();
    this.duration = this.getDurationForMode(this.mode);
    this.timeLeft = this.duration;
    this.emit();
  }

  public skip() {
    this.pause();
    this.handleSessionCompleted(true);
  }

  public setMode(mode: PomodoroMode) {
    this.pause();
    this.mode = mode;
    this.duration = this.getDurationForMode(mode);
    this.timeLeft = this.duration;
    this.saveState();
    this.emit();
  }

  public updateSettings(patch: Partial<PomodoroSettings>) {
    this.settings = { ...this.settings, ...patch };
    if (!this.isRunning) {
      this.duration = this.getDurationForMode(this.mode);
      this.timeLeft = this.duration;
    }
    this.saveState();
    this.emit();
  }

  public linkTask(taskId: string, taskTitle: string) {
    this.linkedTaskId = taskId;
    this.linkedTaskTitle = taskTitle;
    this.saveState();
    this.emit();
  }

  public unlinkTask() {
    this.linkedTaskId = null;
    this.linkedTaskTitle = null;
    this.saveState();
    this.emit();
  }

  private tick() {
    if (!this.isRunning || !this.targetEndTime) return;

    const remainingMs = this.targetEndTime - Date.now();
    const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

    if (remainingSec !== this.timeLeft) {
      this.timeLeft = remainingSec;
      this.emit();
    }

    if (remainingSec <= 0) {
      this.handleSessionCompleted(false);
    }
  }

  private handleSessionCompleted(skipped: boolean) {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isRunning = false;
    this.targetEndTime = null;

    if (!skipped && this.settings.soundEnabled) {
      playPomodoroChime();
    }

    const completedMode = this.mode;
    const completedTaskId = this.linkedTaskId;

    if (completedMode === 'focus') {
      if (!skipped) {
        this.sessionsCompletedToday++;
        this.totalFocusSecondsToday += this.duration;
      }

      // Check if long break interval reached
      const isLongBreak =
        this.sessionsCompletedToday > 0 &&
        this.sessionsCompletedToday % this.settings.longBreakInterval === 0;

      this.mode = isLongBreak ? 'longBreak' : 'shortBreak';
      this.duration = this.getDurationForMode(this.mode);
      this.timeLeft = this.duration;

      // Dispatch global event for Toasts and Kanban task increment
      window.dispatchEvent(
        new CustomEvent('orbitron:pomodoro-complete', {
          detail: {
            mode: 'focus',
            nextMode: this.mode,
            skipped,
            sessionsCompleted: this.sessionsCompletedToday,
            linkedTaskId: completedTaskId,
            linkedTaskTitle: this.linkedTaskTitle,
          },
        })
      );

      if (!skipped && this.settings.autoStartBreaks) {
        this.start();
      }
    } else {
      // Break finished -> switch to focus
      this.mode = 'focus';
      this.duration = this.getDurationForMode('focus');
      this.timeLeft = this.duration;

      window.dispatchEvent(
        new CustomEvent('orbitron:pomodoro-complete', {
          detail: {
            mode: completedMode,
            nextMode: 'focus',
            skipped,
            sessionsCompleted: this.sessionsCompletedToday,
            linkedTaskId: completedTaskId,
            linkedTaskTitle: this.linkedTaskTitle,
          },
        })
      );

      if (!skipped && this.settings.autoStartFocus) {
        this.start();
      }
    }

    this.saveState();
    this.emit();
  }
}

export const pomodoroStore = new PomodoroStore();

export function usePomodoroStore(): PomodoroState;
export function usePomodoroStore<T>(selector: (state: PomodoroState) => T): T;
export function usePomodoroStore<T>(selector?: (state: PomodoroState) => T): T | PomodoroState {
  return useSyncExternalStore(
    pomodoroStore.subscribe,
    () => {
      const snap = pomodoroStore.getSnapshot();
      return selector ? selector(snap) : snap;
    }
  );
}
