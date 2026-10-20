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
} from 'lucide-react';
import { useFinancial, AppView } from '../context/FinancialContext';
import { useHabits } from '../context/HabitsContext';
import pigoIcon from '../assets/pigo-icon.png';

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
  } = useFinancial();

  const { openNewHabitModal, overview } = useHabits();

  // Itens de navegação do Módulo Financeiro
  const financeNavItems: { id: AppView; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'intelligence', label: 'Inteligência', icon: Sparkles },
    { id: 'journey', label: 'Jornada', icon: Trophy },
    { id: 'habits', label: 'Hábitos & Rotina', icon: CheckSquare, badge: overview?.completedToday !== undefined ? `${overview.completedToday}/${overview.total}` : undefined },
    { id: 'transactions', label: 'Lançamentos', icon: ReceiptText },
    { id: 'import', label: 'Importar Extrato', icon: FileSpreadsheet, badge: pendingImportSession ? 'Pendente' : undefined },
    { id: 'accounts', label: 'Contas', icon: Landmark },
    { id: 'cards', label: 'Cartões', icon: CreditCard },
    { id: 'categories', label: 'Categorias', icon: Tag },
    { id: 'budgets', label: 'Orçamentos', icon: Target },
    { id: 'calendar', label: 'Calendário', icon: Calendar },
    { id: 'reserve', label: 'Reserva', icon: ShieldCheck },
    { id: 'goals', label: 'Metas', icon: PiggyBank },
    { id: 'reports', label: 'Relatórios', icon: PieChart },
  ];

  // Itens de navegação do Módulo de Hábitos
  const habitsNavItems: { id: AppView; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'habits', label: 'Meus Hábitos (Hoje)', icon: CheckSquare, badge: overview?.completedToday !== undefined ? `${overview.percentToday}%` : undefined },
    { id: 'journey', label: 'Jornada & Conquistas', icon: Trophy },
    { id: 'dashboard', label: 'Voltar p/ Finanças', icon: WalletCards },
  ];

  const currentNavItems = activeModule === 'habits' ? habitsNavItems : financeNavItems;

  return (
    <aside className="w-64 bg-slate-950/80 border-r border-slate-850 flex flex-col justify-between select-none shrink-0 h-full backdrop-blur-xl">
      {/* Top Branding & Workspace Switcher */}
      <div>
        <div className="p-4 border-b border-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={pigoIcon}
              alt="Pigo Logo"
              className="w-9 h-9 rounded-xl shadow-md object-contain shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black text-white tracking-tight leading-none">
                  PIGO
                </h1>
                <span className="text-[9px] uppercase font-bold tracking-widest px-1 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  {activeModule === 'habits' ? 'Hábitos' : 'Finanças'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                {activeModule === 'habits' ? 'Rastreador de Rotina' : 'Finanças Pessoais'}
              </span>
            </div>
          </div>
        </div>

        {/* Chaveador de Ambiente / Workspace Switcher */}
        <div className="p-3 pb-1">
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveModule('finance')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl transition-all ${
                activeModule === 'finance'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <WalletCards className="w-3.5 h-3.5" />
              <span>Finanças</span>
            </button>
            <button
              onClick={() => setActiveModule('habits')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl transition-all ${
                activeModule === 'habits'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-300" />
              <span>Hábitos</span>
            </button>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="p-3 pt-2">
          {activeModule === 'habits' ? (
            <button
              onClick={() => openNewHabitModal()}
              className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Novo Hábito
            </button>
          ) : (
            <button
              onClick={() => openNewTransaction()}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-600/20 active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              Novo lançamento
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-270px)]">
          {currentNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? activeModule === 'habits'
                      ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm'
                      : 'bg-brand-500/10 text-brand-400 font-semibold border border-brand-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? (activeModule === 'habits' ? 'text-cyan-400' : 'text-brand-400') : 'text-slate-400'}`} />
                <span className="flex-1 text-left truncate">{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / System status & Settings */}
      <div className="p-3 border-t border-slate-900 space-y-1">
        <button
          onClick={() => setCurrentView('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            currentView === 'settings'
              ? 'bg-brand-500/10 text-brand-400 font-semibold border border-brand-500/20 shadow-sm'
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
        <div className="px-3 py-1 flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <WifiOff className="w-3 h-3 text-emerald-500" />
            <span>100% Offline</span>
          </div>
          <span className="font-mono text-[9px]">v1.2.0</span>
        </div>
      </div>
    </aside>
  );
};
