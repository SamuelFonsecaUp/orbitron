import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';
import { Extension } from '@tiptap/core';

export const TabIndentExtension = Extension.create({
  name: 'tabIndent',
  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (this.editor.can().sinkListItem('listItem')) {
          return this.editor.chain().focus().sinkListItem('listItem').run();
        }
        if (this.editor.can().sinkListItem('taskItem')) {
          return this.editor.chain().focus().sinkListItem('taskItem').run();
        }
        return false;
      },
      'Shift-Tab': () => {
        if (this.editor.can().liftListItem('listItem')) {
          return this.editor.chain().focus().liftListItem('listItem').run();
        }
        if (this.editor.can().liftListItem('taskItem')) {
          return this.editor.chain().focus().liftListItem('taskItem').run();
        }
        return false;
      },
    };
  },
});

export function getEditorExtensions(placeholder = "Digite '/' para comandos ou comece a escrever...") {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      history: { depth: 100, newGroupDelay: 500 },
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: 'text-brand-400 underline cursor-pointer' },
    }),
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === 'heading') {
          return `Título ${node.attrs.level}`;
        }
        return placeholder;
      },
      emptyNodeClass: 'is-empty text-slate-600',
    }),
    TabIndentExtension,
    Markdown.configure({
      html: false,
      tightLists: true,
      bulletListMarker: '-',
      linkify: true,
      breaks: false,
      transformPastedText: true,
      transformCopiedText: true,
    }),
  ];
}
