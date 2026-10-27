import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Play,
  Pause,
  Square,
  Plus,
  Trash2,
  Calendar,
  Tag,
  CheckCircle2,
  Sparkles,
  BarChart3,
  TrendingUp,
  Download,
  Filter,
  X,
  Edit2,
  FolderKanban,
} from 'lucide-react';
import {
  useTimeTracker,
  formatTimeHoursMinutesSeconds,
  formatHumanDuration,
} from '../../modules/timeTracker/timeTrackerStore';
import { TimeEntry, TimeTrackerStats } from '../../modules/timeTracker/types';
import { useKanban } from '../../modules/kanban/kanbanStore';
import { useFinancial } from '../../context/FinancialContext';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Geral: { bg: 'bg-slate-500/15', text: 'text-slate-300', border: 'border-slate-500/30' },
  Desenvolvimento: { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/30' },
  Estudos: { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30' },
  Finanças: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  Design: { bg: 'bg-pink-500/15', text: 'text-pink-300', border: 'border-pink-500/30' },
  Reunião: { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30' },
};

export const TimeTrackerTab: React.FC = () => {
  const {
    isRunning,
    activeTaskTitle,
    activeTaskId,
    category,
    formattedTime,
    elapsedSeconds,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopAndSave,
    discard,
  } = useTimeTracker();

  const { tasks } = useKanban();
  const { showToast, setCurrentView } = useFinancial();

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [stats, setStats] = useState<TimeTrackerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [quickInput, setQuickInput] = useState('');
  const [quickCategory, setQuickCategory] = useState('Geral');
  const [activeSessionNotes, setActiveSessionNotes] = useState('');

  // Manual modal state
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualCategory, setManualCategory] = useState('Geral');
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualStart, setManualStart] = useState('09:00');
  const [manualEnd, setManualEnd] = useState('10:00');
  const [manualNotes, setManualNotes] = useState('');

  // Category filter
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');

  const loadData = useCallback(async () => {
    if (!window.electronAPI) return;
    try {
      setIsLoading(true);
      const [allEntries, calculatedStats] = await Promise.all([
        window.electronAPI.getTimeEntries ? window.electronAPI.getTimeEntries() : [],
        window.electronAPI.getTimeTrackerStats ? window.electronAPI.getTimeTrackerStats() : null,
      ]);
      setEntries(allEntries || []);
      setStats(calculatedStats);
    } catch (e) {
      console.error('Error loading time entries:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const handleSaved = () => loadData();
    window.addEventListener('orbitron:time-entry-saved', handleSaved);
    return () => {
      window.removeEventListener('orbitron:time-entry-saved', handleSaved);
    };
  }, [loadData]);

  const handleStartFromInput = (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickInput.trim() || 'Nova Tarefa';
    startTracking(title, null, quickCategory);
    setQuickInput('');
    showToast(`Rastreador iniciado: "${title}"`, 'info');
  };

  const handleStopActive = async () => {
    const saved = await stopAndSave(activeSessionNotes);
    setActiveSessionNotes('');
    if (saved) {
      showToast(`Sessão salva: ${formatHumanDuration(saved.durationSeconds)}`, 'success');
      loadData();
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.electronAPI?.deleteTimeEntry) return;
    if (confirm('Tem certeza que deseja excluir este registro de tempo?')) {
      await window.electronAPI.deleteTimeEntry(id);
      showToast('Registro excluído com sucesso.', 'info');
      loadData();
    }
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) {
      showToast('Informe o título da tarefa.', 'error');
      return;
    }

    const startDate = new Date(`${manualDate}T${manualStart}:00`);
    const endDate = new Date(`${manualDate}T${manualEnd}:00`);
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();

    if (endMs <= startMs) {
      showToast('O horário de término deve ser posterior ao início.', 'error');
      return;
    }

    const durationSeconds = Math.floor((endMs - startMs) / 1000);

    if (window.electronAPI?.createTimeEntry) {
      await window.electronAPI.createTimeEntry({
        taskTitle: manualTitle.trim(),
        category: manualCategory,
        startedAt: startMs,
        endedAt: endMs,
        durationSeconds,
        isManual: true,
        notes: manualNotes,
      });
      showToast('Lançamento manual registrado!', 'success');
      setManualModalOpen(false);
      setManualTitle('');
      setManualNotes('');
      loadData();
    }
  };

  // Group entries by Date (YYYY-MM-DD)
  const filteredEntries = entries.filter((e) =>
    selectedFilterCategory === 'all' ? true : e.category === selectedFilterCategory
  );

  const groupedEntries: Record<string, TimeEntry[]> = {};
  for (const entry of filteredEntries) {
    const dateKey = new Date(entry.startedAt).toISOString().split('T')[0];
    if (!groupedEntries[dateKey]) groupedEntries[dateKey] = [];
    groupedEntries[dateKey].push(entry);
  }

  const formatDateHeader = (dateStr: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dateStr === todayStr) return 'Hoje';
    if (dateStr === yesterday) return 'Ontem';

    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="h-full flex flex-col bg-[#0c0c0e] text-slate-100 overflow-y-auto custom-scrollbar p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Clock className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Rastreador de Tempo</h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
              100% Local-First
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cronometre suas tarefas em segundo plano e acompanhe onde suas horas são investidas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setManualModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Lançamento Manual</span>
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Hoje</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {formatHumanDuration(stats?.todaySeconds || 0)}
          </div>
          <div className="text-[11px] text-cyan-400/80 mt-1 font-medium">Horas de foco registradas</div>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Últimos 7 Dias</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {formatHumanDuration(stats?.weekSeconds || 0)}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1 font-medium">Produtividade semanal</div>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Acumulado</span>
            <BarChart3 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {formatHumanDuration(stats?.totalSeconds || 0)}
          </div>
          <div className="text-[11px] text-purple-400/80 mt-1 font-medium">
            {stats?.totalEntries || 0} sessões concluídas
          </div>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Principal Foco</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-white mt-2 truncate">
            {stats?.topTasks?.[0]?.task_title || 'Nenhuma tarefa'}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1 font-medium">
            {stats?.topTasks?.[0] ? formatHumanDuration(stats.topTasks[0].seconds) : 'Comece agora'}
          </div>
        </div>
      </div>

      {/* Main Active Tracker Controller Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/20 rounded-2xl p-6 shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {activeTaskTitle ? (
          // Active / Paused Controller
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isRunning ? 'bg-cyan-400 animate-ping' : 'bg-amber-400'
                  }`}
                />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-300">
                  {isRunning ? 'Sessão em Andamento' : 'Sessão Pausada'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                  {category}
                </span>
              </div>

              <h2 className="text-xl font-bold text-white truncate mt-1">{activeTaskTitle}</h2>

              <input
                type="text"
                placeholder="Anotações rápidas da sessão (opcional)..."
                value={activeSessionNotes}
                onChange={(e) => setActiveSessionNotes(e.target.value)}
                className="mt-3 w-full max-w-lg bg-slate-950/70 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
              <div className="font-mono text-4xl sm:text-5xl font-black text-cyan-400 tracking-wider">
                {formattedTime}
              </div>

              <div className="flex items-center gap-2">
                {isRunning ? (
                  <button
                    type="button"
                    onClick={pauseTracking}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 transition"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pausar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resumeTracking}
                    className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 transition"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Retomar</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleStopActive}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-emerald-950/50"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Salvar Sessão</span>
                </button>

                <button
                  type="button"
                  onClick={discard}
                  title="Descartar sem salvar"
                  className="p-2.5 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Start New Session Bar
          <form onSubmit={handleStartFromInput} className="flex flex-col sm:flex-row gap-3 relative z-10">
            <input
              type="text"
              placeholder="No que você está trabalhando agora?"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-inner"
            />

            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value)}
              className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="Geral">Geral</option>
              <option value="Desenvolvimento">Desenvolvimento</option>
              <option value="Estudos">Estudos</option>
              <option value="Finanças">Finanças</option>
              <option value="Design">Design</option>
              <option value="Reunião">Reunião</option>
            </select>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 text-xs font-black flex items-center justify-center gap-2 transition shadow-lg"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Iniciar Cronômetro</span>
            </button>
          </form>
        )}
      </div>

      {/* History and Timeline Section */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-white">Histórico de Lançamentos</h3>
            <span className="text-xs text-slate-500">({filteredEntries.length} registros)</span>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedFilterCategory}
              onChange={(e) => setSelectedFilterCategory(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="all">Todas as Categorias</option>
              <option value="Geral">Geral</option>
              <option value="Desenvolvimento">Desenvolvimento</option>
              <option value="Estudos">Estudos</option>
              <option value="Finanças">Finanças</option>
              <option value="Design">Design</option>
              <option value="Reunião">Reunião</option>
            </select>
          </div>
        </div>

        {/* Entries List grouped by Day */}
        <div className="space-y-6">
          {Object.entries(groupedEntries).map(([dateKey, dayEntries]) => {
            const dayTotalSeconds = dayEntries.reduce((acc, e) => acc + e.durationSeconds, 0);

            return (
              <div key={dateKey} className="space-y-2">
                <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-400">
                  <span className="text-white">{formatDateHeader(dateKey)}</span>
                  <span className="text-cyan-400 font-mono">
                    Total: {formatHumanDuration(dayTotalSeconds)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {dayEntries.map((entry) => {
                    const catStyle =
                      CATEGORY_COLORS[entry.category || 'Geral'] || CATEGORY_COLORS.Geral;
                    const startTimeStr = new Date(entry.startedAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const endTimeStr = new Date(entry.endedAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={entry.id}
                        className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-white/10 transition flex items-center justify-between gap-4 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                            <Clock className="w-4 h-4 text-cyan-400" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-100 truncate">
                                {entry.taskTitle}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                              >
                                {entry.category}
                              </span>
                              {entry.isPomodoro && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                  🍅 Pomodoro
                                </span>
                              )}
                              {entry.isManual && (
                                <span className="text-[10px] font-medium text-slate-500">
                                  (Manual)
                                </span>
                              )}
                            </div>

                            {entry.notes && (
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {entry.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <div className="font-mono text-sm font-bold text-white">
                              {formatHumanDuration(entry.durationSeconds)}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {startTimeStr} - {endTimeStr}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteEntry(entry.id)}
                            title="Excluir lançamento"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredEntries.length === 0 && !isLoading && (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-400">Nenhum registro de tempo</div>
              <p className="text-xs text-slate-500 mt-1">
                Inicie um cronômetro acima ou faça um lançamento manual.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Entry Modal */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Adicionar Registro Manual</h3>
              </div>
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome da Tarefa *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Reunião com Cliente, Pesquisa..."
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Geral">Geral</option>
                  <option value="Desenvolvimento">Desenvolvimento</option>
                  <option value="Estudos">Estudos</option>
                  <option value="Finanças">Finanças</option>
                  <option value="Design">Design</option>
                  <option value="Reunião">Reunião</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Data</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Horário Início
                  </label>
                  <input
                    type="time"
                    value={manualStart}
                    onChange={(e) => setManualStart(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Horário Término
                  </label>
                  <input
                    type="time"
                    value={manualEnd}
                    onChange={(e) => setManualEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notas / Resumo
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalhes opcionais do trabalho..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold"
                >
                  Salvar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
