import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Columns,
  FileText,
  Plus,
  Flame,
  CheckCircle2,
  Folder,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useKanbanStore } from '../../kanban/kanbanStore';
import { KanbanTask } from '../../kanban/types';
import { CanvasTheme } from '../store/canvasStore.types';
import { VaultTreeItem } from '../../../types/vault';

interface InsertLibraryModalProps {
  isOpen: boolean;
  theme?: CanvasTheme;
  onClose: () => void;
  onInsertTask: (task: KanbanTask) => void;
  onInsertNote: (note: { path: string; title: string; snippet?: string }) => void;
}

export const InsertLibraryModal: React.FC<InsertLibraryModalProps> = ({
  isOpen,
  theme = 'dark',
  onClose,
  onInsertTask,
  onInsertNote,
}) => {
  const [activeTab, setActiveTab] = useState<'kanban' | 'vault'>('kanban');
  const [search, setSearch] = useState('');
  const [columnFilter, setColumnFilter] = useState<string>('all');
  const [vaultNotes, setVaultNotes] = useState<Array<{ path: string; title: string; folder: string }>>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  const isLight = theme === 'light';

  // Kanban store data
  const tasks = useKanbanStore((s) => s.tasks);
  const columns = useKanbanStore((s) => s.columns);

  // Load vault tree when opened
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    async function loadTree() {
      try {
        setLoadingNotes(true);
        if (window.electronAPI?.vaultGetTree) {
          const tree = await window.electronAPI.vaultGetTree();
          if (isCancelled) return;

          const flattened: Array<{ path: string; title: string; folder: string }> = [];
          const traverse = (items: VaultTreeItem[], currentFolder: string) => {
            for (const item of items) {
              if (item.type === 'page' && !item.relativePath.endsWith('.canvas')) {
                flattened.push({
                  path: item.relativePath,
                  title: item.name.replace(/\.md$/i, ''),
                  folder: currentFolder || 'Geral',
                });
              } else if (item.children) {
                traverse(item.children, item.name);
              }
            }
          };
          traverse(tree, '');
          setVaultNotes(flattened);
        }
      } catch (e) {
        console.warn('[InsertLibraryModal] Erro ao carregar notas do Vault:', e);
      } finally {
        if (!isCancelled) setLoadingNotes(false);
      }
    }

    loadTree();
    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (columnFilter !== 'all' && t.columnId !== columnFilter) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
      );
    });
  }, [tasks, search, columnFilter]);

  // Filter notes
  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vaultNotes.filter((n) => {
      if (!q) return true;
      return n.title.toLowerCase().includes(q) || n.path.toLowerCase().includes(q) || n.folder.toLowerCase().includes(q);
    });
  }, [vaultNotes, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col max-h-[85vh] overflow-hidden ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-[#0f131a] border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Biblioteca do Segundo Cérebro</h2>
              <p className="text-xs text-slate-400">
                Insira cartões do Kanban ou notas Markdown conectados no Quadro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div className="p-4 border-b border-slate-700/30 space-y-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('kanban');
                setSearch('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                activeTab === 'kanban'
                  ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/30'
                  : 'bg-slate-800/40 text-slate-400 border-transparent hover:text-white hover:bg-slate-800'
              }`}
            >
              <Columns className="w-4 h-4" />
              <span>Tarefas do Kanban ({tasks.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('vault');
                setSearch('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                activeTab === 'vault'
                  ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/30'
                  : 'bg-slate-800/40 text-slate-400 border-transparent hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Notas do Vault ({vaultNotes.length})</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                placeholder={
                  activeTab === 'kanban'
                    ? 'Buscar tarefas por título, etiqueta ou descrição...'
                    : 'Buscar notas por nome ou pasta...'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none border transition-colors ${
                  isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-900 focus:border-purple-500'
                    : 'bg-slate-900/80 border-slate-700/80 text-white focus:border-purple-500'
                }`}
              />
            </div>

            {activeTab === 'kanban' && (
              <select
                value={columnFilter}
                onChange={(e) => setColumnFilter(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs border outline-none font-medium cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-800'
                    : 'bg-slate-900/80 border-slate-700/80 text-slate-200'
                }`}
              >
                <option value="all">Todas as colunas</option>
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 min-h-[260px]">
          {activeTab === 'kanban' ? (
            filteredTasks.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Nenhuma tarefa encontrada.
              </div>
            ) : (
              filteredTasks.map((t) => {
                const col = columns.find((c) => c.id === t.columnId);
                const colColor = col?.color || '#38bdf8';

                return (
                  <div
                    key={t.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 hover:border-purple-300'
                        : 'bg-slate-900/50 border-slate-800/80 hover:border-purple-500/50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        style={{ backgroundColor: `${colColor}20`, borderColor: `${colColor}40`, color: colColor }}
                        className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            style={{ color: colColor }}
                            className="text-[10px] font-bold"
                          >
                            {col?.title || 'Coluna'}
                          </span>
                          {t.pomodorosEstimated ? (
                            <span className="flex items-center gap-0.5 text-[10px] text-amber-400 font-mono">
                              <Flame className="w-2.5 h-2.5" />
                              {t.pomodorosCompleted || 0}/{t.pomodorosEstimated}
                            </span>
                          ) : null}
                        </div>
                        <h4 className="text-xs font-semibold text-slate-200 truncate">
                          {t.title}
                        </h4>
                        {t.tags && t.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 truncate">
                            {t.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onInsertTask(t);
                        onClose();
                      }}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Inserir</span>
                    </button>
                  </div>
                );
              })
            )
          ) : loadingNotes ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Carregando notas do Vault...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Nenhuma nota encontrada no Vault.
            </div>
          ) : (
            filteredNotes.map((n) => (
              <div
                key={n.path}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 hover:border-purple-300'
                    : 'bg-slate-900/50 border-slate-800/80 hover:border-purple-500/50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                      <Folder className="w-2.5 h-2.5" />
                      <span>{n.folder}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-200 truncate">
                      {n.title}
                    </h4>
                    <span className="text-[9px] font-mono text-slate-500 truncate block">
                      {n.path}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onInsertNote({
                      path: n.path,
                      title: n.title,
                      snippet: `Nota sincronizada do Vault: ${n.title}`,
                    });
                    onClose();
                  }}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Inserir</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-700/40 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Os cartões inseridos podem ser conectados com setas e reposicionados livremente.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
