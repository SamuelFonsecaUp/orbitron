import React from 'react';
import { Plus, BookOpen, Sparkles, FolderPlus } from 'lucide-react';

interface VaultEmptyStateProps {
  onCreatePage: () => void;
}

export const VaultEmptyState: React.FC<VaultEmptyStateProps> = ({ onCreatePage }) => {
  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-8 text-center select-none">
      <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4 shadow-lg shadow-brand-500/5">
        <BookOpen className="w-7 h-7" />
      </div>

      <h2 className="text-xl font-bold text-slate-100 mb-2">
        Seu Segundo Cérebro Local
      </h2>
      <p className="text-sm text-slate-400 max-w-md mb-8 leading-relaxed">
        Selecione uma nota na barra lateral ou comece um novo documento armazenado 100% no seu disco.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={onCreatePage}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm shadow-md shadow-brand-600/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Criar primeira nota</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500 px-3 py-2 bg-slate-900/60 rounded-xl border border-slate-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Arquivos Markdown compatíveis com Obsidian</span>
        </div>
      </div>
    </div>
  );
};
