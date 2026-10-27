const { contextBridge, ipcRenderer } = require('electron');

// Expose safe, strongly-typed APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // App & Window
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  setAlwaysOnTop: (flag) => ipcRenderer.invoke('window:setAlwaysOnTop', flag),
  isAlwaysOnTop: () => ipcRenderer.invoke('window:isAlwaysOnTop'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('window:toggleAlwaysOnTop'),
  setMiniMode: (enable) => ipcRenderer.invoke('window:setMiniMode', enable).catch(() => false),
  isMiniMode: () => ipcRenderer.invoke('window:isMiniMode').catch(() => false),
  toggleMiniMode: () => ipcRenderer.invoke('window:toggleMiniMode').catch(() => false),
  onMiniModeChanged: (callback) => {
    const handler = (event, isMini) => callback(isMini);
    ipcRenderer.on('window:mini-mode-changed', handler);
    return () => ipcRenderer.removeListener('window:mini-mode-changed', handler);
  },

  // Settings & Security
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (data) => ipcRenderer.invoke('settings:update', data),
  setPin: (pin) => ipcRenderer.invoke('pin:set', pin),
  disablePin: (currentPin) => ipcRenderer.invoke('pin:disable', currentPin),
  verifyPin: (pin) => ipcRenderer.invoke('pin:verify', pin),
  isPinConfigured: () => ipcRenderer.invoke('pin:isConfigured'),

  // Accounts
  getAccounts: (includeArchived) => ipcRenderer.invoke('accounts:get', includeArchived),
  createAccount: (data) => ipcRenderer.invoke('accounts:create', data),
  updateAccount: (id, data) => ipcRenderer.invoke('accounts:update', id, data),
  deleteAccount: (id) => ipcRenderer.invoke('accounts:delete', id),
  adjustAccountBalance: (data) => ipcRenderer.invoke('accounts:adjustBalance', data),

  // Categories
  getCategories: () => ipcRenderer.invoke('categories:get'),
  createCategory: (data) => ipcRenderer.invoke('categories:create', data),
  updateCategory: (id, data) => ipcRenderer.invoke('categories:update', id, data),
  deleteCategory: (id) => ipcRenderer.invoke('categories:delete', id),

  // Credit Cards
  getCreditCards: (includeArchived) => ipcRenderer.invoke('cards:get', includeArchived),
  createCreditCard: (data) => ipcRenderer.invoke('cards:create', data),
  updateCreditCard: (id, data) => ipcRenderer.invoke('cards:update', id, data),
  deleteCreditCard: (id) => ipcRenderer.invoke('cards:delete', id),
  getCardInvoices: (cardId) => ipcRenderer.invoke('cards:getInvoices', cardId),
  payCardInvoice: (data) => ipcRenderer.invoke('cards:payInvoice', data),

  // Transactions
  getTransactions: (filters) => ipcRenderer.invoke('transactions:get', filters),
  createTransaction: (data) => ipcRenderer.invoke('transactions:create', data),
  updateTransaction: (id, data) => ipcRenderer.invoke('transactions:update', id, data),
  deleteTransaction: (id, deleteGroup) => ipcRenderer.invoke('transactions:delete', id, deleteGroup),
  duplicateTransaction: (id) => ipcRenderer.invoke('transactions:duplicate', id),
  batchMoveTransactions: (data) => ipcRenderer.invoke('transactions:batchMove', data),

  // Category Budgets
  getCategoryBudgets: (monthKey) => ipcRenderer.invoke('budgets:get', monthKey),
  setCategoryBudget: (data) => ipcRenderer.invoke('budgets:set', data),
  deleteCategoryBudget: (id) => ipcRenderer.invoke('budgets:delete', id),

  // Smart Notifications
  getNotifications: () => ipcRenderer.invoke('notifications:get'),
  markNotificationRead: (id) => ipcRenderer.invoke('notifications:markRead', id),
  markAllNotificationsRead: () => ipcRenderer.invoke('notifications:markAllRead'),
  deleteNotification: (id) => ipcRenderer.invoke('notifications:delete', id),

  // Banking OFX & CSV Import & Vault
  openBankingFileDialog: () => ipcRenderer.invoke('banking:openFile'),

  // Habits Module
  getHabits: (includeArchived) => ipcRenderer.invoke('habits:get', includeArchived),
  createHabit: (data) => ipcRenderer.invoke('habits:create', data),
  updateHabit: (id, data) => ipcRenderer.invoke('habits:update', id, data),
  deleteHabit: (id) => ipcRenderer.invoke('habits:delete', id),
  toggleHabitDay: (habitId, date, value, notes) => ipcRenderer.invoke('habits:toggleDay', habitId, date, value, notes),
  getHabitHeatmap: (habitId, year) => ipcRenderer.invoke('habits:getHeatmap', habitId, year),
  getHabitsOverview: () => ipcRenderer.invoke('habits:getOverview'),
  getHabitsIntelligence: () => ipcRenderer.invoke('habits:getIntelligence'),

  parseOFX: (content) => ipcRenderer.invoke('banking:parseOFX', content),
  parseCSV: (content, customMapping) => ipcRenderer.invoke('banking:parseCSV', content, customMapping),
  reconcileImport: (data) => ipcRenderer.invoke('banking:reconcile', data),
  batchImportTransactions: (data) => ipcRenderer.invoke('banking:batchImport', data),
  reassignStatementAccount: (data) => ipcRenderer.invoke('banking:reassignStatementAccount', data),
  deleteStatementTransactions: (statementId) => ipcRenderer.invoke('banking:deleteStatementTransactions', statementId),
  getSavedStatements: () => ipcRenderer.invoke('banking:getSavedStatements'),
  saveImportedStatement: (data) => ipcRenderer.invoke('banking:saveStatement', data),
  openStatementsFolder: () => ipcRenderer.invoke('banking:openStatementsFolder'),
  updateStatementStats: (id, data) => ipcRenderer.invoke('banking:updateStatementStats', id, data),

  // Learned Auto-Categorization Import Rules
  getImportRules: () => ipcRenderer.invoke('importRules:get'),
  saveImportRule: (data) => ipcRenderer.invoke('importRules:save', data),
  deleteImportRule: (id) => ipcRenderer.invoke('importRules:delete', id),
  toggleImportRule: (id) => ipcRenderer.invoke('importRules:toggle', id),

  // Financial Calendar & Projections
  getCalendarData: (year, month) => ipcRenderer.invoke('calendar:get', year, month),

  // Goals
  getGoals: () => ipcRenderer.invoke('goals:get'),
  createGoal: (data) => ipcRenderer.invoke('goals:create', data),
  updateGoal: (id, data) => ipcRenderer.invoke('goals:update', id, data),
  deleteGoal: (id) => ipcRenderer.invoke('goals:delete', id),
  addFundsToGoal: (id, amount, accountId) => ipcRenderer.invoke('goals:addFunds', id, amount, accountId),

  getDashboardData: () => ipcRenderer.invoke('dashboard:get'),
  getReports: (filters) => ipcRenderer.invoke('reports:get', filters),

  // Financial Intelligence Engine (100% Local & Offline)
  getIntelligenceOverview: () => ipcRenderer.invoke('intelligence:getOverview'),
  getFinancialHealthScore: (targetDate) => ipcRenderer.invoke('intelligence:getHealthScore', targetDate),
  getBalanceForecast: (daysAhead) => ipcRenderer.invoke('intelligence:getForecast', daysAhead),
  getSmartInsights: (targetMonthKey) => ipcRenderer.invoke('intelligence:getInsights', targetMonthKey),
  detectAnomalies: (monthsBack) => ipcRenderer.invoke('intelligence:getAnomalies', monthsBack),
  suggestCategory: (description, amount) => ipcRenderer.invoke('intelligence:suggestCategory', description, amount),
  detectRecurringPatterns: () => ipcRenderer.invoke('intelligence:detectRecurring'),
  getCreditCardIntelligence: () => ipcRenderer.invoke('intelligence:getCardAnalysis'),
  getGoalsIntelligence: () => ipcRenderer.invoke('intelligence:getGoals'),
  getMonthlyCloseout: (yearMonth) => ipcRenderer.invoke('intelligence:getMonthlyCloseout', yearMonth),

  // Gamificação (Jornada)
  getGameOverview: () => ipcRenderer.invoke('game:getOverview'),
  getGameUnlocks: () => ipcRenderer.invoke('game:getUnlocks'),
  getGameWorld: () => ipcRenderer.invoke('game:getWorld'),
  getGameAssets: () => ipcRenderer.invoke('game:getAssets'),
  openGameAssetsFolder: () => ipcRenderer.invoke('game:openAssetsFolder'),

  // Reserva Financeira
  getReserveOverview: (monthKey) => ipcRenderer.invoke('reserve:get', monthKey),
  setReserveTransactionExcluded: (transactionId, excluded) => ipcRenderer.invoke('reserve:setExcluded', transactionId, excluded),
  registerReserveMovement: (data) => ipcRenderer.invoke('reserve:registerMovement', data),

  // Cloud Auth & Sync (Supabase / Local-First)
  getCloudSession: () => ipcRenderer.invoke('cloud:getSession'),
  cloudSignIn: (email, password, config) => ipcRenderer.invoke('cloud:signIn', email, password, config),
  cloudSignUp: (email, password, config) => ipcRenderer.invoke('cloud:signUp', email, password, config),
  cloudSignOut: () => ipcRenderer.invoke('cloud:signOut'),
  updateCloudConfig: (supabaseUrl, supabaseAnonKey) => ipcRenderer.invoke('cloud:updateConfig', supabaseUrl, supabaseAnonKey),
  triggerCloudSync: (options) => ipcRenderer.invoke('cloud:sync', options),
  getCloudPendingCount: () => ipcRenderer.invoke('cloud:pendingCount'),
  cloudFullPull: () => ipcRenderer.invoke('cloud:fullPull'),

  // App version & auto-update
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  checkForUpdates: () => ipcRenderer.invoke('app:checkForUpdates'),
  installUpdate: () => ipcRenderer.invoke('app:installUpdate'),
  onUpdateStatus: (callback) => {
    const handler = (_event, status) => callback(status);
    ipcRenderer.on('app:updateStatus', handler);
    return () => ipcRenderer.removeListener('app:updateStatus', handler);
  },

  // Local automatic backups
  listLocalBackups: () => ipcRenderer.invoke('backup:listLocal'),
  createBackupNow: () => ipcRenderer.invoke('backup:createNow'),
  openBackupsFolder: () => ipcRenderer.invoke('backup:openFolder'),
  chooseBackupFolder: () => ipcRenderer.invoke('backup:chooseFolder'),
  restoreLocalBackup: (fileName) => ipcRenderer.invoke('backup:restoreLocal', fileName),

  // Backup, Restore & CSV Dialogs
  exportBackupDialog: () => ipcRenderer.invoke('backup:export'),
  restoreBackupDialog: () => ipcRenderer.invoke('backup:restore'),
  exportCsvDialog: (filters) => ipcRenderer.invoke('csv:export', filters),

  // Demo Data
  seedDemoData: () => ipcRenderer.invoke('demo:seed'),
  clearDemoData: () => ipcRenderer.invoke('demo:clear'),

  // Tools Module: Notes, Mindmaps & Password Vault
  getNotes: () => ipcRenderer.invoke('tools:getNotes'),
  createNote: (data) => ipcRenderer.invoke('tools:createNote', data),
  updateNote: (id, data) => ipcRenderer.invoke('tools:updateNote', id, data),
  deleteNote: (id) => ipcRenderer.invoke('tools:deleteNote', id),

  getMindmaps: () => ipcRenderer.invoke('tools:getMindmaps'),
  createMindmap: (data) => ipcRenderer.invoke('tools:createMindmap', data),
  updateMindmap: (id, data) => ipcRenderer.invoke('tools:updateMindmap', id, data),
  deleteMindmap: (id) => ipcRenderer.invoke('tools:deleteMindmap', id),

  getVaultItems: () => ipcRenderer.invoke('tools:getVaultItems'),
  createVaultItem: (data) => ipcRenderer.invoke('tools:createVaultItem', data),
  updateVaultItem: (id, data) => ipcRenderer.invoke('tools:updateVaultItem', id, data),
  deleteVaultItem: (id) => ipcRenderer.invoke('tools:deleteVaultItem', id),

  // Time Tracker Module
  getTimeEntries: (filter) => ipcRenderer.invoke('tools:getTimeEntries', filter),
  createTimeEntry: (data) => ipcRenderer.invoke('tools:createTimeEntry', data),
  updateTimeEntry: (id, data) => ipcRenderer.invoke('tools:updateTimeEntry', id, data),
  deleteTimeEntry: (id) => ipcRenderer.invoke('tools:deleteTimeEntry', id),
  getTimeTrackerStats: (period) => ipcRenderer.invoke('tools:getTimeTrackerStats', period),
  getSystemIdleTime: () => ipcRenderer.invoke('tools:getSystemIdleTime'),
  updateTrayTimer: (text) => ipcRenderer.invoke('tools:updateTrayTimer', text),

  // Local-first Markdown Vault
  vaultInit: (customPath) => ipcRenderer.invoke('vault:init', customPath),
  vaultGetEnvironments: () => ipcRenderer.invoke('vault:getEnvironments'),
  vaultCreateEnvironment: (name, icon) => ipcRenderer.invoke('vault:createEnvironment', name, icon),
  vaultCreateFolder: (opts) => ipcRenderer.invoke('vault:createFolder', opts),
  vaultDeleteFolder: (relPath) => ipcRenderer.invoke('vault:deleteFolder', relPath),
  vaultSetFolderIcon: (relPath, icon) => ipcRenderer.invoke('vault:setFolderIcon', relPath, icon),
  vaultGetTree: (envName) => ipcRenderer.invoke('vault:getTree', envName),
  vaultReadPage: (relPath) => ipcRenderer.invoke('vault:readPage', relPath),
  vaultWritePage: (relPath, content) => ipcRenderer.invoke('vault:writePage', relPath, content),
  vaultCreatePage: (opts) => ipcRenderer.invoke('vault:createPage', opts),
  vaultRenamePage: (oldPath, newTitle) => ipcRenderer.invoke('vault:renamePage', oldPath, newTitle),
  vaultDeletePage: (relPath) => ipcRenderer.invoke('vault:deletePage', relPath),
  vaultGetWorkspace: () => ipcRenderer.invoke('vault:getWorkspace'),
  vaultSaveWorkspace: (cfg) => ipcRenderer.invoke('vault:saveWorkspace', cfg),
  vaultSearch: (query, limit) => ipcRenderer.invoke('vault:search', query, limit),
  vaultGetBacklinks: (relPath, title) => ipcRenderer.invoke('vault:getBacklinks', relPath, title),
  vaultRebuildIndex: () => ipcRenderer.invoke('vault:rebuildIndex'),
  vaultListTrash: () => ipcRenderer.invoke('vault:listTrash'),
  vaultRestorePage: (trashFileName) => ipcRenderer.invoke('vault:restorePage', trashFileName),
  vaultEmptyTrash: () => ipcRenderer.invoke('vault:emptyTrash'),
  vaultListHistory: (relPath) => ipcRenderer.invoke('vault:listHistory', relPath),
  vaultReadHistoryContent: (relPath, timestamp) => ipcRenderer.invoke('vault:readHistoryContent', relPath, timestamp),
  vaultRestoreHistory: (relPath, timestamp) => ipcRenderer.invoke('vault:restoreHistory', relPath, timestamp),
  vaultMoveItem: (srcRel, targetFolder) => ipcRenderer.invoke('vault:moveItem', srcRel, targetFolder),
  vaultGetVaultRoot: () => ipcRenderer.invoke('vault:getVaultRoot'),
  vaultExportPage: (relPath, defaultName) => ipcRenderer.invoke('vault:exportPage', relPath, defaultName),
  vaultExportVaultZip: () => ipcRenderer.invoke('vault:exportVaultZip'),
  vaultExportPDF: (title, htmlBody) => ipcRenderer.invoke('vault:exportPDF', title, htmlBody),

  // Quick actions from tray or global triggers
  onQuickAction: (callback) => {
    const handler = (event, action) => callback(action);
    ipcRenderer.on('orbitron:quick-action', handler);
    return () => ipcRenderer.removeListener('orbitron:quick-action', handler);
  },

  // Canvas Module API (Infinite Whiteboard in Vault)
  canvas: {
    list: (dir) => ipcRenderer.invoke('canvas:list', dir),
    read: (path) => ipcRenderer.invoke('canvas:read', path),
    write: (path, doc) => ipcRenderer.invoke('canvas:write', path, doc),
    rename: (from, to) => ipcRenderer.invoke('canvas:rename', from, to),
    trash: (path) => ipcRenderer.invoke('canvas:trash', path),
    exportImage: (path, format, dataUrl) => ipcRenderer.invoke('canvas:exportImage', path, format, dataUrl),
    watch: (onChange) => {
      const listener = (event, p) => onChange(p);
      ipcRenderer.on('canvas:changed', listener);
      return () => ipcRenderer.removeListener('canvas:changed', listener);
    },
  },
});

contextBridge.exposeInMainWorld('orbitronCanvasApi', {
  list: (dir) => ipcRenderer.invoke('canvas:list', dir),
  read: (path) => ipcRenderer.invoke('canvas:read', path),
  write: (path, doc) => ipcRenderer.invoke('canvas:write', path, doc),
  rename: (from, to) => ipcRenderer.invoke('canvas:rename', from, to),
  trash: (path) => ipcRenderer.invoke('canvas:trash', path),
  exportImage: (path, format, dataUrl) => ipcRenderer.invoke('canvas:exportImage', path, format, dataUrl),
  watch: (onChange) => {
    const listener = (event, p) => onChange(p);
    ipcRenderer.on('canvas:changed', listener);
    return () => ipcRenderer.removeListener('canvas:changed', listener);
  },
});
