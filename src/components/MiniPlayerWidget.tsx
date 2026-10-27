import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Square,
  Maximize2,
  Clock,
  Flame,
  Coffee,
  CheckCircle2,
  X,
  Minus,
} from 'lucide-react';
import { usePomodoroStore, formatPomodoroTime } from '../modules/pomodoro/pomodoroStore';
import { useTimeTracker, formatTimeHoursMinutesSeconds } from '../modules/timeTracker/timeTrackerStore';
import { pomodoroStore } from '../modules/pomodoro/pomodoroStore';
import { timeTrackerStore } from '../modules/timeTracker/timeTrackerStore';

interface MiniPlayerWidgetProps {
  onExpand: () => void;
}

export const MiniPlayerWidget: React.FC<MiniPlayerWidgetProps> = ({ onExpand }) => {
  const pomodoro = usePomodoroStore();
  const timeTracker = useTimeTracker();

  // Mode preference if neither or both are running: 'pomodoro' | 'tracker'
  const [preferredMode, setPreferredMode] = useState<'pomodoro' | 'tracker'>(() => {
    if (timeTracker.isRunning) return 'tracker';
    return 'pomodoro';
  });

  const isTrackerActive = timeTracker.isRunning || preferredMode === 'tracker';
  const isPomodoroActive = !isTrackerActive;

  // Pomodoro controls
  const handlePomodoroPlayPause = () => {
    if (pomodoro.isRunning) {
      pomodoroStore.pause();
    } else {
      pomodoroStore.start();
    }
  };

  const handlePomodoroSkip = () => {
    pomodoroStore.skip();
  };

  const handlePomodoroReset = () => {
    pomodoroStore.reset();
  };

  // TimeTracker controls
  const handleTrackerPlayPause = () => {
    if (timeTracker.isRunning) {
      timeTrackerStore.pauseTracking();
    } else {
      timeTrackerStore.resumeTracking();
    }
  };

  const handleTrackerStop = async () => {
    await timeTrackerStore.stopAndSave();
  };

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow?.();
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow?.();
  };

  const getPomodoroBadge = () => {
    switch (pomodoro.mode) {
      case 'shortBreak':
        return { label: 'Pausa Curta', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', icon: Coffee };
      case 'longBreak':
        return { label: 'Pausa Longa', color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30', icon: Coffee };
      default:
        return { label: 'Foco', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30', icon: Flame };
    }
  };

  const pomoBadge = getPomodoroBadge();
  const PomoIcon = pomoBadge.icon;

  return (
    <div
      className="w-full h-full min-h-[72px] bg-[#0c0d12]/95 border border-slate-700/60 rounded-xl px-3 py-2 flex items-center justify-between gap-3 text-white shadow-2xl backdrop-blur-xl select-none app-drag relative overflow-hidden"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Background Ambient Glow */}
      <div
        className={`absolute -inset-1 opacity-20 pointer-events-none blur-xl transition-all duration-700 ${
          isPomodoroActive
            ? pomodoro.isRunning
              ? 'bg-amber-500'
              : 'bg-purple-600'
            : timeTracker.isRunning
            ? 'bg-cyan-500'
            : 'bg-slate-600'
        }`}
      />

      {/* Left: Mode Indicator & Toggle Pill */}
      <div className="flex items-center gap-2 min-w-0 app-no-drag">
        <button
          onClick={() => setPreferredMode(isPomodoroActive ? 'tracker' : 'pomodoro')}
          title="Alternar entre Pomodoro e Rastreador de Tempo"
          className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-[10px] font-semibold text-slate-300 transition-colors"
        >
          {isPomodoroActive ? (
            <>
              <PomoIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline font-mono text-[9px] uppercase tracking-wide">Pomo</span>
            </>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="hidden sm:inline font-mono text-[9px] uppercase tracking-wide">Track</span>
            </>
          )}
        </button>

        {/* Info & Title */}
        <div className="flex flex-col min-w-0 max-w-[120px] sm:max-w-[140px]">
          <div className="flex items-center gap-1.5 truncate">
            {isPomodoroActive ? (
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold truncate ${pomoBadge.color}`}
              >
                {pomoBadge.label}
              </span>
            ) : (
              <>
                <span className="text-[9px] px-1.5 py-0.2 rounded border font-semibold truncate text-cyan-300 bg-cyan-500/15 border-cyan-500/30">
                  {timeTracker.category || 'Geral'}
                </span>
                {timeTracker.workType && (
                  <span className="text-[8px] px-1 py-0.2 rounded border border-sky-500/30 bg-sky-500/15 text-sky-300 font-semibold truncate max-w-[70px]">
                    {timeTracker.workType.replace('Profissional - ', '')}
                  </span>
                )}
              </>
            )}
          </div>
          <span
            className="text-[11px] font-medium text-slate-300 truncate mt-0.5"
            title={
              isPomodoroActive
                ? pomodoro.linkedTaskTitle || 'Sessão de Foco'
                : timeTracker.activeTaskTitle || 'Atividade em andamento'
            }
          >
            {isPomodoroActive
              ? pomodoro.linkedTaskTitle || 'Sessão de Foco'
              : timeTracker.activeTaskTitle || 'Atividade em andamento'}
          </span>
        </div>
      </div>

      {/* Center: Live Timer Display */}
      <div className="flex flex-col items-center justify-center shrink-0">
        <div className="font-mono text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm flex items-center gap-1">
          {isPomodoroActive ? (
            <span>{formatPomodoroTime(pomodoro.timeLeft)}</span>
          ) : (
            <span className="text-cyan-400">
              {formatTimeHoursMinutesSeconds(timeTracker.elapsedSeconds)}
            </span>
          )}
        </div>
      </div>

      {/* Right: Media Controls & Window Actions */}
      <div className="flex items-center gap-1.5 shrink-0 app-no-drag">
        {isPomodoroActive ? (
          <>
            <button
              onClick={handlePomodoroPlayPause}
              title={pomodoro.isRunning ? 'Pausar (Espaço)' : 'Iniciar (Espaço)'}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-white transition-all shadow-md ${
                pomodoro.isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              {pomodoro.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
            <button
              onClick={handlePomodoroSkip}
              title="Avançar / Concluir ciclo"
              className="w-6 h-6 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <SkipForward className="w-3 h-3" />
            </button>
            <button
              onClick={handlePomodoroReset}
              title="Reiniciar tempo"
              className="w-6 h-6 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleTrackerPlayPause}
              title={timeTracker.isRunning ? 'Pausar rastreamento' : 'Retomar rastreamento'}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-white transition-all shadow-md ${
                timeTracker.isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                  : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30'
              }`}
            >
              {timeTracker.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
            {timeTracker.elapsedSeconds > 0 && (
              <button
                onClick={handleTrackerStop}
                title="Finalizar e Salvar no histórico"
                className="w-6 h-6 rounded-md hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 flex items-center justify-center transition-colors"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            )}
          </>
        )}

        <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />

        {/* Expand / Restore Full Window */}
        <button
          onClick={onExpand}
          title="Expandir Janela Completa (Ctrl+Shift+M)"
          className="w-7 h-7 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-300 hover:text-white flex items-center justify-center transition-all"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Window controls */}
        <button
          onClick={handleMinimize}
          title="Minimizar para a barra"
          className="w-6 h-6 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <Minus className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          title="Fechar"
          className="w-6 h-6 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
