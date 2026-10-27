// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  timeTrackerStore,
  formatTimeHoursMinutesSeconds,
  formatHumanDuration,
} from '../../src/modules/timeTracker/timeTrackerStore';
import { ToolsEngine } from '../../electron/toolsEngine.cjs';
import Database from 'better-sqlite3';

describe('Time Tracker Store (Drift-Free Delta & Idle Time)', () => {
  beforeEach(() => {
    localStorage.clear();
    timeTrackerStore.discard();
  });

  it('formats seconds into exact human-readable durations', () => {
    expect(formatTimeHoursMinutesSeconds(0)).toBe('00:00');
    expect(formatTimeHoursMinutesSeconds(45)).toBe('00:45');
    expect(formatTimeHoursMinutesSeconds(125)).toBe('02:05');
    expect(formatTimeHoursMinutesSeconds(3665)).toBe('01:01:05');

    expect(formatHumanDuration(30)).toBe('30s');
    expect(formatHumanDuration(300)).toBe('5m');
    expect(formatHumanDuration(3600)).toBe('1h');
    expect(formatHumanDuration(5400)).toBe('1h 30m');
  });

  it('starts tracking and calculates delta without interval drift', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    timeTrackerStore.startTracking('Refatorar Módulo', 'task_1', 'Desenvolvimento');
    expect(timeTrackerStore.getState().isRunning).toBe(true);
    expect(timeTrackerStore.getState().activeTaskTitle).toBe('Refatorar Módulo');
    expect(timeTrackerStore.getState().activeTaskId).toBe('task_1');

    // Simulate 25 seconds passing
    vi.spyOn(Date, 'now').mockReturnValue(now + 25000);
    expect(timeTrackerStore.getElapsedSeconds()).toBe(25);

    // Simulate 120 seconds passing
    vi.spyOn(Date, 'now').mockReturnValue(now + 120000);
    expect(timeTrackerStore.getElapsedSeconds()).toBe(120);

    vi.restoreAllMocks();
  });

  it('handles pause and resume preserving accumulated time', () => {
    let mockTime = 1000000;
    vi.spyOn(Date, 'now').mockImplementation(() => mockTime);

    timeTrackerStore.startTracking('Tarefa A', null, 'Geral', null, 'Profissional - Freela');
    expect(timeTrackerStore.getState().workType).toBe('Profissional - Freela');

    // Change work type on the fly
    timeTrackerStore.setWorkType('Projeto Pessoal');
    expect(timeTrackerStore.getState().workType).toBe('Projeto Pessoal');

    // Advance 40 seconds
    mockTime += 40000;
    expect(timeTrackerStore.getElapsedSeconds()).toBe(40);

    // Pause
    timeTrackerStore.pauseTracking();
    expect(timeTrackerStore.getState().isRunning).toBe(false);
    expect(timeTrackerStore.getState().accumulatedSeconds).toBe(40);

    // Advance 5 minutes while paused (should not increment)
    mockTime += 300000;
    expect(timeTrackerStore.getElapsedSeconds()).toBe(40);

    // Resume and advance 20 seconds
    timeTrackerStore.resumeTracking();
    expect(timeTrackerStore.getState().isRunning).toBe(true);
    mockTime += 20000;
    expect(timeTrackerStore.getElapsedSeconds()).toBe(60);

    vi.restoreAllMocks();
  });

  it('allows discarding idle time from the active counter', () => {
    let mockTime = 2000000;
    vi.spyOn(Date, 'now').mockImplementation(() => mockTime);

    timeTrackerStore.startTracking('Tarefa Com Pausa');
    mockTime += 600000; // 10 minutes elapsed (600s)
    expect(timeTrackerStore.getElapsedSeconds()).toBe(600);

    // User was away 7 minutes (420s), discards it
    timeTrackerStore.discardIdleSeconds(420);
    expect(timeTrackerStore.getElapsedSeconds()).toBe(180); // 3 minutes remaining

    vi.restoreAllMocks();
  });

  it('manages dynamic categories with add and delete', () => {
    const initialCategories = timeTrackerStore.getCategories();
    expect(initialCategories.length).toBeGreaterThanOrEqual(4);
    expect(initialCategories.some((c) => c.name === 'Desenvolvimento')).toBe(true);

    // Add new category
    const added = timeTrackerStore.addCategory('Design UI/UX', '#ec4899');
    expect(added.name).toBe('Design UI/UX');
    expect(added.color).toBe('#ec4899');
    expect(timeTrackerStore.getCategories().some((c) => c.id === added.id)).toBe(true);

    // Update category color
    const updated = timeTrackerStore.updateCategory(added.id, { color: '#f59e0b' });
    expect(updated?.color).toBe('#f59e0b');
    const reloaded = timeTrackerStore.getCategories().find((c) => c.id === added.id);
    expect(reloaded?.color).toBe('#f59e0b');

    // Delete category
    const deleted = timeTrackerStore.deleteCategory(added.id);
    expect(deleted).toBe(true);
    expect(timeTrackerStore.getCategories().some((c) => c.id === added.id)).toBe(false);
  });

  it('produces reactive snapshots for useSyncExternalStore on ticks', () => {
    let mockTime = 5000000;
    vi.spyOn(Date, 'now').mockImplementation(() => mockTime);

    timeTrackerStore.startTracking('Teste Reatividade');
    const snap1 = timeTrackerStore.getSnapshot();
    expect(snap1.isRunning).toBe(true);
    expect(snap1.elapsedSeconds).toBe(0);

    // Advance 5 seconds and trigger tick
    mockTime += 5000;
    (timeTrackerStore as any).tick();
    const snap2 = timeTrackerStore.getSnapshot();
    expect(snap2.elapsedSeconds).toBe(5);
    expect(snap2.formattedTime).toBe('00:05');
    expect(snap2.version).toBeGreaterThan(snap1.version);

    vi.restoreAllMocks();
  });

  it('guarantees referential stability for useSyncExternalStore when running', () => {
    timeTrackerStore.startTracking('Teste Estabilidade');
    const snapA = timeTrackerStore.getSnapshot();
    const snapB = timeTrackerStore.getSnapshot();
    expect(snapA).toBe(snapB); // Must be strictly identical (Object.is) to avoid infinite re-render loop
  });
});

