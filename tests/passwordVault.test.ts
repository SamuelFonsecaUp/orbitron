import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { ToolsEngine } from '../electron/toolsEngine.cjs';
import crypto from 'crypto';

describe('Password Vault Security & Encryption Engine', () => {
  let db: any;
  let engine: any;

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY DEFAULT 'app_config',
        vault_salt TEXT
      );
      INSERT INTO settings (id, vault_salt) VALUES ('app_config', 'test_salt_1234567890abcdef');

      CREATE TABLE IF NOT EXISTS password_vault (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT DEFAULT 'outros',
        username TEXT DEFAULT '',
        password_encrypted TEXT NOT NULL,
        url TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        favorite INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT
      );
    `);
    engine = new ToolsEngine(db);
  });

  afterEach(() => {
    db.close();
  });

  it('encrypts secrets using derived key with random IV and never plain-text', () => {
    const rawPassword = 'SuperSecretCosmicPassword2026!';
    const item = engine.createVaultItem({
      title: 'Banco Inter',
      category: 'financeiro',
      username: 'samuel@orbitron.space',
      password: rawPassword,
    });

    expect(item).toBeDefined();
    expect(item.password).toBe(rawPassword);

    // Verify raw database row does NOT contain plain text
    const row = db.prepare(`SELECT password_encrypted FROM password_vault WHERE id = ?`).get(item.id);
    expect(row.password_encrypted).not.toBe(rawPassword);
    expect(row.password_encrypted).not.toContain('SuperSecretCosmicPassword2026');
    expect(row.password_encrypted.startsWith('v2:aes:')).toBe(true);
  });

  it('decrypts legacy v1 passwords transparently for seamless backwards compatibility', () => {
    // Manually insert legacy v1 encrypted secret
    const legacySecret = crypto
      .createHash('sha256')
      .update('pigo-local-vault-key-v1-aes256')
      .digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', legacySecret, iv);
    const rawPassword = 'LegacyVaultPassword123#';
    const encrypted = Buffer.concat([cipher.update(rawPassword, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const legacyPayload = `v1:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;

    db.prepare(`
      INSERT INTO password_vault (id, title, category, username, password_encrypted, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('leg_1', 'Antigo Servico', 'outros', 'usuario', legacyPayload, new Date().toISOString(), new Date().toISOString());

    const items = engine.getVaultItems();
    const legacyItem = items.find((i: any) => i.id === 'leg_1');
    expect(legacyItem).toBeDefined();
    expect(legacyItem.password).toBe(rawPassword);
  });
});
