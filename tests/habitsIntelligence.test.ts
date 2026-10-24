import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { HabitsEngine } from '../electron/habitsEngine.cjs';
import { HabitsIntelligenceEngine } from '../electron/habitsIntelligenceEngine.cjs';

describe('Habits Intelligence Engine (Offline & Local)', () => {
  let db: any;
  let habitsEngine: any;
  let intelligenceEngine: any;

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT DEFAULT 'geral',
        color TEXT DEFAULT '#38bdf8',
        icon TEXT DEFAULT 'CheckCircle',
        type TEXT DEFAULT 'boolean',
        target_value REAL DEFAULT 1,
        target_unit TEXT,
        frequency_type TEXT DEFAULT 'daily',
        frequency_days TEXT,
        frequency_times INTEGER DEFAULT 7,
        period_of_day TEXT DEFAULT 'anytime',
        archived INTEGER DEFAULT 0,
        position INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS habit_logs (
        id TEXT PRIMARY KEY,
        habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        completed INTEGER DEFAULT 1,
        value REAL DEFAULT 1,
        notes TEXT,
        created_at TEXT,
        updated_at TEXT,
        UNIQUE(habit_id, date)
      );
    `);

    habitsEngine = new HabitsEngine(db);
    intelligenceEngine = new HabitsIntelligenceEngine(db);
  });

  afterEach(() => {
    db.close();
  });

  it('returns valid empty state when no habits exist', () => {
    const intel = habitsEngine.getIntelligence();
    expect(intel).toBeDefined();
    expect(intel.consistencyScore).toBe(0);
    expect(intel.momentum).toBe('stable');
    expect(intel.insights.length).toBeGreaterThan(0);
    expect(intel.insights[0].id).toBe('empty_welcome');
  });

  it('allows registering habits on past days retroactively', () => {
    const habit = habitsEngine.createHabit({
      name: 'Meditação Matinal',
      category: 'mente',
      periodOfDay: 'morning',
    });

    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - 3);
    const pastDateStr = pastDate.toISOString().slice(0, 10);

    // Toggle past day
    const res1 = habitsEngine.toggleHabitDay(habit.id, pastDateStr, 1, 'Feito retroativo');
    expect(res1.completed).toBe(true);

    // Verify it exists in heatmap logs
    const heatmap = habitsEngine.getHabitHeatmap(habit.id, now.getFullYear());
    expect(heatmap[pastDateStr]).toBeDefined();
    expect(heatmap[pastDateStr].completed).toBe(true);

    // Toggling again removes it (toggle behavior)
    const res2 = habitsEngine.toggleHabitDay(habit.id, pastDateStr);
    expect(res2.completed).toBe(false);
  });

  it('detects drop-off risk for a habit done yesterday but not today', () => {
    const habit = habitsEngine.createHabit({
      name: 'Treino Funcional',
      category: 'saude',
      periodOfDay: 'morning',
    });

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    // Concluído ontem, mas ainda não hoje
    habitsEngine.toggleHabitDay(habit.id, yesterdayStr, 1);

    const intel = habitsEngine.getIntelligence();
    const riskInsight = intel.insights.find((i: any) => i.type === 'risk' && i.habitId === habit.id);

    expect(riskInsight).toBeDefined();
    expect(riskInsight?.title).toContain('Sequência em risco');
    expect(riskInsight?.severity).toBe('warning');
  });

  it('identifies Domino Effect (synergies) between frequently co-occurring habits', () => {
    const habitA = habitsEngine.createHabit({ name: 'Acordar cedo', periodOfDay: 'morning' });
    const habitB = habitsEngine.createHabit({ name: 'Exercício', periodOfDay: 'morning' });

    const now = new Date();
    // Registra 6 dias consecutivos onde ambos foram cumpridos
    for (let i = 1; i <= 6; i++) {
      const dt = new Date(now);
      dt.setDate(now.getDate() - i);
      const dStr = dt.toISOString().slice(0, 10);

      habitsEngine.toggleHabitDay(habitA.id, dStr, 1);
      habitsEngine.toggleHabitDay(habitB.id, dStr, 1);
    }

    const intel = intelligenceEngine.getIntelligence();
    expect(intel.synergies.length).toBeGreaterThan(0);
    const pair = intel.synergies[0];
    expect(pair.anchorHabitName).toBe('Acordar cedo');
    expect(pair.boostedHabitName).toBe('Exercício');
    expect(pair.probability).toBe(100);
  });

  it('calculates weekly day-of-week rates and finds best day', () => {
    const habit = habitsEngine.createHabit({ name: 'Leitura', periodOfDay: 'evening' });

    // Registra alguns dias passados
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const dt = new Date(now);
      dt.setDate(now.getDate() - i);
      const dStr = dt.toISOString().slice(0, 10);
      habitsEngine.toggleHabitDay(habit.id, dStr, 1);
    }

    const intel = habitsEngine.getIntelligence();
    expect(intel.daysOfWeek).toHaveLength(7);
    expect(intel.consistencyScore).toBeGreaterThan(0);
    expect(intel.totalCheckInsMonth).toBeGreaterThan(0);
  });
});
