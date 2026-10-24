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

export interface IVaultRepository {
  init(customPath?: string): Promise<{ vaultPath: string }>;
  getEnvironments(): Promise<VaultEnvironment[]>;
  createEnvironment(name: string, icon?: string): Promise<VaultEnvironment>;
  createFolder(opts: CreateFolderOptions): Promise<{ relativePath: string }>;
  deleteFolder(relativePath: string): Promise<{ success: boolean }>;
  setFolderIcon(folderRelativePath: string, icon: string): Promise<boolean>;
  getTree(environmentName?: string): Promise<VaultTreeItem[]>;
  readPage(relativePath: string): Promise<{
    path: string;
    relativePath: string;
    content: string;
    createdAt: number;
    updatedAt: number;
  }>;
  writePage(relativePath: string, content: string): Promise<{
    relativePath: string;
    updatedAt: number;
  }>;
  createPage(opts: CreatePageOptions): Promise<{
    relativePath: string;
    title: string;
  }>;
  renamePage(oldRelativePath: string, newTitle: string): Promise<RenamePageResult>;
  deletePage(relativePath: string): Promise<{ success: boolean; message?: string }>;
  getWorkspace(): Promise<WorkspaceConfig>;
  saveWorkspace(config: WorkspaceConfig): Promise<boolean>;

  search(query: string, limit?: number): Promise<VaultSearchResult[]>;
  getBacklinks(relativePath: string, title?: string): Promise<VaultBacklink[]>;
  rebuildIndex(): Promise<boolean>;

  listTrash(): Promise<VaultTrashItem[]>;
  restorePage(trashFileName: string): Promise<{ restoredRelPath: string }>;
  emptyTrash(): Promise<{ success: boolean }>;

  listHistory(relativePath: string): Promise<VaultHistoryItem[]>;
  readHistoryContent(relativePath: string, timestamp: string | number): Promise<string>;
  restoreHistory(relativePath: string, timestamp: string): Promise<{ success: boolean }>;
  moveItem(srcRelativePath: string, targetFolderRelativePath: string): Promise<{ success: boolean; newRelativePath: string }>;
  getVaultRoot(): Promise<string>;
  exportPage(relativePath: string, defaultName?: string): Promise<{ canceled?: boolean; success?: boolean }>;
  exportVaultZip(): Promise<{ canceled?: boolean; success?: boolean }>;
}
