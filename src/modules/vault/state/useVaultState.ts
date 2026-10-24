import { useState, useEffect, useRef, useCallback } from 'react';
import { getVaultRepository } from '../repository/ElectronVaultRepository';
import { parseFrontmatter, extractPageTitle, computeContentHash, updateTreeIcon } from '../domain/markdownParser';
import { VaultTreeItem, VaultPage, WorkspaceConfig, VaultEnvironment } from '../../../types/vault';
import { useVaultSave } from './useVaultSave';

export function useVaultState() {
  const repo = useRef(getVaultRepository()).current;
  const [environments, setEnvironments] = useState<VaultEnvironment[]>([]);
  const [activeEnvironment, setActiveEnvironment] = useState<string>('Pessoal');
  const [tree, setTree] = useState<VaultTreeItem[]>([]);
  const [activePage, setActivePage] = useState<VaultPage | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [editorTitle, setEditorTitle] = useState<string>('');
  const [editorIcon, setEditorIcon] = useState<string>('FileText');
  const [workspace, setWorkspace] = useState<WorkspaceConfig>({ expandedFolders: [], favorites: [], pinned: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const activeEnvRef = useRef<string>('Pessoal');
  activeEnvRef.current = activeEnvironment;

  const { saveStatus, setSaveStatus, flushSave, scheduleSave } = useVaultSave({
    repo, activePage, editorContent, editorTitle, editorIcon,
  });

  const refreshTree = useCallback(async (envName?: string) => {
    try {
      const targetEnv = envName !== undefined ? envName : activeEnvRef.current;
      const items = await repo.getTree(targetEnv);
      setTree(items);
      return items;
    } catch {
      return [];
    }
  }, [repo]);

  const openPage = useCallback(async (relativePath: string) => {
    await flushSave();
    try {
      setIsLoading(true);
      const file = await repo.readPage(relativePath);
      const isCanvas = relativePath.endsWith('.canvas');
      const parsed = isCanvas ? { frontmatter: {}, body: '' } : parseFrontmatter(file.content);
      const title = isCanvas
        ? relativePath.split('/').pop()?.replace('.canvas', '') || 'Quadro'
        : extractPageTitle(parsed.body, parsed.frontmatter.title, relativePath);
      const icon = isCanvas ? 'LayoutGrid' : (parsed.frontmatter.icon || 'FileText');
      const hash = computeContentHash(file.content);

      setActivePage({
        path: file.path, relativePath: file.relativePath, title, icon, body: parsed.body,
        rawContent: file.content, frontmatter: parsed.frontmatter, hash,
        createdAt: file.createdAt, updatedAt: file.updatedAt,
      });
      setEditorContent(parsed.body);
      setEditorTitle(title);
      setEditorIcon(icon);
      setSaveStatus('saved');

      setWorkspace((prev) => {
        const next = { ...prev, lastOpenedPath: relativePath };
        repo.saveWorkspace(next).catch(() => {});
        return next;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [flushSave, repo, setSaveStatus]);

  const selectEnvironment = useCallback(async (envName: string) => {
    await flushSave();
    setActiveEnvironment(envName);
    activeEnvRef.current = envName;
    const items = await refreshTree(envName);
    setWorkspace((prev) => {
      const next = { ...prev, activeEnvironment: envName };
      repo.saveWorkspace(next).catch(() => {});
      return next;
    });
    const first = items.find((i) => !i.isDirectory);
    if (first) await openPage(first.relativePath);
    else { setActivePage(null); setEditorContent(''); }
  }, [flushSave, refreshTree, openPage, repo]);

  const createEnvironment = useCallback(async (name: string) => {
    try {
      const created = await repo.createEnvironment(name);
      const envs = await repo.getEnvironments();
      setEnvironments(envs);
      await selectEnvironment(created.name);
    } catch (e) { console.error(e); }
  }, [repo, selectEnvironment]);

  const createFolder = useCallback(async (parentDir?: string, folderName = 'Nova Pasta') => {
    await repo.createFolder({ parentRelativeDir: parentDir || activeEnvRef.current, folderName });
    await refreshTree();
  }, [repo, refreshTree]);

  const deleteFolder = useCallback(async (relativePath: string) => {
    await repo.deleteFolder(relativePath);
    await refreshTree();
  }, [repo, refreshTree]);

  const createPage = useCallback(async (parentDir?: string, initialTitle = 'Nova Nota') => {
    await flushSave();
    const res = await repo.createPage({ parentRelativeDir: parentDir ?? activeEnvRef.current, title: initialTitle });
    await refreshTree();
    await openPage(res.relativePath);
  }, [flushSave, refreshTree, openPage, repo]);

  const createCanvas = useCallback(async (parentDir?: string, initialTitle = 'Novo Quadro') => {
    await flushSave();
    const env = parentDir ?? activeEnvRef.current;
    const filename = `${initialTitle.trim() || 'Novo Quadro'}.canvas`;
    const relativePath = env ? `${env}/${filename}` : filename;
    try {
      const api = (window as any).electronAPI?.canvas || (window as any).orbitronCanvasApi;
      if (api?.write) await api.write(relativePath, { nodes: [], edges: [] });
      else await repo.writePage(relativePath, JSON.stringify({ nodes: [], edges: [] }));
      await refreshTree();
      await openPage(relativePath);
    } catch (e) { console.error(e); }
  }, [flushSave, refreshTree, openPage, repo]);

  const renameCurrentPage = useCallback(async (newTitle: string) => {
    if (!activePage || !newTitle.trim() || newTitle.trim() === activePage.title) return;
    await flushSave();
    const res = await repo.renamePage(activePage.relativePath, newTitle.trim());
    activePage.title = res.newTitle;
    activePage.relativePath = res.newRelativePath;
    setEditorTitle(res.newTitle);
    await refreshTree();
  }, [activePage, flushSave, refreshTree, repo]);

  const deletePage = useCallback(async (relativePath: string) => {
    if (activePage?.relativePath === relativePath) { setActivePage(null); setEditorContent(''); }
    await repo.deletePage(relativePath);
    const newTree = await refreshTree();
    if (newTree.length > 0 && !activePage) {
      const first = newTree.find((item) => !item.isDirectory);
      if (first) openPage(first.relativePath);
    }
  }, [activePage, refreshTree, openPage, repo]);

  const handleContentChange = useCallback((newBody: string) => {
    setEditorContent(newBody);
    scheduleSave();
  }, [scheduleSave]);

  const handleTitleChange = useCallback((newTitle: string) => {
    setEditorTitle(newTitle);
    scheduleSave();
  }, [scheduleSave]);

  const changePageIcon = useCallback((newIcon: string) => {
    setEditorIcon(newIcon);
    if (activePage) {
      activePage.icon = newIcon;
      setTree((prev) => updateTreeIcon(prev, activePage.relativePath, newIcon));
      scheduleSave();
    }
  }, [activePage, scheduleSave]);

  const changeFolderIcon = useCallback(async (folderRelativePath: string, newIcon: string) => {
    await repo.setFolderIcon(folderRelativePath, newIcon);
    setTree((prev) => updateTreeIcon(prev, folderRelativePath, newIcon));
  }, [repo]);

  const moveItem = useCallback(async (sourceRelPath: string, targetDirRelPath: string) => {
    try {
      await repo.moveItem(sourceRelPath, targetDirRelPath);
      await refreshTree();
      if (activePage?.relativePath === sourceRelPath) {
        const fileName = sourceRelPath.split('/').pop()!;
        const newRelPath = targetDirRelPath ? `${targetDirRelPath}/${fileName}` : fileName;
        await openPage(newRelPath);
      }
    } catch (e) { console.error(e); }
  }, [activePage, refreshTree, openPage, repo]);

  useEffect(() => {
    let mounted = true;
    async function boot() {
      try {
        await repo.init();
        const [ws, envs] = await Promise.all([repo.getWorkspace(), repo.getEnvironments()]);
        if (!mounted) return;
        setWorkspace(ws);
        setEnvironments(envs);
        const initialEnv = ws.activeEnvironment || (envs[0] ? envs[0].name : 'Pessoal');
        setActiveEnvironment(initialEnv);
        activeEnvRef.current = initialEnv;
        const items = await refreshTree(initialEnv);
        if (ws.lastOpenedPath) openPage(ws.lastOpenedPath);
        else if (items.length > 0) {
          const first = items.find((i) => !i.isDirectory);
          if (first) openPage(first.relativePath);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    boot();
    return () => { mounted = false; flushSave(); };
  }, [repo, refreshTree, openPage, flushSave]);

  return {
    environments, activeEnvironment, tree, activePage, editorContent, editorTitle, editorIcon,
    workspace, isLoading, saveStatus, openPage, selectEnvironment, createEnvironment,
    createFolder, deleteFolder, createPage, createCanvas, renameCurrentPage, deletePage,
    changePageIcon, changeFolderIcon, moveItem, handleContentChange, handleTitleChange,
    flushSave, refreshTree,
  };
}
