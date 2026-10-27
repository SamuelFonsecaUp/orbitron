import React, { useMemo } from 'react';
import { Layers, Edit3, ArrowUpRight, Sparkles } from 'lucide-react';
import { useFinancial } from '../../../context/FinancialContext';

interface VaultCitedBoardsProps {
  content: string;
  onOpenCanvas: (path: string) => void;
}

export const VaultCitedBoards: React.FC<VaultCitedBoardsProps> = ({ content, onOpenCanvas }) => {
  const { setCurrentView } = useFinancial();

  // Extract all cited canvas boards from the note content
  const citedBoards = useMemo(() => {
    if (!content) return [];
    const found: Array<{ name: string; path: string }> = [];
    const seen = new Set<string>();

    // 1. Wiki link style: [[Quadros/MeuQuadro.canvas]] or [[MeuQuadro.canvas|Titulo]] or ![[...canvas]]
    const wikiRegex = /!?\[\[([^\]|]+\.canvas)(?:\|([^\]]+))?\]\]/gi;
    let m;
    while ((m = wikiRegex.exec(content)) !== null) {
      const fullPath = m[1].trim();
      const customTitle = m[2]?.trim();
      if (!seen.has(fullPath)) {
        seen.add(fullPath);
        const name =
          customTitle ||
          fullPath.split('/').pop()?.replace(/\.canvas$/i, '') ||
          'Quadro';
        found.push({ name, path: fullPath });
      }
    }

    // 2. Standard markdown link style: [Titulo](Quadros/MeuQuadro.canvas)
    const mdRegex = /\[([^\]]+)\]\(([^)]+\.canvas)\)/gi;
    while ((m = mdRegex.exec(content)) !== null) {
      const fullPath = m[2].trim();
      const customTitle = m[1]?.trim();
      if (!seen.has(fullPath)) {
        seen.add(fullPath);
        const name =
          customTitle ||
          fullPath.split('/').pop()?.replace(/\.canvas$/i, '') ||
          'Quadro';
        found.push({ name, path: fullPath });
      }
    }

    return found;
  }, [content]);

  if (citedBoards.length === 0) return null;

  const handleEditBoard = (boardPath: string) => {
    // Notify Canvas tab
    window.dispatchEvent(
      new CustomEvent('orbitron:open-canvas', { detail: { path: boardPath } })
    );

    // Open directly in current view
    onOpenCanvas(boardPath);
  };

  const handleOpenInWhiteboardTab = (boardPath: string) => {
    window.dispatchEvent(
      new CustomEvent('orbitron:open-canvas', { detail: { path: boardPath } })
    );
    setCurrentView('tools_mindmap');
  };

  return (
    <div className="my-4 p-3.5 rounded-2xl bg-gradient-to-r from-fuchsia-950/30 via-slate-900/60 to-purple-950/30 border border-fuchsia-500/30 backdrop-blur-md shadow-lg shadow-fuchsia-500/5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-fuchsia-500/20 text-fuchsia-300">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-fuchsia-200 tracking-wide flex items-center gap-1.5">
            <span>Quadros Citados nesta Anotação</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-fuchsia-500/20 text-fuchsia-300 font-mono">
              {citedBoards.length}
            </span>
          </span>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Clique em "EDITAR" para abrir no Quadro Branco infinito
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {citedBoards.map((b) => (
          <div
            key={b.path}
            className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-fuchsia-500/50 flex items-center justify-between gap-3 transition-all group shadow-sm"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
                <h5 className="text-xs font-bold text-white truncate group-hover:text-fuchsia-300 transition-colors">
                  {b.name}
                </h5>
              </div>
              <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                {b.path}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* EDITAR Button */}
              <button
                type="button"
                onClick={() => handleEditBoard(b.path)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white shadow-md shadow-fuchsia-600/30 flex items-center gap-1.5 transition active:scale-95"
                title="Editar este quadro agora"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>EDITAR</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenInWhiteboardTab(b.path)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                title="Abrir na aba Quadro Branco"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
