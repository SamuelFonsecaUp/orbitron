import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Check, FolderPlus, Layers } from 'lucide-react';
import { VaultEnvironment } from '../../../types/vault';
import { VaultIconRenderer } from './VaultIconRenderer';

interface VaultEnvironmentPickerProps {
  environments: VaultEnvironment[];
  activeEnvironment: string;
  onSelectEnvironment: (name: string) => void;
  onCreateEnvironment: (name: string) => void;
}

export const VaultEnvironmentPicker: React.FC<VaultEnvironmentPickerProps> = ({
  environments,
  activeEnvironment,
  onSelectEnvironment,
  onCreateEnvironment,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentEnv = environments.find((e) => e.name === activeEnvironment) || {
    id: activeEnvironment,
    name: activeEnvironment,
    icon: 'User',
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvName.trim()) return;
    onCreateEnvironment(newEnvName.trim());
    setNewEnvName('');
    setIsCreating(false);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/70 border border-transparent hover:border-slate-800 transition-all text-left group"
      >
        <div className="flex items-center gap-3 truncate">
          <div className="w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <VaultIconRenderer icon={currentEnv.icon || 'Folder'} className="w-4 h-4 text-brand-400" />
          </div>
          <div className="truncate flex flex-col">
            <span className="text-xs font-semibold text-slate-100 truncate tracking-wide">
              {currentEnv.name}
            </span>
            <span className="text-[10px] text-slate-400">Ambiente de notas</span>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full z-50 bg-[#141724] border border-slate-700/80 rounded-xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-1 text-xs">
          <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-brand-400" />
            <span>Seus Ambientes</span>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar">
            {environments.map((env) => {
              const isSelected = env.name === activeEnvironment;
              return (
                <button
                  key={env.id}
                  type="button"
                  onClick={() => {
                    onSelectEnvironment(env.name);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                    isSelected
                      ? 'bg-brand-500/20 text-brand-200 font-medium'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <VaultIconRenderer icon={env.icon || 'Folder'} className="w-4 h-4 text-brand-400 shrink-0" />
                    <span className="truncate">{env.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-brand-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="pt-1.5 mt-1 border-t border-slate-800/80">
            {isCreating ? (
              <form onSubmit={handleCreate} className="space-y-1.5 p-1">
                <input
                  type="text"
                  autoFocus
                  placeholder="Nome do novo ambiente..."
                  value={newEnvName}
                  onChange={(e) => setNewEnvName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-brand-500/60 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <div className="flex items-center gap-1.5 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-2 py-1 text-[11px] text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-[11px] font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-md transition-colors"
                  >
                    Criar
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-brand-500/10 transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span className="font-medium">Criar novo ambiente</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
