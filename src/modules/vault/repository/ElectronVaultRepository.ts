import { IVaultRepository } from './IVaultRepository';
import {
  VaultTreeItem,
  CreatePageOptions,
  CreateFolderOptions,
  VaultEnvironment,
  RenamePageResult,
  WorkspaceConfig,
  VaultSearchResult,
  VaultBacklink,
  VaultTrashItem,
  VaultHistoryItem,
} from '../../../types/vault';

export class ElectronVaultRepository implements IVaultRepository {
  private get api() {
    if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.vaultGetTree === 'function') {
      return window.electronAPI;
    }
    return null;
  }

  async init(customPath?: string): Promise<{ vaultPath: string }> {
    if (this.api) return this.api.vaultInit(customPath);
    return { vaultPath: 'browser-memory://vault' };
  }

  async getEnvironments(): Promise<VaultEnvironment[]> {
    if (this.api && (this.api as any).vaultGetEnvironments) {
      return (this.api as any).vaultGetEnvironments();
    }
    return [{ id: 'Pessoal', name: 'Pessoal', icon: '👤', path: 'Pessoal' }];
  }

  async createEnvironment(name: string, icon = '📁'): Promise<VaultEnvironment> {
    if (this.api && (this.api as any).vaultCreateEnvironment) {
      return (this.api as any).vaultCreateEnvironment(name, icon);
    }
    return { id: name, name, icon, path: name };
  }

  async createFolder(opts: CreateFolderOptions): Promise<{ relativePath: string }> {
    if (this.api && (this.api as any).vaultCreateFolder) {
      return (this.api as any).vaultCreateFolder(opts);
    }
    const rel = opts.parentRelativeDir ? `${opts.parentRelativeDir}/${opts.folderName}` : opts.folderName;
    return { relativePath: rel };
  }

  async deleteFolder(relativePath: string): Promise<{ success: boolean }> {
    if (this.api && (this.api as any).vaultDeleteFolder) {
      return (this.api as any).vaultDeleteFolder(relativePath);
    }
    return { success: true };
  }

  async setFolderIcon(folderRelativePath: string, icon: string): Promise<boolean> {
    if (this.api && (this.api as any).vaultSetFolderIcon) {
      return (this.api as any).vaultSetFolderIcon(folderRelativePath, icon);
    }
    return true;
  }

  async getTree(environmentName?: string): Promise<VaultTreeItem[]> {
    if (this.api) return (this.api as any).vaultGetTree(environmentName);
    return [];
  }

  async readPage(relativePath: string) {
    if (this.api) return this.api.vaultReadPage(relativePath);
    throw new Error('Electron API não disponível');
  }

  async writePage(relativePath: string, content: string) {
    if (this.api) return this.api.vaultWritePage(relativePath, content);
    return { relativePath, updatedAt: Date.now() };
  }

  async createPage(opts: CreatePageOptions) {
    if (this.api) return this.api.vaultCreatePage(opts);
    return { relativePath: `${opts.title}.md`, title: opts.title };
  }

  async renamePage(oldRelativePath: string, newTitle: string): Promise<RenamePageResult> {
    if (this.api) return this.api.vaultRenamePage(oldRelativePath, newTitle);
    return { oldRelativePath, newRelativePath: `${newTitle}.md`, newTitle };
  }

  async deletePage(relativePath: string) {
    if (this.api) return this.api.vaultDeletePage(relativePath);
    return { success: true };
  }

  async getWorkspace(): Promise<WorkspaceConfig> {
    if (this.api) return this.api.vaultGetWorkspace();
    return { expandedFolders: [], favorites: [], pinned: [] };
  }

  async saveWorkspace(config: WorkspaceConfig): Promise<boolean> {
    if (this.api) return this.api.vaultSaveWorkspace(config);
    return true;
  }

  async search(query: string, limit = 20): Promise<VaultSearchResult[]> {
    if (this.api && (this.api as any).vaultSearch) {
      return (this.api as any).vaultSearch(query, limit);
    }
    return [];
  }

  async getBacklinks(relativePath: string, title?: string): Promise<VaultBacklink[]> {
    if (this.api && (this.api as any).vaultGetBacklinks) {
      return (this.api as any).vaultGetBacklinks(relativePath, title);
    }
    return [];
  }

  async rebuildIndex(): Promise<boolean> {
    if (this.api && (this.api as any).vaultRebuildIndex) {
      return (this.api as any).vaultRebuildIndex();
    }
    return true;
  }

  async listTrash(): Promise<VaultTrashItem[]> {
    if (this.api && (this.api as any).vaultListTrash) {
      return (this.api as any).vaultListTrash();
    }
    return [];
  }

  async restorePage(trashFileName: string): Promise<{ restoredRelPath: string }> {
    if (this.api && (this.api as any).vaultRestorePage) {
      return (this.api as any).vaultRestorePage(trashFileName);
    }
    return { restoredRelPath: trashFileName };
  }

  async emptyTrash(): Promise<{ success: boolean }> {
    if (this.api && (this.api as any).vaultEmptyTrash) {
      return (this.api as any).vaultEmptyTrash();
    }
    return { success: true };
  }

  async listHistory(relativePath: string): Promise<VaultHistoryItem[]> {
    if (this.api && (this.api as any).vaultListHistory) {
      return (this.api as any).vaultListHistory(relativePath);
    }
    return [];
  }

  async readHistoryContent(relativePath: string, timestamp: string | number): Promise<string> {
    if (this.api && (this.api as any).vaultReadHistoryContent) {
      return (this.api as any).vaultReadHistoryContent(relativePath, String(timestamp));
    }
    return '';
  }

  async restoreHistory(relativePath: string, timestamp: string): Promise<{ success: boolean }> {
    if (this.api && (this.api as any).vaultRestoreHistory) {
      return (this.api as any).vaultRestoreHistory(relativePath, timestamp);
    }
    return { success: true };
  }

  async moveItem(srcRelativePath: string, targetFolderRelativePath: string): Promise<{ success: boolean; newRelativePath: string }> {
    if (this.api && (this.api as any).vaultMoveItem) {
      return (this.api as any).vaultMoveItem(srcRelativePath, targetFolderRelativePath);
    }
    return { success: true, newRelativePath: srcRelativePath };
  }

  async getVaultRoot(): Promise<string> {
    if (this.api && (this.api as any).vaultGetVaultRoot) {
      return (this.api as any).vaultGetVaultRoot();
    }
    return '~/Documents/PigoVault';
  }

  async exportPage(relativePath: string, defaultName?: string): Promise<{ canceled?: boolean; success?: boolean }> {
    if (this.api && (this.api as any).vaultExportPage) {
      return (this.api as any).vaultExportPage(relativePath, defaultName);
    }
    return { canceled: true };
  }

  async exportVaultZip(): Promise<{ canceled?: boolean; success?: boolean }> {
    if (this.api && (this.api as any).vaultExportVaultZip) {
      return (this.api as any).vaultExportVaultZip();
    }
    return { canceled: true };
  }
}

let repositoryInstance: IVaultRepository | null = null;
export function getVaultRepository(): IVaultRepository {
  if (!repositoryInstance) {
    repositoryInstance = new ElectronVaultRepository();
  }
  return repositoryInstance;
}
