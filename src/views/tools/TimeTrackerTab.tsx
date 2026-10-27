import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Pin,
  Minimize2,
  PieChart as PieChartIcon,
  Timer,
  ChevronDown,
  Layers,
  FileSpreadsheet,
  Briefcase,
  Zap,
  Palette,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  useTimeTracker,
  formatTimeHoursMinutesSeconds,
  formatHumanDuration,
} from '../../modules/timeTracker/timeTrackerStore';
import { TimeEntry, TimeTrackerStats, TimeCategory, TimeWorkType, TIME_WORK_TYPES } from '../../modules/timeTracker/types';
import { useKanban } from '../../modules/kanban/kanbanStore';
import { useFinancial } from '../../context/FinancialContext';
import { useAlwaysOnTop } from '../../hooks/useAlwaysOnTop';
import { FreelaProfitabilitySection } from './timeTracker/FreelaProfitabilitySection';
import { TimeBlockingGrid } from './timeTracker/TimeBlockingGrid';
import { BurnoutShieldCard } from './timeTracker/BurnoutShieldCard';

type PeriodOption = 'today' | 'yesterday' | 'week' | 'month' | 'last30' | 'custom';

const COLOR_SWATCHES = [
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#3b82f6', // blue
  '#64748b', // slate
];

export const TimeTrackerTab: React.FC = () => {
  const {
    isRunning,
    activeTaskTitle,
    activeTaskId,
    category,
    workType,
    startedAt,
    formattedTime,
    elapsedSeconds,
    categories,
    startTracking,
    pauseTracking,
    resumeTracking,
    stopAndSave,
    discard,
    addCategory,
    updateCategory,
    deleteCategory,
    setWorkType,
  } = useTimeTracker();

  const { tasks } = useKanban();
  const { showToast, setCurrentView } = useFinancial();
  const { isAlwaysOnTop, toggleAlwaysOnTop } = useAlwaysOnTop();

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [stats, setStats] = useState<TimeTrackerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [quickInput, setQuickInput] = useState('');
  const [quickCategory, setQuickCategory] = useState('Geral');
  const [quickWorkType, setQuickWorkType] = useState<TimeWorkType>('Profissional - Contratado');
  const [activeSessionNotes, setActiveSessionNotes] = useState('');

  // Category Manager Modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#06b6d4');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // Manual modal state
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualCategory, setManualCategory] = useState('Geral');
  const [manualWorkType, setManualWorkType] = useState<TimeWorkType>('Profissional - Contratado');
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualStart, setManualStart] = useState('09:00');
  const [manualEnd, setManualEnd] = useState('10:00');
  const [manualNotes, setManualNotes] = useState('');

  // Edit modal state
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Geral');
  const [editWorkType, setEditWorkType] = useState<TimeWorkType>('Profissional - Contratado');
  const [editDate, setEditDate] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Period Filter & Custom Dates
  const [period, setPeriod] = useState<PeriodOption>('week');
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Filters
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');
  const [selectedFilterWorkType, setSelectedFilterWorkType] = useState<string>('all');

  // Sub-tab: 'tracker' (Rastreador & Grade) vs 'freela' (Rentabilidade de Freelas)
  const [subTab, setSubTab] = useState<'tracker' | 'freela'>('tracker');
  // Timeline View: 'list' (Tabela detalhada) vs 'grid' (Time Blocking)
  const [timelineView, setTimelineView] = useState<'list' | 'grid'>('list');

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
    startTracking(title, null, quickCategory, null, quickWorkType);
    setQuickInput('');
    showToast(`Rastreador iniciado: "${title}" (${quickWorkType})`, 'info');
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

  const openEditModal = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditTitle(entry.taskTitle);
    setEditCategory(entry.category || 'Geral');
    setEditWorkType(entry.workType || 'Profissional - Contratado');

    const startDate = new Date(entry.startedAt);
    const endDate = new Date(entry.endedAt || entry.startedAt + entry.durationSeconds * 1000);

    const pad = (n: number) => String(n).padStart(2, '0');
    setEditDate(
      `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`
    );
    setEditStart(`${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`);
    setEditEnd(`${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`);
    setEditNotes(entry.notes || '');
  };

  const handleUpdateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;
    if (!editTitle.trim()) {
      showToast('Informe o título da tarefa.', 'error');
      return;
    }

    const startDate = new Date(`${editDate}T${editStart}:00`);
    const endDate = new Date(`${editDate}T${editEnd}:00`);
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();

    if (endMs <= startMs) {
      showToast('O horário de término deve ser posterior ao início.', 'error');
      return;
    }

    const durationSeconds = Math.floor((endMs - startMs) / 1000);

    if (window.electronAPI?.updateTimeEntry) {
      try {
        await window.electronAPI.updateTimeEntry(editingEntry.id, {
          taskTitle: editTitle.trim(),
          category: editCategory,
          workType: editWorkType,
          startedAt: startMs,
          endedAt: endMs,
          durationSeconds,
          notes: editNotes,
        });
        showToast('Registro de tempo atualizado com sucesso!', 'success');
        setEditingEntry(null);
        loadData();
      } catch (err: any) {
        showToast(err.message || 'Erro ao atualizar registro.', 'error');
      }
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
        workType: manualWorkType,
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

  const getWorkTypeBadgeStyle = (type?: string) => {
    switch (type) {
      case 'Profissional - Freela':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Projeto Pessoal':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      default:
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
    }
  };

  const getWorkTypeIcon = (type?: string) => {
    switch (type) {
      case 'Profissional - Freela':
        return <Zap className="w-2.5 h-2.5 text-amber-400" />;
      case 'Projeto Pessoal':
        return <Sparkles className="w-2.5 h-2.5 text-purple-400" />;
      default:
        return <Briefcase className="w-2.5 h-2.5 text-sky-400" />;
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      addCategory(newCatName.trim(), newCatColor);
      setNewCatName('');
      showToast(`Categoria "${newCatName.trim()}" criada!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Erro ao criar categoria.', 'error');
    }
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    if (confirm(`Excluir a categoria "${catName}"?`)) {
      deleteCategory(catId);
      showToast(`Categoria "${catName}" removida.`, 'info');
    }
  };

  // Category Color Map Lookup
  const getCategoryColor = useCallback(
    (catName?: string | null): string => {
      if (!catName || typeof catName !== 'string') return '#06b6d4';
      if (!categories || !Array.isArray(categories)) return '#06b6d4';
      const match = categories.find(
        (c) => c && c.name && c.name.toLowerCase() === catName.toLowerCase()
      );
      return match ? match.color : '#06b6d4';
    },
    [categories]
  );

  // Filter entries based on Selected Period
  const periodFilteredEntries = useMemo(() => {
    const now = new Date();

    let startMs = 0;
    let endMs = Infinity;

    if (period === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startMs = today.getTime();
    } else if (period === 'yesterday') {
      const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startMs = yesterdayStart.getTime();
      endMs = yesterdayEnd.getTime();
    } else if (period === 'week') {
      startMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    } else if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startMs = startOfMonth.getTime();
    } else if (period === 'last30') {
      startMs = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    } else if (period === 'custom') {
      startMs = new Date(`${customStartDate}T00:00:00`).getTime();
      endMs = new Date(`${customEndDate}T23:59:59`).getTime();
    }

    return entries.filter((e) => {
      if (!e) return false;
      const matchesPeriod = e.startedAt >= startMs && e.startedAt <= endMs;
      const matchesCategory =
        selectedFilterCategory === 'all' ? true : e.category === selectedFilterCategory;
      const entryWorkType = e.workType || 'Profissional - Contratado';
      const matchesWorkType =
        selectedFilterWorkType === 'all' ? true : entryWorkType === selectedFilterWorkType;
      return matchesPeriod && matchesCategory && matchesWorkType;
    });
  }, [entries, period, customStartDate, customEndDate, selectedFilterCategory, selectedFilterWorkType]);

  // Aggregate Stats for Selected Period
  const periodTotalSeconds = useMemo(() => {
    return periodFilteredEntries.reduce((acc, e) => acc + (Number(e?.durationSeconds) || 0), 0);
  }, [periodFilteredEntries]);

  // Chart 1: Category Distribution (Pie/Donut Chart)
  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of periodFilteredEntries) {
      if (!e) continue;
      const c = e.category || 'Geral';
      map[c] = (map[c] || 0) + (Number(e.durationSeconds) || 0);
    }

    return Object.entries(map).map(([name, seconds]) => {
      const pct = periodTotalSeconds > 0 ? Math.round((seconds / periodTotalSeconds) * 100) : 0;
      return {
        name,
        value: seconds,
        hours: (seconds / 3600).toFixed(1),
        percentage: pct,
        color: getCategoryColor(name),
      };
    });
  }, [periodFilteredEntries, periodTotalSeconds, getCategoryColor]);

  // Chart 2: Daily Evolution (Bar Chart)
  const dailyChartData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of periodFilteredEntries) {
      if (!e || !e.startedAt) continue;
      try {
        const d = new Date(e.startedAt);
        if (isNaN(d.getTime())) continue;
        const dateKey = d.toISOString().split('T')[0];
        map[dateKey] = (map[dateKey] || 0) + (Number(e.durationSeconds) || 0);
      } catch {}
    }

    // Sort ascending by date
    return Object.keys(map)
      .sort()
      .map((dateKey) => {
        const parts = dateKey.split('-');
        const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateKey;
        const totalSecs = map[dateKey];
        return {
          date: label,
          fullDate: dateKey,
          hours: Number((totalSecs / 3600).toFixed(2)),
          durationLabel: formatHumanDuration(totalSecs),
        };
      });
  }, [periodFilteredEntries]);

  // Ranking of Top Tasks in the Period
  const topTasksRank = useMemo(() => {
    const map: Record<string, { seconds: number; count: number; category: string }> = {};
    for (const e of periodFilteredEntries) {
      const key = e.taskTitle || 'Tarefa Geral';
      if (!map[key]) {
        map[key] = { seconds: 0, count: 0, category: e.category || 'Geral' };
      }
      map[key].seconds += e.durationSeconds;
      map[key].count++;
    }

    return Object.entries(map)
      .map(([taskTitle, data]) => ({
        taskTitle,
        seconds: data.seconds,
        count: data.count,
        category: data.category,
        percentage:
          periodTotalSeconds > 0 ? Math.round((data.seconds / periodTotalSeconds) * 100) : 0,
      }))
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 8);
  }, [periodFilteredEntries, periodTotalSeconds]);

  // Group entries by Date (YYYY-MM-DD)
  const groupedEntries: Record<string, TimeEntry[]> = useMemo(() => {
    const res: Record<string, TimeEntry[]> = {};
    for (const entry of periodFilteredEntries) {
      const dateKey = new Date(entry.startedAt).toISOString().split('T')[0];
      if (!res[dateKey]) res[dateKey] = [];
      res[dateKey].push(entry);
    }
    return res;
  }, [periodFilteredEntries]);

  // Export CSV Report
  const handleExportCSV = () => {
    if (periodFilteredEntries.length === 0) {
      showToast('Nenhum registro para exportar no período selecionado.', 'info');
      return;
    }

    const headers = [
      'Data',
      'Horario Inicio',
      'Horario Termino',
      'Duracao (Segundos)',
      'Duracao Formatada',
      'Tarefa',
      'Categoria',
      'Tipo',
      'Pomodoro',
      'Manual',
      'Notas',
    ];

    const rows = periodFilteredEntries.map((e) => {
      const dateStr = new Date(e.startedAt).toLocaleDateString('pt-BR');
      const startStr = new Date(e.startedAt).toLocaleTimeString('pt-BR');
      const endStr = new Date(e.endedAt).toLocaleTimeString('pt-BR');
      return [
        `"${dateStr}"`,
        `"${startStr}"`,
        `"${endStr}"`,
        e.durationSeconds,
        `"${formatHumanDuration(e.durationSeconds)}"`,
        `"${e.taskTitle.replace(/"/g, '""')}"`,
        `"${e.category || 'Geral'}"`,
        `"${e.workType || 'Profissional - Contratado'}"`,
        e.isPomodoro ? 'Sim' : 'Nao',
        e.isManual ? 'Sim' : 'Nao',
        `"${(e.notes || '').replace(/"/g, '""')}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_tempo_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Relatório CSV exportado com sucesso!', 'success');
  };

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
    <div className="h-full flex flex-col bg-[#0c0c0e] text-slate-100 overflow-y-auto custom-scrollbar p-6 space-y-6">
      {/* Top Header & Always on Top */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Clock className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Rastreador de Tempo</h1>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
              100% Local-First
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Registro de horas imune a drift e minimização, gráficos visuais e relatórios detalhados.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Always on top toggle button */}
          <button
            onClick={toggleAlwaysOnTop}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
              isAlwaysOnTop
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/80 hover:bg-slate-800 border-white/10 text-slate-300 hover:text-white'
            }`}
            title={
              isAlwaysOnTop
                ? 'Janela fixada no topo (Always on Top ativo). Clique para desafixar.'
                : 'Fixar janela sempre à frente dos outros programas (Always on Top)'
            }
          >
            <Pin className={`w-3.5 h-3.5 ${isAlwaysOnTop ? 'fill-current rotate-45 text-amber-400' : ''}`} />
            <span className="hidden sm:inline">
              {isAlwaysOnTop ? 'Janela Fixada' : 'Fixar no Topo'}
            </span>
          </button>

          {/* Mini Player Mode button */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('orbitron:toggle-mini-mode'))}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition bg-purple-500/15 hover:bg-purple-500/25 border-purple-500/30 text-purple-300 hover:text-white"
            title="Alternar para o Mini Player flutuante (Ctrl+Shift+M)"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mini Player</span>
          </button>

          {/* Manage Categories Button */}
          <button
            type="button"
            onClick={() => setCategoryModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition"
            title="Adicionar ou remover categorias de tarefas"
          >
            <Tag className="w-3.5 h-3.5 text-purple-400" />
            <span>Categorias ({categories.length})</span>
          </button>

          {/* Manual Entry Button */}
          <button
            type="button"
            onClick={() => setManualModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Lançamento Manual</span>
          </button>

          {/* Export CSV Report Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition"
            title="Exportar dados do período em planilha CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2 bg-slate-950 border border-white/10 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setSubTab('tracker')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
              subTab === 'tracker'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Rastreador & Grade Diária</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('freela')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
              subTab === 'freela'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Rentabilidade Real de Freelas</span>
          </button>
        </div>
      </div>

      {subTab === 'freela' ? (
        <FreelaProfitabilitySection
          onStartTrackingProject={(pName) => {
            startTracking(`Freela: ${pName}`, null, 'Desenvolvimento', pName, 'Profissional - Freela');
            setSubTab('tracker');
            showToast(`Rastreador iniciado para o projeto "${pName}"`, 'info');
          }}
          showToast={showToast}
        />
      ) : (
        <>
          {/* Main Active Tracker Controller Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
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
                  {isRunning ? 'Sessão em Andamento (Tempo Real)' : 'Sessão Pausada'}
                </span>
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full border font-bold"
                  style={{
                    backgroundColor: `${getCategoryColor(category)}20`,
                    borderColor: `${getCategoryColor(category)}40`,
                    color: getCategoryColor(category),
                  }}
                >
                  {category}
                </span>

                {/* Active Session WorkType Selector */}
                <select
                  value={workType || 'Profissional - Contratado'}
                  onChange={(e) => setWorkType(e.target.value as TimeWorkType)}
                  className={`text-xs px-2.5 py-0.5 rounded-full border font-bold bg-slate-950/80 outline-none cursor-pointer transition ${getWorkTypeBadgeStyle(
                    workType || 'Profissional - Contratado'
                  )}`}
                  title="Alterar tipo de atividade da sessão atual"
                >
                  {TIME_WORK_TYPES.map((wt) => (
                    <option key={wt} value={wt} className="bg-slate-900 text-white font-medium">
                      {wt}
                    </option>
                  ))}
                </select>
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
              {/* Giant real-time glowing timer */}
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
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={quickWorkType}
              onChange={(e) => setQuickWorkType(e.target.value as TimeWorkType)}
              className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition font-medium"
            >
              {TIME_WORK_TYPES.map((wt) => (
                <option key={wt} value={wt}>
                  {wt}
                </option>
              ))}
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

      {/* Burnout Shield & Weekly Hour Budgets */}
      <BurnoutShieldCard entries={entries} />

      {/* Period Selector & Report Filter Bar */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>Período:</span>
          </span>

          {(
            [
              ['today', 'Hoje'],
              ['yesterday', 'Ontem'],
              ['week', 'Esta Semana'],
              ['month', 'Este Mês'],
              ['last30', 'Últimos 30 Dias'],
              ['custom', 'Personalizado'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                period === key
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-750'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers (if Custom period selected) */}
        {period === 'custom' && (
          <div className="flex items-center gap-2 animate-fade-in">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-slate-950 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            <span className="text-xs text-slate-500">até</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-slate-950 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedFilterCategory}
              onChange={(e) => setSelectedFilterCategory(e.target.value)}
              className="bg-slate-950 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Work Type Filter */}
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedFilterWorkType}
              onChange={(e) => setSelectedFilterWorkType(e.target.value)}
              className="bg-slate-950 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition font-medium"
            >
              <option value="all">Todos os Tipos</option>
              {TIME_WORK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Metrics for Selected Period */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Tempo no Período</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {formatHumanDuration(periodTotalSeconds)}
          </div>
          <div className="text-[11px] text-cyan-400/80 mt-1 font-medium">
            {periodFilteredEntries.length} sessões registradas
          </div>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Categoria Principal</span>
            <PieChartIcon className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-white mt-2 truncate">
            {categoryChartData[0]?.name || 'Nenhuma'}
          </div>
          <div className="text-[11px] text-purple-400/80 mt-1 font-medium">
            {categoryChartData[0] ? `${categoryChartData[0].percentage}% do tempo` : 'Sem registros'}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Tarefa de Maior Foco</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-white mt-2 truncate">
            {topTasksRank[0]?.taskTitle || 'Nenhuma'}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1 font-medium">
            {topTasksRank[0] ? formatHumanDuration(topTasksRank[0].seconds) : 'Comece agora'}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Média por Sessão</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {periodFilteredEntries.length > 0
              ? formatHumanDuration(Math.round(periodTotalSeconds / periodFilteredEntries.length))
              : '0s'}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1 font-medium">Duração média</div>
        </div>
      </div>

      {/* Analytics Charts Section (Where Time Goes) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Category Distribution */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Distribuição por Categoria</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {formatHumanDuration(periodTotalSeconds)}
            </span>
          </div>

          {categoryChartData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4 flex-1">
              <div className="w-48 h-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-2.5 rounded-xl bg-slate-950 border border-white/15 shadow-xl text-xs">
                              <span className="font-bold text-white">{data.name}</span>
                              <div className="text-slate-300 font-mono mt-0.5">
                                {formatHumanDuration(data.value)} ({data.percentage}%)
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="flex-1 space-y-2 w-full">
                {categoryChartData.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-slate-300 truncate">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono shrink-0 ml-2">
                      <span className="text-white font-bold">{formatHumanDuration(c.value)}</span>
                      <span className="text-slate-500 text-[11px]">({c.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500 text-xs">
              <PieChartIcon className="w-8 h-8 text-slate-600 mb-2" />
              <span>Nenhum dado registrado para este período.</span>
            </div>
          )}
        </div>

        {/* Chart 2: Daily Evolution Bar Chart */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Evolução de Horas por Dia</h3>
            </div>
            <span className="text-xs text-slate-400">Total: {formatHumanDuration(periodTotalSeconds)}</span>
          </div>

          {dailyChartData.length > 0 ? (
            <div className="h-52 w-full flex-1">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="h" />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-white/15 shadow-xl text-xs">
                            <span className="font-bold text-white">{data.fullDate}</span>
                            <div className="text-cyan-400 font-mono mt-0.5">{data.durationLabel}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="hours" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500 text-xs">
              <BarChart3 className="w-8 h-8 text-slate-600 mb-2" />
              <span>Nenhum dado registrado para este período.</span>
            </div>
          )}
        </div>
      </div>

      {/* Top Tasks Ranking in Period */}
      {topTasksRank.length > 0 && (
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Onde Você Mais Focou no Período</h3>
            </div>
            <span className="text-xs text-slate-400">Top {topTasksRank.length} tarefas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topTasksRank.map((t, idx) => (
              <div
                key={t.taskTitle}
                className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-[10px] font-mono font-bold text-slate-400 shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white truncate">{t.taskTitle}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400 shrink-0">
                    {formatHumanDuration(t.seconds)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${t.percentage}%`,
                      backgroundColor: getCategoryColor(t.category),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed History & Time Blocking Section */}
      <div className="flex-1 flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-white/[0.08] gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-white">Linha do Tempo</h3>
            <span className="text-xs text-slate-500">({periodFilteredEntries.length} registros)</span>
          </div>

          {/* Toggle between List and Time Blocking Grid */}
          <div className="flex items-center bg-slate-950 border border-white/10 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setTimelineView('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                timelineView === 'list'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Lista Cronológica</span>
            </button>
            <button
              type="button"
              onClick={() => setTimelineView('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                timelineView === 'grid'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Grade Diária (Time Blocking)</span>
            </button>
          </div>
        </div>

        {timelineView === 'grid' ? (
          <TimeBlockingGrid
            entries={entries}
            categories={categories}
            activeRunning={
              isRunning && startedAt
                ? {
                    taskTitle: activeTaskTitle,
                    startedAt,
                    category,
                    workType,
                    elapsedSeconds,
                  }
                : null
            }
            onEditEntry={openEditModal}
            onAddManual={(date, hour) => {
              setManualDate(date);
              setManualStart(hour);
              const [h, m] = hour.split(':').map(Number);
              const endH = (h + 1) % 24;
              const pad = (n: number) => String(n).padStart(2, '0');
              setManualEnd(`${pad(endH)}:${pad(m || 0)}`);
              setManualModalOpen(true);
            }}
          />
        ) : (
          /* Entries List grouped by Day */
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
                    const catColor = getCategoryColor(entry.category || 'Geral');
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
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-slate-100 truncate">
                                {entry.taskTitle}
                              </span>
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                                style={{
                                  backgroundColor: `${catColor}18`,
                                  borderColor: `${catColor}40`,
                                  color: catColor,
                                }}
                              >
                                {entry.category}
                              </span>

                              {/* Work Type Badge */}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${getWorkTypeBadgeStyle(
                                  entry.workType || 'Profissional - Contratado'
                                )}`}
                              >
                                {getWorkTypeIcon(entry.workType || 'Profissional - Contratado')}
                                <span>{entry.workType || 'Profissional - Contratado'}</span>
                              </span>
                              {entry.isPomodoro && (
                                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                  <Timer className="w-2.5 h-2.5 text-rose-400" />
                                  <span>Pomodoro</span>
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

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(entry)}
                              title="Editar registro de tempo"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

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
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {periodFilteredEntries.length === 0 && !isLoading && (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-400">Nenhum registro para este período</div>
              <p className="text-xs text-slate-500 mt-1">
                Selecione outro período acima ou inicie uma nova sessão.
              </p>
            </div>
          )}
        </div>
        )}
      </div>
      </>
      )}

      {/* Category Manager Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Gerenciar Categorias de Tempo</h3>
              </div>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleCreateCategory} className="space-y-3 pb-4 border-b border-white/[0.08]">
              <label className="block text-xs font-semibold text-slate-300">Nova Categoria</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome da categoria..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>

              {/* Color Swatches */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-400">Cor:</span>
                {COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    onClick={() => setNewCatColor(swatch)}
                    className={`w-5 h-5 rounded-full transition-transform ${
                      newCatColor === swatch ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </div>
            </form>

            {/* Existing Categories List */}
            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                Categorias Atuais ({categories.length})
              </label>

              {categories.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 flex flex-col gap-2 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setEditingCatId(editingCatId === c.id ? null : c.id)}
                        title="Clique para alterar a cor desta categoria"
                        className="group/swatch"
                      >
                        <span
                          className="w-4 h-4 rounded-full block border border-white/20 shadow-sm transition transform hover:scale-125"
                          style={{ backgroundColor: c.color }}
                        />
                      </button>
                      <span className="text-xs font-bold text-white">{c.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingCatId(editingCatId === c.id ? null : c.id)}
                        className={`p-1.5 rounded-lg transition ${
                          editingCatId === c.id
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                        title="Alterar cor da categoria"
                      >
                        <Palette className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(c.id, c.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Excluir categoria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Color Palette Picker when editing this category */}
                  {editingCatId === c.id && (
                    <div className="pt-2 border-t border-white/10 flex items-center gap-1.5 flex-wrap animate-fade-in">
                      <span className="text-[10px] text-slate-400 font-semibold mr-1">Nova Cor:</span>
                      {COLOR_SWATCHES.map((swatch) => (
                        <button
                          key={swatch}
                          type="button"
                          onClick={() => {
                            updateCategory(c.id, { color: swatch });
                            showToast(`Cor da categoria "${c.name}" atualizada!`, 'success');
                            setEditingCatId(null);
                          }}
                          className={`w-5 h-5 rounded-full transition-transform hover:scale-125 ${
                            c.color === swatch ? 'ring-2 ring-white scale-110' : ''
                          }`}
                          style={{ backgroundColor: swatch }}
                          title={`Selecionar ${swatch}`}
                        />
                      ))}
                      <label
                        className="relative cursor-pointer flex items-center justify-center w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition overflow-hidden"
                        title="Cor personalizada (seletor)"
                      >
                        <input
                          type="color"
                          value={c.color || '#06b6d4'}
                          onChange={(e) => {
                            updateCategory(c.id, { color: e.target.value });
                          }}
                          className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                        />
                        <span
                          className="w-full h-full block"
                          style={{ backgroundColor: c.color }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria</label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo</label>
                  <select
                    value={manualWorkType}
                    onChange={(e) => setManualWorkType(e.target.value as TimeWorkType)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                  >
                    {TIME_WORK_TYPES.map((wt) => (
                      <option key={wt} value={wt}>
                        {wt}
                      </option>
                    ))}
                  </select>
                </div>
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

      {/* Edit Past Entry Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Editar Registro de Tempo</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateEntry} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome da Tarefa *
                </label>
                <input
                  type="text"
                  placeholder="Título da tarefa..."
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo</label>
                  <select
                    value={editWorkType}
                    onChange={(e) => setEditWorkType(e.target.value as TimeWorkType)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                  >
                    {TIME_WORK_TYPES.map((wt) => (
                      <option key={wt} value={wt}>
                        {wt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Data</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Horário Início
                  </label>
                  <input
                    type="time"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Horário Término
                  </label>
                  <input
                    type="time"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notas / Observações
                </label>
                <textarea
                  placeholder="Detalhes ou anotações adicionais..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-950/50"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
