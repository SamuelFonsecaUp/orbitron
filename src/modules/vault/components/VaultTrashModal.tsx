import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, X, AlertTriangle } from 'lucide-react';
import { getVaultRepository } from '../repository/ElectronVaultRepository';
import { VaultTrashItem } from '../../../types/vault';

interface VaultTrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPageRestored: (restoredPath: string) => void;
}

export const VaultTrashModal: React.FC<VaultTrashModalProps> = ({
  isOpen,
  onClose,
  onPageRestored,
}) => {
  const [items, setItems] = useState<VaultTrashItem[]>([]);
  const [loading, setLoading] = useState(false);
  const repo = getVaultRepository();

  const loadTrash = async () => {
    setLoading(true);
    try {
      const list = await repo.listTrash();
      setItems(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadTrash();
  }, [isOpen]);

  const handleRestore = async (fileName: string) => {
    try {
      const res = await repo.restorePage(fileName);
      await loadTrash();
      onPageRestored(res.restoredRelPath);
    } catch (e) {
      console.error('Erro ao restaurar:', e);
    }
  };

  const handleEmpty = async () => {
    if (confirm('Tem certeza que deseja esvaziar a lixeira permanentemente?')) {
      await repo.emptyTrash();
      await loadTrash();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg bg-[#121520] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Lixeira do Vault (.trash)</span>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={handleEmpty}
                className="text-xs text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
              >
                Esvaziar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1 text-xs custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Carregando lixeira...</div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-slate-500 flex flex-col items-center gap-2">
              <Trash2 className="w-8 h-8 text-slate-600" />
              <span>A lixeira está vazia.</span>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col truncate pr-3">
                  <span className="font-medium text-slate-200 truncate">{item.originalName}</span>
                  <span className="text-[10px] text-slate-500">
                    Excluído em {new Date(item.trashedAt).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(item.trashedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRestore(item.fileName)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/15 hover:bg-brand-500/25 text-brand-300 font-medium shrink-0 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
