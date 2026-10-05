import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Flame,
  Hourglass,
  Lock,
  Swords,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { AchievementIcon, RARITY_STYLE } from '../components/GameWidgets';
import { formatDate } from '../utils/formatters';
import { GameAchievement, GameEvent, GameMission } from '../types';

const KIND_LABEL: Record<GameEvent['kind'], string> = {
  import: 'Extratos',
  categorize: 'Categorização',
  month: 'Meses no azul',
  reserve: 'Reserva',
  budget: 'Orçamentos',
  invoice: 'Faturas em dia',
  mission: 'Missões',
  achievement: 'Conquistas',
};

const KIND_COLOR: Record<GameEvent['kind'], string> = {
  import: '#38bdf8',
  categorize: '#a78bfa',
  month: '#34d399',
  reserve: '#10b981',
  budget: '#f472b6',
  invoice: '#60a5fa',
  mission: '#fb923c',
  achievement: '#f59e0b',
};

const MISSION_STATUS: Record<GameMission['status'], { label: string; color: string; Icon: React.FC<{ className?: string }> }> = {
  in_progress: { label: 'Em andamento', color: '#38bdf8', Icon: Clock },
  completed: { label: 'Concluída', color: '#34d399', Icon: CheckCircle2 },
  failed: { label: 'Não concluída', color: '#f87171', Icon: XCircle },
  awaiting_data: { label: 'Aguardando extrato', color: '#fbbf24', Icon: Hourglass },
};

type AchievementFilter = 'all' | 'unlocked' | 'locked';

