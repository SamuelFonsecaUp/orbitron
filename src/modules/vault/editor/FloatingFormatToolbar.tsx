import React, { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Heading1,
  Heading2,
  List,
  CheckSquare,
} from 'lucide-react';

interface FloatingFormatToolbarProps {
  editor: Editor;
}

export const FloatingFormatToolbar: React.FC<FloatingFormatToolbarProps> = ({ editor }) => {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const updatePosition = () => {
      const { selection } = editor.state;
      if (selection.empty) {
        setCoords(null);
        return;
      }

      const domSelection = window.getSelection();
      if (!domSelection || domSelection.rangeCount === 0) {
        setCoords(null);
        return;
      }

      const range = domSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setCoords(null);
        return;
      }

      // Above selection, or below if too close to viewport top
      const top = rect.top < 60 ? rect.bottom + 8 : rect.top - 46;
      const left = Math.max(16, Math.min(window.innerWidth - 320, rect.left + rect.width / 2 - 140));

      setCoords({ top, left });
    };

    editor.on('selectionUpdate', updatePosition);
    editor.on('blur', () => setCoords(null));

    return () => {
      editor.off('selectionUpdate', updatePosition);
    };
  }, [editor]);

  if (!coords) return null;

  return (
    <div
      style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
      className="fixed z-50 flex items-center gap-0.5 bg-[#141824] border border-slate-700/80 rounded-xl shadow-2xl p-1 text-slate-300 animate-in fade-in duration-150 select-none"
    >
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${
          editor.isActive('bold') ? 'bg-brand-500/20 text-brand-300 font-bold' : ''
        }`}
        title="Negrito (Ctrl+B)"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${
          editor.isActive('italic') ? 'bg-brand-500/20 text-brand-300 font-bold' : ''
        }`}
        title="Itálico (Ctrl+I)"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${
          editor.isActive('strike') ? 'bg-brand-500/20 text-brand-300 font-bold' : ''
        }`}
        title="Riscado (Ctrl+Shift+S)"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${
          editor.isActive('code') ? 'bg-brand-500/20 text-brand-300 font-bold' : ''
        }`}
        title="Código inline (Ctrl+E)"
      >
        <Code className="w-3.5 h-3.5" />
      </button>

      <div className="w-[1px] h-4 bg-slate-700/80 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${
          editor.isActive('heading', { level: 1 }) ? 'bg-brand-500/20 text-brand-300 font-bold' : ''
        }`}
        title="Título 1"
      >
        <Heading1 className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${
          editor.isActive('heading', { level: 2 }) ? 'bg-brand-500/20 text-brand-300 font-bold' : ''
        }`}
        title="Título 2"
      >
        <Heading2 className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${
          editor.isActive('bulletList') ? 'bg-brand-500/20 text-brand-300 font-bold' : ''
        }`}
        title="Lista com marcadores"
      >
        <List className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${
          editor.isActive('taskList') ? 'bg-brand-500/20 text-brand-300 font-bold' : ''
        }`}
        title="Lista de tarefas"
      >
        <CheckSquare className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
