import React, { useMemo } from 'react';
import { useHabits } from '../context/HabitsContext';
import { HabitHeatmap } from '../components/HabitHeatmap';
import { HabitModal } from '../components/HabitModal';
import { Habit, HabitPeriod, HabitCategory } from '../types';
import {
  Flame,
  Trophy,
  Check,
  Plus,
  Sparkles,
  Award,
  Calendar,
  Grid,
  Filter,
  MoreVertical,
  Edit2,
  Clock,
  TrendingUp,
} from 'lucide-react';

const PERIOD_LABELS: Record<HabitPeriod, { label: string; icon: string }> = {
  anytime: { label: 'Qualquer hora', icon: '⏰' },
  morning: { label: 'Manhã', icon: '🌅' },
  afternoon: { label: 'Tarde', icon: '☀️' },
  evening: { label: 'Noite', icon: '🌙' },
};

const CATEGORY_NAMES: Record<HabitCategory, { label: string; icon: string }> = {
  saude: { label: 'Saúde & Corpo', icon: '🍏' },
  mente: { label: 'Mente & Foco', icon: '🧠' },
  produtividade: { label: 'Produtividade', icon: '💼' },
  financas: { label: 'Finanças Pessoais', icon: '💰' },
  rotina: { label: 'Rotina & Hábitos', icon: '⚡' },
  relacionamentos: { label: 'Relações & Lazer', icon: '🤝' },
  geral: { label: 'Geral', icon: '✨' },
};

