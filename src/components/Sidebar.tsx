import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  Landmark,
  CreditCard,
  Target,
  Calendar,
  PiggyBank,
  Trophy,
  ShieldCheck,
  PieChart,
  Settings as SettingsIcon,
  PlusCircle,
  Lock,
  WalletCards,
  WifiOff,
  Tag,
  FileSpreadsheet,
  Sparkles,
  CheckSquare,
  Flame,
  Plus,
  Grid,
  ListTodo,
  SlidersHorizontal,
  Swords,
  History,
  Crown,
} from 'lucide-react';
import { useFinancial, AppView, AppModule } from '../context/FinancialContext';
import { useHabits } from '../context/HabitsContext';
import pigoIcon from '../assets/pigo-icon.png';

interface NavItem {
  id: AppView;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const MODULE_META: Record<
  AppModule,
  {
    badge: string;
    subtitle: string;
    badgeClass: string;
    activeItemClass: string;
    activeIconClass: string;
    badgePillClass: string;
  }
> = {
  finance: {
    badge: 'Finanças',
    subtitle: 'Gestão Patrimonial',
    badgeClass: 'bg-brand-500/15 text-brand-400 border-brand-500/30',
    activeItemClass: 'bg-brand-500/12 text-brand-300 font-semibold border border-brand-500/25 shadow-sm',
    activeIconClass: 'text-brand-400',
    badgePillClass: 'bg-brand-500/15 text-brand-300 border-brand-500/30',
  },
  habits: {
    badge: 'Hábitos',
    subtitle: 'Rotina & Disciplina',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    activeItemClass: 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm',
    activeIconClass: 'text-cyan-400',
    badgePillClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  },
  journey: {
    badge: 'Jornada',
    subtitle: 'Nível & Troféus',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    activeItemClass: 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30 shadow-sm',
    activeIconClass: 'text-amber-400',
    badgePillClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
};

export const Sidebar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    activeModule,
    setActiveModule,
    openNewTransaction,
    settings,
    lockApp,
    pendingImportSession,
    game,
  } = useFinancial();

  const { openNewHabitModal, overview, habits } = useHabits();

  const unlockedAchievements = game ? game.achievements.filter((a) => a.unlocked).length : 0;
  const totalAchievements = game ? game.achievements.length : 0;
  const activeMissionsCompleted = game ? game.missions.current.filter((m) => m.status === 'completed').length : 0;
  const activeMissionsTotal = game ? game.missions.current.length : 0;

