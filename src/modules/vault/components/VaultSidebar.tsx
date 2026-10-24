import React, { useState } from 'react';
import { Plus, Search, FolderPlus, Trash2, Settings, HelpCircle } from 'lucide-react';
import { VaultPageTree } from './VaultPageTree';
import { VaultEnvironmentPicker } from './VaultEnvironmentPicker';
import { VaultTreeItem, VaultEnvironment } from '../../../types/vault';

interface VaultSidebarProps {
  environments: VaultEnvironment[];
  activeEnvironment: string;
  onSelectEnvironment: (name: string) => void;
  onCreateEnvironment: (name: string) => void;
  tree: VaultTreeItem[];
  activeRelativePath?: string;
  onSelectPage: (relativePath: string) => void;
  onCreatePage: (parentDir?: string) => void;
  onCreateFolder: (parentDir?: string, folderName?: string) => void;
  onDeleteFolder?: (folderRelativePath: string) => void;
  onDeletePage: (relativePath: string) => void;
  onMoveItem?: (srcRelativePath: string, targetFolderRelativePath: string) => void;
  onChangeFolderIcon?: (folderRelPath: string, newIcon: string) => void;
  onOpenSearch: () => void;
  onOpenTrash: () => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
  saveStatus?: 'saved' | 'saving' | 'error';
}

export const VaultSidebar: React.FC<VaultSidebarProps> = ({
  environments,
  activeEnvironment,
  onSelectEnvironment,
  onCreateEnvironment,
  tree,
  activeRelativePath,
  onSelectPage,
  onCreatePage,
  onCreateFolder,
  onDeleteFolder,
  onDeletePage,
  onMoveItem,
  onChangeFolderIcon,
  onOpenSearch,
  onOpenTrash,
  onOpenSettings,
  onOpenHelp,
  saveStatus = 'saved',
}) => {
  const [isFolderInputOpen, setIsFolderInputOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateRootFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(activeEnvironment, newFolderName.trim());
    setNewFolderName('');
    setIsFolderInputOpen(false);
  };

  const handleCreateSubfolder = (parentFolderRelPath: string) => {
    const name = prompt('Digite o nome da nova subpasta:');
    if (name && name.trim()) {
      onCreateFolder(parentFolderRelPath, name.trim());
    }
  };

  return (
    <aside className="w-80 min-w-[280px] max-w-[340px] h-full flex flex-col bg-[#0f1117] border-r border-slate-800/80 shrink-0 select-none">
      {/* Notion-style Environment Switcher */}
      <div className="p-3 border-b border-slate-800/60">
        <VaultEnvironmentPicker
          environments={environments}
          activeEnvironment={activeEnvironment}
          onSelectEnvironment={onSelectEnvironment}
          onCreateEnvironment={onCreateEnvironment}
        />
      </div>

      {/* Action Buttons: + Nota & + Pasta */}
      <div className="px-3 pt-3 pb-2 flex items-center gap-2">
        <button
          onClick={() => onCreatePage(activeEnvironment)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-sm transition-all active:scale-95"
          title="Nova página neste ambiente"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Nota</span>
        </button>

        <button
          onClick={() => setIsFolderInputOpen((prev) => !prev)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 hover:text-white border border-slate-700/60 rounded-xl transition-all"
          title="Nova pasta na raiz do ambiente"
        >
          <FolderPlus className="w-4 h-4 text-amber-400/90" />
          <span>Pasta</span>
        </button>
      </div>

      {/* Inline folder creation form */}
      {isFolderInputOpen && (
        <form onSubmit={handleCreateRootFolder} className="px-3 pb-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900 border border-brand-500/60">
            <input
              type="text"
              autoFocus
              placeholder="Nome da nova pasta..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full px-2 py-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-2 py-1 text-[11px] font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-md shrink-0"
            >
              Criar
            </button>
          </div>
        </form>
      )}

      {/* Quick Search trigger button (Ctrl+K) */}
      <div className="px-3 py-1.5 border-b border-slate-800/40">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-500" />
            <span>Buscar notas...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded-md border border-slate-700 font-mono">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Tree list container with internal scrolling */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2.5 custom-scrollbar">
        <div className="px-2 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>Pastas & Notas</span>
          <span className="text-[9px] text-slate-600">{activeEnvironment}</span>
        </div>
        <VaultPageTree
          items={tree}
          activeRelativePath={activeRelativePath}
          onSelectPage={onSelectPage}
          onCreatePageInFolder={(folder) => onCreatePage(folder)}
          onCreateFolderInFolder={(folder) => handleCreateSubfolder(folder)}
          onDeleteFolder={onDeleteFolder}
          onDeletePage={onDeletePage}
          onMoveItem={onMoveItem}
          onChangeFolderIcon={onChangeFolderIcon}
        />
      </div>

      {/* Footer info: Settings, Help & Trash */}
      <div className="p-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1">
          {onOpenHelp && (
            <button
              type="button"
              onClick={onOpenHelp}
              title="Ajuda e atalhos (Ctrl+/)"
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-800/80 hover:text-brand-300 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-brand-400" />
              <span>Ajuda</span>
            </button>
          )}

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              title="Opções do Vault (Exportar ZIP, Reconstruir índice)"
              className="p-1.5 rounded-lg hover:bg-slate-800/80 hover:text-slate-200 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenTrash}
          title="Ver lixeira do cofre"
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>.trash</span>
        </button>
      </div>
    </aside>
  );
};
