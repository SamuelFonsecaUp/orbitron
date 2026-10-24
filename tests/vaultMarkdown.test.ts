import { describe, it, expect } from 'vitest';
import {
  parseFrontmatter,
  serializeMarkdownFile,
  extractPageTitle,
  computeContentHash,
} from '../src/modules/vault/domain/markdownParser';

describe('Markdown & Frontmatter Round-Trip', () => {
  it('preserves clean markdown content without frontmatter', () => {
    const raw = '# Título\n\nEste é um parágrafo.\n\n- Item 1\n- Item 2\n';
    const { frontmatter, body } = parseFrontmatter(raw);

    expect(Object.keys(frontmatter)).toHaveLength(0);
    expect(body).toBe(raw);
    const serialized = serializeMarkdownFile(body, frontmatter);
    expect(serialized).toBe(raw);
  });

  it('round-trips frontmatter with title, tags, date and nested markdown body', () => {
    const raw = [
      '---',
      'title: Planejamento Estratégico 2026',
      'icon: 🎯',
      'sort_rank: a0',
      'created_at: "2026-10-24T10:00:00.000Z"',
      'tags:',
      '  - negócios',
      '  - planejamento',
      '---',
      '# Planejamento Estratégico 2026',
      '',
      'Texto com **negrito**, *itálico* e `código inline`.',
      '',
      '> Citação importante para a equipe.',
      '',
      '- [ ] Tarefa pendente 1',
      '- [x] Tarefa concluída 2',
      '',
      '```typescript',
      'function test() {',
      '  return true;',
      '}',
      '```',
      '',
      '---',
      '',
      '### Seção 2',
      '1. Primeiro',
      '2. Segundo',
      '   - Sub-item A',
      '   - Sub-item B',
      '     1. Nível 3 aninhado',
      '',
    ].join('\n');

    const { frontmatter, body } = parseFrontmatter(raw);
    expect(frontmatter.title).toBe('Planejamento Estratégico 2026');
    expect(frontmatter.icon).toBe('🎯');
    expect(frontmatter.tags).toEqual(['negócios', 'planejamento']);

    const serialized = serializeMarkdownFile(body, frontmatter);
    expect(serialized).toBe(raw);
  });

  it('computes identical hashes for identical content and changes on edit', () => {
    const contentA = '# Minha Nota\n\nTexto original';
    const contentB = '# Minha Nota\n\nTexto original';
    const contentC = '# Minha Nota\n\nTexto modificado';

    const hashA = computeContentHash(contentA);
    const hashB = computeContentHash(contentB);
    const hashC = computeContentHash(contentC);

    expect(hashA).toBe(hashB);
    expect(hashA).not.toBe(hashC);
  });

  it('extracts title correctly from frontmatter, H1 or filename', () => {
    // 1. From frontmatter
    expect(extractPageTitle('# Outro', 'Título Frontmatter', 'nota.md')).toBe('Título Frontmatter');

    // 2. From H1
    expect(extractPageTitle('# Título do H1\n\nResto do corpo', undefined, 'arquivo.md')).toBe('Título do H1');

    // 3. From filename fallback
    expect(extractPageTitle('Sem nenhum título aqui\n\nApenas texto.', undefined, 'Minha-Ideia.md')).toBe('Minha-Ideia');

    // 4. Default fallback
    expect(extractPageTitle('', undefined, undefined)).toBe('Sem título');
  });

  it('handles deeply nested lists up to 3 levels without corruption', () => {
    const raw = [
      '---',
      'title: Hierarquia',
      '---',
      '- Nível 1',
      '  - Nível 2',
      '    - Nível 3',
      '      - Nível 4 profundo',
    ].join('\n');

    const { frontmatter, body } = parseFrontmatter(raw);
    const serialized = serializeMarkdownFile(body, frontmatter);
    expect(serialized).toBe(raw);
  });
});
