const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { getVaultIndexService } = require('./vaultIndexService.cjs');

class VaultService {
  constructor() {
    this.vaultPath = null;
    this.workspacePath = null;
    this.indexer = getVaultIndexService();
  }

  getVaultRoot() {
    if (this.vaultPath) return this.vaultPath;
    let baseDocs;
    try {
      baseDocs = app ? app.getPath('documents') : path.join(process.env.USERPROFILE || process.env.HOME || '.', 'Documents');
    } catch (e) {
      baseDocs = path.join(process.cwd(), 'Documents');
    }
    const orbitronPath = path.join(baseDocs, 'OrbitronVault');
    const legacyPath = path.join(baseDocs, 'PigoVault');
    if (fs.existsSync(legacyPath) && !fs.existsSync(orbitronPath)) {
      try {
        fs.renameSync(legacyPath, orbitronPath);
      } catch (e) {
        this.vaultPath = legacyPath;
        return this.vaultPath;
      }
    }
    this.vaultPath = orbitronPath;
    return this.vaultPath;
  }

  init(customPath = null) {
    if (customPath) {
      this.vaultPath = customPath;
    } else {
      this.getVaultRoot();
    }

    if (!fs.existsSync(this.vaultPath)) {
      fs.mkdirSync(this.vaultPath, { recursive: true });
    }

    // Hidden config and trash directories
    const anotaDir = path.join(this.vaultPath, '.anota');
    const trashDir = path.join(this.vaultPath, '.trash');
    const anexosDir = path.join(this.vaultPath, 'anexos');
    const historyDir = path.join(anotaDir, 'history');

    if (!fs.existsSync(anotaDir)) fs.mkdirSync(anotaDir, { recursive: true });
    if (!fs.existsSync(trashDir)) fs.mkdirSync(trashDir, { recursive: true });
    if (!fs.existsSync(anexosDir)) fs.mkdirSync(anexosDir, { recursive: true });
    if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir, { recursive: true });

    this.workspacePath = path.join(anotaDir, 'workspace.json');
    if (!fs.existsSync(this.workspacePath)) {
      const initialWorkspace = {
        activeEnvironment: 'Pessoal',
        lastOpenedPath: 'Pessoal/Bem-vindo ao Orbitron.md',
        expandedFolders: [],
        favorites: [],
        pinned: [],
      };
      fs.writeFileSync(this.workspacePath, JSON.stringify(initialWorkspace, null, 2), 'utf8');
    }

    // Ensure default environment folder "Pessoal" exists
    const defaultEnvDir = path.join(this.vaultPath, 'Pessoal');
    if (!fs.existsSync(defaultEnvDir)) {
      fs.mkdirSync(defaultEnvDir, { recursive: true });
    }

    // Seed welcoming note inside Pessoal if not existing
    const welcomeFile = path.join(defaultEnvDir, 'Bem-vindo ao Orbitron.md');
    const legacyWelcomeFile = path.join(this.vaultPath, 'Bem-vindo ao Pigo.md');
    if (fs.existsSync(legacyWelcomeFile) && !fs.existsSync(welcomeFile)) {
      try {
        fs.renameSync(legacyWelcomeFile, welcomeFile);
      } catch (e) {}
    }

    if (!fs.existsSync(welcomeFile)) {
      const welcomeContent = [
        '---',
        'title: Bem-vindo ao Orbitron',
        'icon: BookOpen',
        'sort_rank: a0',
        `created_at: "${new Date().toISOString()}"`,
        `updated_at: "${new Date().toISOString()}"`,
        'tags:',
        '  - boas-vindas',
        '  - notas',
        '---',
        '# Bem-vindo ao Orbitron',
        '',
        'Este é o seu **segundo cérebro local-first**. Todas as anotações ficam salvas no seu computador em formato Markdown puro, 100% legíveis no Obsidian, VS Code ou qualquer editor de texto.',
        '',
        '### ⚡ O que você pode fazer:',
        '- **Ambientes e Pastas:** Organize tudo em múltiplos ambientes (Pessoal, Trabalho, etc.) e pastas hierárquicas.',
        '- **Tudo é offline:** Seus dados nunca saem da sua máquina.',
        '- **Edição fluida:** Digite livremente sem se preocupar em apertar "Salvar" — o autosave é instantâneo e seguro.',
        '- **Comandos e atalhos:** Digite `/` para blocos ricos ou `Ctrl+K` para buscar no cofre.',
        '',
        '> *"A melhor ferramenta é aquela que você controla por completo."*',
        '',
      ].join('\n');
      this.writeAtomic(welcomeFile, welcomeContent);
    }

