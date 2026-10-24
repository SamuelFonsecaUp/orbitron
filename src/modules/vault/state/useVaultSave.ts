import { useState, useRef, useCallback } from 'react';
import { IVaultRepository } from '../repository/IVaultRepository';
import { serializeMarkdownFile, computeContentHash } from '../domain/markdownParser';
import { VaultPage } from '../../../types/vault';

const DEBOUNCE_MS = 400;

interface UseVaultSaveProps {
  repo: IVaultRepository;
  activePage: VaultPage | null;
  editorContent: string;
  editorTitle: string;
  editorIcon: string;
}

export function useVaultSave({
  repo,
  activePage,
  editorContent,
  editorTitle,
  editorIcon,
}: UseVaultSaveProps) {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const saveTimeoutRef = useRef<any>(null);

  const activePageRef = useRef(activePage);
  const editorContentRef = useRef(editorContent);
  const editorTitleRef = useRef(editorTitle);
  const editorIconRef = useRef(editorIcon);

  activePageRef.current = activePage;
  editorContentRef.current = editorContent;
  editorTitleRef.current = editorTitle;
  editorIconRef.current = editorIcon;

  const flushSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    const page = activePageRef.current;
    if (!page) return;

    const currentBody = editorContentRef.current;
    const currentTitle = editorTitleRef.current;
    const currentIcon = editorIconRef.current;

    const updatedFrontmatter = {
      ...page.frontmatter,
      title: currentTitle,
      icon: currentIcon,
      updated_at: new Date().toISOString(),
    };

    const fullMarkdown = serializeMarkdownFile(currentBody, updatedFrontmatter);
    const newHash = computeContentHash(fullMarkdown);
    if (newHash === page.hash) {
      setSaveStatus('saved');
      return;
    }

    try {
      setSaveStatus('saving');
      await repo.writePage(page.relativePath, fullMarkdown);
      page.hash = newHash;
      page.rawContent = fullMarkdown;
      page.body = currentBody;
      page.frontmatter = updatedFrontmatter;
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }, [repo]);

  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(flushSave, DEBOUNCE_MS);
  }, [flushSave]);

  return {
    saveStatus,
    setSaveStatus,
    flushSave,
    scheduleSave,
  };
}
