const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getVaultService } = require('./vaultService.cjs');
const { getVaultIndexService } = require('./vaultIndexService.cjs');

class CanvasService {
  constructor() {
    this.vaultService = null;
    this.fileHashes = new Map(); // path -> sha256
    this.watchers = new Map();
  }

  getVault() {
    if (!this.vaultService) {
      this.vaultService = getVaultService();
    }
    return this.vaultService;
  }

  getQuadrosDir() {
    const root = this.getVault().getVaultRoot();
    const dir = path.join(root, 'Quadros');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  resolveCanvasPath(relativePathOrFull) {
    if (path.isAbsolute(relativePathOrFull)) return relativePathOrFull;
    const root = this.getVault().getVaultRoot();
    return path.join(root, relativePathOrFull);
  }

  computeHash(content) {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
  }

  async list(subDir = '') {
    const root = this.getVault().getVaultRoot();
    const targetDir = subDir ? path.join(root, subDir) : this.getQuadrosDir();
    if (!fs.existsSync(targetDir)) return [];

    const files = [];
    const scan = (dir, rel) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.name.startsWith('.')) continue;
        const full = path.join(dir, item.name);
        const itemRel = rel ? `${rel}/${item.name}` : item.name;
        if (item.isDirectory()) {
          scan(full, itemRel);
        } else if (item.isFile() && item.name.endsWith('.canvas')) {
          const stats = fs.statSync(full);
          files.push({
            name: item.name.replace(/\.canvas$/, ''),
            relativePath: path.relative(root, full).replace(/\\/g, '/'),
            fullPath: full,
            updatedAt: stats.mtimeMs,
            size: stats.size,
          });
        }
      }
    };
    scan(targetDir, subDir);
    return files;
  }

  async read(canvasPath) {
    const fullPath = this.resolveCanvasPath(canvasPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Quadro não encontrado: ${canvasPath}`);
    }

    const raw = fs.readFileSync(fullPath, 'utf8');
    const hash = this.computeHash(raw);
    this.fileHashes.set(fullPath, hash);

    let doc = { nodes: [], edges: [] };
    try {
      doc = JSON.parse(raw);
    } catch (e) {
      console.error(`[CanvasService] Erro ao parsear JSON Canvas: ${canvasPath}`, e);
    }

    return { doc, hash };
  }

  async write(canvasPath, doc) {
    const fullPath = this.resolveCanvasPath(canvasPath);
    const serialized = typeof doc === 'string' ? doc : JSON.stringify(doc, null, 2);
    const newHash = this.computeHash(serialized);

    // Hash check: if unchanged, do nothing
    const currentHash = this.fileHashes.get(fullPath);
    if (currentHash === newHash && fs.existsSync(fullPath)) {
      return { hash: newHash, written: false };
    }

    // External conflict detection: check if file changed on disk externally
    if (fs.existsSync(fullPath)) {
      const onDiskRaw = fs.readFileSync(fullPath, 'utf8');
      const onDiskHash = this.computeHash(onDiskRaw);
      if (currentHash && onDiskHash !== currentHash && onDiskHash !== newHash) {
        const conflictName = `${fullPath.replace(/\.canvas$/, '')}.conflito-${Date.now()}.canvas`;
        fs.writeFileSync(conflictName, serialized, 'utf8');
        console.warn(`[CanvasService] Conflito detectado em ${canvasPath}. Cópia salva em ${conflictName}`);
      }
    }

    // Atomic write: write to temp file then rename
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const tmpPath = `${fullPath}.tmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    fs.writeFileSync(tmpPath, serialized, 'utf8');
    fs.renameSync(tmpPath, fullPath);

    this.fileHashes.set(fullPath, newHash);

    // Update SQLite Index
    this.indexCanvas(canvasPath, doc, newHash).catch(() => {});

    return { hash: newHash, written: true };
  }

  async rename(oldPath, newPath) {
    const fullOld = this.resolveCanvasPath(oldPath);
    const fullNew = this.resolveCanvasPath(newPath);
    if (!fs.existsSync(fullOld)) {
      throw new Error(`Arquivo não encontrado para renomear: ${oldPath}`);
    }
    const dir = path.dirname(fullNew);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.renameSync(fullOld, fullNew);
    const hash = this.fileHashes.get(fullOld);
    if (hash) {
      this.fileHashes.delete(fullOld);
      this.fileHashes.set(fullNew, hash);
    }
    return { success: true };
  }

  async trash(canvasPath) {
    const fullPath = this.resolveCanvasPath(canvasPath);
    if (!fs.existsSync(fullPath)) return { success: false };

    const root = this.getVault().getVaultRoot();
    const trashDir = path.join(root, '.trash');
    if (!fs.existsSync(trashDir)) fs.mkdirSync(trashDir, { recursive: true });

    const baseName = path.basename(fullPath);
    const target = path.join(trashDir, `${Date.now()}_${baseName}`);
    fs.renameSync(fullPath, target);

    this.fileHashes.delete(fullPath);
    return { success: true };
  }

  async indexCanvas(canvasPath, doc, hash) {
    try {
      const indexer = getVaultIndexService();
      const db = indexer.getDb(this.getVault().getVaultRoot());
      const parsed = typeof doc === 'string' ? JSON.parse(doc) : doc;
      const title = path.basename(canvasPath, '.canvas');
      const nodeCount = Array.isArray(parsed.nodes) ? parsed.nodes.length : 0;
      const now = Date.now();

      db.prepare(`
        INSERT INTO canvases (path, title, node_count, updated_at, hash)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(path) DO UPDATE SET
          title = excluded.title,
          node_count = excluded.node_count,
          updated_at = excluded.updated_at,
          hash = excluded.hash
      `).run(canvasPath, title, nodeCount, now, hash);

      db.prepare('DELETE FROM canvas_node_text WHERE canvas_path = ?').run(canvasPath);
      db.prepare('DELETE FROM canvas_fts WHERE path = ?').run(canvasPath);

      const insertText = db.prepare(`
        INSERT INTO canvas_node_text (canvas_path, node_id, text) VALUES (?, ?, ?)
      `);
      const insertFts = db.prepare(`
        INSERT INTO canvas_fts (title, body, path) VALUES (?, ?, ?)
      `);

      let fullBody = '';
      if (Array.isArray(parsed.nodes)) {
        for (const n of parsed.nodes) {
          const text = n.text || n.label || '';
          if (text) {
            insertText.run(canvasPath, n.id, text);
            fullBody += ` ${text}`;
          }
        }
      }
      insertFts.run(title, fullBody.trim(), canvasPath);
    } catch (e) {
      console.error('[CanvasService] Erro ao indexar canvas no SQLite:', e);
    }
  }
}

let instance = null;
function getCanvasService() {
  if (!instance) instance = new CanvasService();
  return instance;
}

module.exports = { CanvasService, getCanvasService };
