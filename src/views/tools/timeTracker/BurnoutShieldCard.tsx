import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Sliders,
  Clock,
  Sparkles,
  Zap,
  CheckCircle,
  X,
  HeartHandshake,
} from 'lucide-react';
import { TimeEntry, TimeBudgetSettings, DEFAULT_TIME_BUDGETS } from '../../../modules/timeTracker/types';
import { formatHumanDuration } from '../../../modules/timeTracker/timeTrackerStore';

interface BurnoutShieldCardProps {
  entries: TimeEntry[];
}

const STORAGE_KEY = 'orbitron_time_budgets_v1';

export const BurnoutShieldCard: React.FC<BurnoutShieldCardProps> = ({ entries }) => {
  const [budgets, setBudgets] = useState<TimeBudgetSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_TIME_BUDGETS, ...JSON.parse(saved) } : DEFAULT_TIME_BUDGETS;
    } catch {
      return DEFAULT_TIME_BUDGETS;
    }
  });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempContratado, setTempContratado] = useState(budgets.contratadoWeeklyTarget);
  const [tempFreela, setTempFreela] = useState(budgets.freelaWeeklyLimit);
  const [tempPessoal, setTempPessoal] = useState(budgets.pessoalWeeklyTarget);
  const [tempDaily, setTempDaily] = useState(budgets.maxDailyHours);

  // Calculate current week boundaries (Monday to Sunday)
  const weekStats = useMemo(() => {
    const now = new Date();
    const currentDay = (now.getDay() + 6) % 7; // Monday = 0
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDay);
    startOfWeek.setHours(0, 0, 0, 0);
    const startMs = startOfWeek.getTime();

    // Start of Today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayMs = startOfToday.getTime();

    let contratadoSec = 0;
    let freelaSec = 0;
    let pessoalSec = 0;
    let todaySec = 0;

    for (const e of entries) {
      if (e.startedAt >= startMs) {
        const wt = e.workType || 'Profissional - Contratado';
        if (wt === 'Profissional - Freela') {
          freelaSec += e.durationSeconds;
        } else if (wt === 'Projeto Pessoal') {
          pessoalSec += e.durationSeconds;
        } else {
          contratadoSec += e.durationSeconds;
        }
      }

      if (e.startedAt >= todayMs) {
        todaySec += e.durationSeconds;
      }
    }

    const contratadoHours = contratadoSec / 3600;
    const freelaHours = freelaSec / 3600;
    const pessoalHours = pessoalSec / 3600;
    const todayHours = todaySec / 3600;
    const totalWeeklyHours = contratadoHours + freelaHours + pessoalHours;

    return {
      contratadoSec,
      contratadoHours,
      freelaSec,
      freelaHours,
      pessoalSec,
      pessoalHours,
      todaySec,
      todayHours,
      totalWeeklyHours,
    };
  }, [entries]);

  // Burnout Assessment
  const freelaPercent = Math.round((weekStats.freelaHours / Math.max(1, budgets.freelaWeeklyLimit)) * 100);
  const contratadoPercent = Math.round((weekStats.contratadoHours / Math.max(1, budgets.contratadoWeeklyTarget)) * 100);
  const pessoalPercent = Math.round((weekStats.pessoalHours / Math.max(1, budgets.pessoalWeeklyTarget)) * 100);
  const dailyPercent = Math.round((weekStats.todayHours / Math.max(1, budgets.maxDailyHours)) * 100);

  const isCriticalBurnout =
    freelaPercent >= 100 ||
    dailyPercent >= 100 ||
    weekStats.totalWeeklyHours >= (budgets.contratadoWeeklyTarget + budgets.freelaWeeklyLimit) * 1.1;

  const isWarningSobrecarga =
    !isCriticalBurnout && (freelaPercent >= 80 || dailyPercent >= 80 || contratadoPercent >= 95);

  const openSettings = () => {
    setTempContratado(budgets.contratadoWeeklyTarget);
    setTempFreela(budgets.freelaWeeklyLimit);
    setTempPessoal(budgets.pessoalWeeklyTarget);
    setTempDaily(budgets.maxDailyHours);
    setSettingsOpen(true);
  };

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: TimeBudgetSettings = {
      contratadoWeeklyTarget: Math.max(1, Number(tempContratado)),
      freelaWeeklyLimit: Math.max(1, Number(tempFreela)),
      pessoalWeeklyTarget: Math.max(1, Number(tempPessoal)),
      maxDailyHours: Math.max(1, Number(tempDaily)),
    };
    setBudgets(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    setSettingsOpen(false);
  };

  return (
    <div
      className={`border rounded-2xl p-5 relative overflow-hidden transition-all ${
        isCriticalBurnout
          ? 'bg-rose-950/20 border-rose-500/40 shadow-xl shadow-rose-950/30'
          : isWarningSobrecarga
          ? 'bg-amber-950/20 border-amber-500/40 shadow-xl shadow-amber-950/20'
          : 'bg-slate-900/60 border-white/10'
      }`}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
              isCriticalBurnout
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                : isWarningSobrecarga
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {isCriticalBurnout ? (
              <ShieldAlert className="w-5 h-5" />
            ) : isWarningSobrecarga ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Escudo Anti-Burnout & Orçamento Semanal
              </h3>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  isCriticalBurnout
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : isWarningSobrecarga
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {isCriticalBurnout
                  ? 'Alerta de Burnout'
                  : isWarningSobrecarga
                  ? 'Atenção à Sobrecarga'
                  : 'Ritmo Saudável'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isCriticalBurnout
                ? 'Você ultrapassou o teto seguro de horas! Descanse para renovar sua energia e criatividade.'
                : isWarningSobrecarga
                ? 'Você está próximo do limite semanal de freelas ou limite diário. Planeje momentos de pausa.'
                : 'Equilíbrio equilibrado entre CLT/Contratado, Freelas e Projetos Pessoais.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openSettings}
          className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>Ajustar Metas</span>
        </button>
      </div>

      {/* 3 High-Tech Meters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        {/* Meter 1: Profissional - Contratado */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Contratado</span>
            </span>
            <span className="font-mono text-cyan-400 font-bold">
              {weekStats.contratadoHours.toFixed(1)}h{' '}
              <span className="text-slate-500 font-normal">/ {budgets.contratadoWeeklyTarget}h</span>
            </span>
          </div>

          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 rounded-full transition-all duration-500 shadow-[0_0_8px_#06b6d4]"
              style={{ width: `${Math.min(100, contratadoPercent)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Meta semanal regular</span>
            <span className="font-bold text-slate-400">{contratadoPercent}%</span>
          </div>
        </div>

        {/* Meter 2: Profissional - Freela (Burnout Shield) */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  freelaPercent >= 100
                    ? 'bg-rose-400'
                    : freelaPercent >= 80
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />
              <span>Freela (Teto Seguro)</span>
            </span>
            <span
              className={`font-mono font-bold ${
                freelaPercent >= 100
                  ? 'text-rose-400'
                  : freelaPercent >= 80
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {weekStats.freelaHours.toFixed(1)}h{' '}
              <span className="text-slate-500 font-normal">/ max {budgets.freelaWeeklyLimit}h</span>
            </span>
          </div>

          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                freelaPercent >= 100
                  ? 'bg-rose-500 shadow-[0_0_8px_#ef4444]'
                  : freelaPercent >= 80
                  ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                  : 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
              }`}
              style={{ width: `${Math.min(100, freelaPercent)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-500">
            <span>
              {freelaPercent >= 100
                ? '⚠️ Teto atingido!'
                : freelaPercent >= 80
                ? '⚡ 80% do teto'
                : 'Dentro da margem'}
            </span>
            <span
              className={`font-bold ${
                freelaPercent >= 100
                  ? 'text-rose-400'
                  : freelaPercent >= 80
                  ? 'text-amber-400'
                  : 'text-slate-400'
              }`}
            >
              {freelaPercent}%
            </span>
          </div>
        </div>

        {/* Meter 3: Projeto Pessoal */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>Projeto Pessoal</span>
            </span>
            <span className="font-mono text-purple-400 font-bold">
              {weekStats.pessoalHours.toFixed(1)}h{' '}
              <span className="text-slate-500 font-normal">/ {budgets.pessoalWeeklyTarget}h</span>
            </span>
          </div>

          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-400 rounded-full transition-all duration-500 shadow-[0_0_8px_#a855f7]"
              style={{ width: `${Math.min(100, pessoalPercent)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Investimento próprio</span>
            <span className="font-bold text-slate-400">{pessoalPercent}%</span>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-white/15 rounded-2xl p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Configurar Metas de Horas</h3>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={saveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Meta Semanal: Profissional - Contratado (horas)
                </label>
                <input
                  type="number"
                  min="1"
                  max="80"
                  value={tempContratado}
                  onChange={(e) => setTempContratado(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Teto Semanal Máximo: Profissional - Freela (horas)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={tempFreela}
                  onChange={(e) => setTempFreela(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  O app emitirá alertas visuais quando você atingir 80% e 100% desta carga.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Meta Semanal Mínima: Projeto Pessoal (horas)
                </label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={tempPessoal}
                  onChange={(e) => setTempPessoal(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Limite Seguro Diário de Trabalho (horas)
                </label>
                <input
                  type="number"
                  min="4"
                  max="18"
                  value={tempDaily}
                  onChange={(e) => setTempDaily(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-lg"
                >
                  Salvar Metas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
