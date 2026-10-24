import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { SLASH_COMMANDS, SlashItem } from './slashCommandsData';

export type { SlashItem };
export { SLASH_COMMANDS };

interface SlashCommandMenuProps {
  editor: Editor;
  query: string;
  position: { top: number; left: number };
  onClose: () => void;
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  editor,
  query,
  position,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const cleanQuery = query.toLowerCase().trim();
  const filtered = SLASH_COMMANDS.filter((cmd) => {
    if (!cleanQuery) return true;
    return (
      cmd.title.toLowerCase().includes(cleanQuery) ||
      cmd.keywords.some((k) => k.includes(cleanQuery))
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const el = itemRefs.current[selectedIndex];
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const executeCommand = (item: SlashItem) => {
    // Delete slash text from line
    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from, '\n', '\n');
    const slashPos = textBefore.lastIndexOf('/');
    if (slashPos !== -1) {
      const deleteLen = textBefore.length - slashPos;
      editor.chain().deleteRange({ from: from - deleteLen, to: from }).run();
    }
    item.action(editor);
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          executeCommand(filtered[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [filtered, selectedIndex]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      className="fixed z-50 w-72 max-h-80 overflow-y-auto bg-[#131620] border border-slate-700/80 rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5 custom-scrollbar text-xs select-none"
    >
      <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
        Comandos do Bloco
      </div>

      {filtered.map((item, idx) => {
        const Icon = item.icon;
        const isSelected = idx === selectedIndex;
        return (
          <button
            key={item.id}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            type="button"
            onClick={() => executeCommand(item)}
            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
              isSelected
                ? 'bg-brand-500/20 text-brand-200'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div
              className={`p-1.5 rounded-md ${
                isSelected ? 'bg-brand-500/30 text-white' : 'bg-slate-800/80 text-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col truncate">
              <span className="font-medium text-slate-200 truncate">{item.title}</span>
              <span className="text-[10px] text-slate-400 truncate">{item.description}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
