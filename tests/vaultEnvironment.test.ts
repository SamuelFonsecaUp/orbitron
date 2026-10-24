import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { VaultService } from '../electron/vaultService.cjs';

describe('Vault Environments & Folder Hierarchies', () => {
  let tmpVault: string;
  let vault: VaultService;

  beforeEach(() => {
    tmpVault = fs.mkdtempSync(path.join(os.tmpdir(), 'pigo_env_test_'));
    vault = new VaultService();
    vault.init(tmpVault);
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpVault, { recursive: true, force: true });
    } catch (e) {}
  });

  it('initializes default "Pessoal" environment and seeds starter note', () => {
    const envs = vault.getEnvironments();
    expect(envs.length).toBeGreaterThanOrEqual(1);
    expect(envs.some((e: any) => e.name === 'Pessoal')).toBe(true);

    const tree = vault.getTree('Pessoal');
    expect(tree.length).toBeGreaterThanOrEqual(1);
    expect(tree.some((t: any) => t.name === 'Bem-vindo ao Pigo')).toBe(true);
  });

  it('creates new environment with starter note', () => {
    const newEnv = vault.createEnvironment('Trabalho', '💼');
    expect(newEnv.name).toBe('Trabalho');
    expect(newEnv.icon).toBe('💼');

    const envs = vault.getEnvironments();
    expect(envs.some((e: any) => e.name === 'Trabalho')).toBe(true);

    const tree = vault.getTree('Trabalho');
    expect(tree.length).toBe(1);
    expect(tree[0].name).toBe('Início');
  });

  it('creates folders, subfolders and pages inside an environment', () => {
    // 1. Create a folder in Pessoal
    const folderRes = vault.createFolder({ parentRelativeDir: 'Pessoal', folderName: 'Projetos' });
    expect(folderRes.relativePath).toBe('Pessoal/Projetos');

    // 2. Create subfolder
    const subfolderRes = vault.createFolder({ parentRelativeDir: 'Pessoal/Projetos', folderName: 'App' });
    expect(subfolderRes.relativePath).toBe('Pessoal/Projetos/App');

    // 3. Create page inside subfolder
    const pageRes = vault.createPage({
      parentRelativeDir: 'Pessoal/Projetos/App',
      title: 'Roadmap',
      initialBody: 'Definição de roadmap',
    });
    expect(pageRes.relativePath).toBe('Pessoal/Projetos/App/Roadmap.md');

    // 4. Verify tree hierarchy
    const tree = vault.getTree('Pessoal');
    const projetosFolder = tree.find((t: any) => t.name === 'Projetos');
    expect(projetosFolder).toBeDefined();
    expect(projetosFolder.isDirectory).toBe(true);
    expect(projetosFolder.children.length).toBe(1);
    expect(projetosFolder.children[0].name).toBe('App');
    expect(projetosFolder.children[0].children[0].name).toBe('Roadmap');
  });

  it('deletes folder and moves to trash', () => {
    vault.createFolder({ parentRelativeDir: 'Pessoal', folderName: 'TempFolder' });
    vault.createPage({ parentRelativeDir: 'Pessoal/TempFolder', title: 'NotaTemp' });

    const delRes = vault.deleteFolder('Pessoal/TempFolder');
    expect(delRes.success).toBe(true);

    const treeAfter = vault.getTree('Pessoal');
    expect(treeAfter.some((t: any) => t.name === 'TempFolder')).toBe(false);
  });
});
