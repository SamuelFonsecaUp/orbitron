import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { VaultIndexService } from '../electron/vaultIndexService.cjs';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('FTS5 Full-Text Search & Backlinks Engine', () => {
  let tmpVault: string;
  let indexer: VaultIndexService;

  beforeEach(() => {
    tmpVault = fs.mkdtempSync(path.join(os.tmpdir(), 'pigo_test_vault_'));
    indexer = new VaultIndexService();
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpVault, { recursive: true, force: true });
    } catch (e) {}
  });

  it('matches diacritics / accent tolerance in Portuguese', () => {
    const content = [
      '---',
      'title: Gestão Financeira',
      '---',
      '# Gestão Financeira',
      'Texto com instruções sobre poupança e ações de empresas.',
    ].join('\n');

    indexer.indexPage(tmpVault, 'Financeiro/Gestao.md', content);

    // Search without accents: "gestao" should match "Gestão"
    const results1 = indexer.search(tmpVault, 'gestao');
    expect(results1.length).toBeGreaterThanOrEqual(1);
    expect(results1[0].title).toBe('Gestão Financeira');

    // Search without accents in body: "poupanca" should match "poupança"
    const results2 = indexer.search(tmpVault, 'poupanca');
    expect(results2.length).toBeGreaterThanOrEqual(1);
    expect(results2[0].path).toBe('Financeiro/Gestao.md');
  });

  it('detects wikilinks and retrieves backlinks correctly', () => {
    const pageA = [
      '---',
      'title: Roadmap 2026',
      '---',
      'Neste projeto vamos consultar o [[Manual de Finanças]] para diretrizes.',
    ].join('\n');

    const pageB = [
      '---',
      'title: Manual de Finanças',
      '---',
      'Aqui estão as regras gerais.',
    ].join('\n');

    indexer.indexPage(tmpVault, 'Projetos/Roadmap.md', pageA);
    indexer.indexPage(tmpVault, 'Documentos/Manual de Finanças.md', pageB);

    const backlinks = indexer.getBacklinks(tmpVault, 'Documentos/Manual de Finanças.md', 'Manual de Finanças');
    expect(backlinks.length).toBe(1);
    expect(backlinks[0].title).toBe('Roadmap 2026');
    expect(backlinks[0].path).toBe('Projetos/Roadmap.md');
  });

  it('rebuilds entire index from physical disk files', () => {
    // Create actual files on disk
    fs.mkdirSync(path.join(tmpVault, 'Notas'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpVault, 'Notas', 'Ideia.md'),
      '# Ideia Revolucionária\n\nConstruir um app local-first com Obsidian vault.',
      'utf8'
    );

    indexer.rebuildIndex(tmpVault);

    const results = indexer.search(tmpVault, 'revolucionaria');
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Ideia Revolucionária');
  });
});
