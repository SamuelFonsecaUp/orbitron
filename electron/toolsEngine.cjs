const crypto = require('crypto');

// Legacy static secret strictly used to read and migrate older v1 backups/records
const LEGACY_VAULT_SECRET = crypto
  .createHash('sha256')
  .update('pigo-local-vault-key-v1-aes256')
  .digest();

let electronSafeStorage = null;
try {
  const electron = require('electron');
  if (electron && electron.safeStorage && typeof electron.safeStorage.isEncryptionAvailable === 'function') {
    if (electron.safeStorage.isEncryptionAvailable()) {
      electronSafeStorage = electron.safeStorage;
    }
  }
} catch (_) {}

class ToolsEngine {
  constructor(db) {
    this.db = db;
    this._vaultKey = null;
  }

  getVaultKey() {
    if (this._vaultKey) return this._vaultKey;

    let salt = null;
    try {
      const row = this.db.prepare(`SELECT vault_salt FROM settings WHERE id = 'app_config'`).get();
      if (row && row.vault_salt) {
        salt = row.vault_salt;
      }
    } catch (_) {}

    if (!salt) {
      salt = crypto.randomBytes(32).toString('hex');
      try {
        this.db.prepare(`UPDATE settings SET vault_salt = ? WHERE id = 'app_config'`).run(salt);
      } catch (_) {}
    }

    this._vaultKey = crypto.pbkdf2Sync(salt, 'orbitron-vault-key-v2-master', 100000, 32, 'sha256');
    return this._vaultKey;
  }

