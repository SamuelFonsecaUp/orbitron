import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, ArrowRight } from 'lucide-react';
import { getVaultRepository } from '../repository/ElectronVaultRepository';
import { VaultSearchResult } from '../../../types/vault';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPage: (relativePath: string) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectPage,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VaultSearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const repo = useRef(getVaultRepository()).current;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    let cancel = false;
    const clean = query.trim();

    if (!clean) {
      // Default to initial search or recent
      repo.search('a', 15).then((res) => {
        if (!cancel) {
          setResults(res);
          setSelectedIndex(0);
        }
      });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await repo.search(clean, 20);
        if (!cancel) {
          setResults(res);
          setSelectedIndex(0);
        }
      } catch (e) {
        console.error(e);
      }
    }, 150);

    return () => {
      cancel = true;
      clearTimeout(timer);
    };
  }, [query, repo]);

  const handleSelect = (item: VaultSearchResult) => {
    onSelectPage(item.path);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(1, results.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div
        className="w-full max-w-xl bg-[#121520] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar páginas ou conteúdo no vault (ex: ideias, finanças)..."
            className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded border border-slate-700">
            Esc
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar text-xs">
          {results.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Nenhum resultado encontrado para "{query}".
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.path}
                  onClick={() => handleSelect(item)}
                  className={`flex flex-col p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-brand-500/20 text-white'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate font-medium">
                      <FileText
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-brand-400' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 truncate">{item.path}</span>
                  </div>

                  {item.snippet && (
                    <div
                      className="mt-1 text-[11px] text-slate-400 line-clamp-1 pl-6"
                      dangerouslySetInnerHTML={{ __html: item.snippet }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>↑↓ Navegar</span>
            <span>↵ Abrir</span>
          </div>
          <span>Busca tolerante a acentos (FTS5)</span>
        </div>
      </div>
    </div>
  );
};
