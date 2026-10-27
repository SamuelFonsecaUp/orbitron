/**
 * Gamification Engine (Pigo RPG Financeiro) — 100% local
 *
 * O XP é DERIVADO dos dados financeiros (extratos, lançamentos, reserva, faturas),
 * que já sincronizam entre computadores. Assim todos os PCs chegam ao mesmo nível,
 * o histórico antigo pontua retroativamente e não existe XP duplicado.
 * Apenas o que é inerentemente local fica em tabelas próprias:
 * missões semanais geradas e o controle de "já comemorado".
 */

const XP = {
  statementImport: 50,
  categorizedTransaction: 2,
  positiveMonth: 200,
  reserveAporteBase: 50,
  reserveAporteMaxBonus: 250,
  budgetKept: 50,
  invoiceOnTime: 80,
  habitCheckin: 5,
  perfectHabitDay: 25,
  focusHour: 20,
  focusSession: 5,
};

const RARITY_XP = { comum: 15, raro: 35, epico: 75, lendario: 150 };

const { LEVEL_TITLES, ACHIEVEMENTS } = require('./achievementDefinitions.cjs');

// --- Date helpers (local time, YYYY-MM-DD strings) ---
function parseDate(dateStr) {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(dateStr, days) {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

function addMonthsToKey(monthKey, delta) {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthEnd(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  return formatDate(new Date(y, m, 0));
}

// Semana começa na segunda-feira; a chave é a data dessa segunda
function weekStart(dateStr) {
  const d = parseDate(dateStr);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return formatDate(d);
}

function monthLabel(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function formatBRL(cents) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// --- Level curve: subir do nível n para n+1 custa 100 + 50·(n-1) XP ---
function xpToNext(level) {
  return 100 + 50 * (level - 1);
}

function levelFromXp(totalXp) {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpToNext(level)) {
    remaining -= xpToNext(level);
    level++;
  }
  return { level, xpIntoLevel: remaining, xpForNext: xpToNext(level) };
}

function titleForLevel(level) {
  let title = LEVEL_TITLES[0].title;
  for (const t of LEVEL_TITLES) {
    if (level >= t.from) title = t.title;
  }
  return title;
}

function longestRun(sortedKeys, nextKey) {
  let best = 0;
  let current = 0;
  let prev = null;
  for (const key of sortedKeys) {
    current = prev && nextKey(prev) === key ? current + 1 : 1;
    best = Math.max(best, current);
    prev = key;
  }
  return best;
}

class GamificationEngine {
  constructor(db, intelligence) {
    this.db = db;
    this.intelligence = intelligence;
    this.ensureTables();
  }

  ensureTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS game_weekly_missions (
        week_key TEXT NOT NULL,
        mission_id TEXT NOT NULL,
        definition TEXT NOT NULL,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        PRIMARY KEY (week_key, mission_id)
      );
      CREATE TABLE IF NOT EXISTS game_seen (
        key TEXT PRIMARY KEY,
        seen_at TEXT NOT NULL
      );
    `);
  }

  today() {
    return new Date().toISOString().slice(0, 10);
  }

  // ==========================================
  // Fatos derivados dos dados financeiros
  // ==========================================
  collectFacts() {
    const today = this.today();
    const currentMonth = today.slice(0, 7);

    const statements = this.db.prepare(`
      SELECT id, original_name, imported_at FROM imported_statements ORDER BY imported_at ASC
    `).all();

    const categorizedByMonth = this.db.prepare(`
      SELECT strftime('%Y-%m', transaction_date) as month_key, COUNT(*) as c
      FROM transactions
      WHERE category_id IS NOT NULL AND type IN ('income', 'expense') AND status != 'cancelled'
      GROUP BY month_key
      ORDER BY month_key ASC
    `).all();

    const totals = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN category_id IS NULL AND type IN ('income', 'expense') AND status != 'cancelled' THEN 1 ELSE 0 END) as uncategorized,
        MIN(transaction_date) as first_date,
        MAX(transaction_date) as last_date
      FROM transactions
    `).get();

    // Movimentos da reserva (aportes)
    let reserveMovements = [];
    let reserveStatus = null;
    try {
      reserveMovements = this.intelligence.getReserveMovements().filter(m => m.countsInBalance || m.source === 'transfer');
      reserveStatus = this.intelligence.getReserveStatus(currentMonth, 0, 1);
    } catch (e) {
      reserveMovements = [];
    }

    // Meses fechados no azul (resultado do dia a dia, sem contar aportes/resgates)
    const positiveMonths = [];
    if (totals.first_date) {
      let key = totals.first_date.slice(0, 7);
      while (key < currentMonth) {
        const income = this.intelligence.getMonthIncomeTotal(key).total;
        const expense = this.intelligence.getMonthExpenseTotal(key).total;
        const inMonth = reserveMovements.filter(m => m.date.slice(0, 7) === key && m.source !== 'transfer');
        const aportes = inMonth.filter(m => m.kind === 'aporte').reduce((s, m) => s + Math.abs(m.amount), 0);
        const resgates = inMonth.filter(m => m.kind === 'resgate').reduce((s, m) => s + Math.abs(m.amount), 0);
        const result = income - resgates - (expense - aportes);
        if (income > 0 && result >= 0) positiveMonths.push({ monthKey: key, result });
        key = addMonthsToKey(key, 1);
      }
    }

    // Tetos de orçamento cumpridos em meses fechados
    const budgetsKept = [];
    const budgets = this.db.prepare(`
      SELECT b.id, b.category_id, b.amount_limit, b.created_at, c.name as category_name
      FROM category_budgets b LEFT JOIN categories c ON c.id = b.category_id
    `).all();
    for (const b of budgets) {
      let key = (b.created_at || today).slice(0, 7);
      while (key < currentMonth) {
        const spent = this.db.prepare(`
          SELECT COALESCE(SUM(amount), 0) as total FROM transactions
          WHERE category_id = ? AND type = 'expense' AND status != 'cancelled'
            AND (
              (credit_card_id IS NULL AND transaction_date >= ? AND transaction_date <= ?)
              OR (credit_card_id IS NOT NULL AND invoice_month = ?)
            )
        `).get(b.category_id, `${key}-01`, `${key}-31`, key).total;
        const hadActivity = this.db.prepare(`
          SELECT 1 FROM transactions WHERE transaction_date >= ? AND transaction_date <= ? LIMIT 1
        `).get(`${key}-01`, `${key}-31`);
        if (hadActivity && spent <= b.amount_limit) {
          budgetsKept.push({ budgetId: b.id, monthKey: key, categoryName: b.category_name || 'Categoria' });
        }
        key = addMonthsToKey(key, 1);
      }
    }

    // Faturas pagas até o vencimento
    const invoicesOnTime = this.db.prepare(`
      SELECT t.id, t.transaction_date, t.invoice_month, c.due_day, c.name as card_name
      FROM transactions t
      JOIN credit_cards c ON c.id = t.credit_card_id
      WHERE t.type = 'card_payment' AND t.status = 'completed' AND t.invoice_month IS NOT NULL
    `).all().filter(p => {
      const [y, m] = p.invoice_month.split('-').map(Number);
      const maxDay = new Date(y, m, 0).getDate();
      const due = `${p.invoice_month}-${String(Math.min(p.due_day, maxDay)).padStart(2, '0')}`;
      return p.transaction_date <= due;
    });

    let recurringCount = 0;
    try {
      recurringCount = this.intelligence.detectRecurringPatterns('expense').length;
    } catch (e) {
      recurringCount = 0;
    }

    // Hábitos
    let habitCheckins = 0;
    let habitBestStreak = 0;
    let activeHabitsCount = 0;
    let habitCheckinsByDay = [];
    try {
      const checkinRow = this.db.prepare(`SELECT COUNT(*) as c FROM habit_logs WHERE completed = 1`).get();
      habitCheckins = checkinRow ? checkinRow.c : 0;

      const habitsRow = this.db.prepare(`SELECT COUNT(*) as c FROM habits WHERE archived = 0`).get();
      activeHabitsCount = habitsRow ? habitsRow.c : 0;

      habitCheckinsByDay = this.db.prepare(`
        SELECT date, COUNT(*) as c
        FROM habit_logs
        WHERE completed = 1
        GROUP BY date
        ORDER BY date ASC
      `).all();

      const habitDates = habitCheckinsByDay.map(r => r.date);
      let curStreak = 0;
      let maxStreak = 0;
      let prevDate = null;
      for (const d of habitDates) {
        if (!prevDate) {
          curStreak = 1;
        } else {
          const p = parseDate(prevDate);
          p.setDate(p.getDate() + 1);
          if (formatDate(p) === d) {
            curStreak++;
          } else {
            curStreak = 1;
          }
        }
        if (curStreak > maxStreak) maxStreak = curStreak;
        prevDate = d;
      }
      habitBestStreak = maxStreak;
    } catch (e) {
      habitCheckins = 0;
      habitBestStreak = 0;
      activeHabitsCount = 0;
      habitCheckinsByDay = [];
    }

    // Metas
    let goalsCount = 0;
    let goalsCompleted = 0;
    try {
      const gRows = this.db.prepare(`SELECT target_amount, current_amount FROM goals`).all();
      goalsCount = gRows.length;
      goalsCompleted = gRows.filter(g => g.current_amount >= g.target_amount && g.target_amount > 0).length;
    } catch (e) {
      goalsCount = 0;
      goalsCompleted = 0;
    }

    // Ferramentas (Anotações, Mapas Mentais e Cofre de Senhas) + Contas
    let notesCount = 0;
    let pinnedNotesCount = 0;
    let mindmapsCount = 0;
    let maxMindmapNodes = 0;
    let vaultItemsCount = 0;
    let accountsCount = 0;
    try {
      const nRows = this.db.prepare(`SELECT pinned FROM notes`).all();
      notesCount = nRows.length;
      pinnedNotesCount = nRows.filter(n => n.pinned).length;
    } catch (e) {}
    try {
      const mRows = this.db.prepare(`SELECT nodes_json FROM mindmaps`).all();
      mindmapsCount = mRows.length;
      for (const m of mRows) {
        try {
          const parsed = JSON.parse(m.nodes_json || '[]');
          if (Array.isArray(parsed) && parsed.length > maxMindmapNodes) {
            maxMindmapNodes = parsed.length;
          }
        } catch {}
      }
    } catch (e) {}
    try {
      const vRow = this.db.prepare(`SELECT COUNT(*) as c FROM password_vault`).get();
      vaultItemsCount = vRow ? vRow.c : 0;
    } catch (e) {}
    try {
      const aRow = this.db.prepare(`SELECT COUNT(*) as c FROM accounts WHERE archived = 0`).get();
      accountsCount = aRow ? aRow.c : 0;
    } catch (e) {}

    const perfectHabitDaysCount =
      activeHabitsCount > 0
        ? (habitCheckinsByDay || []).filter(d => d.c >= activeHabitsCount).length
        : 0;

    const pillarsActiveCount =
      (accountsCount > 0 || (totals.total || 0) > 0 ? 1 : 0) +
      (activeHabitsCount > 0 ? 1 : 0) +
      (notesCount > 0 || mindmapsCount > 0 ? 1 : 0) +
      (vaultItemsCount > 0 ? 1 : 0);

    // Rastreamento de Tempo & Foco Cósmico
    let focusSecondsTotal = 0;
    let focusFreelaSeconds = 0;
    let focusPersonalSeconds = 0;
    let focusSessionsTotal = 0;
    let focusByDay = [];
    try {
      const timeRow = this.db
        .prepare(
          `SELECT 
            COALESCE(SUM(duration_seconds), 0) as total_seconds,
            COALESCE(SUM(CASE WHEN work_type = 'Profissional - Freela' THEN duration_seconds ELSE 0 END), 0) as freela_seconds,
            COALESCE(SUM(CASE WHEN work_type = 'Projeto Pessoal' THEN duration_seconds ELSE 0 END), 0) as personal_seconds,
            COUNT(*) as session_count
          FROM time_entries`
        )
        .get();
      if (timeRow) {
        focusSecondsTotal = timeRow.total_seconds || 0;
        focusFreelaSeconds = timeRow.freela_seconds || 0;
        focusPersonalSeconds = timeRow.personal_seconds || 0;
        focusSessionsTotal = timeRow.session_count || 0;
      }

      focusByDay = this.db
        .prepare(
          `SELECT 
            strftime('%Y-%m-%d', started_at / 1000, 'unixepoch', 'localtime') as day_date,
            SUM(duration_seconds) as day_seconds,
            COUNT(*) as session_count
          FROM time_entries
          GROUP BY day_date
          ORDER BY day_date ASC`
        )
        .all()
        .filter((r) => r.day_date);
    } catch (e) {
      focusSecondsTotal = 0;
      focusFreelaSeconds = 0;
      focusPersonalSeconds = 0;
      focusSessionsTotal = 0;
      focusByDay = [];
    }

    return {
      today,
      currentMonth,
      statements,
      categorizedByMonth,
      categorizedCount: categorizedByMonth.reduce((s, r) => s + r.c, 0),
      transactionCount: totals.total || 0,
      uncategorizedCount: totals.uncategorized || 0,
      lastTransactionDate: totals.last_date,
      firstTransactionDate: totals.first_date,
      reserveAportes: reserveMovements.filter(m => m.kind === 'aporte'),
      reserveStatus,
      positiveMonths,
      budgetsKept,
      invoicesOnTime,
      recurringCount,
      habitCheckins,
      habitBestStreak,
      activeHabitsCount,
      habitCheckinsByDay,
      goalsCount,
      goalsCompleted,
      notesCount,
      pinnedNotesCount,
      mindmapsCount,
      maxMindmapNodes,
      vaultItemsCount,
      accountsCount,
      perfectHabitDaysCount,
      pillarsActiveCount,
      focusSecondsTotal,
      focusFreelaSeconds,
      focusPersonalSeconds,
      focusSessionsTotal,
      focusByDay,
    };
  }

  // ==========================================
  // Sequências
  // ==========================================
  computeStreaks(facts) {
    const thisWeek = weekStart(facts.today);
    const lastWeek = addDays(thisWeek, -7);
    const importWeeks = [...new Set(facts.statements.map(s => weekStart(s.imported_at.slice(0, 10))))].sort();
    const weekSet = new Set(importWeeks);

    let importCurrent = 0;
    let cursor = weekSet.has(thisWeek) ? thisWeek : lastWeek;
    while (weekSet.has(cursor)) {
      importCurrent++;
      cursor = addDays(cursor, -7);
    }

    const positiveKeys = facts.positiveMonths.map(m => m.monthKey).sort();
    const positiveSet = new Set(positiveKeys);
    let positiveCurrent = 0;
    let monthCursor = addMonthsToKey(facts.currentMonth, -1);
    while (positiveSet.has(monthCursor)) {
      positiveCurrent++;
      monthCursor = addMonthsToKey(monthCursor, -1);
    }

    return {
      importWeeks: {
        current: importCurrent,
        best: Math.max(importCurrent, longestRun(importWeeks, k => addDays(k, 7))),
        atRisk: importCurrent > 0 && !weekSet.has(thisWeek),
      },
      positiveMonths: {
        current: positiveCurrent,
        best: Math.max(positiveCurrent, longestRun(positiveKeys, k => addMonthsToKey(k, 1))),
        atRisk: false,
      },
    };
  }

  // ==========================================
  // Missões semanais
  // ==========================================
  generateMissions(weekKey, facts) {
    const missions = [];
    const before = weekKey;
    const windowStart = addDays(weekKey, -56);

    // 1. Teto de gasto na categoria variável que mais pesa nas últimas 8 semanas
    const reserveCategoryIds = new Set((facts.reserveStatus?.categories || []).filter(c => c.isReserve).map(c => c.id));
    const candidates = this.db.prepare(`
      SELECT t.category_id as id, c.name, SUM(t.amount) as total
      FROM transactions t JOIN categories c ON c.id = t.category_id
      WHERE t.type = 'expense' AND t.status != 'cancelled'
        AND t.transaction_date >= ? AND t.transaction_date < ?
      GROUP BY t.category_id
      ORDER BY total DESC
    `).all(windowStart, before).filter(c => !reserveCategoryIds.has(c.id));
    const weeksWithData = Math.max(1, Math.min(8, Math.ceil(
      (parseDate(before) - parseDate(facts.firstTransactionDate && facts.firstTransactionDate > windowStart ? facts.firstTransactionDate : windowStart)) / (7 * 86400000)
    )));
    const top = candidates.find(c => c.total / weeksWithData >= 3000);
    if (top) {
      const avgWeekly = top.total / weeksWithData;
      const target = Math.max(1000, Math.round((avgWeekly * 0.9) / 500) * 500);
      missions.push({
        id: 'spend_cap',
        title: `Gaste até ${formatBRL(target)} com ${top.name}`,
        description: `10% abaixo da sua média semanal (${formatBRL(Math.round(avgWeekly))}).`,
        xp: 150,
        categoryId: top.id,
        target,
      });
    }

    // 2. Organização: zerar lançamentos sem categoria ou importar extrato
    if (facts.uncategorizedCount > 0) {
      missions.push({
        id: 'categorize_all',
        title: 'Zere os lançamentos sem categoria',
        description: `${facts.uncategorizedCount} aguardando categoria. Cada um ensina a inteligência do Pigo.`,
        xp: 100,
        target: 0,
      });
    } else {
      missions.push({
        id: 'import_statement',
        title: 'Importe um extrato nesta semana',
        description: 'Manter os dados em dia deixa previsões e missões mais precisas.',
        xp: 100,
        target: 1,
      });
    }

    // 3. Reserva ou dias sem gastos
    if (facts.reserveStatus && facts.reserveStatus.status !== 'complete') {
      missions.push({
        id: 'reserve_aporte',
        title: 'Faça um aporte na reserva',
        description: facts.reserveStatus.suggestedContribution > 0
          ? `Sugestão do fechamento: ${formatBRL(facts.reserveStatus.suggestedContribution)}.`
          : 'Qualquer valor conta: o importante é o hábito.',
        xp: 150,
        target: 1,
      });
    } else if (facts.focusSessionsTotal > 0) {
      missions.push({
        id: 'focus_weekly_goal',
        title: 'Hiperfoco Semanal: 8h no Rastreador',
        description: 'Acumule 8 horas de trabalho focado e imersivo nesta semana.',
        xp: 120,
        target: 8 * 3600,
      });
    } else {
      missions.push({
        id: 'zero_spend_days',
        title: 'Tenha 2 dias sem nenhum gasto',
        description: 'Dias "no-spend" ajudam a quebrar o consumo automático.',
        xp: 120,
        target: 2,
      });
    }

    return missions.slice(0, 3);
  }

  getWeeklyMissions(weekKey, facts, { create = true } = {}) {
    const rows = this.db.prepare(`SELECT * FROM game_weekly_missions WHERE week_key = ?`).all(weekKey);
    if (rows.length > 0 || !create) {
      return rows
        .map(r => ({ ...JSON.parse(r.definition), completedAt: r.completed_at }))
        .sort((x, y) => (x.position ?? 0) - (y.position ?? 0));
    }
    const generated = this.generateMissions(weekKey, facts).map((m, position) => ({ ...m, position }));
    const insert = this.db.prepare(`
      INSERT OR IGNORE INTO game_weekly_missions (week_key, mission_id, definition, created_at) VALUES (?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    for (const m of generated) insert.run(weekKey, m.id, JSON.stringify(m), now);
    return generated.map(m => ({ ...m, completedAt: null }));
  }

  // Avalia o progresso de uma missão; persiste a conclusão quando acontece
  evaluateMission(weekKey, mission, facts) {
    const weekEnd = addDays(weekKey, 6);
    const weekOver = facts.today > weekEnd;
    const dataCoversWeek = Boolean(facts.lastTransactionDate && facts.lastTransactionDate >= weekEnd);
    let progress = 0;
    let status = 'in_progress';
    let progressLabel = '';

    if (mission.completedAt) {
      return { ...mission, weekKey, status: 'completed', progress: 100, progressLabel: 'Concluída' };
    }

    if (mission.id === 'spend_cap') {
      const spent = this.db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total FROM transactions
        WHERE category_id = ? AND type = 'expense' AND status != 'cancelled'
          AND transaction_date >= ? AND transaction_date <= ?
      `).get(mission.categoryId, weekKey, weekEnd).total;
      progress = Math.min(100, Math.round((spent / mission.target) * 100));
      progressLabel = `${formatBRL(spent)} de ${formatBRL(mission.target)}`;
      if (spent > mission.target) status = 'failed';
      else if (weekOver && dataCoversWeek) status = 'completed';
      else if (weekOver) status = 'awaiting_data';
    } else if (mission.id === 'categorize_all') {
      progressLabel = `${facts.uncategorizedCount} sem categoria`;
      if (facts.uncategorizedCount === 0 && !weekOver) status = 'completed';
      else if (weekOver) status = 'failed';
      progress = facts.uncategorizedCount === 0 ? 100 : 0;
    } else if (mission.id === 'import_statement') {
      const count = facts.statements.filter(s => {
        const d = s.imported_at.slice(0, 10);
        return d >= weekKey && d <= weekEnd;
      }).length;
      progress = Math.min(100, count * 100);
      progressLabel = `${count} de 1 extrato`;
      status = count >= 1 ? 'completed' : weekOver ? 'failed' : 'in_progress';
    } else if (mission.id === 'reserve_aporte') {
      const count = facts.reserveAportes.filter(m => m.date >= weekKey && m.date <= weekEnd).length;
      progress = Math.min(100, count * 100);
      progressLabel = `${count} de 1 aporte`;
      if (count >= 1) status = 'completed';
      else if (weekOver && dataCoversWeek) status = 'failed';
      else if (weekOver) status = 'awaiting_data';
    } else if (mission.id === 'zero_spend_days') {
      const spendDays = new Set(this.db.prepare(`
        SELECT DISTINCT transaction_date as d FROM transactions
        WHERE type = 'expense' AND status != 'cancelled' AND transaction_date >= ? AND transaction_date <= ?
      `).all(weekKey, weekEnd).map(r => r.d));
      const elapsed = weekOver ? 7 : Math.max(0, Math.round((parseDate(facts.today) - parseDate(weekKey)) / 86400000));
      const zeroDays = Math.max(0, elapsed - spendDays.size);
      progress = Math.min(100, Math.round((zeroDays / mission.target) * 100));
      progressLabel = `${Math.min(zeroDays, mission.target)} de ${mission.target} dias`;
      if (weekOver && dataCoversWeek) status = zeroDays >= mission.target ? 'completed' : 'failed';
      else if (weekOver) status = 'awaiting_data';
    } else if (mission.id === 'focus_weekly_goal') {
      let secondsInWeek = 0;
      try {
        const startMs = parseDate(weekKey).getTime();
        const endMs = parseDate(weekEnd).getTime() + 86400000 - 1;
        const res = this.db
          .prepare(
            `SELECT COALESCE(SUM(duration_seconds), 0) as sec
             FROM time_entries
             WHERE started_at >= ? AND started_at <= ?`
          )
          .get(startMs, endMs);
        secondsInWeek = res?.sec || 0;
      } catch (e) {
        secondsInWeek = 0;
      }
      progress = Math.min(100, Math.round((secondsInWeek / mission.target) * 100));
      const hoursInWeek = (secondsInWeek / 3600).toFixed(1);
      const targetHours = (mission.target / 3600).toFixed(0);
      progressLabel = `${hoursInWeek}h de ${targetHours}h`;
      if (secondsInWeek >= mission.target) status = 'completed';
      else if (weekOver) status = 'failed';
    }

    if (status === 'completed') {
      const completedAt = weekOver ? weekEnd : facts.today;
      this.db.prepare(`
        UPDATE game_weekly_missions SET completed_at = ? WHERE week_key = ? AND mission_id = ? AND completed_at IS NULL
      `).run(completedAt, weekKey, mission.id);
      return { ...mission, weekKey, completedAt, status, progress: 100, progressLabel };
    }
    return { ...mission, weekKey, status, progress, progressLabel };
  }

  // Missões de semanas anteriores ainda em aberto são reavaliadas (ex.: extrato chegou depois)
  evaluateAllMissions(facts) {
    const currentWeek = weekStart(facts.today);
    const current = this.getWeeklyMissions(currentWeek, facts).map(m => this.evaluateMission(currentWeek, m, facts));
    const pastWeeks = this.db.prepare(`
      SELECT DISTINCT week_key FROM game_weekly_missions WHERE week_key < ? ORDER BY week_key DESC
    `).all(currentWeek).map(r => r.week_key);
    const past = [];
    for (const wk of pastWeeks) {
      for (const m of this.getWeeklyMissions(wk, facts, { create: false })) {
        past.push(this.evaluateMission(wk, m, facts));
      }
    }
    return { current, past, weekEnd: addDays(currentWeek, 6) };
  }

  // ==========================================
  // Conquistas
  // ==========================================
    getAchievementDefinitions() {
    return ACHIEVEMENTS;
  }

  computeAchievements(facts, streaks, missionsCompleted) {
    const metrics = {
      statements: facts.statements.length,
      categorized: facts.categorizedCount,
      inboxZero20: facts.transactionCount >= 20 && facts.uncategorizedCount === 0 ? 1 : 0,
      inboxZero: facts.transactionCount >= 50 && facts.uncategorizedCount === 0 ? 1 : 0,
      inboxZero100: facts.transactionCount >= 100 && facts.uncategorizedCount === 0 ? 1 : 0,
      inboxZero250: facts.transactionCount >= 250 && facts.uncategorizedCount === 0 ? 1 : 0,
      positiveMonths: facts.positiveMonths.length,
      positiveStreak: streaks.positiveMonths.best,
      reserveAportes: facts.reserveAportes.length,
      reserveCoverage: facts.reserveStatus ? facts.reserveStatus.coverageMonths : 0,
      reserveComplete: facts.reserveStatus && facts.reserveStatus.status === 'complete' ? 1 : 0,
      importStreak: streaks.importWeeks.best,
      invoicesOnTime: facts.invoicesOnTime.length,
      budgetsKept: facts.budgetsKept.length,
      missionsCompleted,
      recurringDetected: facts.recurringCount,
      activeHabits: facts.activeHabitsCount,
      habitCheckins: facts.habitCheckins,
      habitStreak: facts.habitBestStreak,
      goalsCount: facts.goalsCount,
      goalsCompleted: facts.goalsCompleted,
      perfectHabitDays: facts.perfectHabitDaysCount || 0,
      notesCount: facts.notesCount || 0,
      pinnedNotesCount: facts.pinnedNotesCount || 0,
      mindmapsCount: facts.mindmapsCount || 0,
      maxMindmapNodes: facts.maxMindmapNodes || 0,
      vaultItemsCount: facts.vaultItemsCount || 0,
      accountsCount: facts.accountsCount || 0,
      pillarsActiveCount: facts.pillarsActiveCount || 0,
      focusSessions: facts.focusSessionsTotal || 0,
      focusHours: Math.floor((facts.focusSecondsTotal || 0) / 3600),
      focusFreelaHours: Math.floor((facts.focusFreelaSeconds || 0) / 3600),
      focusPersonalHours: Math.floor((facts.focusPersonalSeconds || 0) / 3600),
    };
    const seen = new Map(this.db.prepare(`SELECT key, seen_at FROM game_seen WHERE key LIKE 'ach:%'`).all().map(r => [r.key, r.seen_at]));

    return this.getAchievementDefinitions().map(def => {
      const current = metrics[def.metric] || 0;
      const unlocked = current >= def.target;
      return {
        ...def,
        xp: RARITY_XP[def.rarity],
        current: Math.min(current, def.target),
        progress: Math.min(100, Math.round((current / def.target) * 100)),
        unlocked,
        unlockedAt: unlocked ? (seen.get(`ach:${def.id}`) || facts.today).slice(0, 10) : null,
      };
    });
  }

  // ==========================================
  // Visão geral (XP, nível, eventos)
  // ==========================================
  getOverview() {
    const facts = this.collectFacts();
    const streaks = this.computeStreaks(facts);
    const missions = this.evaluateAllMissions(facts);
    const allMissions = [...missions.current, ...missions.past];
    const completedMissions = allMissions.filter(m => m.status === 'completed');
    const achievements = this.computeAchievements(facts, streaks, completedMissions.length);

    const events = [];
    for (const s of facts.statements) {
      events.push({ id: `stmt:${s.id}`, date: s.imported_at.slice(0, 10), xp: XP.statementImport, kind: 'import', title: `Extrato importado: ${s.original_name}` });
    }
    for (const row of facts.categorizedByMonth) {
      const date = row.month_key === facts.currentMonth ? facts.today : monthEnd(row.month_key);
      events.push({ id: `cat:${row.month_key}`, date, xp: row.c * XP.categorizedTransaction, kind: 'categorize', title: `${row.c} lançamentos categorizados em ${monthLabel(row.month_key)}` });
    }
    for (const m of facts.positiveMonths) {
      events.push({ id: `month:${m.monthKey}`, date: monthEnd(m.monthKey), xp: XP.positiveMonth, kind: 'month', title: `${monthLabel(m.monthKey)} fechou no azul (+${formatBRL(m.result)})` });
    }
    for (const a of facts.reserveAportes) {
      const bonus = Math.min(XP.reserveAporteMaxBonus, Math.floor(Math.abs(a.amount) / 2000));
      events.push({ id: `res:${a.id}`, date: a.date, xp: XP.reserveAporteBase + bonus, kind: 'reserve', title: `Aporte de ${formatBRL(Math.abs(a.amount))} na reserva` });
    }
    for (const b of facts.budgetsKept) {
      events.push({ id: `bud:${b.budgetId}:${b.monthKey}`, date: monthEnd(b.monthKey), xp: XP.budgetKept, kind: 'budget', title: `Teto de ${b.categoryName} cumprido em ${monthLabel(b.monthKey)}` });
    }
    for (const p of facts.invoicesOnTime) {
      events.push({ id: `inv:${p.id}`, date: p.transaction_date, xp: XP.invoiceOnTime, kind: 'invoice', title: `Fatura ${p.card_name} paga em dia` });
    }
    for (const m of completedMissions) {
      events.push({ id: `mis:${m.weekKey}:${m.id}`, date: m.completedAt || facts.today, xp: m.xp, kind: 'mission', title: `Missão concluída: ${m.title}` });
    }
        for (const hDay of (facts.habitCheckinsByDay || [])) {
      events.push({
        id: `hab:${hDay.date}`,
        date: hDay.date,
        xp: hDay.c * XP.habitCheckin,
        kind: 'habit',
        title: `${hDay.c} ${hDay.c === 1 ? 'hábito concluído' : 'hábitos concluídos'} no dia`,
      });
      if (facts.activeHabitsCount > 0 && hDay.c >= facts.activeHabitsCount) {
        events.push({
          id: `hab_perfect:${hDay.date}`,
          date: hDay.date,
          xp: XP.perfectHabitDay,
          kind: 'habit',
          title: 'Dia Perfeito: 100% dos hábitos concluídos!',
        });
      }
    }
    for (const fDay of facts.focusByDay || []) {
      const hours = Math.floor(fDay.day_seconds / 3600);
      const sessions = fDay.session_count || 1;
      const dayXp = hours * XP.focusHour + sessions * XP.focusSession;
      if (dayXp > 0) {
        events.push({
          id: `focus:${fDay.day_date}`,
          date: fDay.day_date,
          xp: dayXp,
          kind: 'focus',
          title: `${hours > 0 ? `${hours}h de foco` : `${sessions} sessões`} no Rastreador de Tempo`,
        });
      }
    }
    for (const a of achievements.filter(x => x.unlocked)) {
      events.push({ id: `ach:${a.id}`, date: a.unlockedAt, xp: a.xp, kind: 'achievement', title: `Conquista: ${a.name}` });
    }
    events.sort((a, b) => b.date.localeCompare(a.date) || b.xp - a.xp);

    const totalXp = events.reduce((s, e) => s + e.xp, 0);
    const levelInfo = levelFromXp(totalXp);
    const xpByKind = {};
    for (const e of events) xpByKind[e.kind] = (xpByKind[e.kind] || 0) + e.xp;
    const nextTitle = LEVEL_TITLES.find(t => t.from > levelInfo.level) || null;

    return {
      totalXp,
      level: levelInfo.level,
      title: titleForLevel(levelInfo.level),
      xpIntoLevel: levelInfo.xpIntoLevel,
      xpForNext: levelInfo.xpForNext,
      progressPercent: Math.round((levelInfo.xpIntoLevel / levelInfo.xpForNext) * 100),
      nextTitle: nextTitle ? { title: nextTitle.title, level: nextTitle.from } : null,
      streaks,
      missions: { current: missions.current, weekEnd: missions.weekEnd, completedTotal: completedMissions.length },
      achievements,
      events: events.slice(0, 60),
      xpByKind,
      xpThisWeek: events.filter(e => e.date >= weekStart(facts.today)).reduce((s, e) => s + e.xp, 0),
    };
  }

  // ==========================================
  // Reino do Pigo: os dados financeiros traduzidos em elementos da vila
  // ==========================================
  getWorldState() {
    const facts = this.collectFacts();
    const today = facts.today;
    const overview = this.getOverview();

    // Prédios = contas ativas
    const accounts = this.db.prepare(`SELECT id, name, type, color FROM accounts WHERE active = 1 ORDER BY name ASC`).all()
      .map(a => ({ ...a, balance: this.intelligence.getAccountBalanceAt(a.id, today) }));
    const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

    // Muralhas = reserva (camadas = meses de custo de vida cobertos)
    const reserve = facts.reserveStatus;

    // Dragão = faturas de cartão em aberto
    const cards = this.db.prepare(`SELECT id, name, credit_limit FROM credit_cards WHERE active = 1`).all();
    const cardDebt = cards.length === 0 ? 0 : this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM transactions
      WHERE credit_card_id IS NOT NULL AND type = 'expense' AND status NOT IN ('cancelled', 'paid')
    `).get().total;
    const totalLimit = cards.reduce((s, c) => s + c.credit_limit, 0);
    const longInstallments = this.db.prepare(`
      SELECT COUNT(DISTINCT installment_id) as c FROM transactions
      WHERE credit_card_id IS NOT NULL AND installment_id IS NOT NULL AND status NOT IN ('cancelled', 'paid')
        AND invoice_month > ?
    `).get(facts.currentMonth).c;

    // Construções = metas
    const goals = this.db.prepare(`SELECT id, name, color, target_amount, current_amount FROM goals ORDER BY created_at ASC`).all()
      .map(g => ({
        id: g.id,
        name: g.name,
        color: g.color,
        progress: g.target_amount > 0 ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) : 0,
        currentAmount: g.current_amount,
        targetAmount: g.target_amount,
      }));

    // Goblins = assinaturas/recorrências ativas detectadas nos extratos
    let subscriptions = [];
    try {
      subscriptions = this.intelligence.detectRecurringPatterns('expense')
        .filter(p => p.isActive)
        .map(p => ({ name: p.cleanDescription, amount: p.averageAmount, frequency: p.suggestedFrequency }));
    } catch (e) {
      subscriptions = [];
    }

    // Clima = saúde financeira + resultado do último mês fechado
    let healthScore = 50;
    try {
      healthScore = this.intelligence.getFinancialHealthScore().score;
    } catch (e) {}
    const lastMonthKey = addMonthsToKey(facts.currentMonth, -1);
    const lastMonthPositive = facts.positiveMonths.some(m => m.monthKey === lastMonthKey);
    const lastMonthHadData = Boolean(this.db.prepare(`
      SELECT 1 FROM transactions WHERE transaction_date >= ? AND transaction_date <= ? LIMIT 1
    `).get(`${lastMonthKey}-01`, `${lastMonthKey}-31`));
    let weather = 'cloudy';
    if (lastMonthHadData && !lastMonthPositive && healthScore < 60) weather = 'rain';
    else if (healthScore >= 70 || lastMonthPositive) weather = 'sunny';

    // Caravana = extrato importado nos últimos 7 dias
    const lastImport = facts.statements.length > 0 ? facts.statements[facts.statements.length - 1].imported_at : null;
    const caravanArrived = Boolean(lastImport && lastImport.slice(0, 10) >= addDays(today, -7));

    return {
      level: overview.level,
      title: overview.title,
      totalXp: overview.totalXp,
      progressPercent: overview.progressPercent,
      healthScore,
      weather,
      festival: lastMonthPositive,
      lastMonthKey,
      treasury: { totalBalance },
      buildings: accounts,
      walls: reserve ? {
        layers: Math.max(0, Math.floor(reserve.coverageMonths)),
        coverageMonths: reserve.coverageMonths,
        targetMonths: reserve.targetMonths,
        balance: reserve.balance,
        status: reserve.status,
      } : { layers: 0, coverageMonths: 0, targetMonths: 6, balance: 0, status: 'not_configured' },
      dragon: {
        present: cardDebt > 0,
        debt: cardDebt,
        totalLimit,
        utilization: totalLimit > 0 ? Math.round((cardDebt / totalLimit) * 100) : 0,
        chains: longInstallments,
        cardsCount: cards.length,
      },
      warehouse: { uncategorized: facts.uncategorizedCount, categorized: facts.categorizedCount },
      constructions: goals,
      goblins: subscriptions,
      caravan: { arrived: caravanArrived, lastImportAt: lastImport },
      streaks: overview.streaks,
      missions: overview.missions.current,
    };
  }

  // Novidades desde a última vez (para comemorar); na primeira execução só registra
  getNewUnlocks() {
    const overview = this.getOverview();
    const seenKeys = new Set(this.db.prepare(`SELECT key FROM game_seen`).all().map(r => r.key));
    const firstRun = seenKeys.size === 0;
    const now = new Date().toISOString();
    const markSeen = this.db.prepare(`INSERT OR IGNORE INTO game_seen (key, seen_at) VALUES (?, ?)`);

    const fresh = [];
    for (const a of overview.achievements.filter(x => x.unlocked)) {
      const key = `ach:${a.id}`;
      if (!seenKeys.has(key)) {
        markSeen.run(key, now);
        if (!firstRun) fresh.push({ type: 'achievement', id: a.id, name: a.name, rarity: a.rarity, xp: a.xp, icon: a.icon });
      }
    }
    const levelKey = `level:${overview.level}`;
    if (!seenKeys.has(levelKey)) {
      markSeen.run(levelKey, now);
      if (!firstRun) fresh.push({ type: 'level', level: overview.level, title: overview.title });
    }

    return {
      firstRun,
      unlocks: fresh,
      summary: { level: overview.level, title: overview.title, totalXp: overview.totalXp, achievements: overview.achievements.filter(a => a.unlocked).length },
    };
  }
}

module.exports = {
  GamificationEngine,
  levelFromXp,
  titleForLevel,
  weekStart,
  XP,
  RARITY_XP,
};