  // Seções do Módulo Financeiro (Organizadas em 4 grupos claros)
  const financeSections: NavSection[] = [
    {
      title: 'Visão Geral',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'intelligence', label: 'Inteligência', icon: Sparkles },
        { id: 'reports', label: 'Relatórios', icon: PieChart },
      ],
    },
    {
      title: 'Movimentações',
      items: [
        { id: 'transactions', label: 'Lançamentos', icon: ReceiptText },
        { id: 'calendar', label: 'Calendário', icon: Calendar },
        {
          id: 'import',
          label: 'Importar Extrato',
          icon: FileSpreadsheet,
          badge: pendingImportSession ? 'Pendente' : undefined,
        },
      ],
    },
    {
      title: 'Carteira',
      items: [
        { id: 'accounts', label: 'Contas Bancárias', icon: Landmark },
        { id: 'cards', label: 'Cartões de Crédito', icon: CreditCard },
      ],
    },
    {
      title: 'Planejamento',
      items: [
        { id: 'budgets', label: 'Orçamentos', icon: Target },
        { id: 'reserve', label: 'Reserva de Emergência', icon: ShieldCheck },
        { id: 'goals', label: 'Metas Financeiras', icon: PiggyBank },
        { id: 'categories', label: 'Categorias', icon: Tag },
      ],
    },
  ];

  // Seções do Módulo de Hábitos
  const habitsSections: NavSection[] = [
    {
      title: 'Execução Diária',
      items: [
        {
          id: 'habits',
          label: 'Hoje (Check-in)',
          icon: ListTodo,
          badge: overview ? `${overview.completedToday}/${overview.total}` : undefined,
        },
        {
          id: 'habits_week',
          label: 'Grade Semanal (7d)',
          icon: Calendar,
        },
      ],
    },
    {
      title: 'Evolução & Gestão',
      items: [
        {
          id: 'habits_analytics',
          label: 'Consistência & Mapas',
          icon: Grid,
          badge: overview?.bestStreak ? `${overview.bestStreak}d 🔥` : undefined,
        },
        {
          id: 'habits_manage',
          label: 'Meus Hábitos',
          icon: SlidersHorizontal,
          badge: habits.length > 0 ? `${habits.length}` : undefined,
        },
      ],
    },
  ];

  // Seções do Módulo Jornada
  const journeySections: NavSection[] = [
    {
      title: 'Seu Progresso',
      items: [
        {
          id: 'journey',
          label: 'Visão Geral & Nível',
          icon: Crown,
          badge: game ? `Nv. ${game.level}` : undefined,
        },
        {
          id: 'journey_missions',
          label: 'Missões da Semana',
          icon: Swords,
          badge: activeMissionsTotal > 0 ? `${activeMissionsCompleted}/${activeMissionsTotal}` : undefined,
        },
      ],
    },
    {
      title: 'Sala de Troféus',
      items: [
        {
          id: 'journey_achievements',
          label: 'Conquistas',
          icon: Trophy,
          badge: totalAchievements > 0 ? `${unlockedAchievements}/${totalAchievements}` : undefined,
        },
        {
          id: 'journey_history',
          label: 'Histórico de XP',
          icon: History,
        },
      ],
    },
  ];

  const currentSections =
    activeModule === 'habits'
      ? habitsSections
      : activeModule === 'journey'
      ? journeySections
      : financeSections;

  const meta = MODULE_META[activeModule];

  return (
    <aside className="w-64 bg-slate-950/90 border-r border-slate-800/80 flex flex-col justify-between select-none shrink-0 h-full backdrop-blur-xl">
      {/* Top Branding & Module Switcher */}
      <div className="flex flex-col min-h-0 flex-1">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={pigoIcon}
              alt="Pigo Logo"
              className="w-9 h-9 rounded-xl shadow-md object-contain shrink-0 ring-1 ring-white/10"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black text-white tracking-tight leading-none">
                  PIGO
                </h1>
                <span
                  className={`text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded border transition-colors ${meta.badgeClass}`}
                >
                  {meta.badge}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                {meta.subtitle}
              </span>
            </div>
          </div>
        </div>

        {/* 3-Way Module Switcher */}
        <div className="px-3 pt-3 pb-1">
          <div className="grid grid-cols-3 p-1 rounded-2xl bg-slate-900/95 border border-slate-800/90 text-[11px] font-bold gap-0.5">
            <button
              onClick={() => setActiveModule('finance')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-xl transition-all ${
                activeModule === 'finance'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Ambiente de Finanças Pessoais"
            >
              <WalletCards className="w-3.5 h-3.5 shrink-0" />
              <span>Finanças</span>
            </button>

            <button
              onClick={() => setActiveModule('habits')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-xl transition-all ${
                activeModule === 'habits'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Ambiente de Hábitos & Rotina"
            >
              <CheckSquare className="w-3.5 h-3.5 shrink-0" />
              <span>Hábitos</span>
            </button>

            <button
              onClick={() => setActiveModule('journey')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-xl transition-all ${
                activeModule === 'journey'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Ambiente de Nível, Missões & Conquistas"
            >
              <Trophy className="w-3.5 h-3.5 shrink-0" />
              <span>Jornada</span>
            </button>
          </div>
        </div>

        {/* Contextual Action / Status Widget */}
        <div className="px-3 py-2">
          {activeModule === 'habits' ? (
            <button
              onClick={() => openNewHabitModal()}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Novo Hábito
            </button>
          ) : activeModule === 'journey' ? (
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 border border-amber-500/25">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-amber-300 truncate">{game?.title || 'Iniciante'}</span>
                <span className="font-black text-white bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px] border border-amber-500/30">
                  Nv. {game?.level || 1}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${game?.progressPercent || 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                <span>{game ? `${game.xpIntoLevel}/${game.xpForNext} XP` : '0 XP'}</span>
                <span>{unlockedAchievements}/{totalAchievements} troféus</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => openNewTransaction()}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-600/20 active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              Novo lançamento
            </button>
          )}
        </div>

        {/* Grouped Navigation Sections */}
        <nav className="px-3 py-1 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
          {currentSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? meta.activeItemClass
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? meta.activeIconClass : 'text-slate-400'}`} />
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md border ${meta.badgePillClass}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer / System status & Settings */}
      <div className="p-3 border-t border-slate-900/90 space-y-1">
        <button
          onClick={() => setCurrentView('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            currentView === 'settings'
              ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <SettingsIcon className="w-4 h-4 text-slate-400" />
          <span className="flex-1 text-left">Configurações</span>
        </button>

        {settings?.pinEnabled && (
          <button
            onClick={() => lockApp()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <Lock className="w-4 h-4 text-slate-400" />
            <span className="flex-1 text-left">Bloquear App</span>
          </button>
        )}

        {/* Offline Badge */}
        <div className="px-3 pt-1 flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <WifiOff className="w-3 h-3 text-emerald-500" />
            <span>100% Local-First</span>
          </div>
          <span className="font-mono text-[9px]">v1.3.0</span>
        </div>
      </div>
    </aside>
  );
};
