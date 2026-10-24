import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { GripVertical, Plus, Trash2, Copy } from 'lucide-react';

interface BlockDragHandleProps {
  editor: Editor;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const BlockDragHandle: React.FC<BlockDragHandleProps> = ({ editor, containerRef }) => {
  const [coords, setCoords] = useState<{ top: number; left: number; nodePos: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Find direct child block of .ProseMirror
      const proseMirror = container.querySelector('.ProseMirror');
      if (!proseMirror) return;

      const element = document.elementFromPoint(e.clientX, e.clientY);
      if (!element || !proseMirror.contains(element)) {
        if (!menuOpen) setCoords(null);
        return;
      }

      // Find top-level block inside editor
      let block = element as HTMLElement;
      while (block && block.parentElement && block.parentElement !== proseMirror) {
        block = block.parentElement;
      }

      if (block && block.parentElement === proseMirror) {
        const rect = block.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const pos = editor.view.posAtDOM(block, 0);

        setCoords({
          top: rect.top - containerRect.top + container.scrollTop,
          left: Math.max(8, rect.left - containerRect.left - 48),
          nodePos: pos,
        });
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, [editor, containerRef, menuOpen]);

  if (!coords) return null;

  const handleDuplicate = () => {
    setMenuOpen(false);
    const node = editor.state.doc.nodeAt(coords.nodePos);
    if (node) {
      editor.chain().insertContentAt(coords.nodePos + node.nodeSize, node.toJSON()).focus().run();
    }
  };

  const handleDelete = () => {
    setMenuOpen(false);
    const node = editor.state.doc.nodeAt(coords.nodePos);
    if (node) {
      editor.chain().deleteRange({ from: coords.nodePos, to: coords.nodePos + node.nodeSize }).focus().run();
    }
  };

  const handleAddBelow = () => {
    const node = editor.state.doc.nodeAt(coords.nodePos);
    const insertPos = node ? coords.nodePos + node.nodeSize : coords.nodePos;
    editor.chain().insertContentAt(insertPos, { type: 'paragraph' }).focus(insertPos + 1).run();
  };

  return (
    <div
      style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
      className="absolute flex items-center gap-0.5 text-slate-500 hover:text-slate-300 transition-opacity z-20 select-none"
    >
      <button
        type="button"
        onClick={handleAddBelow}
        title="Adicionar bloco abaixo"
        className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        title="Arrastar ou opções do bloco"
        className="p-1 hover:bg-slate-800 rounded cursor-grab active:cursor-grabbing text-slate-500 hover:text-white transition-colors"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      {menuOpen && (
        <div className="absolute top-7 left-0 w-36 bg-[#161a26] border border-slate-700/80 rounded-xl shadow-2xl p-1 flex flex-col gap-0.5 text-xs z-30">
          <button
            type="button"
            onClick={handleDuplicate}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white text-left"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>Duplicar</span>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir bloco</span>
          </button>
        </div>
      )}
    </div>
  );
};
