export interface PageFrontmatter {
  title?: string;
  icon?: string;
  created_at?: string;
  updated_at?: string;
  sort_rank?: string;
  parent_path?: string;
  tags?: string[];
  [key: string]: any;
}

export interface VaultPage {
  path: string; // Absolute path on disk
  relativePath: string; // Relative to vault root (e.g. "Projetos/App.md")
  title: string;
  icon?: string;
  body: string; // Raw markdown body without frontmatter
  rawContent: string; // Complete file content including frontmatter
  frontmatter: PageFrontmatter;
  hash: string;
  createdAt: number;
  updatedAt: number;
}

export interface VaultTreeItem {
  id: string; // usually relativePath
  name: string;
  relativePath: string;
  isDirectory: boolean;
  children?: VaultTreeItem[];
  icon?: string;
  sortRank?: string;
  updatedAt?: number;
}

export interface VaultEnvironment {
  id: string;
  name: string;
  icon?: string;
  path: string;
}

export interface WorkspaceConfig {
  activeEnvironment?: string;
  environments?: VaultEnvironment[];
  folderIcons?: Record<string, string>;
  lastOpenedPath?: string;
  expandedFolders: string[];
  favorites: string[];
  pinned: string[];
  sortMode?: 'rank' | 'alphabetical' | 'date';
}

export interface CreateFolderOptions {
  parentRelativeDir?: string;
  folderName: string;
}

export interface CreatePageOptions {
  parentRelativeDir?: string; // e.g. "" or "Projetos"
  title: string;
  initialBody?: string;
  icon?: string;
}

export interface RenamePageResult {
  oldRelativePath: string;
  newRelativePath: string;
  newTitle: string;
}

export interface VaultSearchResult {
  path: string;
  title: string;
  snippet?: string;
  rank?: number;
}

export interface VaultBacklink {
  path: string;
  title: string;
  icon?: string;
  updated_at?: number;
}

export interface VaultTrashItem {
  id: string;
  fileName: string;
  originalName: string;
  trashedAt: number;
}

export interface VaultHistoryItem {
  id: string;
  timestamp: number;
  size: number;
}

export interface MoveItemResult {
  success: boolean;
  oldRelativePath: string;
  newRelativePath: string;
}
