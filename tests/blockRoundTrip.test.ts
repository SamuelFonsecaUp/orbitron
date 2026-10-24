// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Markdown } from 'tiptap-markdown';

function createTestEditor(initialMarkdown = '') {
  return new Editor({
    content: initialMarkdown,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Markdown.configure({
        html: false,
        tightLists: true,
        bulletListMarker: '-',
        linkify: false,
        breaks: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
  });
}

describe('Tiptap Markdown Block Parser & Serializer', () => {
  it('initializes and serializes headings, paragraphs and lists', () => {
    const input = '# Título Principal\n\nEste é um parágrafo de teste.\n\n- Item 1\n- Item 2';
    const editor = createTestEditor(input);

    const output = (editor.storage as any).markdown.getMarkdown();
    expect(output.trim()).toBe(input.trim());
    editor.destroy();
  });

  it('supports blockquote, horizontal rule and code blocks', () => {
    const input = [
      '> Citação importante',
      '',
      '---',
      '',
      '```',
      'const x = 42;',
      '```',
    ].join('\n');

    const editor = createTestEditor(input);
    const output = (editor.storage as any).markdown.getMarkdown();

    expect(output.trim()).toBe(input.trim());
    editor.destroy();
  });

  it('supports task lists / checkboxes in markdown', () => {
    const input = [
      '- [ ] Tarefa pendente',
      '- [x] Tarefa concluída',
    ].join('\n\n');

    const editor = createTestEditor(input);
    const output = (editor.storage as any).markdown.getMarkdown();

    expect(output.trim()).toBe(input.trim());
    editor.destroy();
  });

  it('supports bold, italic, code and inline formatting', () => {
    const input = 'Texto com **negrito**, *itálico* e `código inline`.';
    const editor = createTestEditor(input);

    const output = (editor.storage as any).markdown.getMarkdown();
    expect(output.trim()).toBe(input.trim());
    editor.destroy();
  });
});
