import React, { useState, useEffect, useCallback } from 'react';
import { CanvasPage } from '../../modules/canvas/CanvasPage';
import { Layers, Plus, Trash2, Check, Sun, Moon, FolderKanban } from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useCanvasStore, canvasStore } from '../../modules/canvas/store/canvasStore';
import { BoardManagerModal, CanvasFileInfo } from './BoardManagerModal';

export const CanvasHubTab: React.FC = () => {
  const { showToast } = useFinancial();
  const [boards, setBoards] = useState<CanvasFileInfo[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newBoardName, setNewBoardName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);

  const theme = useCanvasStore((s) => s.theme);
  const isLight = theme === 'light';

  const getCanvasApi = () => {
    return (window as any).electronAPI?.canvas || (window as any).orbitronCanvasApi;
  };

  const loadBoards = useCallback(async () => {
    const api = getCanvasApi();
    if (!api?.list) {
      setIsLoading(false);
      return;
    }
    try {
      const files: CanvasFileInfo[] = await api.list();
      if (!files || files.length === 0) {
        // Create initial default board
        const defaultRelPath = 'Quadros/Quadro Geral.canvas';
        const starterDoc = {
          nodes: [
            {
              id: 'node_welcome',
              type: 'text',
              text: '# 🪐 Quadro Branco Orbitron\n\nBem-vindo ao seu quadro infinito com **JSON Canvas 1.0**!\n- Conectores magnéticos\n- Formas e Post-its\n- Imagens e Links\n- Modo Claro (White) e Escuro (Dark)\n- 100% compatível com Obsidian',
              x: 100,
              y: 100,
              width: 360,
              height: 220,
              color: '1',
            },
          ],
          edges: [],
        };
        await api.write(defaultRelPath, starterDoc);
        const updated = await api.list();
        setBoards(updated || [{ name: 'Quadro Geral', relativePath: defaultRelPath }]);
        setSelectedPath(defaultRelPath);
      } else {
        setBoards(files);
        if (!selectedPath || !files.some((f) => f.relativePath === selectedPath)) {
          setSelectedPath(files[0].relativePath);
        }
      }
    } catch (err) {
      console.error('[CanvasHubTab] Erro ao carregar quadros:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPath]);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  // Listen to open-canvas requests from note citations or command palette
  useEffect(() => {
    const handleOpenExternal = (e: any) => {
      const p = e.detail?.path;
      if (p) setSelectedPath(p);
    };
    window.addEventListener('orbitron:open-canvas', handleOpenExternal);
    return () => window.removeEventListener('orbitron:open-canvas', handleOpenExternal);
  }, []);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newBoardName.trim();
    if (!name) return;
    const api = getCanvasApi();
    if (!api?.write) return;

    try {
      const cleanName = name.replace(/[\\/:*?"<>|]/g, '');
      const relPath = `Quadros/${cleanName}.canvas`;
      await api.write(relPath, { nodes: [], edges: [] });
      setNewBoardName('');
      setIsCreating(false);
      showToast(`Quadro "${cleanName}" criado com sucesso!`, 'success');
      await loadBoards();
      setSelectedPath(relPath);
    } catch (err: any) {
      showToast(err.message || 'Erro ao criar quadro.', 'error');
    }
  };

  const handleDeleteCurrentBoard = async () => {
    if (!selectedPath || boards.length <= 1) {
      showToast('Você precisa manter ao menos um quadro ativo.', 'info');
      return;
    }
    const current = boards.find((b) => b.relativePath === selectedPath);
    if (!window.confirm(`Deseja mover o quadro "${current?.name || 'este quadro'}" para a lixeira?`)) {
      return;
    }
    const api = getCanvasApi();
    if (!api?.trash) return;
    try {
      await api.trash(selectedPath);
      showToast('Quadro movido para a lixeira.', 'info');
      setSelectedPath(null);
      await loadBoards();
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir quadro.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Carregando motor JSON Canvas...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-[calc(100vh-140px)] min-h-[620px] rounded-2xl overflow-hidden border shadow-2xl transition-colors duration-200 animate-in fade-in duration-150 ${
        isLight
          ? 'bg-slate-50 border-slate-200/90 shadow-slate-200/50'
          : 'bg-slate-950 border-slate-800/80 shadow-black/60'
      }`}
    >
      {/* Top Canvas Bar: Board Switcher & Actions */}
      <div
        className={`h-12 border-b px-4 flex items-center justify-between gap-3 shrink-0 backdrop-blur-md transition-colors ${
          isLight
            ? 'bg-white/90 border-slate-200 text-slate-800'
            : 'bg-slate-900/90 border-slate-800/80 text-white'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-fuchsia-500">
            <Layers className="w-4 h-4 text-fuchsia-500" />
            <span className="hidden sm:inline">Quadro Branco:</span>
          </div>

          {/* Boards Selector Dropdown */}
          <select
            value={selectedPath || ''}
            onChange={(e) => setSelectedPath(e.target.value)}
            className={`rounded-xl px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-fuchsia-500 max-w-[200px] truncate border transition-colors ${
              isLight
                ? 'bg-slate-100 border-slate-300 text-slate-800'
                : 'bg-slate-950 border-slate-700/80 text-white'
            }`}
          >
            {boards.map((b) => (
              <option key={b.relativePath} value={b.relativePath}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Gerenciador de Quadros Button */}
          <button
            type="button"
            onClick={() => setManagerOpen(true)}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/60'
            }`}
            title="Abrir Gerenciador de Quadros (Renomear, Duplicar, Citar nas notas)"
          >
            <FolderKanban className="w-3.5 h-3.5 text-fuchsia-500" />
            <span className="hidden md:inline">Gerenciar Quadros</span>
          </button>

          {isCreating ? (
            <form onSubmit={handleCreateBoard} className="flex items-center gap-1">
              <input
                type="text"
                autoFocus
                placeholder="Nome do quadro..."
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                className={`rounded-lg px-2 py-0.5 text-xs w-36 focus:outline-none border ${
                  isLight
                    ? 'bg-white border-fuchsia-500 text-slate-800 placeholder-slate-400'
                    : 'bg-slate-950 border-fuchsia-500 text-white placeholder-slate-500'
                }`}
              />
              <button
                type="submit"
                className="p-1 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white"
                title="Criar"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white px-1"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition border ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/60'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-fuchsia-500" />
              <span className="hidden sm:inline">Novo</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Quick Toggle */}
          <button
            type="button"
            onClick={() => canvasStore.toggleTheme()}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition ${
              isLight
                ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title={isLight ? 'Modo Claro ativo (Clique para alternar para Dark)' : 'Modo Escuro ativo (Clique para alternar para White)'}
          >
            {isLight ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">White</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline">Dark</span>
              </>
            )}
          </button>

          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 hidden lg:inline">
            JSON Canvas 1.0 • 100% Local-First
          </span>

          {boards.length > 1 && (
            <button
              type="button"
              onClick={handleDeleteCurrentBoard}
              title="Excluir quadro atual"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Infinite Space */}
      <div className={`flex-1 min-h-0 relative ${isLight ? 'bg-[#f8fafc]' : 'bg-[#090d16]'}`}>
        {selectedPath ? (
          <CanvasPage key={selectedPath} filePath={selectedPath} />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 text-xs">
            Selecione ou crie um quadro acima para começar.
          </div>
        )}
      </div>

      {/* Modal de Gerenciamento de Quadros */}
      <BoardManagerModal
        isOpen={managerOpen}
        boards={boards}
        selectedPath={selectedPath}
        onClose={() => setManagerOpen(false)}
        onSelectBoard={(p) => setSelectedPath(p)}
        onReloadBoards={loadBoards}
      />
    </div>
  );
};
