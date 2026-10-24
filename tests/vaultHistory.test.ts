import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { VaultService } from '../electron/vaultService.cjs';

describe('Vault Version History & Retention', () => {
  let tmpVault: string;
  let vault: VaultService;

  beforeEach(() => {
    tmpVault = fs.mkdtempSync(path.join(os.tmpdir(), 'pigo_history_test_'));
    vault = new VaultService();
    vault.init(tmpVault);
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpVault, { recursive: true, force: true });
    } catch (e) {}
  });

  it('records history snapshot and respects 1-hour interval and max 50 purge', () => {
    const pageRel = 'MinhaNota.md';
    vault.createPage({ title: 'MinhaNota', initialBody: 'Versão 1' });

    // 1. Initial snapshot should exist
    const history1 = vault.listHistory(pageRel);
    expect(history1.length).toBeGreaterThanOrEqual(1);

    // 2. Writing again immediately should NOT create a second snapshot within 1 hour
    vault.writePage(pageRel, '# MinhaNota\n\nVersão 1.1 alterada');
    const history2 = vault.listHistory(pageRel);
    expect(history2.length).toBe(history1.length);

    // 3. Simulate older snapshots to test auto-purge at 50
    const historyDir = path.join(tmpVault, '.anota', 'history', pageRel);
    const ONE_HOUR = 3600000 + 1000;
    const baseTime = Date.now() - 60 * ONE_HOUR;

    for (let i = 0; i < 55; i++) {
      const snapTime = baseTime + i * ONE_HOUR;
      fs.writeFileSync(path.join(historyDir, `${snapTime}.md`), `Conteúdo histórico ${i}`, 'utf8');
    }

    // Trigger purge
    vault.purgeOldSnapshots(pageRel);
    const historyPurged = vault.listHistory(pageRel);
    expect(historyPurged.length).toBeLessThanOrEqual(50);
  });

  it('restores a specific historical snapshot faithfully', () => {
    const pageRel = 'Contrato.md';
    vault.createPage({ title: 'Contrato', initialBody: 'Texto Original' });

    const historyDir = path.join(tmpVault, '.anota', 'history', pageRel);
    const oldTimestamp = Date.now() - 5000000;
    fs.writeFileSync(path.join(historyDir, `${oldTimestamp}.md`), '# Contrato\n\nVersão Histórica Antiga', 'utf8');

    vault.restoreHistory(pageRel, String(oldTimestamp));
    const current = vault.readPage(pageRel);
    expect(current.content).toContain('Versão Histórica Antiga');
  });
});
