import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StickyNote,
  Network,
  KeyRound,
  Plus,
  Trash2,
  Pin,
  Search,
  CheckSquare,
  Square,
  Copy,
  Eye,
  EyeOff,
  Sparkles,
  Star,
  Globe,
  RefreshCw,
  ShieldCheck,
  GitBranch,
  Check,
  FolderKanban,
  Lock,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

interface NoteItem {
  id: string;
  title: string;
  content: string;
  category: string;
  color: string;
  pinned: boolean;
  checklist: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

interface MindmapNode {
  id: string;
  label: string;
  parentId: string | null;
  x: number;
  y: number;
  color: string;
  notes?: string;
}

interface MindmapBoard {
  id: string;
  title: string;
  description: string;
  nodes: MindmapNode[];
  createdAt: string;
  updatedAt: string;
}

interface VaultItem {
  id: string;
  title: string;
  category: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

const NOTE_CATEGORIES = [
  { id: 'ideias', label: '💡 Ideias', color: '#a855f7' },
  { id: 'financas', label: '💰 Finanças', color: '#10b981' },
  { id: 'projetos', label: '🚀 Projetos', color: '#38bdf8' },
  { id: 'estudos', label: '📚 Estudos', color: '#f59e0b' },
  { id: 'pessoal', label: '📌 Pessoal', color: '#ec4899' },
];

const VAULT_CATEGORIES = [
  { id: 'bancos', label: '🏦 Bancos & Corretoras', color: '#10b981' },
  { id: 'cartoes', label: '💳 Cartões & Apps', color: '#8b5cf6' },
  { id: 'redes_sociais', label: '🌐 Redes Sociais', color: '#38bdf8' },
  { id: 'trabalho', label: '💼 Trabalho', color: '#f59e0b' },
  { id: 'email', label: '📧 E-mails & Contas', color: '#ec4899' },
  { id: 'outros', label: '🔐 Outros', color: '#94a3b8' },
];

const NODE_COLORS = ['#a855f7', '#10b981', '#38bdf8', '#f59e0b', '#ec4899', '#ef4444', '#6366f1'];

export const ToolsView: React.FC = () => {
  const { currentView, setCurrentView, showToast, refreshGame } = useFinancial();

  const activeTool: 'notes' | 'mindmap' | 'vault' =
    currentView === 'tools_mindmap'
      ? 'mindmap'
      : currentView === 'tools_vault'
      ? 'vault'
      : 'notes';

  // =========================================================
  // 1. NOTES STATE & HANDLERS
  // =========================================================
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [noteSearch, setNoteSearch] = useState('');
  const [noteCategoryFilter, setNoteCategoryFilter] = useState<string>('all');
  const [newCheckItemText, setNewCheckItemText] = useState('');

  // =========================================================
  // 2. MINDMAP STATE & HANDLERS
  // =========================================================
  const [mindmaps, setMindmaps] = useState<MindmapBoard[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('root');
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [newMapTitle, setNewMapTitle] = useState('');
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // =========================================================
  // 3. PASSWORD VAULT STATE & HANDLERS
  // =========================================================
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [vaultSearch, setVaultSearch] = useState('');
  const [vaultCategoryFilter, setVaultCategoryFilter] = useState<string>('all');
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [editingVault, setEditingVault] = useState<Partial<VaultItem> | null>(null);

  const loadAllTools = useCallback(async () => {
    if (!window.electronAPI) return;
    try {
      const [loadedNotes, loadedMaps, loadedVault] = await Promise.all([
        window.electronAPI.getNotes ? window.electronAPI.getNotes() : [],
        window.electronAPI.getMindmaps ? window.electronAPI.getMindmaps() : [],
        window.electronAPI.getVaultItems ? window.electronAPI.getVaultItems() : [],
      ]);
      setNotes(loadedNotes || []);
      if (loadedNotes?.length > 0 && !selectedNoteId) {
        setSelectedNoteId(loadedNotes[0].id);
      }
      setMindmaps(loadedMaps || []);
      if (loadedMaps?.length > 0 && !selectedMapId) {
        setSelectedMapId(loadedMaps[0].id);
      }
      setVaultItems(loadedVault || []);
    } catch (err) {
      console.error('Erro ao carregar ferramentas:', err);
    }
  }, [selectedNoteId, selectedMapId]);

  useEffect(() => {
    loadAllTools();
  }, [loadAllTools]);

  // --- NOTES ACTIONS ---
  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;

  const handleCreateNote = async () => {
    if (!window.electronAPI?.createNote) return;
    const created = await window.electronAPI.createNote({
      title: 'Nova Anotação',
      content: '',
      category: noteCategoryFilter !== 'all' ? noteCategoryFilter : 'ideias',
      color: '#a855f7',
      pinned: false,
      checklist: [],
    });
    const updated = await window.electronAPI.getNotes();
    setNotes(updated);
    if (created?.id) setSelectedNoteId(created.id);
    await refreshGame();
    showToast('Nova anotação criada!', 'success');
  };

  const handleUpdateNote = async (id: string, patch: Partial<NoteItem>) => {
    if (!window.electronAPI?.updateNote) return;
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    await window.electronAPI.updateNote(id, patch);
    await refreshGame();
  };

  const handleDeleteNote = async (id: string) => {
    if (!window.electronAPI?.deleteNote) return;
    await window.electronAPI.deleteNote(id);
    const updated = await window.electronAPI.getNotes();
    setNotes(updated);
    setSelectedNoteId(updated[0]?.id || null);
    showToast('Anotação removida.', 'info');
  };

  const handleAddChecklistItem = async () => {
    if (!selectedNote || !newCheckItemText.trim()) return;
    const nextList: ChecklistItem[] = [
      ...(selectedNote.checklist || []),
      { id: `chk_${Date.now()}`, text: newCheckItemText.trim(), done: false },
    ];
    setNewCheckItemText('');
    await handleUpdateNote(selectedNote.id, { checklist: nextList });
  };

  const handleToggleChecklistItem = async (itemId: string) => {
    if (!selectedNote) return;
    const nextList = (selectedNote.checklist || []).map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    await handleUpdateNote(selectedNote.id, { checklist: nextList });
  };

  const handleRemoveChecklistItem = async (itemId: string) => {
    if (!selectedNote) return;
    const nextList = (selectedNote.checklist || []).filter((item) => item.id !== itemId);
    await handleUpdateNote(selectedNote.id, { checklist: nextList });
  };

  // --- MINDMAP ACTIONS ---
  const selectedMap = mindmaps.find((m) => m.id === selectedMapId) || null;
  const selectedNode =
    selectedMap?.nodes.find((n) => n.id === selectedNodeId) ||
    selectedMap?.nodes[0] ||
    null;

  const handleCreateMindmap = async () => {
    if (!window.electronAPI?.createMindmap) return;
    const title = newMapTitle.trim() || `Mapa Mental #${mindmaps.length + 1}`;
    const created = await window.electronAPI.createMindmap({ title });
    setNewMapTitle('');
    const updated = await window.electronAPI.getMindmaps();
    setMindmaps(updated);
    if (created?.id) {
      setSelectedMapId(created.id);
      setSelectedNodeId('root');
    }
    await refreshGame();
    showToast(`Mapa Mental "${title}" criado!`, 'success');
  };

  const handleDeleteMindmap = async (id: string) => {
    if (!window.electronAPI?.deleteMindmap) return;
    await window.electronAPI.deleteMindmap(id);
    const updated = await window.electronAPI.getMindmaps();
    setMindmaps(updated);
    setSelectedMapId(updated[0]?.id || null);
    showToast('Mapa Mental excluído.', 'info');
  };

  const saveMapNodes = async (mapId: string, nextNodes: MindmapNode[], nextTitle?: string) => {
    if (!window.electronAPI?.updateMindmap) return;
    setMindmaps((prev) =>
      prev.map((m) =>
        m.id === mapId
          ? { ...m, nodes: nextNodes, title: nextTitle !== undefined ? nextTitle : m.title }
          : m
      )
    );
    await window.electronAPI.updateMindmap(mapId, {
      nodes: nextNodes,
      ...(nextTitle !== undefined ? { title: nextTitle } : {}),
    });
    await refreshGame();
  };

  const handleAddChildNode = async () => {
    if (!selectedMap) return;
    const parent = selectedNode || selectedMap.nodes[0];
    if (!parent) return;

    const siblingsCount = selectedMap.nodes.filter((n) => n.parentId === parent.id).length;
    const angle = (siblingsCount * 55 - 45) * (Math.PI / 180);
    const distance = 190;
    const rawX = Math.round(parent.x + Math.cos(angle) * distance);
    const rawY = Math.round(parent.y + Math.sin(angle) * distance);

    const newNode: MindmapNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      label: 'Nova Ideia',
      parentId: parent.id,
      x: Math.max(80, Math.min(780, rawX)),
      y: Math.max(60, Math.min(460, rawY)),
      color: NODE_COLORS[selectedMap.nodes.length % NODE_COLORS.length],
      notes: '',
    };

    const nextNodes = [...selectedMap.nodes, newNode];
    await saveMapNodes(selectedMap.id, nextNodes);
    setSelectedNodeId(newNode.id);
  };

  const handleUpdateSelectedNode = async (patch: Partial<MindmapNode>) => {
    if (!selectedMap || !selectedNode) return;
    const nextNodes = selectedMap.nodes.map((n) =>
      n.id === selectedNode.id ? { ...n, ...patch } : n
    );
    await saveMapNodes(selectedMap.id, nextNodes);
  };

  const handleDeleteSelectedNode = async () => {
    if (!selectedMap || !selectedNode) return;
    if (selectedNode.parentId === null) {
      showToast('O nó central não pode ser removido (você pode renomeá-lo).', 'info');
      return;
    }
    // Remove node and its direct children
    const toRemove = new Set<string>([selectedNode.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const n of selectedMap.nodes) {
        if (n.parentId && toRemove.has(n.parentId) && !toRemove.has(n.id)) {
          toRemove.add(n.id);
          changed = true;
        }
      }
    }
    const nextNodes = selectedMap.nodes.filter((n) => !toRemove.has(n.id));
    await saveMapNodes(selectedMap.id, nextNodes);
    setSelectedNodeId('root');
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingNodeId || !selectedMap || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(70, Math.min(rect.width - 70, Math.round(e.clientX - rect.left)));
    const y = Math.max(45, Math.min(rect.height - 45, Math.round(e.clientY - rect.top)));
    setMindmaps((prev) =>
      prev.map((m) =>
        m.id === selectedMap.id
          ? {
              ...m,
              nodes: m.nodes.map((n) => (n.id === draggingNodeId ? { ...n, x, y } : n)),
            }
          : m
      )
    );
  };

  const handleCanvasMouseUp = async () => {
    if (!draggingNodeId || !selectedMap) return;
    const draggedId = draggingNodeId;
    setDraggingNodeId(null);
    if (window.electronAPI?.updateMindmap) {
      const currentMap = mindmaps.find((m) => m.id === selectedMap.id);
      if (currentMap) {
        await window.electronAPI.updateMindmap(currentMap.id, { nodes: currentMap.nodes });
      }
    }
    setSelectedNodeId(draggedId);
  };

  // --- PASSWORD VAULT ACTIONS ---
  const generateStrongPassword = () => {
    const chars =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*+-=?';
    let pass = '';
    for (let i = 0; i < 18; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditingVault((prev) => (prev ? { ...prev, password: pass } : prev));
    showToast('Senha forte de 18 caracteres gerada!', 'info');
  };

  const handleSaveVaultItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVault || !window.electronAPI) return;
    if (!editingVault.title?.trim()) {
      showToast('Informe o nome do serviço ou aplicativo.', 'error');
      return;
    }
    try {
      if (editingVault.id) {
        await window.electronAPI.updateVaultItem(editingVault.id, editingVault);
        showToast('Credencial atualizada no Cofre!', 'success');
      } else {
        await window.electronAPI.createVaultItem(editingVault);
        showToast('Nova senha blindada salva no Cofre!', 'success');
      }
      setEditingVault(null);
      const updated = await window.electronAPI.getVaultItems();
      setVaultItems(updated);
      await refreshGame();
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar no Cofre.', 'error');
    }
  };

