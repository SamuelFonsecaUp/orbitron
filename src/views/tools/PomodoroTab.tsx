import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Timer,
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle2,
  ListTodo,
  ExternalLink,
  Flame,
  Coffee,
  Pin,
  Minimize2,
  X,
} from 'lucide-react';
import {
  pomodoroStore,
  usePomodoroStore,
  formatPomodoroTime,
} from '../../modules/pomodoro/pomodoroStore';
import { PomodoroMode } from '../../modules/pomodoro/types';
import { kanbanStore, useKanbanStore } from '../../modules/kanban/kanbanStore';
import { useFinancial } from '../../context/FinancialContext';
import { useAlwaysOnTop } from '../../hooks/useAlwaysOnTop';

export const PomodoroTab: React.FC = () => {
  const { showToast, setCurrentView } = useFinancial();
  const {
    mode,
    timeLeft,
    duration,
    isRunning,
    sessionsCompletedToday,
    totalFocusSecondsToday,
    linkedTaskId,
    linkedTaskTitle,
    settings,
  } = usePomodoroStore();

  const [showSettings, setShowSettings] = useState(false);
  const [customFocus, setCustomFocus] = useState(settings.focusMinutes);
  const [customShortBreak, setCustomShortBreak] = useState(settings.shortBreakMinutes);
  const [customLongBreak, setCustomLongBreak] = useState(settings.longBreakMinutes);

  // Sync custom inputs if settings change
  useEffect(() => {
    setCustomFocus(settings.focusMinutes);
    setCustomShortBreak(settings.shortBreakMinutes);
    setCustomLongBreak(settings.longBreakMinutes);
  }, [settings]);

  // Load kanban tasks for task linker
  const kanbanState = useKanbanStore();
  const activeTasks = kanbanState.tasks.filter((t) => {
    const col = kanbanState.columns.find((c) => c.id === t.columnId);
    return col ? !col.title.toLowerCase().includes('conclu') : true;
  });

  const { isAlwaysOnTop, toggleAlwaysOnTop } = useAlwaysOnTop();

  const modeTheme = {
    focus: {
      color: 'text-rose-400',
      bgGlow: 'from-rose-500/10 via-slate-900/80 to-purple-950/20',
      border: 'border-rose-500/30',
      ringColor: '#f43f5e',
      label: 'Sessão de Foco',
      subtitle: 'Mantenha total atenção na sua tarefa atual',
      IconComponent: Flame,
    },
    shortBreak: {
      color: 'text-emerald-400',
      bgGlow: 'from-emerald-500/10 via-slate-900/80 to-teal-950/20',
      border: 'border-emerald-500/30',
      ringColor: '#10b981',
      label: 'Pausa Curta',
      subtitle: 'Beba água, estique as pernas e respire fundo',
      IconComponent: Coffee,
    },
    longBreak: {
      color: 'text-cyan-400',
      bgGlow: 'from-cyan-500/10 via-slate-900/80 to-indigo-950/20',
      border: 'border-cyan-500/30',
      ringColor: '#06b6d4',
      label: 'Pausa Longa',
      subtitle: 'Excelente progresso! Descanse a mente antes do próximo ciclo',
      IconComponent: Sparkles,
    },
  }[mode];

  // Circle progress math
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.max(0, Math.min(1, 1 - timeLeft / Math.max(1, duration)));
  const strokeDashoffset = circumference * (1 - progressRatio);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    pomodoroStore.updateSettings({
      focusMinutes: Math.max(1, Math.min(120, Number(customFocus))),
      shortBreakMinutes: Math.max(1, Math.min(60, Number(customShortBreak))),
      longBreakMinutes: Math.max(1, Math.min(90, Number(customLongBreak))),
    });
    setShowSettings(false);
    showToast('Configurações do Pomodoro atualizadas!', 'success');
  };

  const handleTaskSelect = (taskId: string) => {
    if (!taskId) {
      pomodoroStore.unlinkTask();
      return;
    }
    const task = kanbanState.tasks.find((t) => t.id === taskId);
    if (task) {
      pomodoroStore.linkTask(task.id, task.title);
      showToast(`Tarefa "${task.title}" vinculada ao Pomodoro!`, 'info');
    }
  };

  const totalFocusHours = (totalFocusSecondsToday / 3600).toFixed(1);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Mode Switcher */}
      <div className={`p-6 rounded-3xl bg-gradient-to-br ${modeTheme.bgGlow} border ${modeTheme.border} shadow-2xl relative overflow-hidden backdrop-blur-md`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center ${modeTheme.color}`}>
                <modeTheme.IconComponent className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                {modeTheme.label}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {modeTheme.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Always on top pin button */}
            <button
              onClick={toggleAlwaysOnTop}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
                isAlwaysOnTop
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/60 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:text-white'
              }`}
              title={
                isAlwaysOnTop
                  ? 'Janela fixada no topo (Always on Top ativo). Clique para desafixar.'
                  : 'Fixar janela sempre à frente dos outros programas (Always on Top)'
              }
            >
              <Pin className={`w-3.5 h-3.5 ${isAlwaysOnTop ? 'fill-current rotate-45 text-amber-400' : ''}`} />
              <span className="hidden sm:inline">
                {isAlwaysOnTop ? 'Janela no Topo' : 'Fixar no Topo'}
              </span>
            </button>

            {/* Mini Player Mode button */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('orbitron:toggle-mini-mode'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all bg-purple-500/15 hover:bg-purple-500/25 border-purple-500/30 text-purple-300 hover:text-white"
              title="Alternar para o Mini Player flutuante (Ctrl+Shift+M)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mini Player</span>
            </button>

            {/* Mode Tabs */}
            <div className="liquid-glass-well p-1.5 rounded-2xl flex items-center gap-1">
              {(
                [
                  ['focus', 'Foco', Flame],
                  ['shortBreak', 'Pausa Curta', Coffee],
                  ['longBreak', 'Pausa Longa', Sparkles],
                ] as const
              ).map(([m, lbl, TabIcon]) => {
                const isActive = mode === m;
                return (
                  <button
                    key={m}
                    onClick={() => pomodoroStore.setMode(m)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-white/20 text-white shadow-lg shadow-black/40 scale-[1.02]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{lbl}</span>
                  </button>
                );
              })}
            </div>

            {/* Settings button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition"
              title="Configurações do Timer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Clock Face & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: The Giant Circular Pomodoro Timer */}
        <div className="lg:col-span-2 p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
          {/* Subtle central radial aura */}
          <div
            className="pointer-events-none absolute w-96 h-96 rounded-full blur-3xl opacity-20 transition-colors duration-700"
            style={{ backgroundColor: modeTheme.ringColor }}
          />

          {/* SVG Circular Progress Ring */}
          <div className="relative w-80 h-80 flex items-center justify-center my-4">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 300 300">
              {/* Background track circle */}
              <circle
                cx="150"
                cy="150"
                r={radius}
                className="text-slate-800/70"
                strokeWidth="14"
                stroke="currentColor"
                fill="transparent"
              />
              {/* Glowing animated progress stroke */}
              <circle
                cx="150"
                cy="150"
                r={radius}
                stroke={modeTheme.ringColor}
                strokeWidth="14"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  transition: 'stroke-dashoffset 0.3s ease, stroke 0.5s ease',
                  filter: `drop-shadow(0 0 12px ${modeTheme.ringColor}60)`,
                }}
              />
            </svg>

            {/* Inner Clock Digital Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                {modeTheme.label}
              </span>
              <span className={`text-6xl font-black font-mono tracking-tight text-white ${isRunning ? 'animate-pulse' : ''}`}>
                {formatPomodoroTime(timeLeft)}
              </span>
              <span className="text-xs font-semibold text-slate-400 mt-2 flex items-center gap-1.5">
                <span>Ciclo atual:</span>
                <strong className="text-white">
                  #{(sessionsCompletedToday % settings.longBreakInterval) + 1} de {settings.longBreakInterval}
                </strong>
              </span>
            </div>
          </div>

          {/* Big Action Controls */}
          <div className="flex items-center gap-4 mt-4 relative z-10">
            <button
              onClick={() => pomodoroStore.reset()}
              className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition shadow-lg"
              title="Reiniciar Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={() => pomodoroStore.toggle()}
              style={{
                backgroundColor: isRunning ? '#d97706' : modeTheme.ringColor,
                boxShadow: `0 10px 30px -5px ${isRunning ? '#d9770680' : modeTheme.ringColor + '80'}`,
              }}
              className="px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider text-white transition active:scale-95 flex items-center gap-2.5 hover:brightness-110"
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Iniciar {modeTheme.label}</span>
                </>
              )}
            </button>

            <button
              onClick={() => pomodoroStore.skip()}
              className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition shadow-lg"
              title="Pular para a Próxima Etapa"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Col: Task Linker & Session Stats */}
        <div className="space-y-6">
          {/* Daily Stats Card */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <h3 className="font-bold text-white text-sm">Produtividade de Hoje</h3>
              </div>
              <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-rose-400" />
                <span>{sessionsCompletedToday} blocos</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Pomodoros
                </span>
                <span className="text-2xl font-black text-white mt-1 block">
                  {sessionsCompletedToday}
                </span>
                <span className="text-[10px] text-slate-500">concluídos</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Tempo em Foco
                </span>
                <span className="text-2xl font-black text-rose-400 mt-1 block">
                  {totalFocusHours}h
                </span>
                <span className="text-[10px] text-slate-500">trabalho focado</span>
              </div>
            </div>

            {/* Pomodoro Visual Dots */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Progresso do Ciclo:
              </span>
              <div className="flex items-center gap-2">
                {Array.from({ length: settings.longBreakInterval }).map((_, i) => {
                  const isDone = (sessionsCompletedToday % settings.longBreakInterval) > i;
                  return (
                    <div
                      key={i}
                      className={`flex-1 h-3 rounded-full transition-all duration-300 ${
                        isDone
                          ? 'bg-rose-500 shadow-md shadow-rose-500/50'
                          : 'bg-slate-800 border border-white/5'
                      }`}
                      title={`Bloco ${i + 1}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Kanban Task Linker Card */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-white text-sm">Vincular a Tarefa do Kanban</h3>
              </div>
              <button
                onClick={() => setCurrentView('tools_kanban' as any)}
                className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
                title="Abrir Quadro Kanban"
              >
                <span>Ver Quadro</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Escolha uma tarefa ativa para registrar automaticamente os blocos de pomodoro nela.
            </p>

            <select
              value={linkedTaskId || ''}
              onChange={(e) => handleTaskSelect(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="">Nenhuma tarefa vinculada (Foco Geral)</option>
              {activeTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} {t.pomodorosCompleted ? `(${t.pomodorosCompleted} foco)` : ''}
                </option>
              ))}
            </select>

            {linkedTaskTitle && (
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-purple-300 uppercase block">
                    Focando agora em:
                  </span>
                  <span className="text-xs font-bold text-white">{linkedTaskTitle}</span>
                </div>
                <button
                  onClick={() => pomodoroStore.unlinkTask()}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleSaveSettings}
            className="w-full max-w-md rounded-3xl bg-slate-950 border border-slate-800 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 font-black text-white text-sm">
                <Settings className="w-4 h-4 text-purple-400" />
                <span>Configurar Relógio Pomodoro</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Tempo de Foco (minutos)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={customFocus}
                  onChange={(e) => setCustomFocus(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Pausa Curta (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={customShortBreak}
                    onChange={(e) => setCustomShortBreak(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Pausa Longa (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={customLongBreak}
                    onChange={(e) => setCustomLongBreak(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-2 space-y-2 border-t border-white/10">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-300">Sons de Notificação (Chime)</span>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => pomodoroStore.updateSettings({ soundEnabled: e.target.checked })}
                    className="rounded accent-purple-500 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-300">Fixar Timer na Barra Superior</span>
                  <input
                    type="checkbox"
                    checked={settings.pinnedInNavbar}
                    onChange={(e) => pomodoroStore.updateSettings({ pinnedInNavbar: e.target.checked })}
                    className="rounded accent-purple-500 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-300">Auto-iniciar Pausas</span>
                  <input
                    type="checkbox"
                    checked={settings.autoStartBreaks}
                    onChange={(e) => pomodoroStore.updateSettings({ autoStartBreaks: e.target.checked })}
                    className="rounded accent-purple-500 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-300">Auto-iniciar Foco após Pausa</span>
                  <input
                    type="checkbox"
                    checked={settings.autoStartFocus}
                    onChange={(e) => pomodoroStore.updateSettings({ autoStartFocus: e.target.checked })}
                    className="rounded accent-purple-500 w-4 h-4"
                  />
                </label>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-white text-xs shadow-lg shadow-purple-600/30"
              >
                Salvar Configurações
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
