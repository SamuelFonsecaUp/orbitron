export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number;
  soundEnabled: boolean;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  pinnedInNavbar: boolean;
}

export interface PomodoroState {
  mode: PomodoroMode;
  timeLeft: number; // in seconds
  duration: number; // in seconds
  isRunning: boolean;
  sessionsCompletedToday: number;
  totalFocusSecondsToday: number;
  linkedTaskId: string | null;
  linkedTaskTitle: string | null;
  settings: PomodoroSettings;
}
