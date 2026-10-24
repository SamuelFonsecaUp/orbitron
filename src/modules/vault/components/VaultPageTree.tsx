import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Trash2, Edit2, Plus, FolderPlus, GripVertical } from 'lucide-react';
import { VaultTreeItem } from '../../../types/vault';
import { VaultIconRenderer } from './VaultIconRenderer';
import { VaultIconPickerModal } from './VaultIconPickerModal';

interface VaultPageTreeProps {
  items: VaultTreeItem[];
  activeRelativePath?: string;
  onSelectPage: (relativePath: string) => void;
  onCreatePageInFolder?: (folderRelativePath: string) => void;
  onCreateFolderInFolder?: (folderRelativePath: string) => void;
  onDeletePage: (relativePath: string) => void;
  onDeleteFolder?: (folderRelativePath: string) => void;
  onRenamePage?: (relativePath: string) => void;
  onMoveItem?: (srcRelativePath: string, targetFolderRelativePath: string) => void;
  onChangeFolderIcon?: (folderRelPath: string, newIcon: string) => void;
  depth?: number;
}

export const VaultPageTree: React.FC<VaultPageTreeProps> = ({
  items,
  activeRelativePath,
  onSelectPage,
  onCreatePageInFolder,
  onCreateFolderInFolder,
  onDeletePage,
  onDeleteFolder,
  onRenamePage,
  onMoveItem,
  onChangeFolderIcon,
  depth = 0,
}) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [folderIconTarget, setFolderIconTarget] = useState<string | null>(null);

  const toggleFolder = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!items || items.length === 0) {
    if (depth === 0) {
      return (
        <div className="px-4 py-8 text-center text-xs text-slate-500 leading-relaxed">
          Nenhuma nota ou pasta encontrada neste ambiente.
        </div>
      );
    }
    return null;
  }

  return (
    <div className="flex flex-col space-y-1 select-none text-xs">
      {items.map((item) => {
        const isSelected = !item.isDirectory && activeRelativePath === item.relativePath;
        const isFolder = item.isDirectory;
        const isFolderOpen = !collapsed[item.id];
        const isTargeted = dragOverFolderId === item.id;

        if (isFolder) {
          return (
            <div key={item.id} className="flex flex-col">
              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', item.relativePath);
                  e.dataTransfer.setData('application/orbitron-note', JSON.stringify({ relativePath: item.relativePath, title: item.name }));
              e.dataTransfer.effectAllowed = 'copyMove';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOverFolderId(item.id);
                }}
                onDragLeave={(e) => {
                  e.stopPropagation();
                  setDragOverFolderId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOverFolderId(null);
                  const srcPath = e.dataTransfer.getData('text/plain');
                  if (srcPath && srcPath !== item.relativePath && onMoveItem) {
                    onMoveItem(srcPath, item.relativePath);
                  }
                }}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 cursor-pointer transition-all ${
                  isTargeted ? 'bg-brand-500/25 ring-2 ring-brand-500' : ''
                }`}
                style={{ paddingLeft: `${Math.max(10, depth * 16 + 10)}px` }}
                onClick={() => toggleFolder(item.id)}
              >
                <div className="flex items-center gap-2 truncate">
                  <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 cursor-grab shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {isFolderOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setFolderIconTarget(item.relativePath);
                    }}
                    title="Alterar ícone da pasta"
                    className="hover:scale-110 transition-transform cursor-pointer"
                  >
                    <VaultIconRenderer icon={item.icon || 'Folder'} className="w-4 h-4 text-amber-400/90 shrink-0" />
                  </span>
                  <span className="truncate font-medium text-slate-200">{item.name}</span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onCreatePageInFolder && (
                    <button
                      title="Nova página nesta pasta"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreatePageInFolder(item.relativePath);
                      }}
                      className="p-1 hover:bg-slate-700/70 rounded-md text-slate-400 hover:text-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onCreateFolderInFolder && (
                    <button
                      title="Nova subpasta nesta pasta"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateFolderInFolder(item.relativePath);
                      }}
                      className="p-1 hover:bg-slate-700/70 rounded-md text-slate-400 hover:text-amber-300 transition-colors"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDeleteFolder && (
                    <button
                      title="Excluir pasta"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Deseja mover a pasta "${item.name}" para a lixeira?`)) {
                          onDeleteFolder(item.relativePath);
                        }
                      }}
                      className="p-1 hover:bg-rose-500/20 rounded-md text-slate-400 hover:text-rose-300 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {isFolderOpen && item.children && (
                <VaultPageTree
                  items={item.children}
                  activeRelativePath={activeRelativePath}
                  onSelectPage={onSelectPage}
                  onCreatePageInFolder={onCreatePageInFolder}
                  onCreateFolderInFolder={onCreateFolderInFolder}
                  onDeletePage={onDeletePage}
                  onDeleteFolder={onDeleteFolder}
                  onRenamePage={onRenamePage}
                  onMoveItem={onMoveItem}
                  onChangeFolderIcon={onChangeFolderIcon}
                  depth={depth + 1}
                />
              )}
            </div>
          );
        }

        return (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', item.relativePath);
              e.dataTransfer.setData('application/orbitron-note', JSON.stringify({ relativePath: item.relativePath, title: item.name }));
              e.dataTransfer.effectAllowed = 'copyMove';
            }}
            onClick={() => onSelectPage(item.relativePath)}
            style={{ paddingLeft: `${Math.max(10, depth * 16 + 10)}px` }}
            className={`group flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all ${
              isSelected
                ? 'bg-brand-500/15 text-brand-300 font-medium shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 cursor-grab shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <VaultIconRenderer
                icon={item.icon || 'FileText'}
                className={`w-3.5 h-3.5 shrink-0 ${
                  isSelected ? 'text-brand-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <span className="truncate">{item.name}</span>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onRenamePage && (
                <button
                  title="Renomear nota"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRenamePage(item.relativePath);
                  }}
                  className="p-1 hover:bg-slate-700/70 rounded-md text-slate-400 hover:text-white transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                title="Mover para a lixeira"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePage(item.relativePath);
                }}
                className="p-1 hover:bg-rose-500/20 rounded-md text-slate-400 hover:text-rose-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
      {depth === 0 && (
        <VaultIconPickerModal
          isOpen={!!folderIconTarget}
          onClose={() => setFolderIconTarget(null)}
          onSelectIcon={(newIcon) => {
            if (folderIconTarget && onChangeFolderIcon) {
              onChangeFolderIcon(folderIconTarget, newIcon);
            }
          }}
        />
      )}
    </div>
  );
};
