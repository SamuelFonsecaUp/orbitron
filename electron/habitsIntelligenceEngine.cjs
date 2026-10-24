/**
 * HabitsIntelligenceEngine - Motor Local de Inteligência e Análise Comportamental
 * 
 * 100% Offline & Local. Analisa dados históricos de conclusão de hábitos utilizando:
 * - Janelas móveis de aderência (7, 14, 30 e 90 dias) e tendência de momento.
 * - Detecção de risco de quebra de sequência (Streak Drop-off Risk).
 * - Análise de probabilidade condicional para Efeito Dominó (Habit Stacking).
 * - Perfil semanal de produtividade (Melhores e piores dias).
 * - Recomendações determinísticas baseadas em Ciência do Hábito (Atomic Habits).
 */

class HabitsIntelligenceEngine {
  constructor(db) {
    this.db = db;
  }

  // Gera data local YYYY-MM-DD
  formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  getIntelligence() {
    const now = new Date();
    const todayStr = this.formatDate(now);

    // 1. Carrega hábitos ativos
    const habits = this.db.prepare('SELECT * FROM habits WHERE archived = 0 ORDER BY created_at ASC').all();
    if (!habits.length) {
      return this.getEmptyStateOverview();
    }

    // 2. Carrega logs dos últimos 90 dias
    const past90 = new Date(now);
    past90.setDate(now.getDate() - 90);
    const past90Str = this.formatDate(past90);

    const past30 = new Date(now);
    past30.setDate(now.getDate() - 30);
    const past30Str = this.formatDate(past30);

    const past7 = new Date(now);
    past7.setDate(now.getDate() - 7);
    const past7Str = this.formatDate(past7);

    const past14 = new Date(now);
    past14.setDate(now.getDate() - 14);
    const past14Str = this.formatDate(past14);

    const allLogs = this.db.prepare(`
      SELECT habit_id, date, completed, value 
      FROM habit_logs 
      WHERE date >= ? AND completed = 1
    `).all(past90Str);

    const logsByHabit = {};
    const logsByDate = {};

    for (const log of allLogs) {
      if (!logsByHabit[log.habit_id]) logsByHabit[log.habit_id] = new Set();
      logsByHabit[log.habit_id].add(log.date);

      if (!logsByDate[log.date]) logsByDate[log.date] = new Set();
      logsByDate[log.date].add(log.habit_id);
    }

    // 3. Taxas de conclusão nas janelas móveis
    const totalHabits = habits.length;
    let checkIns7 = 0;
    let expected7 = totalHabits * 7;

    let checkIns14 = 0;
    let expected14 = totalHabits * 14;

    let checkIns30 = 0;
    let expected30 = totalHabits * 30;

    for (const h of habits) {
      const datesSet = logsByHabit[h.id] || new Set();
      for (const d of datesSet) {
        if (d >= past7Str && d <= todayStr) checkIns7++;
        if (d >= past14Str && d <= todayStr) checkIns14++;
        if (d >= past30Str && d <= todayStr) checkIns30++;
      }
    }

    const rate7Days = expected7 > 0 ? Math.min(100, Math.round((checkIns7 / expected7) * 100)) : 0;
    const rate14Days = expected14 > 0 ? Math.min(100, Math.round((checkIns14 / expected14) * 100)) : 0;
    const rate30Days = expected30 > 0 ? Math.min(100, Math.round((checkIns30 / expected30) * 100)) : 0;

    // 4. Momentum e Score de Consistência
    let momentum = 'stable';
    if (rate7Days >= rate30Days + 8) momentum = 'accelerating';
    else if (rate7Days <= rate30Days - 8) momentum = 'declining';

    const consistencyScore = Math.min(100, Math.max(0, Math.round(rate7Days * 0.5 + rate30Days * 0.3 + (momentum === 'accelerating' ? 20 : momentum === 'stable' ? 10 : 0))));

    // 5. Análise por Dia da Semana (Seg a Dom)
    const dayStats = [
      { dayIndex: 0, dayName: 'Domingo', shortName: 'Dom', completed: 0, total: 0 },
      { dayIndex: 1, dayName: 'Segunda-feira', shortName: 'Seg', completed: 0, total: 0 },
      { dayIndex: 2, dayName: 'Terça-feira', shortName: 'Ter', completed: 0, total: 0 },
      { dayIndex: 3, dayName: 'Quarta-feira', shortName: 'Qua', completed: 0, total: 0 },
      { dayIndex: 4, dayName: 'Quinta-feira', shortName: 'Qui', completed: 0, total: 0 },
      { dayIndex: 5, dayName: 'Sexta-feira', shortName: 'Sex', completed: 0, total: 0 },
      { dayIndex: 6, dayName: 'Sábado', shortName: 'Sáb', completed: 0, total: 0 },
    ];

    for (let i = 0; i < 30; i++) {
      const dt = new Date(now);
      dt.setDate(now.getDate() - i);
      const dStr = this.formatDate(dt);
      const dayOfWeek = dt.getDay();

      const doneCount = logsByDate[dStr] ? logsByDate[dStr].size : 0;
      dayStats[dayOfWeek].completed += doneCount;
      dayStats[dayOfWeek].total += totalHabits;
    }

    const daysOfWeek = dayStats.map((d) => ({
      ...d,
      rate: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
    }));

    const sortedDays = [...daysOfWeek].sort((a, b) => b.rate - a.rate);
    const bestDay = sortedDays[0]?.rate > 0 ? { name: sortedDays[0].dayName, rate: sortedDays[0].rate } : null;
    const weakestDay = sortedDays[sortedDays.length - 1]?.total > 0 ? { name: sortedDays[sortedDays.length - 1].dayName, rate: sortedDays[sortedDays.length - 1].rate } : null;

    // 6. Eficiência por Período do Dia
    const periodMap = {
      morning: { period: 'morning', label: 'Manhã', completed: 0, total: 0 },
      afternoon: { period: 'afternoon', label: 'Tarde', completed: 0, total: 0 },
      evening: { period: 'evening', label: 'Noite', completed: 0, total: 0 },
      anytime: { period: 'anytime', label: 'Qualquer hora', completed: 0, total: 0 },
    };

    for (const h of habits) {
      const p = h.period_of_day || 'anytime';
      if (periodMap[p]) {
        const datesSet = logsByHabit[h.id] || new Set();
        let c = 0;
        for (const d of datesSet) {
          if (d >= past14Str && d <= todayStr) c++;
        }
        periodMap[p].completed += c;
        periodMap[p].total += 14;
      }
    }

    const periods = Object.values(periodMap).map((p) => ({
      period: p.period,
      label: p.label,
      count: p.completed,
      rate: p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0,
    }));

    // 7. Efeito Dominó (Sinergia entre Hábitos)
    const synergies = this.calculateSynergies(habits, logsByDate);

    // 8. Geração de Insights Inteligentes Acionáveis
    const insights = this.generateActionableInsights({
      habits,
      logsByHabit,
      todayStr,
      rate7Days,
      rate30Days,
      momentum,
      bestDay,
      weakestDay,
      periods,
      synergies,
    });

    // 9. Resumo do Mês
    const currentMonthPrefix = todayStr.slice(0, 7);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthPrefix = this.formatDate(lastMonth).slice(0, 7);

    const monthCheckIns = this.db.prepare(`SELECT count(*) as count FROM habit_logs WHERE date LIKE ? AND completed = 1`).get(`${currentMonthPrefix}%`)?.count || 0;
    const prevMonthCheckIns = this.db.prepare(`SELECT count(*) as count FROM habit_logs WHERE date LIKE ? AND completed = 1`).get(`${lastMonthPrefix}%`)?.count || 0;

    const monthlyGrowthPercent = prevMonthCheckIns > 0 ? Math.round(((monthCheckIns - prevMonthCheckIns) / prevMonthCheckIns) * 100) : 0;

    return {
      consistencyScore,
      momentum,
      rate7Days,
      rate30Days,
      totalCheckInsMonth: monthCheckIns,
      monthlyGrowthPercent,
      bestDay,
      weakestDay,
      daysOfWeek,
      periods,
      synergies,
      insights,
    };
  }

