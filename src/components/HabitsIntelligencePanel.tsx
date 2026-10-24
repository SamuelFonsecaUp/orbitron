import React, { useEffect, useState } from 'react';
import { useHabits } from '../context/HabitsContext';
import { HabitsIntelligenceOverview, HabitInsightItem } from '../types';
import {
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  Zap,
  Sparkles,
  Link2,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';

export const HabitsIntelligencePanel: React.FC = () => {
  const { getIntelligence } = useHabits();
  const [data, setData] = useState<HabitsIntelligenceOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await getIntelligence();
      setData(res);
    } catch (err) {
      console.error('[HabitsIntelligencePanel] Erro ao carregar inteligência:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [getIntelligence]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
        <span className="text-xs font-semibold">Analisando histórico de consistência e padrões...</span>
      </div>
    );
  }

  if (!data) return null;

  const getMomentumBadge = (momentum: string) => {
    if (momentum === 'accelerating') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">🚀 Em Aceleração</span>;
    }
    if (momentum === 'declining') {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">⚠️ Queda de Ritmo</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">⚖️ Ritmo Estável</span>;
  };

  const getInsightIcon = (type: HabitInsightItem['type']) => {
    switch (type) {
      case 'risk': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'synergy': return <Link2 className="w-4 h-4 text-cyan-400" />;
      case 'achievement': return <Zap className="w-4 h-4 text-emerald-400" />;
      case 'pattern': return <Calendar className="w-4 h-4 text-sky-400" />;
      default: return <Lightbulb className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Consistency Score & Momentum */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Score de Consistência</span>
            <BrainCircuit className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{data.consistencyScore}</span>
            <span className="text-xs text-slate-400 font-semibold">/ 100</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-sky-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${data.consistencyScore}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Momento & Tendência</span>
            {getMomentumBadge(data.momentum)}
          </div>
          <div className="my-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Últimos 7 dias:</span>
              <span className="font-bold text-white">{data.rate7Days}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Média 30 dias:</span>
              <span className="font-bold text-slate-300">{data.rate30Days}%</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-500">Comparação móvel ponderada</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Check-ins do Mês</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-black text-white">{data.totalCheckInsMonth}</span>
            <span className="text-xs text-slate-400 ml-2 font-semibold">registros</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">
            {data.monthlyGrowthPercent >= 0 ? `+${data.monthlyGrowthPercent}% vs mês anterior` : `${data.monthlyGrowthPercent}% vs mês anterior`}
          </span>
        </div>
      </div>

      {/* Weekly Breakdown & Domino Synergies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Days of Week Heat / Bar */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" /> Ritmo Semanal por Dia
            </h3>
            {data.bestDay && (
              <span className="text-[11px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-lg">
                Pico: {data.bestDay.name} ({data.bestDay.rate}%)
              </span>
            )}
          </div>

          <div className="grid grid-cols-7 gap-2 pt-2">
            {data.daysOfWeek.map((d) => (
              <div key={d.dayIndex} className="flex flex-col items-center gap-1.5">
                <div className="h-24 w-full bg-slate-800/50 rounded-xl flex items-end p-1 overflow-hidden">
                  <div
                    className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-lg transition-all"
                    style={{ height: `${Math.max(8, d.rate)}%` }}
                    title={`${d.dayName}: ${d.rate}% (${d.completed}/${d.total})`}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-300">{d.shortName}</span>
                <span className="text-[10px] font-semibold text-slate-400">{d.rate}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Domino Effect Synergies (Habit Stacking) */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
            <Link2 className="w-4 h-4 text-cyan-400" /> Efeito Dominó (Habit Stacking)
          </h3>
          <p className="text-[11px] text-slate-400">
            Probabilidade condicional local: cumprir o hábito âncora alavanca o segundo.
          </p>

          {data.synergies.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-800/40 text-xs text-slate-400 text-center">
              Continue registrando hábitos para mapear combinações de sinergia.
            </div>
          ) : (
            <div className="space-y-2">
              {data.synergies.map((s, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-bold text-white">{s.anchorHabitName}</span>
                    <span className="text-slate-400 mx-1.5">➔</span>
                    <span className="font-bold text-cyan-300">{s.boostedHabitName}</span>
                  </div>
                  <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                    {s.probability}% sucesso
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actionable Insights List */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" /> Recomendações e Diagnósticos Atômicos
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.insights.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-2 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getInsightIcon(item.type)}
                  <h4 className="text-xs font-bold text-white">{item.title}</h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {item.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 text-[11px] text-cyan-200">
                <strong className="text-cyan-400">Dica Prática:</strong> {item.actionableTip}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
