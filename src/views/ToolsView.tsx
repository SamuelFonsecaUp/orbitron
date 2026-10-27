import React from 'react';
import { useFinancial } from '../context/FinancialContext';
import { VaultShell } from '../modules/vault/components/VaultShell';
import { PasswordVaultTab } from './tools/PasswordVaultTab';
import { CanvasHubTab } from './tools/CanvasHubTab';
import { KanbanTab } from './tools/KanbanTab';
import { PomodoroTab } from './tools/PomodoroTab';
import {
  FolderKanban,
  StickyNote,
  Layers,
  KeyRound,
  Columns,
  Timer,
  X,
} from 'lucide-react';

const ToolsViewInner: React.FC = () => {
  const { currentView, setCurrentView } = useFinancial();

  const activeTool: 'notes' | 'mindmap' | 'kanban' | 'pomodoro' | 'vault' =
    currentView === 'tools_mindmap'
      ? 'mindmap'
      : currentView === 'tools_kanban'
      ? 'kanban'
      : currentView === 'tools_pomodoro'
      ? 'pomodoro'
      : currentView === 'tools_vault'
      ? 'vault'
      : 'notes';

  return (
    <div className="space-y-5 pb-8 px-6 pt-4 max-w-[1700px] mx-auto">
      {/* Top Header & Liquid Glass Sub-Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-300 shrink-0 shadow-sm">
              <FolderKanban className="w-5 h-5 block" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">
                Segundo Cérebro & Ferramentas
              </h1>
              <p className="text-xs text-slate-400">
                Anotações em Markdown, Quadro Branco infinito, Kanban de Tarefas, Relógio Pomodoro e Cofre blindado.
              </p>
            </div>
          </div>
        </div>

        {/* Liquid Glass Tool Switcher */}
        <div className="liquid-glass-well p-1.5 rounded-2xl flex items-center gap-1 self-start flex-wrap">
          {[
            { id: 'tools_notes', key: 'notes', label: 'Anotações (Vault)', icon: StickyNote },
            { id: 'tools_mindmap', key: 'mindmap', label: 'Quadro Branco', icon: Layers },
            { id: 'tools_kanban', key: 'kanban', label: 'Quadro Kanban', icon: Columns },
            { id: 'tools_pomodoro', key: 'pomodoro', label: 'Relógio Pomodoro', icon: Timer },
            { id: 'tools_vault', key: 'vault', label: 'Cofre de Senhas', icon: KeyRound },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTool === tab.key;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/25 scale-[1.02]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. SEGUNDO CÉREBRO (VAULT MARKDOWN) */}
      {activeTool === 'notes' && (
        <div
          className="w-full rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl flex flex-col"
          style={{ height: 'calc(100vh - 150px)', minHeight: '600px' }}
        >
          <VaultShell />
        </div>
      )}

      {/* 2. QUADRO BRANCO INFINITO (JSON CANVAS 1.0) */}
      {activeTool === 'mindmap' && <CanvasHubTab />}

      {/* 3. QUADRO KANBAN DE TAREFAS */}
      {activeTool === 'kanban' && <KanbanTab />}

      {/* 4. RELÓGIO POMODORO DE ALTA PERFORMANCE */}
      {activeTool === 'pomodoro' && <PomodoroTab />}

      {/* 5. COFRE DE SENHAS BLINDADO */}
      {activeTool === 'vault' && <PasswordVaultTab />}
    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ToolsErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ToolsView error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-slate-900/90 border border-slate-800 rounded-3xl max-w-lg mx-auto my-12 text-slate-200 shadow-2xl backdrop-blur-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-3">
            <X className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Ops! Ocorreu um problema ao carregar as Ferramentas.</h3>
          <p className="text-xs text-slate-400 mb-5 font-mono bg-slate-950/80 p-2.5 rounded-xl border border-white/5 break-words">
            {this.state.error?.message || 'Erro inesperado'}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
            }}
            className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-fuchsia-600/30"
          >
            Tentar Novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const ToolsView: React.FC = () => (
  <ToolsErrorBoundary>
    <ToolsViewInner />
  </ToolsErrorBoundary>
);

export default ToolsView;