  calculateSynergies(habits, logsByDate) {
    if (habits.length < 2) return [];

    const dateList = Object.keys(logsByDate);
    if (dateList.length < 5) return [];

    const synergies = [];
    const habitMap = {};
    for (const h of habits) habitMap[h.id] = h;

    for (let i = 0; i < habits.length; i++) {
      for (let j = 0; j < habits.length; j++) {
        if (i === j) continue;
        const hA = habits[i];
        const hB = habits[j];

        let daysA = 0;
        let daysBoth = 0;

        for (const date of dateList) {
          const setOnDate = logsByDate[date];
          if (setOnDate.has(hA.id)) {
            daysA++;
            if (setOnDate.has(hB.id)) {
              daysBoth++;
            }
          }
        }

        if (daysA >= 4) {
          const probBGivenA = Math.round((daysBoth / daysA) * 100);
          if (probBGivenA >= 70) {
            synergies.push({
              anchorHabitName: hA.name,
              boostedHabitName: hB.name,
              probability: probBGivenA,
              liftPercent: Math.round(probBGivenA - 50),
            });
          }
        }
      }
    }

    return synergies.slice(0, 3);
  }

  generateActionableInsights({
    habits,
    logsByHabit,
    todayStr,
    rate7Days,
    rate30Days,
    momentum,
    bestDay,
    weakestDay,
    periods,
    synergies,
  }) {
    const list = [];

    // A. Hábitos em risco de quebra de sequência hoje
    for (const h of habits) {
      const dates = logsByHabit[h.id] || new Set();
      const doneToday = dates.has(todayStr);

      if (!doneToday) {
        // Verifica se tem streak recente
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = this.formatDate(yesterday);
        if (dates.has(yStr)) {
          list.push({
            id: `risk_${h.id}`,
            type: 'risk',
            severity: 'warning',
            title: `Sequência em risco: ${h.name}`,
            description: `Você completou ontem e mantém uma sequência ativa. Marque hoje para não quebrar seu ritmo!`,
            actionableTip: `Use a regra dos 2 minutos: faça uma versão simplificada agora para manter a identidade do hábito.`,
            habitId: h.id,
            badge: '⚡ Ação Imediata',
          });
        }
      }
    }

    // B. Padrão de Melhor Dia e Dia Vulnerável
    if (bestDay && weakestDay && bestDay.name !== weakestDay.name && bestDay.rate >= 60 && weakestDay.rate <= 40) {
      list.push({
        id: 'pattern_weekday',
        type: 'pattern',
        severity: 'info',
        title: `Padrão semanal: ${bestDay.name} é o seu pico de foco`,
        description: `Sua taxa de conclusão atinge ${bestDay.rate}% às ${bestDay.name}s, mas cai para ${weakestDay.rate}% aos ${weakestDay.name}s.`,
        actionableTip: `Aos ${weakestDay.name}s, reduza o atrito: planeje o ambiente com antecedência ou defina lembretes matinais.`,
        badge: '📅 Análise Semanal',
      });
    }

    // C. Efeito Dominó (Habit Stacking)
    if (synergies.length > 0) {
      const syn = synergies[0];
      list.push({
        id: 'synergy_domino',
        type: 'synergy',
        severity: 'success',
        title: `Efeito Dominó: ${syn.anchorHabitName} potencializa seus resultados`,
        description: `Nos dias em que você cumpre "${syn.anchorHabitName}", a taxa de sucesso de "${syn.boostedHabitName}" atinge ${syn.probability}%.`,
        actionableTip: `Empilhe os dois hábitos: "Imediatamente após concluir ${syn.anchorHabitName}, eu farei ${syn.boostedHabitName}".`,
        badge: '🔗 Sinergia Atômica',
      });
    }

    // D. Análise por Período
    const morning = periods.find((p) => p.period === 'morning');
    const evening = periods.find((p) => p.period === 'evening');
    if (morning && evening && morning.rate > evening.rate + 20 && morning.count > 0) {
      list.push({
        id: 'period_morning_advantage',
        type: 'pattern',
        severity: 'info',
        title: 'Manhãs de alta retenção',
        description: `Seus hábitos matinais têm ${morning.rate}% de sucesso vs ${evening.rate}% no período da noite. O cansaço mental afeta suas noites.`,
        actionableTip: `Se puder, transfira um hábito crítico da noite para o período da manhã para garantir execução.`,
        badge: '🌅 Foco Matinal',
      });
    }

    // E. Tendência Geral
    if (momentum === 'accelerating') {
      list.push({
        id: 'momentum_accel',
        type: 'achievement',
        severity: 'success',
        title: 'Rotina em aceleração positiva!',
        description: `Sua consistência nos últimos 7 dias (${rate7Days}%) superou sua média mensal (${rate30Days}%). Você está construindo tração sólida.`,
        actionableTip: `Mantenha a consistência sem adicionar novos hábitos pesados por mais 7 dias para consolidar.`,
        badge: '🚀 Tendência em Alta',
      });
    } else if (momentum === 'declining' && rate30Days > 0) {
      list.push({
        id: 'momentum_drop',
        type: 'recommendation',
        severity: 'warning',
        title: 'Queda de ritmo detectada na última semana',
        description: `Sua aderência caiu de ${rate30Days}% no mês para ${rate7Days}% nesta semana. É normal haver flutuações.`,
        actionableTip: `Não tente recuperar tudo de uma vez. Foque apenas no hábito mais fácil hoje para retomar o ritmo.`,
        badge: '🎯 Ajuste Estratégico',
      });
    }

    // Fallback se poucos logs
    if (list.length === 0) {
      list.push({
        id: 'start_insights',
        type: 'recommendation',
        severity: 'tip',
        title: 'Construindo seu perfil de inteligência',
        description: 'Conforme você realiza check-ins ao longo da semana, o motor detectará seus dias mais fortes, melhores horários e conexões entre hábitos.',
        actionableTip: 'Marque seus hábitos diariamente e use o botão de dias anteriores se esqueceu de registrar ontem!',
        badge: '💡 Dica Inicial',
      });
    }

    return list;
  }

  getEmptyStateOverview() {
    return {
      consistencyScore: 0,
      momentum: 'stable',
      rate7Days: 0,
      rate30Days: 0,
      totalCheckInsMonth: 0,
      monthlyGrowthPercent: 0,
      bestDay: null,
      weakestDay: null,
      daysOfWeek: [],
      periods: [],
      synergies: [],
      insights: [
        {
          id: 'empty_welcome',
          type: 'recommendation',
          severity: 'tip',
          title: 'Inteligência de Hábitos 100% Offline',
          description: 'Crie seus primeiros hábitos para desbloquear análises de consistência, efeito dominó e recomendações personalizadas.',
          actionableTip: 'Comece com 1 ou 2 hábitos pequenos para construir consistência inicial sem sobrecarga.',
          badge: '🌱 Primeiro Passo',
        },
      ],
    };
  }
}

module.exports = { HabitsIntelligenceEngine };
