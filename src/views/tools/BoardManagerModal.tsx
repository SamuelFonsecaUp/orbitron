import React, { useState } from 'react';
import {
  X,
  Layers,
  Search,
  Plus,
  Copy,
  Check,
  Edit2,
  Trash2,
  ExternalLink,
  Files,
  Calendar,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';

export interface CanvasFileInfo {
  name: string;
  relativePath: string;
  updatedAt?: number;
  size?: number;
}

interface BoardManagerModalProps {
  isOpen: boolean;
  boards: CanvasFileInfo[];
  selectedPath: string | null;
  onClose: () => void;
  onSelectBoard: (path: string) => void;
  onReloadBoards: () => Promise<void>;
}

export const BoardManagerModal: React.FC<BoardManagerModalProps> = ({
  isOpen,
  boards,
  selectedPath,
  onClose,
  onSelectBoard,
  onReloadBoards,
}) => {
  const { showToast } = useFinancial();
  const [search, setSearch] = useState('');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newBoardName, setNewBoardName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const getCanvasApi = () => {
    return (window as any).electronAPI?.canvas || (window as any).orbitronCanvasApi;
  };

  const filteredBoards = boards.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  const handleCopyCitation = (board: CanvasFileInfo) => {
    const citation = `[[${board.relativePath}]]`;
    navigator.clipboard.writeText(citation);
    setCopiedPath(board.relativePath);
    showToast(`Citação "${citation}" copiada! Cole em qualquer anotação.`, 'success');
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const handleStartRename = (board: CanvasFileInfo) => {
    setEditingPath(board.relativePath);
    setEditName(board.name);
  };

  const handleConfirmRename = async (board: CanvasFileInfo) => {
    const clean = editName.trim().replace(/[\\/:*?"<>|]/g, '');
    if (!clean || clean === board.name) {
      setEditingPath(null);
      return;
    }
    const api = getCanvasApi();
    if (!api?.rename) return;

    try {
      const dir = board.relativePath.includes('/')
        ? board.relativePath.slice(0, board.relativePath.lastIndexOf('/'))
        : 'Quadros';
      const newRelativePath = `${dir}/${clean}.canvas`;
      await api.rename(board.relativePath, newRelativePath);
      showToast(`Quadro renomeado para "${clean}".`, 'success');
      setEditingPath(null);
      await onReloadBoards();
      if (selectedPath === board.relativePath) {
        onSelectBoard(newRelativePath);
      }
    } catch (err: any) {
      showToast(err.message || 'Erro ao renomear quadro.', 'error');
    }
  };

  const handleDuplicate = async (board: CanvasFileInfo) => {
    const api = getCanvasApi();
    if (!api?.read || !api?.write) return;

    try {
      const res = await api.read(board.relativePath);
      const copyName = `${board.name} (Cópia)`;
      const dir = board.relativePath.includes('/')
        ? board.relativePath.slice(0, board.relativePath.lastIndexOf('/'))
        : 'Quadros';
      const copyRelPath = `${dir}/${copyName}.canvas`;
      await api.write(copyRelPath, res.doc || { nodes: [], edges: [] });
      showToast(`Quadro duplicado com sucesso!`, 'success');
      await onReloadBoards();
      onSelectBoard(copyRelPath);
    } catch (err: any) {
      showToast(err.message || 'Erro ao duplicar quadro.', 'error');
    }
  };

  const handleDelete = async (board: CanvasFileInfo) => {
    if (boards.length <= 1) {
      showToast('Você precisa manter pelo menos um quadro ativo.', 'info');
      return;
    }
    if (!window.confirm(`Deseja mover o quadro "${board.name}" para a lixeira?`)) {
      return;
    }
    const api = getCanvasApi();
    if (!api?.trash) return;

    try {
      await api.trash(board.relativePath);
      showToast(`Quadro "${board.name}" movido para a lixeira.`, 'info');
      await onReloadBoards();
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir quadro.', 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newBoardName.trim().replace(/[\\/:*?"<>|]/g, '');
    if (!clean) return;
    const api = getCanvasApi();
    if (!api?.write) return;

    try {
      const relPath = `Quadros/${clean}.canvas`;
      await api.write(relPath, { nodes: [], edges: [] });
      setNewBoardName('');
      setIsCreating(false);
      showToast(`Quadro "${clean}" criado!`, 'success');
      await onReloadBoards();
      onSelectBoard(relPath);
    } catch (err: any) {
      showToast(err.message || 'Erro ao criar quadro.', 'error');
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Recente';
    const d = new Date(timestamp);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-white">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Gerenciador de Quadros Brancos</h3>
              <p className="text-xs text-slate-400">
                Gerencie, renomeie, duplique ou copie citações para suas anotações
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Pesquisar quadros por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500"
            />
          </div>

          {isCreating ? (
            <form onSubmit={handleCreate} className="flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                placeholder="Nome do novo quadro..."
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-fuchsia-500 text-xs text-white placeholder-slate-500 w-44 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-fuchsia-600 hover:bg-fuchsia-500 text-white transition shadow-sm"
              >
                Criar
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="p-1.5 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-fuchsia-600 hover:bg-fuchsia-500 text-white flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Quadro</span>
            </button>
          )}
        </div>

        {/* Board List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
          {filteredBoards.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Nenhum quadro encontrado com esse nome.
            </div>
          ) : (
            filteredBoards.map((board) => {
              const isSelected = selectedPath === board.relativePath;
              const isEditing = editingPath === board.relativePath;
              const isCopied = copiedPath === board.relativePath;

              return (
                <div
                  key={board.relativePath}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-fuchsia-950/20 border-fuchsia-500/40 shadow-lg shadow-fuchsia-500/5'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-fuchsia-600 text-white border-fuchsia-400'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleConfirmRename(board);
                              if (e.key === 'Escape') setEditingPath(null);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-slate-900 border border-fuchsia-500 text-xs text-white focus:outline-none"
                          />
                          <button
                            onClick={() => handleConfirmRename(board)}
                            className="p-1 rounded bg-fuchsia-600 text-white hover:bg-fuchsia-500 text-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold truncate text-slate-100">
                            {board.name}
                          </h4>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                              Ativo
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono truncate">{board.relativePath}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(board.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    {/* Select / Open */}
                    <button
                      onClick={() => {
                        onSelectBoard(board.relativePath);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition flex items-center gap-1 border border-slate-700/60"
                      title="Abrir este quadro para edição"
                    >
                      <ExternalLink className="w-3 h-3 text-fuchsia-400" />
                      <span>Abrir</span>
                    </button>

                    {/* Copy Citation */}
                    <button
                      onClick={() => handleCopyCitation(board)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1 border ${
                        isCopied
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 border-purple-500/30'
                      }`}
                      title={`Copiar citação: [[${board.relativePath}]]`}
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Copiado!' : 'Citar'}</span>
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={() => handleDuplicate(board)}
                      className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
                      title="Duplicar quadro"
                    >
                      <Files className="w-3.5 h-3.5" />
                    </button>

                    {/* Rename */}
                    <button
                      onClick={() => handleStartRename(board)}
                      className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
                      title="Renomear quadro"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Trash */}
                    {boards.length > 1 && (
                      <button
                        onClick={() => handleDelete(board)}
                        className="p-1.5 rounded-xl hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                        title="Mover para a lixeira"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>{boards.length} quadros no seu segundo cérebro</span>
          <span className="text-[11px] text-slate-500">
            Dica: use o botão <strong>Citar</strong> para colar <code>[[Quadro.canvas]]</code> em qualquer anotação.
          </span>
        </div>
      </div>
    </div>
  );
};
