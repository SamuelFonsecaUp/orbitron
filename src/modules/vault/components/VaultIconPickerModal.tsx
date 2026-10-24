import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { ICON_MAP, VaultIconRenderer } from './VaultIconRenderer';

interface VaultIconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIcon?: string;
  onSelectIcon: (iconName: string) => void;
}

export const VaultIconPickerModal: React.FC<VaultIconPickerModalProps> = ({
  isOpen,
  onClose,
  currentIcon = 'FileText',
  onSelectIcon,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(currentIcon);

  if (!isOpen) return null;

  const iconNames = Object.keys(ICON_MAP);
  const filtered = iconNames.filter((name) =>
    name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const handleConfirm = (iconName: string) => {
    setSelected(iconName);
    onSelectIcon(iconName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-sm bg-[#121520] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-500/15 rounded-xl text-brand-400">
              <VaultIconRenderer icon={selected} className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Escolher Ícone</h3>
              <p className="text-[11px] text-slate-400">Personalize o ícone desta nota</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-800/60">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              autoFocus
              placeholder="Buscar ícone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Grid of icons */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-5 gap-2 custom-scrollbar">
          {filtered.map((name) => {
            const isChosen = name === selected;
            return (
              <button
                key={name}
                type="button"
                onClick={() => handleConfirm(name)}
                title={name}
                className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all ${
                  isChosen
                    ? 'bg-brand-500/25 border border-brand-500 text-brand-300 scale-105 shadow-md'
                    : 'bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <VaultIconRenderer icon={name} className="w-5 h-5" />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between text-xs text-slate-500">
          <span>{filtered.length} ícones disponíveis</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
