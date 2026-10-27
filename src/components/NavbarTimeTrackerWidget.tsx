import React, { useState, useRef, useEffect } from 'react';
import {
  Clock,
  Play,
  Pause,
  Square,
  X,
  ChevronDown,
  ExternalLink,
  Tag,
  CheckCircle2,
  Pin,
} from 'lucide-react';
import { useTimeTracker } from '../modules/timeTracker/timeTrackerStore';
import { useKanban } from '../modules/kanban/kanbanStore';
import { useFinancial } from '../context/FinancialContext';
import { useAlwaysOnTop } from '../hooks/useAlwaysOnTop';

export const NavbarTimeTrackerWidget: React.FC = () => {
  const {
    isRunning,
    activeTaskTitle,
    category,
    workType,
    formattedTime,
    categories,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopAndSave,
    discard,
  } = useTimeTracker();

  const { tasks } = useKanban();
  const { setCurrentView, setActiveModule, showToast } = useFinancial();
  const { isAlwaysOnTop, toggleAlwaysOnTop } = useAlwaysOnTop();

  const [isOpen, setIsOpen] = useState(false);
  const [inputTitle, setInputTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Geral');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleStartCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const title = inputTitle.trim() || 'Nova Tarefa';
    startTracking(title, null, selectedCategory);
    setInputTitle('');
    setIsOpen(false);
    showToast(`Rastreando: "${title}"`, 'info');
  };

  const handleStartTask = (taskId: string, title: string, cat?: string) => {
    startTracking(title, taskId, cat || 'Geral');
    setIsOpen(false);
    showToast(`Rastreando tarefa: "${title}"`, 'info');
  };

  const handleStop = async () => {
    const saved = await stopAndSave();
    if (saved) {
      showToast(`Tempo salvo: ${saved.taskTitle}`, 'success');
    }
    setIsOpen(false);
  };

  const openTimeTrackerTab = () => {
    setActiveModule('tools');
    setCurrentView('tools_timetracker');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Navbar trigger pill */}
      {isRunning ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)] animate-pulse-subtle">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center gap-2 max-w-[200px] text-left hover:text-white transition"
            title="Abrir detalhes do rastreador"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span className="font-mono text-xs font-bold tracking-wider">{formattedTime}</span>
            <span className="text-[11px] font-medium text-slate-300 truncate max-w-[90px]">
              {activeTaskTitle}
            </span>
          </button>

          <div className="h-3 w-px bg-cyan-500/30 mx-0.5" />

          {/* Pause / Resume */}
          <button
            type="button"
            onClick={pauseTracking}
            title="Pausar contagem"
            className="p-1 rounded-full hover:bg-cyan-500/25 text-cyan-300 hover:text-white transition"
          >
            <Pause className="w-3 h-3" />
          </button>

          {/* Stop and Save */}
          <button
            type="button"
            onClick={handleStop}
            title="Finalizar e salvar no histórico"
            className="p-1 rounded-full hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 transition"
          >
            <Square className="w-3 h-3 fill-current" />
          </button>
        </div>
      ) : activeTaskTitle ? (
        // Paused state
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center gap-2 max-w-[200px] text-left hover:text-white transition"
          >
            <Clock className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="font-mono text-xs font-bold">{formattedTime}</span>
            <span className="text-[11px] text-slate-300 truncate max-w-[80px]">
              {activeTaskTitle} (Pausado)
            </span>
          </button>

          <button
            type="button"
            onClick={resumeTracking}
            title="Retomar contagem"
            className="p-1 rounded-full hover:bg-amber-500/25 text-amber-300 hover:text-white transition"
          >
            <Play className="w-3 h-3 fill-current" />
          </button>

          <button
            type="button"
            onClick={handleStop}
            title="Salvar registro"
            className="p-1 rounded-full hover:bg-emerald-500/30 text-emerald-400 transition"
          >
            <Square className="w-3 h-3 fill-current" />
          </button>
        </div>
      ) : (
        // Inactive trigger
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-cyan-300 text-xs font-semibold transition"
          title="Iniciar rastreador de tempo"
        >
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Rastrear Tempo</span>
          <ChevronDown className="w-3 h-3 text-slate-500" />
        </button>
      )}

      {/* Quick Launch & Controller Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-84 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-scale-in">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white">Rastreador de Tempo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleAlwaysOnTop}
                className={`p-1 rounded-lg border text-xs transition flex items-center gap-1 ${
                  isAlwaysOnTop
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm'
                    : 'hover:bg-white/5 border-transparent text-slate-400 hover:text-white'
                }`}
                title={
                  isAlwaysOnTop
                    ? 'Janela fixada no topo. Clique para desafixar.'
                    : 'Fixar janela sempre à frente (Always on Top)'
                }
              >
                <Pin className={`w-3.5 h-3.5 ${isAlwaysOnTop ? 'rotate-45 fill-current text-amber-400' : ''}`} />
              </button>
              <button
                type="button"
                onClick={openTimeTrackerTab}
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition ml-1"
              >
                <span>Histórico</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* If currently running / paused */}
          {activeTaskTitle ? (
            <div className="py-3 border-b border-white/[0.08]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Tarefa Ativa</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                    {category}
                  </span>
                  {workType && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-sky-500/30 bg-sky-500/15 text-sky-300 font-semibold truncate max-w-[130px]">
                      {workType}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm font-bold text-white truncate mt-1">{activeTaskTitle}</div>
              <div className="font-mono text-2xl font-black text-cyan-400 my-2">
                {formattedTime}
              </div>

              <div className="flex items-center gap-2">
                {isRunning ? (
                  <button
                    type="button"
                    onClick={pauseTracking}
                    className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pausar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resumeTracking}
                    className="flex-1 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Retomar</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleStop}
                  className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Salvar</span>
                </button>

                <button
                  type="button"
                  onClick={discard}
                  title="Descartar sessão sem salvar"
                  className="p-2 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            // Quick start form
            <form onSubmit={handleStartCustom} className="py-3 border-b border-white/[0.08] space-y-2">
              <div className="text-[11px] text-slate-400 font-medium">
                No que você vai focar agora?
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Ex: Refatorar API, Relatório..."
                  value={inputTitle}
                  onChange={(e) => setInputTitle(e.target.value)}
                  className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold flex items-center gap-1 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Iniciar</span>
                </button>
              </div>

              {/* Category picker */}
              <div className="flex items-center gap-2 pt-1">
                <Tag className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="text-[11px] text-slate-400">Categoria:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-950 border border-white/10 text-slate-300 text-[11px] rounded-lg px-2 py-0.5 outline-none focus:border-cyan-500 transition flex-1"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </form>
          )}

          {/* Quick pick from Kanban Tasks */}
          <div className="pt-3">
            <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center justify-between">
              <span>Ou escolha do Kanban</span>
              <span className="text-[10px] text-slate-500 font-normal">
                {tasks.length} disponíveis
              </span>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {tasks.slice(0, 6).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleStartTask(t.id, t.title, t.tags?.[0])}
                  className="w-full text-left p-2 rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-white/5 transition flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 truncate">
                      {t.title}
                    </div>
                    {t.tags && t.tags.length > 0 && (
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Tag className="w-2.5 h-2.5" />
                        {t.tags[0]}
                      </span>
                    )}
                  </div>
                  <Play className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:scale-110 transition shrink-0" />
                </button>
              ))}

              {tasks.length === 0 && (
                <div className="text-center py-4 text-xs text-slate-500">
                  Nenhuma tarefa no Kanban ainda.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
