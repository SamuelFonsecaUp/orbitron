import React, { useState, useEffect } from 'react';
import { Settings, Folder, Archive, RefreshCw, X, Check, ShieldCheck } from 'lucide-react';
import { getVaultRepository } from '../repository/ElectronVaultRepository';

interface VaultSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VaultSettingsModal: React.FC<VaultSettingsModalProps> = ({ isOpen, onClose }) => {
  const [vaultPath, setVaultPath] = useState('');
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [rebuildDone, setRebuildDone] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const repo = getVaultRepository();

  useEffect(() => {
    if (isOpen) {
      repo.getVaultRoot().then((p) => setVaultPath(p));
      setRebuildDone(false);
    }
  }, [isOpen, repo]);

  const handleRebuild = async () => {
    setIsRebuilding(true);
    try {
      await repo.rebuildIndex();
      setRebuildDone(true);
      setTimeout(() => setRebuildDone(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRebuilding(false);
    }
  };

  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      await repo.exportVaultZip();
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-md bg-[#121520] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
            <Settings className="w-4 h-4 text-brand-400" />
            <span>Configurações do Vault Local</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 text-xs">
          {/* Vault Path */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span>Localização Física no Computador</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono select-text break-all bg-slate-950/80 p-2 rounded-lg border border-slate-800/80">
              {vaultPath || 'Carregando...'}
            </div>
          </div>

          {/* Export Zip */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Archive className="w-3.5 h-3.5 text-cyan-400" />
                <span>Exportar Vault Completo (.ZIP)</span>
              </div>
              <button
                type="button"
                onClick={handleExportZip}
                disabled={isExporting}
                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                {isExporting ? 'Exportando...' : 'Exportar ZIP'}
              </button>
            </div>
            <span className="text-[11px] text-slate-400">
              Gera um arquivo compacto com todas as suas pastas e notas Markdown.
            </span>
          </div>

          {/* Rebuild SQLite Index */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isRebuilding ? 'animate-spin' : ''}`} />
                <span>Reconstruir Índice FTS5</span>
              </div>
              <button
                type="button"
                onClick={handleRebuild}
                disabled={isRebuilding}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg font-medium transition-colors"
              >
                {rebuildDone ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Concluído</span>
                  </>
                ) : isRebuilding ? (
                  <span>Indexando...</span>
                ) : (
                  <span>Reconstruir</span>
                )}
              </button>
            </div>
            <span className="text-[11px] text-slate-400">
              Vare a pasta do disco e reconstrói o banco SQLite de busca e links do zero.
            </span>
          </div>

          {/* Privacy badge */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>100% Local-first: nenhum dado sai do seu computador.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
