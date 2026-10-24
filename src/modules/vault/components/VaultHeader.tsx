import React, { useState, useEffect } from 'react';
import {
  Trash2,
  AlertCircle,
  History,
  Download,
  PanelLeftClose,
  PanelLeftOpen,
  HelpCircle,
} from 'lucide-react';
import { VaultIconRenderer } from './VaultIconRenderer';
import { VaultIconPickerModal } from './VaultIconPickerModal';

interface VaultHeaderProps {
  relativePath: string;
  title: string;
  icon?: string;
  saveStatus?: 'saved' | 'saving' | 'error';
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onOpenHistory?: () => void;
  onExportPage?: () => void;
  onOpenHelp?: () => void;
  onChangeIcon?: (newIcon: string) => void;
  onRename: (newTitle: string) => void;
  onDelete: () => void;
}

export const VaultHeader: React.FC<VaultHeaderProps> = ({
  relativePath,
  title,
  icon = 'FileText',
  saveStatus = 'saved',
  isSidebarOpen = true,
  onToggleSidebar,
  onOpenHistory,
  onExportPage,
  onOpenHelp,
  onChangeIcon,
  onRename,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  useEffect(() => {
    setTempTitle(title);
  }, [title]);

  const handleCommit = () => {
    setIsEditing(false);
    if (tempTitle.trim() && tempTitle.trim() !== title) {
      onRename(tempTitle.trim());
    } else {
      setTempTitle(title);
    }
  };

  const pathSegments = relativePath.split('/');

  return (
    <header className="px-8 pt-5 pb-3 border-b border-slate-800/40 shrink-0 select-none">
      <div className="max-w-[720px] mx-auto flex flex-col gap-2">
        {/* Top bar with Breadcrumbs & Desktop actions */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                title={isSidebarOpen ? 'Ocultar barra lateral' : 'Mostrar barra lateral'}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
              >
                {isSidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5 text-brand-400" />}
              </button>
            )}

            <div className="flex items-center gap-1.5 truncate">
              <span className="hover:text-slate-400">Vault</span>
              {pathSegments.map((segment, idx) => (
                <React.Fragment key={idx}>
                  <span>/</span>
                  <span className={idx === pathSegments.length - 1 ? 'text-slate-300 font-medium' : ''}>
                    {segment.replace(/\.md$/, '')}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {saveStatus === 'error' && (
              <div className="flex items-center gap-1 text-rose-400 text-xs mr-2">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Falha no disco</span>
              </div>
            )}

            {onOpenHelp && (
              <button
                type="button"
                onClick={onOpenHelp}
                title="Ajuda & Atalhos (Ctrl+/)"
                className="p-1.5 text-slate-400 hover:text-brand-300 hover:bg-slate-800/80 rounded-lg transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            )}

            {onOpenHistory && (
              <button
                type="button"
                onClick={onOpenHistory}
                title="Histórico de versões da nota"
                className="p-1.5 text-slate-400 hover:text-brand-300 hover:bg-slate-800/80 rounded-lg transition-colors"
              >
                <History className="w-3.5 h-3.5" />
              </button>
            )}

            {onExportPage && (
              <button
                type="button"
                onClick={onExportPage}
                title="Exportar esta nota como Markdown (.md)"
                className="p-1.5 text-slate-400 hover:text-brand-300 hover:bg-slate-800/80 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onDelete}
              title="Mover para a lixeira"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title row */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIconPickerOpen(true)}
            title="Alterar ícone da nota"
            className="p-1.5 rounded-xl hover:bg-slate-800 text-brand-400 hover:text-brand-300 transition-colors group"
          >
            <VaultIconRenderer icon={icon} className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
          {isEditing ? (
            <input
              type="text"
              value={tempTitle}
              autoFocus
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleCommit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCommit();
                if (e.key === 'Escape') {
                  setTempTitle(title);
                  setIsEditing(false);
                }
              }}
              className="w-full text-2xl font-bold bg-slate-800/80 text-white px-2 py-0.5 rounded outline-none border border-brand-500/50"
            />
          ) : (
            <h1
              onClick={() => setIsEditing(true)}
              title="Clique para editar o título"
              className="text-2xl font-bold text-slate-100 hover:text-white cursor-text truncate transition-colors"
            >
              {title || 'Sem título'}
            </h1>
          )}
        </div>
      </div>

      <VaultIconPickerModal
        isOpen={iconPickerOpen}
        onClose={() => setIconPickerOpen(false)}
        currentIcon={icon}
        onSelectIcon={(newIcon) => onChangeIcon && onChangeIcon(newIcon)}
      />
    </header>
  );
};
