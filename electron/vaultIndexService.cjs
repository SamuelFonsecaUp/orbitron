const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class VaultIndexService {
  constructor() {
    this.db = null;
    this.indexPath = null;
  }

  getDb(vaultRoot) {
    const anotaDir = path.join(vaultRoot, '.anota');
    if (!fs.existsSync(anotaDir)) fs.mkdirSync(anotaDir, { recursive: true });

    const targetPath = path.join(anotaDir, 'index.sqlite');
    if (this.db && this.indexPath === targetPath) {
      return this.db;
    }

    if (this.db) {
      try { this.db.close(); } catch (e) {}
    }

    this.indexPath = targetPath;
    this.db = new Database(targetPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.initTables();
    return this.db;
  }

  initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pages (
        id TEXT PRIMARY KEY,
        path TEXT UNIQUE NOT NULL,
        parent_path TEXT,
        title TEXT,
        icon TEXT,
        created_at INTEGER,
        updated_at INTEGER,
        sort_rank TEXT,
        hash TEXT
      );

      CREATE TABLE IF NOT EXISTS links (
        source_path TEXT NOT NULL,
        target_path TEXT,
        target_title TEXT,
        kind TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS blocks_meta (
        block_id TEXT PRIMARY KEY,
        page_path TEXT NOT NULL,
        kind TEXT
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS pages_fts USING fts5(
        title, body, path UNINDEXED, tokenize='unicode61 remove_diacritics 2'
      );
    `);
  }

  parseFrontmatterFast(raw) {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!match) return { frontmatter: {}, body: raw };

    const yaml = match[1];
    const body = raw.slice(match[0].length);
    const frontmatter = {};

    for (const line of yaml.split('\n')) {
      const idx = line.indexOf(':');
      if (idx !== -1) {
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        frontmatter[k] = v;
      }
    }
    return { frontmatter, body };
  }

  indexPage(vaultRoot, relativePath, rawContent, stats = null) {
    const db = this.getDb(vaultRoot);
    const { frontmatter, body } = this.parseFrontmatterFast(rawContent);

    // Extract title
    let title = frontmatter.title;
    if (!title) {
      const h1Match = body.match(/^#\s+(.+)$/m);
      title = h1Match ? h1Match[1].trim() : path.basename(relativePath, '.md');
    }

    const icon = frontmatter.icon || 'FileText';
    const sortRank = frontmatter.sort_rank || 'a0';
    const parentPath = path.dirname(relativePath) === '.' ? null : path.dirname(relativePath);
    const now = Date.now();
    const createdAt = stats?.birthtimeMs || now;
    const updatedAt = stats?.mtimeMs || now;

    // 1. Update pages table
    const upsertPage = db.prepare(`
      INSERT INTO pages (id, path, parent_path, title, icon, created_at, updated_at, sort_rank, hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(path) DO UPDATE SET
        title = excluded.title,
        icon = excluded.icon,
        parent_path = excluded.parent_path,
        updated_at = excluded.updated_at,
        sort_rank = excluded.sort_rank,
        hash = excluded.hash
    `);
    upsertPage.run(relativePath, relativePath, parentPath, title, icon, createdAt, updatedAt, sortRank, '');

    // 2. Extract links ([[Target]] or [[Path/Target]])
    db.prepare('DELETE FROM links WHERE source_path = ?').run(relativePath);
    const linkMatches = body.matchAll(/\[\[(.*?)\]\]/g);
    const insertLink = db.prepare('INSERT INTO links (source_path, target_path, target_title, kind) VALUES (?, ?, ?, ?)');

    for (const match of linkMatches) {
      const rawTarget = match[1].trim();
      const targetTitle = path.basename(rawTarget, '.md');
      const targetPath = rawTarget.endsWith('.md') ? rawTarget : `${rawTarget}.md`;
      insertLink.run(relativePath, targetPath, targetTitle, 'wikilink');
    }

    // 3. Update FTS
    db.prepare('DELETE FROM pages_fts WHERE path = ?').run(relativePath);
    db.prepare('INSERT INTO pages_fts (title, body, path) VALUES (?, ?, ?)').run(title, body, relativePath);
  }

  removePage(vaultRoot, relativePath) {
    const db = this.getDb(vaultRoot);
    db.prepare('DELETE FROM pages WHERE path = ?').run(relativePath);
    db.prepare('DELETE FROM links WHERE source_path = ?').run(relativePath);
    db.prepare('DELETE FROM pages_fts WHERE path = ?').run(relativePath);
  }

  removeFolder(vaultRoot, folderRelPath) {
    const db = this.getDb(vaultRoot);
    const prefix = `${folderRelPath}/%`;
    db.prepare('DELETE FROM pages WHERE path LIKE ? OR path = ?').run(prefix, folderRelPath);
    db.prepare('DELETE FROM links WHERE source_path LIKE ? OR source_path = ?').run(prefix, folderRelPath);
    db.prepare('DELETE FROM pages_fts WHERE path LIKE ? OR path = ?').run(prefix, folderRelPath);
  }

  search(vaultRoot, query, limit = 20) {
    const db = this.getDb(vaultRoot);
    const clean = query.trim().replace(/['"*]/g, '');
    if (!clean) return [];

    // Search using FTS5 match with prefix
    const ftsQuery = `"${clean}"*`;

    try {
      const stmt = db.prepare(`
        SELECT 
          path,
          title,
          snippet(pages_fts, 1, '<mark class="bg-amber-500/30 text-amber-200 font-bold px-0.5 rounded">', '</mark>', '...', 16) AS snippet,
          rank
        FROM pages_fts
        WHERE pages_fts MATCH ?
        ORDER BY rank
        LIMIT ?
      `);
      return stmt.all(ftsQuery, limit);
    } catch (e) {
      // Fallback to LIKE if FTS expression is tricky
      const likeStmt = db.prepare(`
        SELECT path, title, '' as snippet, 0 as rank
        FROM pages
        WHERE title LIKE ? OR path LIKE ?
        LIMIT ?
      `);
      return likeStmt.all(`%${clean}%`, `%${clean}%`, limit);
    }
  }

  getBacklinks(vaultRoot, relativePath, title) {
    const db = this.getDb(vaultRoot);
    const cleanTitle = title || path.basename(relativePath, '.md');

    const stmt = db.prepare(`
      SELECT DISTINCT 
        p.path, 
        p.title, 
        p.icon,
        p.updated_at
      FROM links l
      JOIN pages p ON p.path = l.source_path
      WHERE (l.target_path = ? OR l.target_title = ? OR l.target_path = ?)
        AND l.source_path != ?
      ORDER BY p.updated_at DESC
    `);

    return stmt.all(relativePath, cleanTitle, path.basename(relativePath), relativePath);
  }

  rebuildIndex(vaultRoot) {
    const db = this.getDb(vaultRoot);
    db.exec(`
      DELETE FROM pages;
      DELETE FROM links;
      DELETE FROM blocks_meta;
      DELETE FROM pages_fts;
    `);

    const scan = (dir, rel = '') => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.name.startsWith('.')) continue;
        if (item.name === 'anexos') continue;

        const full = path.join(dir, item.name);
        const itemRel = rel ? `${rel}/${item.name}` : item.name;

        if (item.isDirectory()) {
          scan(full, itemRel);
        } else if (item.isFile() && item.name.endsWith('.md')) {
          const content = fs.readFileSync(full, 'utf8');
          const stats = fs.statSync(full);
          this.indexPage(vaultRoot, itemRel, content, stats);
        }
      }
    };

    scan(vaultRoot);
    return true;
  }
}

let instance = null;
function getVaultIndexService() {
  if (!instance) {
    instance = new VaultIndexService();
  }
  return instance;
}

module.exports = {
  VaultIndexService,
  getVaultIndexService,
};
