import { describe, it, expect, beforeEach } from 'vitest';
import { pomodoroStore, formatPomodoroTime } from '../../src/modules/pomodoro/pomodoroStore';

describe('Pomodoro Store & Timer Engine', () => {
  beforeEach(() => {
    pomodoroStore.pause();
    pomodoroStore.setMode('focus');
    pomodoroStore.unlinkTask();
  });

  it('formats time in mm:ss accurately', () => {
    expect(formatPomodoroTime(1500)).toBe('25:00');
    expect(formatPomodoroTime(300)).toBe('05:00');
    expect(formatPomodoroTime(65)).toBe('01:05');
    expect(formatPomodoroTime(9)).toBe('00:09');
    expect(formatPomodoroTime(0)).toBe('00:00');
    expect(formatPomodoroTime(-10)).toBe('00:00');
  });

  it('switches modes and updates duration properly', () => {
    pomodoroStore.setMode('focus');
    let snap = pomodoroStore.getSnapshot();
    expect(snap.mode).toBe('focus');
    expect(snap.duration).toBe(25 * 60);
    expect(snap.timeLeft).toBe(25 * 60);

    pomodoroStore.setMode('shortBreak');
    snap = pomodoroStore.getSnapshot();
    expect(snap.mode).toBe('shortBreak');
    expect(snap.duration).toBe(5 * 60);
    expect(snap.timeLeft).toBe(5 * 60);

    pomodoroStore.setMode('longBreak');
    snap = pomodoroStore.getSnapshot();
    expect(snap.mode).toBe('longBreak');
    expect(snap.duration).toBe(15 * 60);
    expect(snap.timeLeft).toBe(15 * 60);
  });

  it('starts, pauses and toggles running state', () => {
    expect(pomodoroStore.getSnapshot().isRunning).toBe(false);

    pomodoroStore.start();
    expect(pomodoroStore.getSnapshot().isRunning).toBe(true);

    pomodoroStore.pause();
    expect(pomodoroStore.getSnapshot().isRunning).toBe(false);

    pomodoroStore.toggle();
    expect(pomodoroStore.getSnapshot().isRunning).toBe(true);

    pomodoroStore.toggle();
    expect(pomodoroStore.getSnapshot().isRunning).toBe(false);
  });

  it('links and unlinks Kanban tasks', () => {
    pomodoroStore.linkTask('task-xyz', 'Criar componente React');
    let snap = pomodoroStore.getSnapshot();
    expect(snap.linkedTaskId).toBe('task-xyz');
    expect(snap.linkedTaskTitle).toBe('Criar componente React');

    pomodoroStore.unlinkTask();
    snap = pomodoroStore.getSnapshot();
    expect(snap.linkedTaskId).toBe(null);
    expect(snap.linkedTaskTitle).toBe(null);
  });

  it('updates custom settings', () => {
    pomodoroStore.updateSettings({
      focusMinutes: 50,
      shortBreakMinutes: 10,
    });
    const snap = pomodoroStore.getSnapshot();
    expect(snap.settings.focusMinutes).toBe(50);
    expect(snap.settings.shortBreakMinutes).toBe(10);

    // Reset back
    pomodoroStore.updateSettings({
      focusMinutes: 25,
      shortBreakMinutes: 5,
    });
  });
});
