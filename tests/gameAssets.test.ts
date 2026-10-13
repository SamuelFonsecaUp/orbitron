import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { initDatabase, closeDatabase } from '../electron/database.cjs';
import { FinancialService } from '../electron/services.cjs';

describe('User game assets folder', () => {
  let service: any;
  let previousCwd: string;
  let tempDir: string;

  beforeEach(() => {
    // Fora do Electron a pasta de dados cai no diretório atual: usa uma pasta temporária
    previousCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pigo-assets-'));
    process.chdir(tempDir);
    service = new FinancialService(initDatabase(':memory:'));
  });

  afterEach(() => {
    closeDatabase();
    process.chdir(previousCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates the folder with a guide and an example manifest', () => {
    const assets = service.getGameAssets();
    expect(fs.existsSync(path.join(assets.folder, 'LEIA-ME.txt'))).toBe(true);
    expect(fs.existsSync(path.join(assets.folder, 'mobis'))).toBe(true);
    expect(assets.manifest.mobis.exemplo_meu_sofa.w).toBe(2);
    expect(assets.pigo).toBeNull();
  });

  it('reads images by folder and tolerates a BOM in the manifest', () => {
    const folder = service.getGameAssetsFolder();
    const png = Buffer.from('89504e470d0a1a0a', 'hex');
    fs.writeFileSync(path.join(folder, 'mobis', 'cofre.png'), png);
    fs.writeFileSync(path.join(folder, 'pisos', 'madeira_hd.png'), png);
    fs.writeFileSync(path.join(folder, 'paredes', 'tijolo.png'), png);
    fs.writeFileSync(path.join(folder, 'mobis', 'notas.txt'), 'ignorado');
    fs.writeFileSync(path.join(folder, 'pigo.png'), png);
    fs.writeFileSync(path.join(folder, 'manifest.json'), '﻿{"mobis":{"cofre":{"offsetY":-4}}}');

    const assets = service.getGameAssets();
    expect(Object.keys(assets.mobis)).toEqual(['cofre']);
    expect(assets.mobis.cofre.startsWith('data:image/png;base64,')).toBe(true);
    expect(Object.keys(assets.floors)).toEqual(['madeira_hd']);
    expect(Object.keys(assets.walls)).toEqual(['tijolo']);
    expect(assets.pigo).toMatch(/^data:image\/png/);
    expect(assets.manifest.mobis.cofre.offsetY).toBe(-4);
  });
});
