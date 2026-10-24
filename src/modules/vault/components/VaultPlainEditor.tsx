import React, { useRef, useEffect } from 'react';

interface VaultPlainEditorProps {
  content: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const VaultPlainEditor: React.FC<VaultPlainEditorProps> = ({
  content,
  onChange,
  placeholder = 'Comece a escrever sua nota em Markdown...',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height to scroll smoothly with container
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(400, textareaRef.current.scrollHeight)}px`;
    }
  }, [content]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6 overscroll-contain custom-scrollbar">
      <div className="max-w-[720px] mx-auto flex flex-col min-h-full pb-48">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          className="w-full bg-transparent resize-none outline-none text-slate-200 text-sm md:text-base leading-relaxed font-sans placeholder:text-slate-600 focus:outline-none min-h-[500px]"
          style={{ tabSize: 2 }}
        />
      </div>
    </div>
  );
};
