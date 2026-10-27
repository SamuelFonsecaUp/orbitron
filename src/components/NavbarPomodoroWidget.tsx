import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Timer,
  Flame,
  Coffee,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { pomodoroStore, usePomodoroStore, formatPomodoroTime } from '../modules/pomodoro/pomodoroStore';
import { useFinancial } from '../context/FinancialContext';

export const NavbarPomodoroWidget: React.FC = () => {
  const { setCurrentView } = useFinancial();
  const {
    mode,
    timeLeft,
    duration,
    isRunning,
    sessionsCompletedToday,
    linkedTaskTitle,
    settings,
  } = usePomodoroStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  if (!settings.pinnedInNavbar && !isRunning && sessionsCompletedToday === 0) {
    return null;
  }

  const modeTheme = {
    focus: {
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 hover:bg-rose-500/20',
      border: 'border-rose-500/30',
      label: 'Foco',
      Icon: Flame,
    },
    shortBreak: {
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
      border: 'border-emerald-500/30',
      label: 'Pausa Curta',
      Icon: Coffee,
    },
    longBreak: {
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 hover:bg-cyan-500/20',
      border: 'border-cyan-500/30',
      label: 'Pausa Longa',
      Icon: Sparkles,
    },
  }[mode];

  const ModeIcon = modeTheme.Icon;
  const progressPercent = Math.max(0, Math.min(100, (1 - timeLeft / Math.max(1, duration)) * 100));

  return (
    <div className="relative inline-flex items-center" ref={menuRef}>
      {/* Pinned Pomodoro Pill Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        title={`Pomodoro: ${modeTheme.label} • ${formatPomodoroTime(timeLeft)} (Clique para opções)`}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all select-none shadow-sm ${modeTheme.bg} ${modeTheme.border} ${modeTheme.color} ${
          isRunning ? 'ring-1 ring-offset-1 ring-offset-slate-950' : ''
        }`}
      >
        <ModeIcon className="w-3.5 h-3.5 shrink-0" />

        {/* Time Remaining */}
        <span className={`font-mono text-[11px] font-bold tracking-tight ${isRunning ? 'animate-pulse' : ''}`}>
          {formatPomodoroTime(timeLeft)}
        </span>

        {/* Mini Play / Pause inline icon */}
        <span
          onClick={(e) => {
            e.stopPropagation();
            pomodoroStore.toggle();
          }}
          className="p-0.5 rounded hover:bg-white/20 transition ml-0.5"
          title={isRunning ? 'Pausar' : 'Iniciar'}
        >
          {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </span>
      </button>

      {/* Dropdown Quick Controller */}
      {menuOpen && (
        <div className="absolute top-10 right-0 w-64 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl backdrop-blur-2xl p-3 z-50 text-xs animate-in fade-in zoom-in-95 duration-150 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Timer className="w-3.5 h-3.5 text-rose-400" />
              <span>Relógio Pomodoro</span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
              {sessionsCompletedToday} sessões
            </span>
          </div>

          {/* Linked Task badge (if any) */}
          {linkedTaskTitle && (
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[9px] uppercase tracking-wider text-purple-400 font-bold block">
                  Tarefa Vinculada
                </span>
                <span className="text-white text-xs font-semibold truncate block">
                  {linkedTaskTitle}
                </span>
              </div>
              <button
                onClick={() => pomodoroStore.unlinkTask()}
                className="text-[10px] text-slate-400 hover:text-white"
                title="Desvincular tarefa"
              >
                ✕
              </button>
            </div>
          )}

          {/* Mode Selector Buttons */}
          <div className="grid grid-cols-3 gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/5">
            {[
              { id: 'focus' as const, label: 'Foco', Icon: Flame },
              { id: 'shortBreak' as const, label: 'Pausa', Icon: Coffee },
              { id: 'longBreak' as const, label: 'Longa', Icon: Sparkles },
            ].map(({ id, label, Icon: TabIcon }) => (
              <button
                key={id}
                onClick={() => pomodoroStore.setMode(id)}
                className={`py-1 px-1 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                  mode === id
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TabIcon className="w-3 h-3" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Big Time Display & Progress */}
          <div className="text-center py-1">
            <span className="text-3xl font-black font-mono tracking-tight text-white">
              {formatPomodoroTime(timeLeft)}
            </span>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden mt-2 border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  mode === 'focus'
                    ? 'bg-rose-500'
                    : mode === 'shortBreak'
                    ? 'bg-emerald-500'
                    : 'bg-cyan-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Controls: Play/Pause, Reset, Skip */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={() => pomodoroStore.reset()}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Reiniciar Sessão"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => pomodoroStore.toggle()}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs text-white transition flex items-center justify-center gap-1.5 shadow-lg ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pausar
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Iniciar
                </>
              )}
            </button>

            <button
              onClick={() => pomodoroStore.skip()}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Pular para Próxima Sessão"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Navigate to Full View */}
          <button
            onClick={() => {
              setCurrentView('tools_pomodoro' as any);
              setMenuOpen(false);
            }}
            className="w-full py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-white/5 text-slate-300 hover:text-white text-[11px] font-semibold transition flex items-center justify-center gap-1.5"
          >
            <span>Painel Completo do Pomodoro</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      )}
    </div>
  );
};
