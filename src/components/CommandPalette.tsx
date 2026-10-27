import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  PlusCircle,
  FileText,
  LayoutDashboard,
  Receipt,
  Landmark,
  CreditCard,
  Target,
  Calendar,
  PieChart,
  Shield,
  Brain,
  CheckSquare,
  Sparkles,
  Upload,
  Lock,
  Eye,
  EyeOff,
  Settings,
  ArrowRight,
  Compass,
  CornerDownLeft,
  X,
  Palette,
  Columns,
  Timer,
  Clock,
} from 'lucide-react';
import { useFinancial, AppView, AppModule } from '../context/FinancialContext';
import { formatCurrency } from '../utils/formatters';

interface PaletteItem {
  id: string;
  category: 'Ações Rápidas' | 'Navegação' | 'Contas' | 'Cartões' | 'Metas' | 'Segundo Cérebro';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  perform: () => void;
}

export const CommandPalette: React.FC = () => {
  const {
    setCurrentView,
    setActiveModule,
    openNewTransaction,
    setImportModalOpen,
    accounts,
    creditCards,
    goals,
    privacyMode,
    togglePrivacyMode,
    isLocked,
  } = useFinancial();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [vaultResults, setVaultResults] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global Keyboard shortcut (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleCustomTrigger = () => {
      if (!isLocked) setIsOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('orbitron:open-palette', handleCustomTrigger);

    // Listen to Tray quick actions from main process
    const unsub = window.electronAPI?.onQuickAction?.((action: string) => {
      if (isLocked) return;
      if (action === 'open-palette') {
        setIsOpen(true);
      } else if (action === 'new-transaction') {
        openNewTransaction();
      } else if (action === 'new-note') {
        setCurrentView('tools_notes');
        setActiveModule('tools');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('vault:create-page'));
        }, 150);
      }
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('orbitron:open-palette', handleCustomTrigger);
      unsub?.();
    };
  }, [isLocked, isOpen, openNewTransaction, setCurrentView, setActiveModule]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Search in Vault with debounce
  useEffect(() => {
    if (!query.trim() || !window.electronAPI?.vaultSearch) {
      setVaultResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await window.electronAPI.vaultSearch?.(query.trim(), 4);
        if (results && Array.isArray(results)) {
          setVaultResults(results);
        }
      } catch (_) {
        setVaultResults([]);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query]);

  const navigateTo = (view: AppView, mod?: AppModule) => {
    if (mod) setActiveModule(mod);
    setCurrentView(view);
    setIsOpen(false);
  };

  // Base items definitions
  const items: PaletteItem[] = useMemo(() => {
    const list: PaletteItem[] = [];

    // 1. Quick Actions
    list.push({
      id: 'action-new-tx',
      category: 'Ações Rápidas',
      title: 'Novo Lançamento Financeiro',
      subtitle: 'Registrar receita, despesa ou transferência',
      icon: <PlusCircle className="w-4 h-4 text-emerald-400" />,
      badge: 'Atalho',
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      perform: () => {
        setIsOpen(false);
        openNewTransaction();
      },
    });

    list.push({
      id: 'action-import',
      category: 'Ações Rápidas',
      title: 'Importar Extrato Bancário',
      subtitle: 'Conferir e importar arquivos OFX ou CSV',
      icon: <Upload className="w-4 h-4 text-cyan-400" />,
      badge: 'Extrato',
      badgeColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      perform: () => {
        setIsOpen(false);
        setImportModalOpen(true);
      },
    });

    list.push({
      id: 'action-new-note',
      category: 'Ações Rápidas',
      title: 'Nova Nota no Segundo Cérebro',
      subtitle: 'Criar documento Markdown no Vault local',
      icon: <FileText className="w-4 h-4 text-purple-400" />,
      badge: 'Vault',
      badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      perform: () => {
        navigateTo('tools_notes', 'tools');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('vault:create-page'));
        }, 150);
      },
    });

    list.push({
      id: 'action-new-canvas',
      category: 'Ações Rápidas',
      title: 'Novo Quadro Branco (Canvas)',
      subtitle: 'Abrir quadro branco infinito JSON Canvas 1.0',
      icon: <Palette className="w-4 h-4 text-pink-400" />,
      badge: 'Canvas',
      badgeColor: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
      perform: () => {
        navigateTo('tools_mindmap', 'tools');
      },
    });

    list.push({
      id: 'action-toggle-privacy',
      category: 'Ações Rápidas',
      title: privacyMode ? 'Desativar Modo Privacidade' : 'Ativar Modo Privacidade (Olho Mágico)',
      subtitle: 'Ocultar ou exibir valores e saldos na tela',
      icon: privacyMode ? <Eye className="w-4 h-4 text-amber-400" /> : <EyeOff className="w-4 h-4 text-amber-400" />,
      badge: 'Segurança',
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      perform: () => {
        togglePrivacyMode();
        setIsOpen(false);
      },
    });

    list.push({
      id: 'action-open-vault',
      category: 'Ações Rápidas',
      title: 'Cofre de Senhas Criptografado',
      subtitle: 'Acessar senhas com proteção PBKDF2/DPAPI',
      icon: <Lock className="w-4 h-4 text-rose-400" />,
      badge: 'Cofre',
      badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      perform: () => {
        navigateTo('tools_vault', 'tools');
      },
    });

    list.push({
      id: 'action-open-kanban',
      category: 'Ações Rápidas',
      title: 'Quadro Kanban de Tarefas',
      subtitle: 'Organizar cartões, prioridades e colunas personalizadas',
      icon: <Columns className="w-4 h-4 text-purple-400" />,
      badge: 'Kanban',
      badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      perform: () => {
        navigateTo('tools_kanban', 'tools');
      },
    });

    list.push({
      id: 'action-open-pomodoro',
      category: 'Ações Rápidas',
      title: 'Relógio Pomodoro de Foco',
      subtitle: 'Iniciar timer de alta produtividade (25min / pausas)',
      icon: <Timer className="w-4 h-4 text-rose-400" />,
      badge: 'Pomodoro',
      badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      perform: () => {
        navigateTo('tools_pomodoro', 'tools');
      },
    });

    list.push({
      id: 'action-open-timetracker',
      category: 'Ações Rápidas',
      title: 'Rastreador de Tempo em Tarefas',
      subtitle: 'Cronometrar atividades local-first e ver histórico de horas',
      icon: <Clock className="w-4 h-4 text-cyan-400" />,
      badge: 'Tempo',
      badgeColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      perform: () => {
        navigateTo('tools_timetracker', 'tools');
      },
    });

    // 2. Navigation items
    list.push({
      id: 'nav-dashboard',
      category: 'Navegação',
      title: 'Painel Geral (Dashboard)',
      subtitle: 'Visão consolidada de patrimônio, fluxo e alertas',
      icon: <LayoutDashboard className="w-4 h-4 text-emerald-400" />,
      badge: 'Finanças',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      perform: () => navigateTo('dashboard', 'finance'),
    });

    list.push({
      id: 'nav-tx',
      category: 'Navegação',
      title: 'Lançamentos & Extrato',
      subtitle: 'Histórico completo de transações e filtros',
      icon: <Receipt className="w-4 h-4 text-emerald-400" />,
      badge: 'Finanças',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      perform: () => navigateTo('transactions', 'finance'),
    });

    list.push({
      id: 'nav-accounts',
      category: 'Navegação',
      title: 'Contas Bancárias & Saldos',
      subtitle: 'Gerenciar contas correntes, poupanças e carteiras',
      icon: <Landmark className="w-4 h-4 text-emerald-400" />,
      badge: 'Finanças',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      perform: () => navigateTo('accounts', 'finance'),
    });

    list.push({
      id: 'nav-cards',
      category: 'Navegação',
      title: 'Cartões de Crédito & Faturas',
      subtitle: 'Acompanhar limites e parcelamentos',
      icon: <CreditCard className="w-4 h-4 text-emerald-400" />,
      badge: 'Finanças',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      perform: () => navigateTo('cards', 'finance'),
    });

    list.push({
      id: 'nav-habits',
      category: 'Navegação',
      title: 'Hábitos Diários & Metas',
      subtitle: 'Check-in estelar, hábitos mensuráveis e lembretes',
      icon: <CheckSquare className="w-4 h-4 text-cyan-400" />,
      badge: 'Hábitos',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      perform: () => navigateTo('habits', 'habits'),
    });

    list.push({
      id: 'nav-goals',
      category: 'Navegação',
      title: 'Metas Financeiras & Sonhos',
      subtitle: 'Acompanhamento de objetivos de poupança',
      icon: <Target className="w-4 h-4 text-emerald-400" />,
      badge: 'Finanças',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      perform: () => navigateTo('goals', 'finance'),
    });

    list.push({
      id: 'nav-calendar',
      category: 'Navegação',
      title: 'Calendário Financeiro',
      subtitle: 'Previsão de vencimentos e fluxo de caixa diário',
      icon: <Calendar className="w-4 h-4 text-emerald-400" />,
      badge: 'Finanças',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      perform: () => navigateTo('calendar', 'finance'),
    });

    list.push({
      id: 'nav-reports',
      category: 'Navegação',
      title: 'Relatórios & Projeções',
      subtitle: 'Gráficos comparativos, fluxo e categorias',
      icon: <PieChart className="w-4 h-4 text-emerald-400" />,
      badge: 'Finanças',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      perform: () => navigateTo('reports', 'finance'),
    });

    list.push({
      id: 'nav-reserve',
      category: 'Navegação',
      title: 'Reserva de Emergência',
      subtitle: 'Cálculo de segurança para meses essenciais',
      icon: <Shield className="w-4 h-4 text-emerald-400" />,
      badge: 'Finanças',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      perform: () => navigateTo('reserve', 'finance'),
    });

    list.push({
      id: 'nav-intel',
      category: 'Navegação',
      title: 'Inteligência Financeira',
      subtitle: 'Score de saúde e diagnósticos automáticos offline',
      icon: <Brain className="w-4 h-4 text-emerald-400" />,
      badge: 'Finanças',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      perform: () => navigateTo('intelligence', 'finance'),
    });

    list.push({
      id: 'nav-journey',
      category: 'Navegação',
      title: 'Jornada Cósmica & Conquistas',
      subtitle: 'Níveis estelares, missões semanais e XP',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      badge: 'Jornada',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      perform: () => navigateTo('journey', 'journey'),
    });

    list.push({
      id: 'nav-timetracker',
      category: 'Navegação',
      title: 'Rastreador de Tempo',
      subtitle: 'Histórico de horas trabalhadas e foco diário',
      icon: <Clock className="w-4 h-4 text-cyan-400" />,
      badge: 'Ferramentas',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      perform: () => navigateTo('tools_timetracker', 'tools'),
    });

    list.push({
      id: 'nav-settings',
      category: 'Navegação',
      title: 'Configurações do Sistema',
      subtitle: 'Backups .orbitron, segurança PIN e preferências',
      icon: <Settings className="w-4 h-4 text-slate-400" />,
      badge: 'Sistema',
      badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      perform: () => navigateTo('settings'),
    });

    // 3. Dynamic accounts (filtered when typing)
    if (query.trim()) {
      accounts.forEach((acc) => {
        list.push({
          id: `acc-${acc.id}`,
          category: 'Contas',
          title: acc.name,
          subtitle: `Conta • Saldo atual: ${privacyMode ? '••••' : formatCurrency(acc.currentBalance)}`,
          icon: <Landmark className="w-4 h-4 text-emerald-400" />,
          badge: 'Saldo',
          badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          perform: () => navigateTo('accounts', 'finance'),
        });
      });

      creditCards.forEach((card) => {
        list.push({
          id: `card-${card.id}`,
          category: 'Cartões',
          title: card.name,
          subtitle: `Cartão • Fatura atual: ${privacyMode ? '••••' : formatCurrency(card.currentInvoiceAmount)} | Limite disp.: ${privacyMode ? '••••' : formatCurrency(card.availableLimit)}`,
          icon: <CreditCard className="w-4 h-4 text-indigo-400" />,
          badge: 'Fatura',
          badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
          perform: () => navigateTo('cards', 'finance'),
        });
      });

      goals.forEach((goal) => {
        const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) || 0;
        list.push({
          id: `goal-${goal.id}`,
          category: 'Metas',
          title: goal.title,
          subtitle: `Meta • ${pct}% concluída (${privacyMode ? '••••' : formatCurrency(goal.currentAmount)} de ${privacyMode ? '••••' : formatCurrency(goal.targetAmount)})`,
          icon: <Target className="w-4 h-4 text-amber-400" />,
          badge: `${pct}%`,
          badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          perform: () => navigateTo('goals', 'finance'),
        });
      });

      vaultResults.forEach((v) => {
        list.push({
          id: `vault-${v.relativePath || v.title}`,
          category: 'Segundo Cérebro',
          title: v.title || v.name || 'Nota sem título',
          subtitle: v.snippet || v.relativePath || 'Nota Markdown no Vault',
          icon: <FileText className="w-4 h-4 text-purple-400" />,
          badge: 'Nota',
          badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          perform: () => {
            navigateTo('tools_notes', 'tools');
            setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent('vault:open-page', { detail: { path: v.relativePath } })
              );
            }, 150);
          },
        });
      });
    }

    return list;
  }, [
    query,
    accounts,
    creditCards,
    goals,
    vaultResults,
    privacyMode,
    openNewTransaction,
    setImportModalOpen,
    togglePrivacyMode,
  ]);

  // Filter items matching query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase().trim();
    return items.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        (it.subtitle && it.subtitle.toLowerCase().includes(q)) ||
        it.category.toLowerCase().includes(q)
    );
  }, [items, query]);

  // Adjust selection when list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length]);

  // Keyboard navigation inside input
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredItems.length ? (prev + 1) % filteredItems.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredItems.length ? (prev - 1 + filteredItems.length) % filteredItems.length : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].perform();
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector('[data-selected="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/65 backdrop-blur-sm animate-fade-in select-none"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-[#0c0d12]/95 border border-slate-800/90 rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden flex flex-col max-h-[75vh] backdrop-blur-xl animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800/80 bg-slate-900/50">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="O que você quer fazer? (ex: novo lançamento, nubank, nota...)"
            className="flex-1 bg-transparent border-0 text-sm font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-0"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-800/90 text-slate-400 border border-slate-700/80 rounded">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto flex-1 p-2 space-y-1 divide-y divide-slate-800/30">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Nenhuma ação, conta ou nota encontrada para "{query}".
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  data-selected={isSelected}
                  onClick={() => item.perform()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group ${
                    isSelected
                      ? 'bg-cyan-500/10 border border-cyan-500/25 text-white'
                      : 'hover:bg-slate-900/60 border border-transparent text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div
                      className={`p-2 rounded-lg border shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                          : 'bg-slate-900/90 border-slate-800 text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold tracking-wide truncate flex items-center gap-2">
                        <span>{item.title}</span>
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          item.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 bg-slate-800 border border-slate-700 rounded text-[9px] font-mono text-slate-300">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.2 bg-slate-800 border border-slate-700 rounded text-[9px] font-mono text-slate-300">
                ↓
              </kbd>
              <span>Navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 bg-slate-800 border border-slate-700 rounded text-[9px] font-mono text-slate-300">
                ↵
              </kbd>
              <span>Selecionar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 bg-slate-800 border border-slate-700 rounded text-[9px] font-mono text-slate-300">
                ESC
              </kbd>
              <span>Fechar</span>
            </span>
          </div>

          <span className="text-[10px] text-cyan-400/80 font-mono font-medium">
            Orbitron Omnibox
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