describe('ToolsEngine SQLite Time Tracker Backend', () => {
  let db: any;
  let engine: ToolsEngine;

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE IF NOT EXISTS time_entries (
        id TEXT PRIMARY KEY,
        task_id TEXT,
        task_title TEXT NOT NULL,
        category TEXT DEFAULT 'Geral',
        work_type TEXT DEFAULT 'Profissional - Contratado',
        project_name TEXT,
        started_at INTEGER NOT NULL,
        ended_at INTEGER NOT NULL,
        duration_seconds INTEGER NOT NULL,
        is_pomodoro INTEGER DEFAULT 0,
        is_manual INTEGER DEFAULT 0,
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_time_entries_task ON time_entries(task_id);
      CREATE INDEX IF NOT EXISTS idx_time_entries_started ON time_entries(started_at);
    `);
    engine = new ToolsEngine(db);
  });

  it('creates, retrieves, updates and deletes time entries in SQLite', () => {
    const entry = engine.createTimeEntry({
      taskTitle: 'Planejamento Financeiro Q4',
      category: 'Finanças',
      workType: 'Profissional - Freela',
      startedAt: 1700000000000,
      endedAt: 1700003600000,
      durationSeconds: 3600,
      notes: 'Sessão produtiva',
    });

    expect(entry.id).toBeDefined();
    expect(entry.taskTitle).toBe('Planejamento Financeiro Q4');
    expect(entry.workType).toBe('Profissional - Freela');
    expect(entry.durationSeconds).toBe(3600);

    const all = engine.getTimeEntries();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(entry.id);
    expect(all[0].workType).toBe('Profissional - Freela');

    // Update
    const updated = engine.updateTimeEntry(entry.id, {
      notes: 'Sessão revisada com metas batidas',
      category: 'Estratégia',
      workType: 'Projeto Pessoal',
    });
    expect(updated.notes).toBe('Sessão revisada com metas batidas');
    expect(updated.category).toBe('Estratégia');
    expect(updated.workType).toBe('Projeto Pessoal');

    // Stats
    const stats = engine.getTimeTrackerStats();
    expect(stats.totalSeconds).toBe(3600);
    expect(stats.totalEntries).toBe(1);
    expect(stats.byCategory[0].category).toBe('Estratégia');

    // Delete
    engine.deleteTimeEntry(entry.id);
    expect(engine.getTimeEntries().length).toBe(0);
  });
});