    // Initialize index if not indexed yet
    try {
      this.indexer.getDb(this.vaultPath);
      const res = this.indexer.search(this.vaultPath, 'Orbitron', 1);
      if (res.length === 0) {
        this.indexer.rebuildIndex(this.vaultPath);
      }
    } catch (e) {
      console.error('Erro na indexação inicial:', e);
    }

    return { vaultPath: this.vaultPath };
  }

  getEnvironments() {
    const root = this.getVaultRoot();
    if (!fs.existsSync(root)) return [];

    const items = fs.readdirSync(root, { withFileTypes: true });
    const envs = [];

    const iconMap = {
      Pessoal: 'User',
      Trabalho: 'Briefcase',
      Estudos: 'GraduationCap',
      Finanças: 'DollarSign',
      Projetos: 'Rocket',
      Ideias: 'Lightbulb',
    };

    for (const item of items) {
      if (!item.isDirectory()) continue;
      if (item.name.startsWith('.')) continue;
      if (item.name === 'anexos') continue;

      envs.push({
        id: item.name,
        name: item.name,
        icon: iconMap[item.name] || 'Folder',
        path: item.name,
      });
    }

    if (envs.length === 0) {
      const defaultEnv = path.join(root, 'Pessoal');
      if (!fs.existsSync(defaultEnv)) fs.mkdirSync(defaultEnv, { recursive: true });
      envs.push({
        id: 'Pessoal',
        name: 'Pessoal',
        icon: 'User',
        path: 'Pessoal',
      });
    }

    return envs;
  }

  createEnvironment(name, icon = 'Folder') {
    const root = this.getVaultRoot();
    const cleanName = (name || 'Novo Ambiente').trim().replace(/[\\/:*?"<>|]/g, '-');
    if (!cleanName) throw new Error('Nome de ambiente inválido');

    const envDir = path.join(root, cleanName);
    if (!fs.existsSync(envDir)) {
      fs.mkdirSync(envDir, { recursive: true });
    }

    // Starter note
    const starterFile = path.join(envDir, 'Início.md');
    if (!fs.existsSync(starterFile)) {
      const starterContent = [
        '---',
        'title: Início',
        'icon: BookOpen',
        `created_at: "${new Date().toISOString()}"`,
        `updated_at: "${new Date().toISOString()}"`,
        '---',
        `# ${cleanName}`,
        '',
        `Ambiente criado com sucesso! Crie novas pastas e páginas para organizar este espaço.`,
        '',
      ].join('\n');
      this.writeAtomic(starterFile, starterContent);
      const stats = fs.statSync(starterFile);
      this.indexer.indexPage(root, `${cleanName}/Início.md`, starterContent, stats);
    }

    return {
      id: cleanName,
      name: cleanName,
      icon: icon || 'Folder',
      path: cleanName,
    };
  }

  createFolder({ parentRelativeDir = '', folderName }) {
    const root = this.getVaultRoot();
    const cleanName = (folderName || 'Nova Pasta').trim().replace(/[\\/:*?"<>|]/g, '-');
    if (!cleanName) throw new Error('Nome de pasta inválido');

    const targetDir = parentRelativeDir ? path.join(root, parentRelativeDir, cleanName) : path.join(root, cleanName);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const relativePath = parentRelativeDir ? `${parentRelativeDir}/${cleanName}` : cleanName;
    return { relativePath };
  }

  deleteFolder(relativePath) {
    const root = this.getVaultRoot();
    const fullPath = path.join(root, relativePath);

    if (!fs.existsSync(fullPath)) {
      return { success: false, message: 'Pasta não encontrada' };
    }

    const trashDir = path.join(root, '.trash');
    if (!fs.existsSync(trashDir)) fs.mkdirSync(trashDir, { recursive: true });

    const baseName = path.basename(relativePath);
    const trashTarget = path.join(trashDir, `${Date.now()}_${baseName}`);

    fs.renameSync(fullPath, trashTarget);
    this.indexer.removeFolder(root, relativePath);

    return { success: true };
  }

  writeAtomic(filePath, content) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const tmpPath = `${filePath}.tmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, filePath);
  }

  extractIconFast(filePath) {
    try {
      const fd = fs.openSync(filePath, 'r');
      const buf = Buffer.alloc(512);
      const bytes = fs.readSync(fd, buf, 0, 512, 0);
      fs.closeSync(fd);
      const text = buf.toString('utf8', 0, bytes);
      const match = text.match(/^icon:\s*(.+)$/m);
      if (match) {
        return match[1].trim().replace(/^['"]|['"]$/g, '');
      }
    } catch (e) {}
    return 'FileText';
  }

  setFolderIcon(folderRelativePath, icon) {
    const ws = this.getWorkspace();
    if (!ws.folderIcons) ws.folderIcons = {};
    ws.folderIcons[folderRelativePath] = icon;
    this.saveWorkspace(ws);
    return true;
  }

  getTree(environmentName = null) {
    const root = this.getVaultRoot();
    if (!fs.existsSync(root)) return [];

    const targetDir = environmentName ? path.join(root, environmentName) : root;
    if (!fs.existsSync(targetDir)) return [];

    let folderIcons = {};
    try {
      const ws = this.getWorkspace();
      folderIcons = ws.folderIcons || {};
    } catch (e) {}

    const scanDir = (dirPath, relPath = '') => {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      const result = [];

      for (const item of items) {
        if (item.name.startsWith('.')) continue;
        if (item.name === 'anexos') continue;

        const itemFullPath = path.join(dirPath, item.name);
        const itemRelPath = relPath ? `${relPath}/${item.name}` : item.name;

        if (item.isDirectory()) {
          result.push({
            id: itemRelPath,
            name: item.name,
            relativePath: itemRelPath,
            isDirectory: true,
            icon: folderIcons[itemRelPath] || 'Folder',
            children: scanDir(itemFullPath, itemRelPath),
          });
        } else if (item.isFile() && (item.name.endsWith('.md') || item.name.endsWith('.canvas'))) {
          const isCanvas = item.name.endsWith('.canvas');
          const stats = fs.statSync(itemFullPath);
          result.push({
            id: itemRelPath,
            name: item.name.replace(/\.(md|canvas)$/, ''),
            relativePath: itemRelPath,
            isDirectory: false,
            isCanvas,
            icon: isCanvas ? 'LayoutGrid' : this.extractIconFast(itemFullPath),
            updatedAt: stats.mtimeMs,
          });
        }
      }

      return result.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });
    };

    return scanDir(targetDir, environmentName || '');
  }

  readPage(relativePath) {
    const root = this.getVaultRoot();
    const fullPath = path.join(root, relativePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Página não encontrada: ${relativePath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const stats = fs.statSync(fullPath);

    return {
      path: fullPath,
      relativePath,
      content,
      createdAt: stats.birthtimeMs || stats.ctimeMs,
      updatedAt: stats.mtimeMs,
    };
  }

  writePage(relativePath, content) {
    const root = this.getVaultRoot();
    const fullPath = path.join(root, relativePath);
    this.writeAtomic(fullPath, content);
    const stats = fs.statSync(fullPath);

    this.indexer.indexPage(root, relativePath, content, stats);
    this.recordHistorySnapshot(relativePath, content);

    return {
      relativePath,
      updatedAt: stats.mtimeMs,
    };
  }

  createPage({ parentRelativeDir = '', title, initialBody = '' }) {
    const root = this.getVaultRoot();
    const cleanTitle = title.trim() || 'Sem título';
    const safeFilename = cleanTitle.replace(/[\\/:*?"<>|]/g, '-');
    const targetDir = parentRelativeDir ? path.join(root, parentRelativeDir) : root;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    let fileName = `${safeFilename}.md`;
    let counter = 1;
    while (fs.existsSync(path.join(targetDir, fileName))) {
      fileName = `${safeFilename} ${counter}.md`;
      counter++;
    }

    const fullPath = path.join(targetDir, fileName);
    const relativePath = parentRelativeDir ? `${parentRelativeDir}/${fileName}` : fileName;

    const fileContent = [
      '---',
      `title: ${cleanTitle}`,
      'icon: FileText',
      `created_at: "${new Date().toISOString()}"`,
      `updated_at: "${new Date().toISOString()}"`,
      '---',
      `# ${cleanTitle}`,
      '',
      initialBody,
    ].join('\n');

    this.writeAtomic(fullPath, fileContent);
    const stats = fs.statSync(fullPath);
    this.indexer.indexPage(root, relativePath, fileContent, stats);
    this.recordHistorySnapshot(relativePath, fileContent);

    return { relativePath, title: cleanTitle };
  }

  renamePage(oldRelativePath, newTitle) {
    const root = this.getVaultRoot();
    const oldFullPath = path.join(root, oldRelativePath);

    if (!fs.existsSync(oldFullPath)) {
      throw new Error(`Página não encontrada: ${oldRelativePath}`);
    }

    const cleanTitle = newTitle.trim();
    if (!cleanTitle) throw new Error('O título não pode ser vazio.');

    const isCanvas = oldRelativePath.endsWith('.canvas');
    const safeFilename = cleanTitle.replace(/[\\/:*?"<>|]/g, '-');
    const parentDir = path.dirname(oldFullPath);
    const newFileName = isCanvas ? `${safeFilename}.canvas` : `${safeFilename}.md`;
    const newFullPath = path.join(parentDir, newFileName);

    if (!isCanvas) {
      let content = fs.readFileSync(oldFullPath, 'utf8');
      if (content.startsWith('---')) {
        content = content.replace(/^title:.*$/m, `title: ${cleanTitle}`);
      }
      content = content.replace(/^#\s+.*$/m, `# ${cleanTitle}`);
      this.writeAtomic(oldFullPath, content);
    }

    let finalRelativePath = oldRelativePath;
    if (oldFullPath !== newFullPath) {
      if (fs.existsSync(newFullPath)) {
        throw new Error(`Já existe um arquivo chamado "${newFileName}".`);
      }
      fs.renameSync(oldFullPath, newFullPath);
      const relDir = path.dirname(oldRelativePath);
      finalRelativePath = relDir === '.' ? newFileName : `${relDir}/${newFileName}`;

      this.indexer.removePage(root, oldRelativePath);
    }

    const stats = fs.statSync(newFullPath);
    this.indexer.indexPage(root, finalRelativePath, content, stats);

    return {
      oldRelativePath,
      newRelativePath: finalRelativePath,
      newTitle: cleanTitle,
    };
  }

  deletePage(relativePath) {
    const root = this.getVaultRoot();
    const fullPath = path.join(root, relativePath);

    if (!fs.existsSync(fullPath)) {
      return { success: false, message: 'Arquivo não encontrado' };
    }

    const trashDir = path.join(root, '.trash');
    if (!fs.existsSync(trashDir)) fs.mkdirSync(trashDir, { recursive: true });

    const baseName = path.basename(relativePath);
    const trashTarget = path.join(trashDir, `${Date.now()}_${baseName}`);

    fs.renameSync(fullPath, trashTarget);
    this.indexer.removePage(root, relativePath);

    return { success: true };
  }

  // --- Version History (Snapshot per hour, max 50 auto-purge) ---
  getHistoryDir(relativePath) {
    const root = this.getVaultRoot();
    const cleanRel = relativePath.replace(/[\\/]/g, '_');
    const historyDir = path.join(root, '.anota', 'history', cleanRel);
    if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir, { recursive: true });
    return historyDir;
  }

  recordHistorySnapshot(relativePath, content) {
    try {
      const historyDir = this.getHistoryDir(relativePath);
      const existing = fs.readdirSync(historyDir)
        .filter((f) => f.endsWith('.md'))
        .map((f) => Number(f.replace('.md', '')))
        .filter((n) => !isNaN(n))
        .sort((a, b) => b - a);

      const ONE_HOUR_MS = 60 * 60 * 1000;
      const now = Date.now();

      if (existing.length > 0 && now - existing[0] < ONE_HOUR_MS) {
        return;
      }

      const snapPath = path.join(historyDir, `${now}.md`);
      fs.writeFileSync(snapPath, content, 'utf8');
      this.purgeOldSnapshots(relativePath);
    } catch (e) {
      console.error('Erro ao gravar snapshot de histórico:', e);
    }
  }

  purgeOldSnapshots(relativePath) {
    const historyDir = this.getHistoryDir(relativePath);
    const files = fs.readdirSync(historyDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => ({ name: f, time: Number(f.replace('.md', '')) }))
      .filter((x) => !isNaN(x.time))
      .sort((a, b) => b.time - a.time);

    const MAX_SNAPSHOTS = 50;
    if (files.length > MAX_SNAPSHOTS) {
      for (const item of files.slice(MAX_SNAPSHOTS)) {
        try { fs.unlinkSync(path.join(historyDir, item.name)); } catch (e) {}
      }
    }
  }

  listHistory(relativePath) {
    const historyDir = this.getHistoryDir(relativePath);
    if (!fs.existsSync(historyDir)) return [];

    return fs.readdirSync(historyDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => {
        const stats = fs.statSync(path.join(historyDir, f));
        const timestamp = Number(f.replace('.md', ''));
        return {
          id: f,
          timestamp: isNaN(timestamp) ? stats.mtimeMs : timestamp,
          size: stats.size,
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  restoreHistory(relativePath, timestamp) {
    const historyDir = this.getHistoryDir(relativePath);
    const snapFile = path.join(historyDir, `${timestamp}.md`);
    if (!fs.existsSync(snapFile)) throw new Error('Versão histórica não encontrada');

    const historicalContent = fs.readFileSync(snapFile, 'utf8');
    this.writePage(relativePath, historicalContent);
    return { success: true };
  }

  readHistoryContent(relativePath, timestamp) {
    const historyDir = this.getHistoryDir(relativePath);
    const snapFile = path.join(historyDir, `${timestamp}.md`);
    if (!fs.existsSync(snapFile)) return '';
    return fs.readFileSync(snapFile, 'utf8');
  }

  moveItem(srcRelativePath, targetFolderRelativePath) {
    const root = this.getVaultRoot();
    const oldFullPath = path.join(root, srcRelativePath);

    if (!fs.existsSync(oldFullPath)) {
      throw new Error(`Arquivo ou pasta de origem não encontrado: ${srcRelativePath}`);
    }

    const baseName = path.basename(srcRelativePath);
    const targetDir = targetFolderRelativePath ? path.join(root, targetFolderRelativePath) : root;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    let targetFileName = baseName;
    let targetFullPath = path.join(targetDir, targetFileName);
    let counter = 1;

    if (oldFullPath !== targetFullPath) {
      const ext = path.extname(baseName);
      const nameWithoutExt = path.basename(baseName, ext);
      while (fs.existsSync(targetFullPath)) {
        targetFileName = `${nameWithoutExt} (${counter})${ext}`;
        targetFullPath = path.join(targetDir, targetFileName);
        counter++;
      }

      fs.renameSync(oldFullPath, targetFullPath);
    }

    const newRelativePath = targetFolderRelativePath
      ? `${targetFolderRelativePath}/${targetFileName}`
      : targetFileName;

    if (srcRelativePath.endsWith('.md')) {
      this.indexer.removePage(root, srcRelativePath);
      const content = fs.readFileSync(targetFullPath, 'utf8');
      const stats = fs.statSync(targetFullPath);
      this.indexer.indexPage(root, newRelativePath, content, stats);
    } else {
      this.indexer.removeFolder(root, srcRelativePath);
      this.indexer.rebuildIndex(root);
    }

    return { success: true, oldRelativePath: srcRelativePath, newRelativePath };
  }

  // --- Exporting ---
  exportPage(relativePath, destPath) {
    const root = this.getVaultRoot();
    const source = path.join(root, relativePath);
    if (!fs.existsSync(source)) throw new Error('Arquivo não encontrado');
    fs.copyFileSync(source, destPath);
    return { success: true, destPath };
  }

  exportVaultZip(destZipPath) {
    const root = this.getVaultRoot();
    const AdmZip = require('adm-zip');
    const zip = new AdmZip();

    const addFiles = (dir, zipRel = '') => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.name.startsWith('.')) continue;
        const full = path.join(dir, item.name);
        const rel = zipRel ? `${zipRel}/${item.name}` : item.name;
        if (item.isDirectory()) {
          addFiles(full, rel);
        } else if (item.isFile()) {
          zip.addLocalFile(full, zipRel);
        }
      }
    };

    addFiles(root);
    zip.writeZip(destZipPath);
    return { success: true, destZipPath };
  }

  // --- Search & Backlinks ---
  searchFts(query, limit = 20) {
    const root = this.getVaultRoot();
    return this.indexer.search(root, query, limit);
  }

  getBacklinks(relativePath, title) {
    const root = this.getVaultRoot();
    return this.indexer.getBacklinks(root, relativePath, title);
  }

  rebuildIndex() {
    const root = this.getVaultRoot();
    return this.indexer.rebuildIndex(root);
  }

  // --- Trash Management ---
  listTrash() {
    const root = this.getVaultRoot();
    const trashDir = path.join(root, '.trash');
    if (!fs.existsSync(trashDir)) return [];

    return fs.readdirSync(trashDir)
      .filter((f) => !f.startsWith('.'))
      .map((f) => {
        const full = path.join(trashDir, f);
        const stats = fs.statSync(full);
        const parts = f.split('_');
        const timestamp = parts.length > 1 ? Number(parts[0]) : stats.mtimeMs;
        const originalName = parts.length > 1 ? parts.slice(1).join('_') : f;
        return {
          id: f,
          fileName: f,
          originalName,
          trashedAt: timestamp,
        };
      })
      .sort((a, b) => b.trashedAt - a.trashedAt);
  }

  restorePage(trashFileName) {
    const root = this.getVaultRoot();
    const trashPath = path.join(root, '.trash', trashFileName);
    if (!fs.existsSync(trashPath)) throw new Error('Arquivo não encontrado na lixeira');

    const parts = trashFileName.split('_');
    const originalName = parts.length > 1 ? parts.slice(1).join('_') : trashFileName;
    let targetPath = path.join(root, originalName);
    let counter = 1;
    while (fs.existsSync(targetPath)) {
      const ext = path.extname(originalName);
      const base = path.basename(originalName, ext);
      targetPath = path.join(root, `${base} (${counter})${ext}`);
      counter++;
    }

    fs.renameSync(trashPath, targetPath);
    const restoredRelPath = path.relative(root, targetPath).replace(/\\/g, '/');
    const content = fs.readFileSync(targetPath, 'utf8');
    const stats = fs.statSync(targetPath);
    this.indexer.indexPage(root, restoredRelPath, content, stats);

    return { restoredRelPath };
  }

  emptyTrash() {
    const root = this.getVaultRoot();
    const trashDir = path.join(root, '.trash');
    if (fs.existsSync(trashDir)) {
      for (const f of fs.readdirSync(trashDir)) {
        try { fs.unlinkSync(path.join(trashDir, f)); } catch (e) {}
      }
    }
    return { success: true };
  }

  getWorkspace() {
    this.init();
    try {
      if (fs.existsSync(this.workspacePath)) {
        return JSON.parse(fs.readFileSync(this.workspacePath, 'utf8'));
      }
    } catch (e) {}
    return { lastOpenedPath: null, expandedFolders: [], favorites: [], pinned: [] };
  }

  saveWorkspace(config) {
    this.init();
    try {
      fs.writeFileSync(this.workspacePath, JSON.stringify(config, null, 2), 'utf8');
      return true;
    } catch (e) {
      return false;
    }
  }

  exportAllPages() {
    this.init();
    const root = this.getVaultRoot();
    const pages = [];
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === '.trash' || entry.name === '.vault_index') continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile()) {
          const isDoc = entry.name.endsWith('.md') || entry.name.endsWith('.canvas');
          const isAttachment = fullPath.includes(path.sep + 'anexos' + path.sep) || fullPath.includes('/anexos/');
          if (isDoc || isAttachment) {
            const relPath = path.relative(root, fullPath).replace(/\\/g, '/');
            if (isDoc || entry.name.endsWith('.svg') || entry.name.endsWith('.txt')) {
              const content = fs.readFileSync(fullPath, 'utf8');
              pages.push({ relPath, content, encoding: 'utf8' });
            } else {
              const b64 = fs.readFileSync(fullPath).toString('base64');
              pages.push({ relPath, content: b64, encoding: 'base64' });
            }
          }
        }
      }
    };
    walk(root);
    const workspace = this.getWorkspace();
    return { workspace, pages };
  }

  importAllPages(vaultData) {
    if (!vaultData || !Array.isArray(vaultData.pages)) return false;
    this.init();
    const root = this.getVaultRoot();
    for (const p of vaultData.pages) {
      if (!p.relPath || typeof p.content !== 'string') continue;
      const fullPath = path.join(root, p.relPath);
      const data = p.encoding === 'base64' ? Buffer.from(p.content, 'base64') : p.content;
      this.writeAtomic(fullPath, data);
    }
    if (vaultData.workspace) {
      this.saveWorkspace(vaultData.workspace);
    }
    this.rebuildIndex();
    return true;
  }
}

let instance = null;
function getVaultService() {
  if (!instance) {
    instance = new VaultService();
  }
  return instance;
}

module.exports = {
  VaultService,
  getVaultService,
};