  const handleDeleteVaultItem = async (id: string) => {
    if (!window.electronAPI?.deleteVaultItem) return;
    await window.electronAPI.deleteVaultItem(id);
    const updated = await window.electronAPI.getVaultItems();
    setVaultItems(updated);
    showToast('Credencial removida do Cofre.', 'info');
  };

  const handleToggleFavoriteVault = async (item: VaultItem) => {
    if (!window.electronAPI?.updateVaultItem) return;
    await window.electronAPI.updateVaultItem(item.id, { favorite: !item.favorite });
    const updated = await window.electronAPI.getVaultItems();
    setVaultItems(updated);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copiado para a área de transferência!`, 'success');
  };

  // Filtered Lists
  const filteredNotes = notes.filter((n) => {
    const matchesCat = noteCategoryFilter === 'all' || n.category === noteCategoryFilter;
    const q = noteSearch.toLowerCase().trim();
    const matchesQuery =
      !q ||
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  const filteredVault = vaultItems.filter((v) => {
    const matchesCat = vaultCategoryFilter === 'all' || v.category === vaultCategoryFilter;
    const q = vaultSearch.toLowerCase().trim();
    const matchesQuery =
      !q ||
      v.title.toLowerCase().includes(q) ||
      v.username.toLowerCase().includes(q) ||
      v.url.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Liquid Glass Sub-Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-300">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">
                Pigo Ferramentas & Segundo Cérebro
              </h1>
              <p className="text-xs text-slate-400">
                Suas anotações, mapas mentais visuais e cofre de senhas criptografado 100% offline.
              </p>
            </div>
          </div>
        </div>

        {/* Liquid Glass Tool Switcher */}
        <div className="liquid-glass-well p-1.5 rounded-2xl flex items-center gap-1 self-start">
          {[
            { id: 'tools_notes', key: 'notes', label: 'Anotações', icon: StickyNote, count: notes.length },
            { id: 'tools_mindmap', key: 'mindmap', label: 'Mapa Mental', icon: Network, count: mindmaps.length },
            { id: 'tools_vault', key: 'vault', label: 'Cofre de Senhas', icon: KeyRound, count: vaultItems.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTool === tab.key;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id as any)}
                style={{ '--tab-glow': 'rgba(217, 70, 239, 0.35)' } as React.CSSProperties}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-300 ${
                  isActive
                    ? 'liquid-glass-tab-active text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-fuchsia-300' : ''}`} />
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.08] text-slate-300">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================
          ABA 1: ANOTAÇÕES & SEGUNDO CÉREBRO
         ========================================================= */}
      {activeTool === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[560px]">
          {/* Left Column: Notes List & Filters */}
          <div className="lg:col-span-4 bg-slate-900/80 border border-white/[0.07] rounded-3xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar anotação..."
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-400"
                />
              </div>
              <button
                onClick={handleCreateNote}
                className="liquid-glass-cta px-3.5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-500 text-white text-xs font-extrabold flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Nota</span>
              </button>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              <button
                onClick={() => setNoteCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition ${
                  noteCategoryFilter === 'all'
                    ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Todas
              </button>
              {NOTE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setNoteCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition ${
                    noteCategoryFilter === cat.id
                      ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40'
                      : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Notes List */}
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[460px] pr-1 custom-scrollbar">
              {filteredNotes.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-4">
                  <StickyNote className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-xs font-bold text-slate-300">Nenhuma anotação encontrada</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Clique em "+ Nova Nota" para registrar ideias, planejamentos ou listas.
                  </p>
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const isSelected = note.id === selectedNoteId;
                  const catObj =
                    NOTE_CATEGORIES.find((c) => c.id === note.category) || NOTE_CATEGORIES[0];
                  const doneCount = (note.checklist || []).filter((c) => c.done).length;
                  const totalCheck = (note.checklist || []).length;
                  return (
                    <button
                      key={note.id}
                      onClick={() => setSelectedNoteId(note.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-slate-800/90 border-fuchsia-500/50 shadow-lg'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: note.color || catObj.color }}
                          />
                          <h3 className="text-xs font-extrabold text-white truncate">
                            {note.title || 'Sem título'}
                          </h3>
                        </div>
                        {note.pinned && (
                          <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400/20" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5 min-h-[16px]">
                        {note.content || 'Sem texto adicional...'}
                      </p>
                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/[0.04] text-[10px] text-slate-500">
                        <span>{catObj.label}</span>
                        {totalCheck > 0 && (
                          <span className="text-emerald-400 font-bold">
                            ✓ {doneCount}/{totalCheck} itens
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Note Editor */}
          <div className="lg:col-span-8 bg-slate-900/80 border border-white/[0.07] rounded-3xl p-6 flex flex-col">
            {!selectedNote ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/25 flex items-center justify-center text-fuchsia-400 mb-3">
                  <StickyNote className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-white">Seu Segundo Cérebro</h3>
                <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
                  Guarde anotações financeiras, ideias de projetos, resumos de livros e listas de tarefas em um só lugar.
                </p>
                <button
                  onClick={handleCreateNote}
                  className="liquid-glass-cta px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-500 text-white text-xs font-extrabold flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Primeira Anotação</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-4">
                {/* Top Editor Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.07]">
                  <input
                    type="text"
                    value={selectedNote.title}
                    onChange={(e) => handleUpdateNote(selectedNote.id, { title: e.target.value })}
                    placeholder="Título da anotação..."
                    className="flex-1 min-w-[200px] bg-transparent text-lg font-black text-white focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedNote.category}
                      onChange={(e) =>
                        handleUpdateNote(selectedNote.id, { category: e.target.value })
                      }
                      className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                      {NOTE_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() =>
                        handleUpdateNote(selectedNote.id, { pinned: !selectedNote.pinned })
                      }
                      title={selectedNote.pinned ? 'Desafixar do topo' : 'Fixar no topo'}
                      className={`p-2 rounded-xl border transition ${
                        selectedNote.pinned
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Pin className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteNote(selectedNote.id)}
                      title="Excluir anotação"
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Main Free-Form Note Content */}
                <textarea
                  rows={8}
                  value={selectedNote.content}
                  onChange={(e) => handleUpdateNote(selectedNote.id, { content: e.target.value })}
                  placeholder="Escreva suas ideias, metas, reflexões ou planejamentos aqui..."
                  className="w-full flex-1 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-100 leading-relaxed placeholder-slate-500 focus:outline-none focus:border-fuchsia-500/50 resize-none"
                />

                {/* Interactive Checklist Section */}
                <div className="p-4 rounded-2xl bg-slate-950/75 border border-slate-800/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-fuchsia-400" />
                      <span>Checklist & Tarefas da Nota</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {(selectedNote.checklist || []).filter((i) => i.done).length}/
                      {(selectedNote.checklist || []).length} concluídos
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Adicionar item ao checklist e pressionar Enter..."
                      value={newCheckItemText}
                      onChange={(e) => setNewCheckItemText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddChecklistItem();
                        }
                      }}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddChecklistItem}
                      className="px-3 py-1.5 rounded-xl bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-500/35 text-fuchsia-200 text-xs font-bold transition"
                    >
                      + Adicionar
                    </button>
                  </div>

                  {(selectedNote.checklist || []).length > 0 && (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                      {(selectedNote.checklist || []).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/70"
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleChecklistItem(item.id)}
                            className="flex items-center gap-2 text-left flex-1 text-xs"
                          >
                            {item.done ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500 shrink-0" />
                            )}
                            <span
                              className={
                                item.done ? 'line-through text-slate-500' : 'text-slate-200'
                              }
                            >
                              {item.text}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveChecklistItem(item.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          ABA 2: MAPAS MENTAIS INTERATIVOS
         ========================================================= */}
      {activeTool === 'mindmap' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Panel: Boards & Node Inspector */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900/80 border border-white/[0.07] rounded-3xl p-4 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Meus Quadros de Mapa Mental
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nome do novo mapa mental..."
                  value={newMapTitle}
                  onChange={(e) => setNewMapTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateMindmap();
                    }
                  }}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-400"
                />
                <button
                  onClick={handleCreateMindmap}
                  className="liquid-glass-cta px-3 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-500 text-white text-xs font-extrabold flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Criar</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {mindmaps.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedMapId(m.id);
                      setSelectedNodeId('root');
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      m.id === selectedMapId
                        ? 'bg-fuchsia-500/15 border-fuchsia-500/40 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{m.title}</p>
                      <span className="text-[10px] text-slate-400">
                        {m.nodes.length} nós conectados
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMindmap(m.id);
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Node Inspector */}
            {selectedMap && selectedNode && (
              <div className="bg-slate-900/80 border border-white/[0.07] rounded-3xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <GitBranch className="w-4 h-4 text-fuchsia-400" />
                    <span>Editar Nó Selecionado</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddChildNode}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-extrabold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Puxar Ramificação</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Texto do Nó:</label>
                  <input
                    type="text"
                    value={selectedNode.label}
                    onChange={(e) => handleUpdateSelectedNode({ label: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fuchsia-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Cor do Nó:</label>
                  <div className="flex items-center gap-2">
                    {NODE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleUpdateSelectedNode({ color: c })}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          selectedNode.color === c ? 'scale-125 ring-2 ring-white' : 'opacity-75'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Notas / Detalhes deste Nó:
                  </label>
                  <textarea
                    rows={3}
                    value={selectedNode.notes || ''}
                    onChange={(e) => handleUpdateSelectedNode({ notes: e.target.value })}
                    placeholder="Anote detalhes específicos deste ponto..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none resize-none"
                  />
                </div>

                {selectedNode.parentId !== null && (
                  <button
                    type="button"
                    onClick={handleDeleteSelectedNode}
                    className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir este Nó</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Panel: Interactive Visual Mindmap Canvas */}
          <div className="lg:col-span-8 bg-slate-900/80 border border-white/[0.07] rounded-3xl p-4 flex flex-col">
            {!selectedMap ? (
              <div className="h-[520px] flex flex-col items-center justify-center text-center p-6">
                <Network className="w-12 h-12 text-fuchsia-400 mb-3" />
                <h3 className="text-base font-black text-white">Crie seu Primeiro Mapa Mental</h3>
                <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
                  Conecte ideias visualmente, estruture metas financeiras, projetos ou estudos arrastando os nós na tela.
                </p>
                <button
                  onClick={handleCreateMindmap}
                  className="liquid-glass-cta px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-500 text-white text-xs font-extrabold flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Mapa Mental Inicial</span>
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-sm font-black text-white">{selectedMap.title}</h3>
                    <p className="text-[11px] text-slate-400">
                      Arraste qualquer bloco para mover • Clique em um nó e depois em &ldquo;+ Puxar Ramificação&rdquo;
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddChildNode}
                    className="liquid-glass-cta px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nova Ramificação</span>
                  </button>
                </div>

                <div
                  ref={canvasRef}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  className="relative w-full h-[500px] rounded-2xl bg-[#09090b] border border-white/[0.06] overflow-hidden select-none"
                  style={{
                    backgroundImage:
                      'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
                    backgroundSize: '22px 22px',
                  }}
                >
                  {/* SVG Curved Connectors */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {selectedMap.nodes.map((node) => {
                      if (!node.parentId) return null;
                      const parent = selectedMap.nodes.find((p) => p.id === node.parentId);
                      if (!parent) return null;
                      const midX = (parent.x + node.x) / 2;
                      const pathData = `M ${parent.x} ${parent.y} C ${midX} ${parent.y}, ${midX} ${node.y}, ${node.x} ${node.y}`;
                      return (
                        <path
                          key={`edge_${parent.id}_${node.id}`}
                          d={pathData}
                          stroke={node.color || '#a855f7'}
                          strokeWidth={2.5}
                          strokeOpacity={0.65}
                          fill="none"
                        />
                      );
                    })}
                  </svg>

                  {/* Interactive Draggable Nodes */}
                  {selectedMap.nodes.map((node) => {
                    const isSelected = node.id === selectedNode?.id;
                    const isRoot = node.parentId === null;
                    return (
                      <div
                        key={node.id}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setSelectedNodeId(node.id);
                          setDraggingNodeId(node.id);
                        }}
                        style={{
                          left: `${node.x}px`,
                          top: `${node.y}px`,
                          transform: 'translate(-50%, -50%)',
                          borderColor: isSelected ? '#ffffff' : node.color,
                          boxShadow: isSelected
                            ? `0 0 24px -2px ${node.color}90`
                            : '0 8px 20px -4px rgba(0,0,0,0.6)',
                        }}
                        className={`absolute px-4 py-2.5 rounded-2xl cursor-grab active:cursor-grabbing border-2 transition-shadow ${
                          isRoot
                            ? 'bg-slate-900 font-black text-sm text-white'
                            : 'bg-slate-900/95 font-bold text-xs text-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: node.color }}
                          />
                          <span>{node.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          ABA 3: COFRE DE SENHAS CRIPTOGRAFADO (AES-256)
         ========================================================= */}
      {activeTool === 'vault' && (
        <div className="space-y-4">
          {/* Security Banner & Top Controls */}
          <div className="p-4 rounded-3xl bg-slate-900/85 border border-white/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>Cofre Local Criptografado (AES-256-GCM)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Suas senhas são embaralhadas com criptografia militar no seu computador e nunca ficam expostas em texto puro.
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                setEditingVault({
                  title: '',
                  category: 'bancos',
                  username: '',
                  password: '',
                  url: '',
                  notes: '',
                  favorite: false,
                })
              }
              className="liquid-glass-cta px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Guardar Nova Senha</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setVaultCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  vaultCategoryFilter === 'all'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Todas ({vaultItems.length})
              </button>
              {VAULT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setVaultCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    vaultCategoryFilter === cat.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar serviço ou login..."
                value={vaultSearch}
                onChange={(e) => setVaultSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Modal / Drawer Form for Creating or Editing a Password */}
          {editingVault && (
            <form
              onSubmit={handleSaveVaultItem}
              className="p-5 rounded-3xl bg-slate-900 border border-emerald-500/40 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>
                    {editingVault.id ? 'Editar Credencial' : 'Guardar Nova Senha no Cofre'}
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingVault(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Serviço / Banco / App *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Nubank, Gov.br, Gmail..."
                    value={editingVault.title || ''}
                    onChange={(e) =>
                      setEditingVault((p) => ({ ...p, title: e.target.value }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={editingVault.category || 'bancos'}
                    onChange={(e) =>
                      setEditingVault((p) => ({ ...p, category: e.target.value }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    {VAULT_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Login / E-mail / CPF
                  </label>
                  <input
                    type="text"
                    placeholder="seu@email.com ou CPF"
                    value={editingVault.username || ''}
                    onChange={(e) =>
                      setEditingVault((p) => ({ ...p, username: e.target.value }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Senha ou PIN *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Digite ou gere uma senha forte"
                      value={editingVault.password || ''}
                      onChange={(e) =>
                        setEditingVault((p) => ({ ...p, password: e.target.value }))
                      }
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={generateStrongPassword}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 flex items-center gap-1 shrink-0 transition"
                      title="Gerar senha aleatória de 18 caracteres"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Gerar Forte</span>
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Site / URL (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={editingVault.url || ''}
                    onChange={(e) =>
                      setEditingVault((p) => ({ ...p, url: e.target.value }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>Salvar</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Vault Credentials Grid */}
          {filteredVault.length === 0 ? (
            <div className="p-12 rounded-3xl bg-slate-900/60 border border-white/[0.06] text-center">
              <KeyRound className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h4 className="text-sm font-black text-white">Seu Cofre de Senhas está vazio</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Guarde senhas de bancos, corretoras, cartões e acessos importantes com criptografia AES-256 local.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVault.map((item) => {
                const isRevealed = Boolean(revealedIds[item.id]);
                const catObj =
                  VAULT_CATEGORIES.find((c) => c.id === item.category) || VAULT_CATEGORIES[5];
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-900/85 border border-white/[0.07] hover:border-white/[0.15] transition flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block">
                            {catObj.label}
                          </span>
                          <h4 className="text-sm font-black text-white mt-0.5">{item.title}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleFavoriteVault(item)}
                          className="p-1 text-slate-500 hover:text-amber-400 transition"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              item.favorite ? 'text-amber-400 fill-amber-400' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {item.username && (
                        <div className="mt-3 p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[9px] uppercase font-bold text-slate-500 block">
                              Usuário / Login
                            </span>
                            <span className="text-xs text-slate-200 truncate block">
                              {item.username}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.username, 'Login')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                            title="Copiar login"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="mt-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[9px] uppercase font-bold text-slate-500 block">
                            Senha Criptografada
                          </span>
                          <span className="text-xs font-mono text-emerald-300 truncate block">
                            {isRevealed ? item.password : '••••••••••••'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setRevealedIds((p) => ({ ...p, [item.id]: !p[item.id] }))
                            }
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                            title={isRevealed ? 'Ocultar senha' : 'Revelar senha'}
                          >
                            {isRevealed ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.password, 'Senha')}
                            className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg"
                            title="Copiar senha"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[11px]">
                      <button
                        type="button"
                        onClick={() => setEditingVault(item)}
                        className="text-slate-400 hover:text-white font-semibold"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVaultItem(item.id)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