  encryptSecret(plainText) {
    if (!plainText) return '';
    try {
      if (electronSafeStorage) {
        const encrypted = electronSafeStorage.encryptString(String(plainText));
        return `v2:safe:${encrypted.toString('base64')}`;
      }
      const key = this.getVaultKey();
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
      const authTag = cipher.getAuthTag();
      return `v2:aes:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
    } catch (e) {
      console.warn('[ToolsEngine] Erro ao criptografar segredo:', e);
      return Buffer.from(String(plainText), 'utf8').toString('base64');
    }
  }

  decryptSecret(payload) {
    if (!payload) return '';
    const str = String(payload);
    try {
      // 1. Electron Native safeStorage (DPAPI Windows / OS Keychain)
      if (str.startsWith('v2:safe:') && electronSafeStorage) {
        const buf = Buffer.from(str.slice(8), 'base64');
        return electronSafeStorage.decryptString(buf);
      }

      // 2. High-security AES-256-GCM com chave derivada por PBKDF2 (100.000 rounds)
      if (str.startsWith('v2:aes:')) {
        const parts = str.split(':');
        const iv = Buffer.from(parts[2], 'base64');
        const authTag = Buffer.from(parts[3], 'base64');
        const encrypted = Buffer.from(parts[4], 'base64');
        const decipher = crypto.createDecipheriv('aes-256-gcm', this.getVaultKey(), iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return decrypted.toString('utf8');
      }

      // 3. Fallback retroativo v1 (migração suave de registros legados)
      if (str.startsWith('v1:')) {
        const parts = str.split(':');
        const iv = Buffer.from(parts[1], 'base64');
        const authTag = Buffer.from(parts[2], 'base64');
        const encrypted = Buffer.from(parts[3], 'base64');
        const decipher = crypto.createDecipheriv('aes-256-gcm', LEGACY_VAULT_SECRET, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return decrypted.toString('utf8');
      }

      // 4. Fallback simples base64
      return Buffer.from(str, 'base64').toString('utf8');
    } catch (e) {
      return str;
    }
  }

  // =========================================================
  // 1. ANOTAÇÕES & SEGUNDO CÉREBRO (notes)
  // =========================================================
  getNotes() {
    const rows = this.db
      .prepare(`SELECT * FROM notes ORDER BY pinned DESC, updated_at DESC`)
      .all();
    return rows.map((r) => {
      let checklist = [];
      try {
        checklist = r.checklist_json ? JSON.parse(r.checklist_json) : [];
      } catch {
        checklist = [];
      }
      return {
        id: r.id,
        title: r.title,
        content: r.content || '',
        category: r.category || 'ideias',
        color: r.color || '#a855f7',
        pinned: Boolean(r.pinned),
        checklist,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });
  }

  createNote(data) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const checklistJson = JSON.stringify(Array.isArray(data.checklist) ? data.checklist : []);
    this.db
      .prepare(
        `INSERT INTO notes (id, title, content, category, color, pinned, checklist_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        (data.title || 'Nova Anotação').trim(),
        data.content || '',
        data.category || 'ideias',
        data.color || '#a855f7',
        data.pinned ? 1 : 0,
        checklistJson,
        now,
        now
      );
    return this.getNotes().find((n) => n.id === id);
  }

  updateNote(id, data) {
    const existing = this.db.prepare(`SELECT * FROM notes WHERE id = ?`).get(id);
    if (!existing) throw new Error('Anotação não encontrada.');
    const now = new Date().toISOString();
    const checklistJson =
      data.checklist !== undefined
        ? JSON.stringify(Array.isArray(data.checklist) ? data.checklist : [])
        : existing.checklist_json;

    this.db
      .prepare(
        `UPDATE notes
         SET title = ?, content = ?, category = ?, color = ?, pinned = ?, checklist_json = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        data.title !== undefined ? data.title.trim() : existing.title,
        data.content !== undefined ? data.content : existing.content,
        data.category !== undefined ? data.category : existing.category,
        data.color !== undefined ? data.color : existing.color,
        data.pinned !== undefined ? (data.pinned ? 1 : 0) : existing.pinned,
        checklistJson,
        now,
        id
      );
    return this.getNotes().find((n) => n.id === id);
  }

  deleteNote(id) {
    this.db.prepare(`DELETE FROM notes WHERE id = ?`).run(id);
    return true;
  }

  // =========================================================
  // 2. MAPAS MENTAIS & IDEIAS VISUAIS (mindmaps)
  // =========================================================
  getMindmaps() {
    const rows = this.db
      .prepare(`SELECT * FROM mindmaps ORDER BY updated_at DESC`)
      .all();
    return rows.map((r) => {
      let nodes = [];
      try {
        nodes = r.nodes_json ? JSON.parse(r.nodes_json) : [];
      } catch {
        nodes = [];
      }
      return {
        id: r.id,
        title: r.title,
        description: r.description || '',
        nodes,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });
  }

  createMindmap(data) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const nodesJson = JSON.stringify(
      Array.isArray(data.nodes) && data.nodes.length > 0
        ? data.nodes
        : [
            {
              id: 'root',
              text: (data.title || 'Ideia Central').trim(),
              x: 0,
              y: 0,
              color: '#6366f1',
            },
          ]
    );

    this.db
      .prepare(
        `INSERT INTO mindmaps (id, title, description, nodes_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(id, (data.title || 'Novo Mapa Mental').trim(), data.description || '', nodesJson, now, now);

    return this.getMindmaps().find((m) => m.id === id);
  }

  updateMindmap(id, data) {
    const existing = this.db.prepare(`SELECT * FROM mindmaps WHERE id = ?`).get(id);
    if (!existing) throw new Error('Mapa mental não encontrado.');
    const now = new Date().toISOString();
    const nodesJson =
      data.nodes !== undefined
        ? JSON.stringify(Array.isArray(data.nodes) ? data.nodes : [])
        : existing.nodes_json;

    this.db
      .prepare(
        `UPDATE mindmaps
         SET title = ?, description = ?, nodes_json = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        data.title !== undefined ? data.title.trim() : existing.title,
        data.description !== undefined ? data.description : existing.description,
        nodesJson,
        now,
        id
      );
    return this.getMindmaps().find((m) => m.id === id);
  }

  deleteMindmap(id) {
    this.db.prepare(`DELETE FROM mindmaps WHERE id = ?`).run(id);
    return true;
  }

  // =========================================================
  // 3. COFRE DE SENHAS CRIPTOGRAFADO (password_vault)
  // =========================================================
  getVaultItems() {
    const rows = this.db
      .prepare(`SELECT * FROM password_vault ORDER BY favorite DESC, title ASC`)
      .all();
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category || 'outros',
      username: r.username || '',
      password: this.decryptSecret(r.password_encrypted),
      url: r.url || '',
      notes: r.notes || '',
      favorite: Boolean(r.favorite),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  createVaultItem(data) {
    if (!data.title || !data.title.trim()) {
      throw new Error('Informe o nome do serviço ou aplicativo.');
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const encryptedPass = this.encryptSecret(data.password || '');

    this.db
      .prepare(
        `INSERT INTO password_vault (id, title, category, username, password_encrypted, url, notes, favorite, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        data.title.trim(),
        data.category || 'outros',
        (data.username || '').trim(),
        encryptedPass,
        (data.url || '').trim(),
        data.notes || '',
        data.favorite ? 1 : 0,
        now,
        now
      );
    return this.getVaultItems().find((v) => v.id === id);
  }

  updateVaultItem(id, data) {
    const existing = this.db.prepare(`SELECT * FROM password_vault WHERE id = ?`).get(id);
    if (!existing) throw new Error('Credencial não encontrada.');
    const now = new Date().toISOString();
    const encryptedPass =
      data.password !== undefined
        ? this.encryptSecret(data.password)
        : existing.password_encrypted;

    this.db
      .prepare(
        `UPDATE password_vault
         SET title = ?, category = ?, username = ?, password_encrypted = ?, url = ?, notes = ?, favorite = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        data.title !== undefined ? data.title.trim() : existing.title,
        data.category !== undefined ? data.category : existing.category,
        data.username !== undefined ? data.username.trim() : existing.username,
        encryptedPass,
        data.url !== undefined ? data.url.trim() : existing.url,
        data.notes !== undefined ? data.notes : existing.notes,
        data.favorite !== undefined ? (data.favorite ? 1 : 0) : existing.favorite,
        now,
        id
      );
    return this.getVaultItems().find((v) => v.id === id);
  }

  deleteVaultItem(id) {
    this.db.prepare(`DELETE FROM password_vault WHERE id = ?`).run(id);
    return true;
  }
}

module.exports = { ToolsEngine };
