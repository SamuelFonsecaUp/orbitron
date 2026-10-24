import React, { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { getEditorExtensions } from './editorExtensions';
import { SlashCommandMenu } from './SlashCommandMenu';
import { FloatingFormatToolbar } from './FloatingFormatToolbar';
import { BlockDragHandle } from './BlockDragHandle';

interface VaultBlockEditorProps {
  content: string;
  onChange: (markdown: string) => void;
}

export const VaultBlockEditor: React.FC<VaultBlockEditorProps> = ({ content, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  const [slashState, setSlashState] = useState<{
    open: boolean;
    query: string;
    position: { top: number; left: number };
  }>({
    open: false,
    query: '',
    position: { top: 0, left: 0 },
  });

  const editor = useEditor({
    content,
    extensions: getEditorExtensions(),
    editorProps: {
      attributes: {
        class:
          'prose prose-invert max-w-none focus:outline-none min-h-[500px] text-slate-200 text-sm md:text-base leading-relaxed',
      },
    },
    onUpdate: ({ editor: ed }) => {
      isInternalUpdate.current = true;
      const markdown = (ed.storage as any).markdown.getMarkdown();
      onChange(markdown);

      // Detect slash command
      const { from } = ed.state.selection;
      const textBefore = ed.state.doc.textBetween(Math.max(0, from - 20), from, '\n', '\n');
      const slashIndex = textBefore.lastIndexOf('/');

      if (slashIndex !== -1 && !textBefore.slice(slashIndex).includes(' ')) {
        const query = textBefore.slice(slashIndex + 1);
        const coords = ed.view.coordsAtPos(from);
        setSlashState({
          open: true,
          query,
          position: {
            top: coords.bottom + 8,
            left: Math.max(16, Math.min(window.innerWidth - 300, coords.left)),
          },
        });
      } else {
        setSlashState((prev) => (prev.open ? { ...prev, open: false } : prev));
      }
    },
  });

  // Keep editor content in sync when a different page is selected
  useEffect(() => {
    if (!editor) return;
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    const currentMarkdown = (editor.storage as any).markdown.getMarkdown();
    if (currentMarkdown.trim() !== content.trim()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 min-h-0 overflow-y-auto px-8 py-6 overscroll-contain custom-scrollbar"
    >
      <div className="max-w-[720px] mx-auto min-h-full pb-48 relative">
        {editor && <BlockDragHandle editor={editor} containerRef={containerRef} />}
        {editor && <FloatingFormatToolbar editor={editor} />}
        {editor && slashState.open && (
          <SlashCommandMenu
            editor={editor}
            query={slashState.query}
            position={slashState.position}
            onClose={() => setSlashState((prev) => ({ ...prev, open: false }))}
          />
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
