import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { VaultService } from '../electron/vaultService.cjs';
import { computeTextDiff } from '../src/modules/vault/domain/textDiff';

describe('Vault Move Items (Drag & Drop) and Text Diffing', () => {
  let tmpVault: string;
  let vault: VaultService;

  beforeEach(() => {
    tmpVault = fs.mkdtempSync(path.join(os.tmpdir(), 'pigo_drag_test_'));
    vault = new VaultService();
    vault.init(tmpVault);
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpVault, { recursive: true, force: true });
    } catch (e) {}
  });

  it('moves a note into a folder physically and updates relative path', () => {
    vault.createFolder({ parentRelativeDir: 'Pessoal', folderName: 'Projetos' });
    const page = vault.createPage({ parentRelativeDir: 'Pessoal', title: 'MinhaTarefa' });

    expect(page.relativePath).toBe('Pessoal/MinhaTarefa.md');

    const moveRes = vault.moveItem('Pessoal/MinhaTarefa.md', 'Pessoal/Projetos');
    expect(moveRes.success).toBe(true);
    expect(moveRes.newRelativePath).toBe('Pessoal/Projetos/MinhaTarefa.md');

    // Verify file exists in new location and removed from old
    expect(fs.existsSync(path.join(tmpVault, 'Pessoal', 'Projetos', 'MinhaTarefa.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpVault, 'Pessoal', 'MinhaTarefa.md'))).toBe(false);
  });

  it('computes Google Docs style line diff correctly', () => {
    const oldVersion = '# Título Antigo\nPrimeira linha\nLinha para remover\nFinal';
    const newVersion = '# Título Novo\nPrimeira linha\nLinha adicionada\nFinal';

    const diff = computeTextDiff(oldVersion, newVersion);

    expect(diff.some((d) => d.type === 'removed' && d.text === '# Título Antigo')).toBe(true);
    expect(diff.some((d) => d.type === 'added' && d.text === '# Título Novo')).toBe(true);
    expect(diff.some((d) => d.type === 'unchanged' && d.text === 'Primeira linha')).toBe(true);
    expect(diff.some((d) => d.type === 'removed' && d.text === 'Linha para remover')).toBe(true);
    expect(diff.some((d) => d.type === 'added' && d.text === 'Linha adicionada')).toBe(true);
    expect(diff.some((d) => d.type === 'unchanged' && d.text === 'Final')).toBe(true);
  });

  it('reflects custom page and folder icons in getTree', () => {
    vault.createFolder({ parentRelativeDir: 'Pessoal', folderName: 'Financas' });
    vault.setFolderIcon('Pessoal/Financas', 'DollarSign');

    const pageContent = '---\ntitle: Orcamento\nicon: Target\n---\n# Orcamento\nConteudo';
    vault.writePage('Pessoal/Financas/Orcamento.md', pageContent);

    const tree = vault.getTree('Pessoal');
    const folder = tree.find((t: any) => t.name === 'Financas');
    expect(folder).toBeDefined();
    expect(folder.icon).toBe('DollarSign');

    const note = folder.children.find((c: any) => c.name === 'Orcamento');
    expect(note).toBeDefined();
    expect(note.icon).toBe('Target');
  });
});
