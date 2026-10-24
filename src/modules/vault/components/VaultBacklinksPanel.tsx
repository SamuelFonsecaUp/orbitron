import React, { useState, useEffect } from 'react';
import { Link2, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { getVaultRepository } from '../repository/ElectronVaultRepository';
import { VaultBacklink } from '../../../types/vault';

interface VaultBacklinksPanelProps {
  relativePath: string;
  title: string;
  onOpenPage: (path: string) => void;
}

export const VaultBacklinksPanel: React.FC<VaultBacklinksPanelProps> = ({
  relativePath,
  title,
  onOpenPage,
}) => {
  const [backlinks, setBacklinks] = useState<VaultBacklink[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const repo = getVaultRepository();

  useEffect(() => {
    let cancel = false;
    async function load() {
      try {
        const links = await repo.getBacklinks(relativePath, title);
        if (!cancel) setBacklinks(links);
      } catch (e) {
        console.error(e);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [relativePath, title, repo]);

  if (backlinks.length === 0) return null;

  return (
    <div className="mt-12 pt-6 border-t border-slate-800/80 max-w-[720px] mx-auto select-none">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors mb-3"
      >
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <Link2 className="w-3.5 h-3.5 text-brand-400" />
        <span>{backlinks.length} {backlinks.length === 1 ? 'Backlink' : 'Backlinks'} (Notas apontando para cá)</span>
      </button>

      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {backlinks.map((link) => (
            <div
              key={link.path}
              onClick={() => onOpenPage(link.path)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 cursor-pointer text-slate-300 hover:text-white transition-all group"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400 shrink-0" />
              <div className="flex flex-col truncate">
                <span className="font-medium truncate">{link.title}</span>
                <span className="text-[10px] text-slate-500 truncate">{link.path}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
