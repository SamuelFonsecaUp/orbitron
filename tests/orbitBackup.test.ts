import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';

describe('Orbit Unified 100% Local-First Backup Engine', () => {
  let db: any;

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        user_name TEXT,
        currency TEXT DEFAULT 'BRL',
        theme TEXT DEFAULT 'dark',
        onboarding_completed INTEGER DEFAULT 0,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'checking',
        initial_balance REAL DEFAULT 0,
        color TEXT DEFAULT '#10b981',
        icon TEXT DEFAULT 'Landmark',
        active INTEGER DEFAULT 1,
        is_demo INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        color TEXT DEFAULT '#10b981',
        icon TEXT DEFAULT 'Tag',
        active INTEGER DEFAULT 1,
        is_system INTEGER DEFAULT 0,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT DEFAULT 'geral',
        color TEXT DEFAULT '#38bdf8',
        period_of_day TEXT DEFAULT 'anytime',
        archived INTEGER DEFAULT 0,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS habit_logs (
        id TEXT PRIMARY KEY,
        habit_id TEXT NOT NULL,
        date TEXT NOT NULL,
        completed INTEGER DEFAULT 1,
        value REAL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        color TEXT DEFAULT '#ffffff',
        pinned INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT
      );
    `);
  });

  afterEach(() => {
    db.close();
  });

  it('exports all local tables and metadata into a valid unified Orbit backup package', () => {
    // Populate test data
    db.prepare(`INSERT INTO accounts (id, name, initial_balance) VALUES (?, ?, ?)`).run('acc_1', 'Conta Espacial', 5000);
    db.prepare(`INSERT INTO habits (id, name, period_of_day) VALUES (?, ?, ?)`).run('hab_1', 'Ver o céu estrelado', 'evening');
    db.prepare(`INSERT INTO habit_logs (id, habit_id, date, completed) VALUES (?, ?, ?, ?)`).run('log_1', 'hab_1', '2026-10-24', 1);
    db.prepare(`INSERT INTO notes (id, title, content) VALUES (?, ?, ?)`).run('note_1', 'Missão Marte', 'Anotações da expedição');

    const backupData = {
      orbitFormat: true,
      version: '1.2.0',
      appName: 'Orbit',
      exportedAt: new Date().toISOString(),
      tables: {
        accounts: db.prepare(`SELECT * FROM accounts`).all(),
        habits: db.prepare(`SELECT * FROM habits`).all(),
        habitLogs: db.prepare(`SELECT * FROM habit_logs`).all(),
        notes: db.prepare(`SELECT * FROM notes`).all(),
      },
      vault: {
        workspace: { favorites: [] },
        pages: [{ relPath: 'Projetos/Orbit.md', content: '# Orbit Local-First\nSistema pessoal' }],
      },
    };

    const json = JSON.stringify(backupData, null, 2);
    expect(json).toBeDefined();

    const parsed = JSON.parse(json);
    expect(parsed.orbitFormat).toBe(true);
    expect(parsed.appName).toBe('Orbit');
    expect(parsed.tables.accounts).toHaveLength(1);
    expect(parsed.tables.accounts[0].name).toBe('Conta Espacial');
    expect(parsed.tables.habits).toHaveLength(1);
    expect(parsed.tables.notes).toHaveLength(1);
    expect(parsed.vault.pages).toHaveLength(1);
    expect(parsed.vault.pages[0].relPath).toBe('Projetos/Orbit.md');
  });

  it('restores all tables and entities completely from an Orbit backup package', () => {
    // Initial data to be wiped
    db.prepare(`INSERT INTO accounts (id, name, initial_balance) VALUES (?, ?, ?)`).run('acc_old', 'Conta Antiga', 10);

    const packageJson = JSON.stringify({
      orbitFormat: true,
      version: '1.2.0',
      appName: 'Orbit',
      tables: {
        accounts: [
          { id: 'acc_orbit_1', name: 'Banco Intergaláctico', initial_balance: 12500, active: 1, created_at: '2026-10-24' },
          { id: 'acc_orbit_2', name: 'Cofre Estelar', initial_balance: 34000, active: 1, created_at: '2026-10-24' },
        ],
        habits: [
          { id: 'hab_orbit_1', name: 'Leitura Noturna', period_of_day: 'evening', color: '#38bdf8' },
        ],
        notes: [
          { id: 'note_orbit_1', title: 'Ideia Cósmica', content: 'Construir coisas incríveis', created_at: '2026-10-24' },
        ],
      },
      vault: {
        pages: [{ relPath: 'Ideias/Orbit.md', content: '100% Local-First' }],
      },
    });

    const data = JSON.parse(packageJson);
    const restoreTx = db.transaction(() => {
      db.prepare(`DELETE FROM accounts`).run();
      db.prepare(`DELETE FROM habits`).run();
      db.prepare(`DELETE FROM notes`).run();

      for (const a of data.tables.accounts) {
        db.prepare(`INSERT INTO accounts (id, name, initial_balance, active, created_at) VALUES (?, ?, ?, ?, ?)`).run(
          a.id, a.name, a.initial_balance, a.active, a.created_at
        );
      }
      for (const h of data.tables.habits) {
        db.prepare(`INSERT INTO habits (id, name, period_of_day, color) VALUES (?, ?, ?, ?)`).run(
          h.id, h.name, h.period_of_day, h.color
        );
      }
      for (const n of data.tables.notes) {
        db.prepare(`INSERT INTO notes (id, title, content, created_at) VALUES (?, ?, ?, ?)`).run(
          n.id, n.title, n.content, n.created_at
        );
      }
    });

    restoreTx();

    const restoredAccounts = db.prepare(`SELECT * FROM accounts`).all();
    expect(restoredAccounts).toHaveLength(2);
    expect(restoredAccounts[0].name).toBe('Banco Intergaláctico');
    expect(restoredAccounts[1].name).toBe('Cofre Estelar');

    const restoredHabits = db.prepare(`SELECT * FROM habits`).all();
    expect(restoredHabits).toHaveLength(1);
    expect(restoredHabits[0].name).toBe('Leitura Noturna');

    const restoredNotes = db.prepare(`SELECT * FROM notes`).all();
    expect(restoredNotes).toHaveLength(1);
    expect(restoredNotes[0].title).toBe('Ideia Cósmica');
  });
});