export const JourneyView: React.FC = () => {
  const { game, refreshGame } = useFinancial();
  const [filter, setFilter] = useState<AchievementFilter>('all');

  useEffect(() => {
    refreshGame();
  }, [refreshGame]);

  const achievements = useMemo(() => {
    if (!game) return [];
    const list = filter === 'unlocked' ? game.achievements.filter(a => a.unlocked)
      : filter === 'locked' ? game.achievements.filter(a => !a.unlocked)
      : game.achievements;
    // Desbloqueadas primeiro; bloqueadas pelas mais próximas de completar
    return [...list].sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || b.progress - a.progress);
  }, [game, filter]);

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Calculando sua jornada...</span>
      </div>
    );
  }

  const unlockedCount = game.achievements.filter(a => a.unlocked).length;
  const daysLeft = Math.max(0, Math.ceil((new Date(`${game.missions.weekEnd}T23:59:59`).getTime() - Date.now()) / 86400000));
  const xpTotalByKind = Object.entries(game.xpByKind).sort((a, b) => b[1] - a[1]);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl space-y-6">
        {/* Level hero */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/15 via-slate-900/90 to-slate-950 border border-amber-500/25 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-600 flex flex-col items-center justify-center shadow-xl shrink-0">
              <span className="text-[10px] font-bold uppercase text-amber-100 tracking-wider">Nível</span>
              <span className="text-4xl font-black text-white leading-none">{game.level}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-white">{game.title}</h1>
              <p className="text-xs text-slate-400 mt-1">
                {game.totalXp.toLocaleString('pt-BR')} XP no total • +{game.xpThisWeek.toLocaleString('pt-BR')} XP nesta semana
              </p>
              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>{game.xpIntoLevel} / {game.xpForNext} XP</span>
                  <span>Nível {game.level + 1}</span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700" style={{ width: `${game.progressPercent}%` }} />
                </div>
                {game.nextTitle && (
                  <span className="text-[11px] text-slate-500 mt-1.5 block">
                    Próximo título: <strong className="text-amber-300">{game.nextTitle.title}</strong> no nível {game.nextTitle.level}
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:w-64 shrink-0">
              <StreakCard label="Semanas importando" streak={game.streaks.importWeeks} unit="sem." />
              <StreakCard label="Meses no azul" streak={game.streaks.positiveMonths} unit="meses" />
            </div>
          </div>
        </div>

        {/* Weekly missions */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-850">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Swords className="w-4 h-4 text-orange-400" />
                Missões da semana
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Geradas pela inteligência a partir dos seus padrões • {daysLeft === 0 ? 'último dia' : `${daysLeft} ${daysLeft === 1 ? 'dia restante' : 'dias restantes'}`} • {game.missions.completedTotal} concluídas no total
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {game.missions.current.map(m => {
              const st = MISSION_STATUS[m.status];
              return (
                <div key={m.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-white">{m.title}</span>
                    <span className="text-[10px] font-black text-amber-300 shrink-0">+{m.xp} XP</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{m.description}</span>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-auto">
                    <div className="h-full rounded-full transition-all" style={{ width: `${m.progress}%`, backgroundColor: st.color }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">{m.progressLabel}</span>
                    <span className="flex items-center gap-1 font-semibold" style={{ color: st.color }}>
                      <st.Icon className="w-3 h-3" />
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-850">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Conquistas
              <span className="text-xs font-semibold text-slate-400">{unlockedCount}/{game.achievements.length}</span>
            </h2>
            <div className="flex bg-slate-950/80 p-1 rounded-lg border border-slate-850">
              {([['all', 'Todas'], ['unlocked', 'Desbloqueadas'], ['locked', 'Bloqueadas']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${filter === key ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {achievements.map(a => <AchievementCard key={a.id} achievement={a} />)}
          </div>
        </div>

        {/* XP sources + history */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-850">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-amber-400" />
              De onde vem seu XP
            </h2>
            <div className="space-y-2.5">
              {xpTotalByKind.map(([kind, xp]) => (
                <div key={kind}>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{KIND_LABEL[kind as GameEvent['kind']] || kind}</span>
                    <span className="text-white font-bold">{xp.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.round((xp / Math.max(1, game.totalXp)) * 100)}%`, backgroundColor: KIND_COLOR[kind as GameEvent['kind']] || '#94a3b8' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/60 border border-slate-850">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-orange-400" />
              Histórico de XP
            </h2>
            {game.events.length === 0 ? (
              <p className="text-xs text-slate-400">Importe seu primeiro extrato para começar a ganhar XP.</p>
            ) : (
              <div className="divide-y divide-slate-850 max-h-80 overflow-y-auto pr-1">
                {game.events.map(e => (
                  <div key={e.id} className="py-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: KIND_COLOR[e.kind] }} />
                      <div className="min-w-0">
                        <span className="text-xs text-white block truncate">{e.title}</span>
                        <span className="text-[10px] text-slate-500">{formatDate(e.date)} • {KIND_LABEL[e.kind]}</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-amber-300 shrink-0">+{e.xp} XP</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StreakCard: React.FC<{ label: string; streak: { current: number; best: number; atRisk: boolean }; unit: string }> = ({ label, streak, unit }) => (
  <div className={`p-3 rounded-xl border ${streak.atRisk ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-950/60 border-slate-800'}`}>
    <span className="text-[10px] text-slate-400 block">{label}</span>
    <span className="flex items-center gap-1 text-lg font-black text-white">
      <Flame className={`w-4 h-4 ${streak.current > 0 ? 'text-orange-400' : 'text-slate-600'}`} />
      {streak.current}
    </span>
    <span className="text-[10px] text-slate-500">
      {streak.atRisk ? 'Em risco esta semana!' : `Recorde: ${streak.best} ${unit}`}
    </span>
  </div>
);

const AchievementCard: React.FC<{ achievement: GameAchievement }> = ({ achievement: a }) => {
  const rarity = RARITY_STYLE[a.rarity];
  return (
    <div
      className={`p-3.5 rounded-xl border flex gap-3 transition-all ${a.unlocked ? 'bg-slate-950/60' : 'bg-slate-950/30 opacity-70'}`}
      style={{ borderColor: a.unlocked ? `${rarity.color}55` : undefined }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: a.unlocked ? `${rarity.color}1f` : 'rgba(100,116,139,0.12)' }}
      >
        {a.unlocked
          ? <AchievementIcon name={a.icon} className="w-5 h-5" color={rarity.color} />
          : <Lock className="w-4 h-4 text-slate-500" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-white truncate">{a.name}</span>
          <span className="text-[9px] font-bold uppercase shrink-0" style={{ color: rarity.color }}>{rarity.label}</span>
        </div>
        <span className="text-[11px] text-slate-400 block">{a.description}</span>
        {a.unlocked ? (
          <span className="text-[10px] text-slate-500 mt-1 block">
            Desbloqueada em {a.unlockedAt ? formatDate(a.unlockedAt) : '—'} • +{a.xp} XP
          </span>
        ) : (
          <div className="mt-1.5">
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${a.progress}%`, backgroundColor: rarity.color }} />
            </div>
            <span className="text-[10px] text-slate-500">{a.current.toLocaleString('pt-BR')} / {a.target.toLocaleString('pt-BR')} • +{a.xp} XP</span>
          </div>
        )}
      </div>
    </div>
  );
};