export const HabitsView: React.FC = () => {
  const {
    habits,
    overview,
    loading,
    activeTab,
    setActiveTab,
    selectedPeriod,
    setSelectedPeriod,
    toggleDay,
    openNewHabitModal,
    openEditHabitModal,
  } = useHabits();

  // Datas dos últimos 7 dias para a matriz rápida (da esquerda para a direita, terminando em Hoje)
  const last7Days = useMemo(() => {
    const dates: { dateStr: string; label: string; dayNumber: number; isToday: boolean }[] = [];
    const now = new Date();
    const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      dates.push({
        dateStr,
        label: i === 0 ? 'Hoje' : weekDayNames[d.getDay()],
        dayNumber: d.getDate(),
        isToday: i === 0,
      });
    }
    return dates;
  }, []);

  // Filtra hábitos pelo período selecionado
  const filteredHabits = useMemo(() => {
    if (selectedPeriod === 'all') return habits;
    return habits.filter((h) => h.period_of_day === selectedPeriod);
  }, [habits, selectedPeriod]);

  // Agrupa hábitos por categoria
  const groupedByCategory = useMemo(() => {
    const groups: Partial<Record<HabitCategory, Habit[]>> = {};
    filteredHabits.forEach((h) => {
      const cat = h.category || 'geral';
      if (!groups[cat]) groups[cat] = [];
      groups[cat]!.push(h);
    });
    return groups;
  }, [filteredHabits]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-6 py-5 max-w-7xl mx-auto w-full space-y-6">
      {/* Cabeçalho de Métricas / Banner Atomic Habits */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Progresso do Dia */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-cyan-950/40 to-slate-900/80 border border-cyan-500/20 backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Progresso de Hoje</span>
            <span className="text-xs font-bold text-white bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/30">
              {overview?.completedToday ?? 0} de {overview?.total ?? 0}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white tracking-tight">{overview?.percentToday ?? 0}%</span>
              <span className="text-xs text-slate-400 font-medium">concluído</span>
            </div>
            {/* Barra de progresso */}
            <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${overview?.percentToday ?? 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Melhor Sequência Ativa (Streak) */}
        <div className="p-4 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-amber-400" /> Sequência Ativa
            </span>
            <span className="text-[11px] text-slate-400">Recorde atual</span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white tracking-tight">{overview?.bestStreak ?? 0}</span>
              <span className="text-xs text-slate-400 font-medium">dias seguidos</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-1">
              {overview?.bestHabitName ? `Hábito: ${overview.bestHabitName}` : 'Inicie uma sequência hoje!'}
            </p>
          </div>
        </div>

        {/* Força Média dos Hábitos */}
        <div className="p-4 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Força Média
            </span>
            <span className="text-[11px] text-slate-400">Loop Algorithm</span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white tracking-tight">{overview?.averageStrength ?? 0}%</span>
              <span className="text-xs text-slate-400 font-medium">consistência</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Retenção de longo prazo</p>
          </div>
        </div>

        {/* Ação Rápida */}
        <div className="p-4 rounded-3xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Adicionar Rotina</span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <button
            onClick={() => openNewHabitModal()}
            className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Novo Hábito
          </button>
        </div>
      </div>

      {/* Barra de Abas e Filtros de Período */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        {/* Abas */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-2xl border border-slate-850">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'today' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Hoje & Grade Semanal
          </button>
          <button
            onClick={() => setActiveTab('heatmaps')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'heatmaps' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            Consistência (Heatmaps)
          </button>
        </div>

        {/* Filtro de Período do Dia */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Período:
          </span>
          {(['all', 'morning', 'afternoon', 'evening'] as const).map((p) => {
            const active = selectedPeriod === p;
            const label = p === 'all' ? 'Todos' : PERIOD_LABELS[p].label;
            const icon = p === 'all' ? '✨' : PERIOD_LABELS[p].icon;
            return (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  active ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="mr-1">{icon}</span>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo Principal */}
      {habits.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Nenhum hábito cadastrado ainda</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Pequenos hábitos diários produzem resultados extraordinários ao longo do tempo. Comece seu primeiro agora!
          </p>
          <button
            onClick={() => openNewHabitModal()}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition shadow-md shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            Criar Primeiro Hábito
          </button>
        </div>
      ) : activeTab === 'today' ? (
        /* Aba 1: Matriz Rápida dos Últimos 7 Dias (Design Everyday / Loop) */
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 overflow-hidden shadow-xl backdrop-blur-md">
          {/* Cabeçalho da Matriz */}
          <div className="grid grid-cols-12 px-5 py-3 border-b border-slate-800/80 bg-slate-950/40 text-xs font-semibold text-slate-400 select-none items-center">
            <div className="col-span-5 sm:col-span-6">Hábito & Frequência</div>
            <div className="col-span-7 sm:col-span-6 flex justify-end gap-2.5 sm:gap-4 pr-1">
              {last7Days.map((d) => (
                <div
                  key={d.dateStr}
                  className={`flex flex-col items-center justify-center w-8 sm:w-10 py-1 rounded-xl transition ${
                    d.isToday ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-bold' : ''
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold">{d.label}</span>
                  <span className="text-xs font-black">{d.dayNumber}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Linhas da Matriz */}
          <div className="divide-y divide-slate-800/40">
            {filteredHabits.map((habit) => {
              const habitColor = habit.color || '#38bdf8';
              const catInfo = CATEGORY_NAMES[habit.category] || CATEGORY_NAMES.geral;
              const periodInfo = PERIOD_LABELS[habit.period_of_day] || PERIOD_LABELS.anytime;

              return (
                <div
                  key={habit.id}
                  className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-slate-850/40 transition group"
                >
                  {/* Detalhes do Hábito */}
                  <div className="col-span-5 sm:col-span-6 flex items-center gap-3 min-w-0 pr-2">
                    <button
                      onClick={() => openEditHabitModal(habit)}
                      className="w-4 h-4 rounded-full shrink-0 group-hover:scale-110 transition-transform shadow-sm"
                      style={{ backgroundColor: habitColor }}
                      title="Editar Hábito"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white truncate cursor-pointer hover:text-cyan-300 transition" onClick={() => openEditHabitModal(habit)}>
                          {habit.name}
                        </span>
                        {habit.currentStreak > 0 && (
                          <span
                            className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: `${habitColor}18`, color: habitColor }}
                          >
                            <Flame className="w-2.5 h-2.5" />
                            {habit.currentStreak}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{catInfo.icon} {catInfo.label}</span>
                        <span>•</span>
                        <span>{periodInfo.icon} {periodInfo.label}</span>
                        {habit.type === 'measurable' && (
                          <>
                            <span>•</span>
                            <span className="text-cyan-400 font-medium">
                              Meta: {habit.target_value} {habit.target_unit}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Células de Check-in dos Últimos 7 Dias */}
                  <div className="col-span-7 sm:col-span-6 flex justify-end gap-2.5 sm:gap-4 pr-1 items-center">
                    {last7Days.map((d) => {
                      const isCompleted = d.isToday
                        ? habit.completedToday
                        : habit.recentHistory?.find((h) => h.date === d.dateStr)?.completed;

                      return (
                        <button
                          key={d.dateStr}
                          onClick={() => toggleDay(habit.id, d.dateStr)}
                          title={`${d.dateStr}: ${isCompleted ? 'Concluído' : 'Clique para marcar'}`}
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all ${
                            isCompleted
                              ? 'scale-100 shadow-md'
                              : 'bg-slate-950/60 border border-slate-800 text-transparent hover:border-slate-700 hover:text-slate-600'
                          }`}
                          style={{
                            backgroundColor: isCompleted ? habitColor : undefined,
                            boxShadow: isCompleted ? `0 0 12px ${habitColor}50` : undefined,
                          }}
                        >
                          <Check className={`w-4 h-4 stroke-[3.5] ${isCompleted ? 'text-slate-950' : ''}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Aba 2: Consistência & Heatmaps Anuais (Estilo GitHub) */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Grid className="w-4 h-4 text-cyan-400" />
              Mapas de Consistência Anuais ({new Date().getFullYear()})
            </h3>
            <span className="text-xs text-slate-400">Baseado no Loop Habit Tracker</span>
          </div>

          <div className="space-y-4">
            {filteredHabits.map((habit) => (
              <HabitHeatmap key={habit.id} habit={habit} />
            ))}
          </div>
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <HabitModal />
    </div>
  );
};
