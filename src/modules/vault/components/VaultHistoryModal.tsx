import React, { useState, useEffect } from 'react';
import { History, RotateCcw, X, Clock, FileCheck } from 'lucide-react';
import { getVaultRepository } from '../repository/ElectronVaultRepository';
import { VaultHistoryItem } from '../../../types/vault';
import { computeTextDiff, DiffLine } from '../domain/textDiff';

interface VaultHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  relativePath: string;
  onVersionRestored: () => void;
}

export const VaultHistoryModal: React.FC<VaultHistoryModalProps> = ({
  isOpen,
  onClose,
  relativePath,
  onVersionRestored,
}) => {
  const [historyList, setHistoryList] = useState<VaultHistoryItem[]>([]);
  const [selectedTimestamp, setSelectedTimestamp] = useState<number | null>(null);
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [diffLoading, setDiffLoading] = useState(false);

  const repo = getVaultRepository();

  const loadHistory = async () => {
    setLoading(true);
    try {
      const items = await repo.listHistory(relativePath);
      setHistoryList(items);
      if (items.length > 0) {
        setSelectedTimestamp(items[0].timestamp);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && relativePath) loadHistory();
  }, [isOpen, relativePath]);

  // Load diff whenever selectedTimestamp changes
  useEffect(() => {
    if (!selectedTimestamp || !relativePath) return;

    let canceled = false;
    async function loadDiff() {
      setDiffLoading(true);
      try {
        const [currentFile, snapContent] = await Promise.all([
          repo.readPage(relativePath),
          repo.readHistoryContent(relativePath, selectedTimestamp!),
        ]);
        if (canceled) return;
        const diff = computeTextDiff(snapContent, currentFile.content);
        setDiffLines(diff);
      } catch (e) {
        console.error('Erro ao calcular diff:', e);
      } finally {
        if (!canceled) setDiffLoading(false);
      }
    }

    loadDiff();
    return () => {
      canceled = true;
    };
  }, [selectedTimestamp, relativePath, repo]);

  const handleRestore = async (timestamp: number) => {
    if (confirm('Deseja restaurar esta versão histórica da nota?')) {
      try {
        await repo.restoreHistory(relativePath, String(timestamp));
        onVersionRestored();
        onClose();
      } catch (e) {
        console.error('Erro ao restaurar histórico:', e);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-4xl bg-[#11141e] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[82vh] text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#0e1018]">
          <div className="flex items-center gap-2.5 text-white font-bold text-sm">
            <div className="p-1.5 bg-brand-500/15 rounded-lg text-brand-400">
              <History className="w-4 h-4" />
            </div>
            <span>Histórico de Versões</span>
            <span className="text-xs font-normal text-slate-400">• Comparação estilo Google Docs</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Split View */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Panel: Snapshot list */}
          <div className="w-72 border-r border-slate-800/80 flex flex-col bg-[#0d0f17] shrink-0">
            <div className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/60">
              Versões Anteriores ({historyList.length})
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {loading ? (
                <div className="p-6 text-center text-xs text-slate-500">Carregando snapshots...</div>
              ) : historyList.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                  <Clock className="w-6 h-6 text-slate-600" />
                  <span>Nenhuma versão anterior gravada.</span>
                </div>
              ) : (
                historyList.map((item, idx) => {
                  const isSelected = item.timestamp === selectedTimestamp;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedTimestamp(item.timestamp)}
                      className={`w-full p-2.5 rounded-xl text-left transition-all flex flex-col gap-0.5 ${
                        isSelected
                          ? 'bg-brand-500/20 border border-brand-500/60 text-white'
                          : 'hover:bg-slate-800/60 border border-transparent text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span>{idx === 0 ? 'Versão Mais Recente' : `Versão #${historyList.length - idx}`}</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-brand-400" />}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.timestamp).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(item.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Google Docs Style Diff Viewer */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#0b0c13] overflow-hidden">
            {/* Top Toolbar of Diff View */}
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 shrink-0">
              <div className="flex items-center gap-2 text-xs">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 font-medium">Comparação:</span>
                <span className="text-emerald-400 font-semibold">+ Adicionado</span>
                <span className="text-slate-500">•</span>
                <span className="text-rose-400 font-semibold line-through">- Removido</span>
              </div>

              {selectedTimestamp && (
                <button
                  type="button"
                  onClick={() => handleRestore(selectedTimestamp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium shadow-sm transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Esta Versão</span>
                </button>
              )}
            </div>

            {/* Diff Lines Area */}
            <div className="flex-1 overflow-y-auto p-5 font-mono text-xs leading-relaxed custom-scrollbar space-y-0.5">
              {diffLoading ? (
                <div className="p-8 text-center text-slate-500">Calculando diferenças...</div>
              ) : diffLines.length === 0 ? (
                <div className="p-8 text-center text-slate-500">Nenhuma diferença de texto encontrada.</div>
              ) : (
                diffLines.map((line, i) => {
                  if (line.type === 'added') {
                    return (
                      <div key={i} className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 border-l-2 border-emerald-500">
                        + {line.text}
                      </div>
                    );
                  }
                  if (line.type === 'removed') {
                    return (
                      <div key={i} className="px-2.5 py-1 rounded bg-rose-500/15 text-rose-300 line-through border-l-2 border-rose-500">
                        - {line.text}
                      </div>
                    );
                  }
                  return (
                    <div key={i} className="px-2.5 py-0.5 text-slate-400">
                      &nbsp;&nbsp;{line.text}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
