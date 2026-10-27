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

  // --- TIME TRACKER ---
  getTimeEntries(filter = {}) {
    let query = `SELECT * FROM time_entries`;
    const conditions = [];
    const params = [];

    if (filter.taskId) {
      conditions.push(`task_id = ?`);
      params.push(filter.taskId);
    }
    if (filter.category) {
      conditions.push(`category = ?`);
      params.push(filter.category);
    }
    if (filter.workType) {
      conditions.push(`work_type = ?`);
      params.push(filter.workType);
    }
    if (filter.startedAfter) {
      conditions.push(`started_at >= ?`);
      params.push(Number(filter.startedAfter));
    }
    if (filter.startedBefore) {
      conditions.push(`started_at <= ?`);
      params.push(Number(filter.startedBefore));
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    query += ` ORDER BY started_at DESC`;

    if (filter.limit) {
      query += ` LIMIT ?`;
      params.push(Number(filter.limit));
    }

    const rows = this.db.prepare(query).all(...params);
    return rows.map((r) => ({
      id: r.id,
      taskId: r.task_id,
      taskTitle: r.task_title,
      category: r.category,
      workType: r.work_type || 'Profissional - Contratado',
      projectName: r.project_name,
      startedAt: r.started_at,
      endedAt: r.ended_at,
      durationSeconds: r.duration_seconds,
      isPomodoro: Boolean(r.is_pomodoro),
      isManual: Boolean(r.is_manual),
      notes: r.notes || '',
      createdAt: r.created_at,
    }));
  }

  createTimeEntry(data) {
    if (!data.taskTitle || !data.taskTitle.trim()) {
      throw new Error('O título da tarefa é obrigatório.');
    }
    const id = data.id || `entry_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const startedAt = Number(data.startedAt) || Date.now();
    const endedAt = Number(data.endedAt) || startedAt;
    const durationSeconds =
      Number(data.durationSeconds) >= 0
        ? Number(data.durationSeconds)
        : Math.max(0, Math.floor((endedAt - startedAt) / 1000));

    this.db
      .prepare(
        `INSERT INTO time_entries (id, task_id, task_title, category, work_type, project_name, started_at, ended_at, duration_seconds, is_pomodoro, is_manual, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        data.taskId || null,
        data.taskTitle.trim(),
        data.category || 'Geral',
        data.workType || 'Profissional - Contratado',
        data.projectName || null,
        startedAt,
        endedAt,
        durationSeconds,
        data.isPomodoro ? 1 : 0,
        data.isManual ? 1 : 0,
        data.notes || '',
        now
      );

    return this.getTimeEntries().find((e) => e.id === id);
  }

  updateTimeEntry(id, data) {
    const existing = this.db.prepare(`SELECT * FROM time_entries WHERE id = ?`).get(id);
    if (!existing) throw new Error('Registro de tempo não encontrado.');

    const taskTitle = data.taskTitle !== undefined ? data.taskTitle.trim() : existing.task_title;
    const category = data.category !== undefined ? data.category : existing.category;
    const workType = data.workType !== undefined ? data.workType : (existing.work_type || 'Profissional - Contratado');
    const projectName = data.projectName !== undefined ? data.projectName : existing.project_name;
    const startedAt = data.startedAt !== undefined ? Number(data.startedAt) : existing.started_at;
    const endedAt = data.endedAt !== undefined ? Number(data.endedAt) : existing.ended_at;
    const durationSeconds =
      data.durationSeconds !== undefined
        ? Number(data.durationSeconds)
        : Math.max(0, Math.floor((endedAt - startedAt) / 1000));
    const notes = data.notes !== undefined ? data.notes : existing.notes;

    this.db
      .prepare(
        `UPDATE time_entries
         SET task_title = ?, category = ?, work_type = ?, project_name = ?, started_at = ?, ended_at = ?, duration_seconds = ?, notes = ?
         WHERE id = ?`
      )
      .run(taskTitle, category, workType, projectName, startedAt, endedAt, durationSeconds, notes, id);

    return this.getTimeEntries().find((e) => e.id === id);
  }

  deleteTimeEntry(id) {
    this.db.prepare(`DELETE FROM time_entries WHERE id = ?`).run(id);
    return true;
  }

  getTimeTrackerStats() {
    const totalRow = this.db
      .prepare(
        `SELECT SUM(duration_seconds) as totalSeconds, COUNT(*) as totalEntries FROM time_entries`
      )
      .get();

    // Today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayRow = this.db
      .prepare(`SELECT SUM(duration_seconds) as todaySeconds FROM time_entries WHERE started_at >= ?`)
      .get(startOfToday.getTime());

    // This week (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekRow = this.db
      .prepare(`SELECT SUM(duration_seconds) as weekSeconds FROM time_entries WHERE started_at >= ?`)
      .get(sevenDaysAgo);

    // Group by category
    const byCategory = this.db
      .prepare(
        `SELECT category, SUM(duration_seconds) as seconds, COUNT(*) as count
         FROM time_entries
         GROUP BY category
         ORDER BY seconds DESC`
      )
      .all();

    // Group by task
    const topTasks = this.db
      .prepare(
        `SELECT task_title, task_id, SUM(duration_seconds) as seconds, COUNT(*) as count
         FROM time_entries
         GROUP BY task_title
         ORDER BY seconds DESC
         LIMIT 10`
      )
      .all();

    return {
      totalSeconds: totalRow?.totalSeconds || 0,
      totalEntries: totalRow?.totalEntries || 0,
      todaySeconds: todayRow?.todaySeconds || 0,
      weekSeconds: weekRow?.weekSeconds || 0,
      byCategory,
      topTasks,
    };
  }

  // --- FREELA PROJECTS & PROFITABILITY ---
  getFreelaProjects() {
    let projects = [];
    try {
      projects = this.db.prepare(`SELECT * FROM freela_projects ORDER BY created_at DESC`).all();
    } catch (e) {
      projects = [];
    }

    // Auto-detect project names from time_entries
    try {
      const distinctNames = this.db
        .prepare(
          `SELECT DISTINCT project_name 
           FROM time_entries 
           WHERE project_name IS NOT NULL AND trim(project_name) != ''`
        )
        .all()
        .map((r) => r.project_name.trim());

      const existingNames = new Set(projects.map((p) => p.name.toLowerCase()));
      for (const pName of distinctNames) {
        if (!existingNames.has(pName.toLowerCase())) {
          const id = `prj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          const now = new Date().toISOString();
          try {
            this.db
              .prepare(
                `INSERT OR IGNORE INTO freela_projects (id, name, created_at, updated_at)
                 VALUES (?, ?, ?, ?)`
              )
              .run(id, pName, now, now);
            projects.push({
              id,
              name: pName,
              client_name: '',
              contract_amount: 0,
              target_hourly_rate: 0,
              estimated_hours: 0,
              status: 'active',
              notes: '',
              created_at: now,
              updated_at: now,
            });
          } catch (_) {}
        }
      }
    } catch (e) {}

    return projects.map((prj) => {
      let trackedSeconds = 0;
      let sessionCount = 0;
      try {
        const timeRow = this.db
          .prepare(
            `SELECT SUM(duration_seconds) as total_sec, COUNT(*) as cnt
             FROM time_entries
             WHERE (project_name = ? OR task_title LIKE '%' || ? || '%')`
          )
          .get(prj.name, prj.name);
        trackedSeconds = timeRow?.total_sec || 0;
        sessionCount = timeRow?.cnt || 0;
      } catch (_) {}

      let receivedCents = 0;
      let matchingTransactions = [];
      try {
        const searchTerms = [prj.name];
        if (prj.client_name && prj.client_name.trim()) {
          searchTerms.push(prj.client_name.trim());
        }

        const conditions = searchTerms
          .map(() => `(description LIKE ? OR tags LIKE ? OR notes LIKE ?)`)
          .join(' OR ');
        const params = [];
        for (const term of searchTerms) {
          const pattern = `%${term}%`;
          params.push(pattern, pattern, pattern);
        }

        matchingTransactions = this.db
          .prepare(
            `SELECT id, description, amount, transaction_date, type, status
             FROM transactions
             WHERE type = 'income' AND status != 'cancelled' AND (${conditions})
             ORDER BY transaction_date DESC`
          )
          .all(...params);

        receivedCents = matchingTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
      } catch (_) {}

      const trackedHours = trackedSeconds / 3600;
      const basisCents = receivedCents > 0 ? receivedCents : prj.contract_amount || 0;
      const effectiveHourlyRateCents = trackedHours > 0 ? Math.round(basisCents / trackedHours) : 0;
      const targetHourlyRate = prj.target_hourly_rate || 0;

      let marginPercent = null;
      if (targetHourlyRate > 0 && effectiveHourlyRateCents > 0) {
        marginPercent = Math.round(((effectiveHourlyRateCents - targetHourlyRate) / targetHourlyRate) * 100);
      }

      const hoursProgress =
        prj.estimated_hours > 0 ? Math.min(250, Math.round((trackedHours / prj.estimated_hours) * 100)) : 0;

      return {
        id: prj.id,
        name: prj.name,
        clientName: prj.client_name || '',
        contractAmountCents: prj.contract_amount || 0,
        targetHourlyRateCents: prj.target_hourly_rate || 0,
        estimatedHours: prj.estimated_hours || 0,
        status: prj.status || 'active',
        notes: prj.notes || '',
        trackedSeconds,
        trackedHours: Number(trackedHours.toFixed(2)),
        sessionCount,
        receivedCents,
        effectiveHourlyRateCents,
        marginPercent,
        hoursProgress,
        matchingTransactionsCount: matchingTransactions.length,
        createdAt: prj.created_at,
        updatedAt: prj.updated_at,
      };
    });
  }

  saveFreelaProject(data) {
    if (!data.name || !data.name.trim()) {
      throw new Error('O nome do projeto é obrigatório.');
    }
    const name = data.name.trim();
    const now = new Date().toISOString();
    const id = data.id || `prj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const clientName = data.clientName !== undefined ? data.clientName.trim() : '';
    const contractAmount = Number(data.contractAmountCents) >= 0 ? Number(data.contractAmountCents) : 0;
    const targetHourlyRate = Number(data.targetHourlyRateCents) >= 0 ? Number(data.targetHourlyRateCents) : 0;
    const estimatedHours = Number(data.estimatedHours) >= 0 ? Number(data.estimatedHours) : 0;
    const status = data.status || 'active';
    const notes = data.notes || '';

    const existing = this.db
      .prepare(`SELECT * FROM freela_projects WHERE id = ? OR LOWER(name) = LOWER(?)`)
      .get(id, name);

    if (existing) {
      this.db
        .prepare(
          `UPDATE freela_projects
           SET name = ?, client_name = ?, contract_amount = ?, target_hourly_rate = ?, estimated_hours = ?, status = ?, notes = ?, updated_at = ?
           WHERE id = ?`
        )
        .run(name, clientName, contractAmount, targetHourlyRate, estimatedHours, status, notes, now, existing.id);
      return this.getFreelaProjects().find((p) => p.id === existing.id);
    } else {
      this.db
        .prepare(
          `INSERT INTO freela_projects (id, name, client_name, contract_amount, target_hourly_rate, estimated_hours, status, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(id, name, clientName, contractAmount, targetHourlyRate, estimatedHours, status, notes, now, now);
      return this.getFreelaProjects().find((p) => p.id === id);
    }
  }

  deleteFreelaProject(id) {
    this.db.prepare(`DELETE FROM freela_projects WHERE id = ?`).run(id);
    return true;
  }
}

module.exports = { ToolsEngine };
