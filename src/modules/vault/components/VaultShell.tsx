import React, { useState, useEffect, useRef } from 'react';
import { useVaultState } from '../state/useVaultState';
import { getVaultRepository } from '../repository/ElectronVaultRepository';
import { VaultSidebar } from './VaultSidebar';
import { VaultHeader } from './VaultHeader';
import { markdownToHtml } from '../domain/markdownToHtml';
import { VaultBlockEditor } from '../editor/VaultBlockEditor';
import { VaultEmptyState } from './VaultEmptyState';
import { CommandPaletteModal } from './CommandPaletteModal';
import { VaultTrashModal } from './VaultTrashModal';
import { VaultHistoryModal } from './VaultHistoryModal';
import { VaultSettingsModal } from './VaultSettingsModal';
import { VaultHelpModal } from './VaultHelpModal';
import { VaultBacklinksPanel } from './VaultBacklinksPanel';
import { CanvasPage } from '../../canvas/CanvasPage';

export const VaultShell: React.FC = () => {
  const {
    environments,
    activeEnvironment,
    tree,
    activePage,
    editorContent,
    editorTitle,
    editorIcon,
    saveStatus,
    openPage,
    selectEnvironment,
    createEnvironment,
    createFolder,
    deleteFolder,
    createPage,
    createCanvas,
    renameCurrentPage,
    deletePage,
    changePageIcon,
    changeFolderIcon,
    moveItem,
    handleContentChange,
    refreshTree,
  } = useVaultState();

  const [searchOpen, setSearchOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const repo = useRef(getVaultRepository()).current;

  // Global keyboard shortcuts (Ctrl+K, Ctrl+P, Ctrl+N, Ctrl+\, Ctrl+/)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'p')) {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        createPage(activeEnvironment, 'Nova Nota');
      } else if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      } else if (((e.ctrlKey || e.metaKey) && e.key === '/') || e.key === 'F1') {
        e.preventDefault();
        setHelpOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createPage, activeEnvironment]);

  const handleExportPage = async () => {
    if (!activePage) return;
    try {
      await repo.exportPage(activePage.relativePath, editorTitle);
    } catch (e) {
      console.error('Erro ao exportar página:', e);
    }
  };

  const handleExportPDF = async () => {
    if (!activePage) return;
    try {
      if (window.electronAPI?.vaultExportPDF) {
        const html = markdownToHtml(editorContent);
        await window.electronAPI.vaultExportPDF(editorTitle, html);
      }
    } catch (e) {
      console.error('Erro ao exportar PDF:', e);
    }
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-1 overflow-hidden bg-[#0a0c10] select-text">
      {/* Sidebar with tree (collapsible for desktop focus) */}
      {isSidebarOpen && (
        <VaultSidebar
          environments={environments}
          activeEnvironment={activeEnvironment}
          onSelectEnvironment={selectEnvironment}
          onCreateEnvironment={createEnvironment}
          tree={tree}
          activeRelativePath={activePage?.relativePath}
          onSelectPage={openPage}
          onCreatePage={(parent) => createPage(parent || activeEnvironment, 'Nova Nota')}
          onCreateCanvas={(parent) => createCanvas(parent || activeEnvironment, 'Novo Quadro')}
          onCreateFolder={createFolder}
          onDeleteFolder={deleteFolder}
          onDeletePage={deletePage}
          onMoveItem={moveItem}
          onChangeFolderIcon={changeFolderIcon}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenTrash={() => setTrashOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenHelp={() => setHelpOpen(true)}
          saveStatus={saveStatus}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden bg-[#0c0e14]">
        {activePage ? (
          <>
            <VaultHeader
              relativePath={activePage.relativePath}
              title={editorTitle}
              icon={editorIcon}
              saveStatus={saveStatus}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
              onOpenHistory={() => setHistoryOpen(true)}
              onOpenHelp={() => setHelpOpen(true)}
              onChangeIcon={changePageIcon}
              onExportPage={handleExportPage}
              onExportPDF={handleExportPDF}
              onRename={renameCurrentPage}
              onDelete={() => deletePage(activePage.relativePath)}
            />
            {activePage.relativePath.endsWith('.canvas') ? (
              <div className="flex-1 min-h-0 relative">
                <CanvasPage filePath={activePage.relativePath} />
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col overflow-y-auto custom-scrollbar">
                <VaultBlockEditor
                  content={editorContent}
                  onChange={handleContentChange}
                />
                <VaultBacklinksPanel
                  relativePath={activePage.relativePath}
                  title={editorTitle}
                  onOpenPage={openPage}
                />
              </div>
            )}
          </>
        ) : (
          <VaultEmptyState onCreatePage={() => createPage(activeEnvironment, 'Nova Nota')} />
        )}
      </main>

      {/* Modals */}
      <CommandPaletteModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectPage={openPage}
      />

      <VaultTrashModal
        isOpen={trashOpen}
        onClose={() => setTrashOpen(false)}
        onPageRestored={async (restoredPath) => {
          await refreshTree();
          await openPage(restoredPath);
        }}
      />

      {activePage && (
        <VaultHistoryModal
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
          relativePath={activePage.relativePath}
          onVersionRestored={() => openPage(activePage.relativePath)}
        />
      )}

      <VaultSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <VaultHelpModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </div>
  );
};
