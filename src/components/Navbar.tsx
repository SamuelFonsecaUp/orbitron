import React, { useState, useEffect } from 'react';
import {
  Minus,
  Square,
  Copy,
  X,
  RefreshCw,
  Bell,
  Printer,
  FileSpreadsheet,
  Sun,
  Moon,
  ChevronRight,
  CheckSquare,
  Eye,
  EyeOff,
  Search,
  Minimize2,
} from 'lucide-react';
import { useFinancial, AppModule } from '../context/FinancialContext';
import { useHabits } from '../context/HabitsContext';
import { XpPill } from './GameWidgets';
import { NavbarTimeTrackerWidget } from './NavbarTimeTrackerWidget';

const MODULE_BADGE: Record<AppModule, { label: string; className: string }> = {
  finance: {
    label: 'Orbit Finanças',
    className: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25',
  },
  habits: {
    label: 'Orbit Hábitos',
    className: 'bg-cyan-500/12 text-cyan-300 border-cyan-500/25',
  },
  tools: {
    label: 'Orbit Ferramentas',
    className: 'bg-purple-500/12 text-purple-300 border-purple-500/25',
  },
  journey: {
    label: 'Orbit Jornada',
    className: 'bg-amber-500/12 text-amber-300 border-amber-500/25',
  },
};

export const Navbar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    activeModule,
    refreshAll,
    isLoading,
    unreadNotificationsCount,
    setNotificationsOpen,
    pendingImportSession,
    theme,
    toggleTheme,
    privacyMode,
    togglePrivacyMode,
  } = useFinancial();
  const { overview } = useHabits();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    async function checkMax() {
      if (window.electronAPI?.isMaximized) {
        const max = await window.electronAPI.isMaximized();
        setIsMaximized(max);
      }
    }
    checkMax();
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };

  const handleMaximize = async () => {
    if (window.electronAPI?.maximizeWindow) {
      const max = await window.electronAPI.maximizeWindow();
      setIsMaximized(max);
    }
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  const viewTitles: Record<string, string> = {
    dashboard: 'Visão Geral',
    intelligence: 'Inteligência Financeira',
    transactions: 'Lançamentos',
    accounts: 'Contas Bancárias',
    cards: 'Cartões de Crédito',
    budgets: 'Orçamentos & Tetos de Gastos',
    calendar: 'Calendário & Projeção Financeira',
    categories: 'Categorias',
    goals: 'Metas Financeiras',
    reserve: 'Reserva de Emergência',
    reports: 'Relatórios & Gráficos',
    import: 'Importar Extrato Bancário (OFX / CSV)',
    habits: 'Hoje • Check-in Diário',
    habits_week: 'Grade Semanal (7 Dias)',
    habits_analytics: 'Consistência & Mapas de Calor',
    habits_intelligence: 'Dashboards & Algoritmos de Consistência',
    habits_manage: 'Meus Hábitos • Catálogo',
    journey: 'Visão Geral & Nível',
    journey_missions: 'Missões da Semana',
    journey_achievements: 'Sala de Troféus & Conquistas',
    journey_history: 'Histórico de XP',
    tools_notes: 'Anotações & Segundo Cérebro',
    tools_mindmap: 'Quadro Branco Interativo',
    tools_kanban: 'Quadro Kanban de Tarefas',
    tools_pomodoro: 'Relógio Pomodoro',
    tools_timetracker: 'Rastreador de Tempo Local',
    tools_vault: 'Cofre de Senhas Criptografado',
    settings: 'Configurações do Sistema',
  };

  const modBadge = MODULE_BADGE[activeModule];

  return (
    <header className="h-12 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between px-4 select-none shrink-0 backdrop-blur-md relative z-20 app-drag">
      {/* Breadcrumb Title Area */}
      <div className="flex items-center gap-2">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${modBadge.className}`}
        >
          {modBadge.label}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <h2 className="text-xs font-bold tracking-wide text-slate-200">
          {viewTitles[currentView] || 'Orbit'}
        </h2>
      </div>

      {/* Actions and Desktop Window Controls */}
      <div className="flex items-center gap-2 app-no-drag">
        {pendingImportSession && currentView !== 'import' && (
          <button
            onClick={() => setCurrentView('import')}
            title="Você tem uma importação em andamento não finalizada"
            className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all animate-pulse"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Continuar Importação</span>
          </button>
        )}

        {/* Quick Habit Progress Pill when outside Habits */}
        {activeModule !== 'habits' && overview && overview.total > 0 && (
          <button
            onClick={() => setCurrentView('habits')}
            title="Progresso dos hábitos de hoje"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-cyan-300 transition-all"
          >
            <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {overview.completedToday}/{overview.total} hábitos
            </span>
          </button>
        )}

        {/* Pinned Time Tracker Widget */}
        <NavbarTimeTrackerWidget />

        <div data-tour="xp-pill" className="inline-flex"><XpPill /></div>

        {/* Global Omnibox Palette Trigger */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('orbitron:open-palette'))}
          title="Paleta de Comandos Global (Ctrl + K)"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800/80 hover:border-slate-700/80 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-all shadow-sm group"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
          <span className="text-slate-300">Buscar</span>
          <kbd className="ml-0.5 text-[9px] px-1.5 py-0.2 bg-slate-800/90 border border-slate-700 text-slate-400 rounded font-mono font-bold">
            Ctrl K
          </kbd>
        </button>

        {/* Privacy Mode (Olho Mágico) Toggle */}
        <button
          data-tour="privacy-toggle" onClick={togglePrivacyMode}
          title={
            privacyMode
              ? 'Mostrar valores financeiros (Alt + P)'
              : 'Modo Privacidade: ocultar valores em R$ (Alt + P)'
          }
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
            privacyMode
              ? 'bg-amber-500/15 border-amber-500/35 text-amber-300 hover:bg-amber-500/25'
              : 'p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-transparent'
          }`}
        >
          {privacyMode ? (
            <>
              <EyeOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Valores Ocultos</span>
            </>
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
        </button>

        <button
          onClick={() => window.print()}
          title="Imprimir / Salvar PDF"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-all"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setNotificationsOpen(true)}
          title="Central de Notificações"
          className="relative p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-all"
        >
          <Bell className="w-3.5 h-3.5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-3.5 px-1 bg-rose-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => refreshAll()}
          disabled={isLoading}
          title="Atualizar dados"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-400' : ''}`} />
        </button>

        {/* Window controls if running inside Electron */}
        <div className="flex items-center ml-2 border-l border-slate-800 pl-2">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('orbitron:toggle-mini-mode'))}
            title="Mini Player Compacto (Always on Top) [Ctrl+Shift+M]"
            className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-purple-500/15 rounded-lg transition-colors mr-0.5"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMinimize}
            title="Minimizar"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            title={isMaximized ? 'Restaurar' : 'Maximizar'}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
          </button>
          <button
            onClick={handleClose}
            title="Fechar"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
