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
  RefreshCw,
  ShieldCheck,
  GitBranch,
  Check,
  FolderKanban,
  Lock,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  Minus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Layout,
  Share2,
  FileText,
  Sliders,
  Flame,
  Target,
  Download,
  ChevronDown,
  MoveUp,
  MoveDown,
  GripVertical,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';

export type BlockType =
  | 'text'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'todo'
  | 'bullet'
  | 'numbered'
  | 'callout'
  | 'quote'
  | 'code'
  | 'divider';

export interface NoteBlock {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  icon?: string;
  color?: string;
}

function parseContentToBlocks(raw: string): NoteBlock[] {
  if (!raw || !raw.trim()) {
    return [{ id: 'b_1', type: 'text', content: '' }];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.type) {
      return parsed;
    }
  } catch {}

  // Parse legacy plain text / markdown into structured blocks
  const lines = raw.split('\n');
  const blocks: NoteBlock[] = [];
  lines.forEach((line, idx) => {
    const id = `b_leg_${idx}_${Date.now()}`;
    if (line.startsWith('# ')) {
      blocks.push({ id, type: 'h1', content: line.slice(2) });
    } else if (line.startsWith('## ')) {
      blocks.push({ id, type: 'h2', content: line.slice(3) });
    } else if (line.startsWith('### ')) {
      blocks.push({ id, type: 'h3', content: line.slice(4) });
    } else if (line.startsWith('[ ] ') || line.startsWith('[x] ')) {
      blocks.push({ id, type: 'todo', content: line.slice(4), checked: line.startsWith('[x] ') });
    } else if (line.startsWith('• ') || line.startsWith('- ')) {
      blocks.push({ id, type: 'bullet', content: line.replace(/^[•-]\s*/, '') });
    } else if (/^\d+\.\s/.test(line)) {
      blocks.push({ id, type: 'numbered', content: line.replace(/^\d+\.\s*/, '') });
    } else if (line.startsWith('> 💡 ') || line.startsWith('> ')) {
      blocks.push({ id, type: 'callout', content: line.replace(/^>\s*(💡\s*)?/, ''), icon: '💡' });
    } else if (line.startsWith('> ')) {
      blocks.push({ id, type: 'quote', content: line.slice(2) });
    } else if (line.trim() === '---') {
      blocks.push({ id, type: 'divider', content: '' });
    } else {
      blocks.push({ id, type: 'text', content: line });
    }
  });
  return blocks.length > 0 ? blocks : [{ id: 'b_1', type: 'text', content: '' }];
}

function serializeBlocksToText(blocks: NoteBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case 'h1':
          return `# ${b.content}`;
        case 'h2':
          return `## ${b.content}`;
        case 'h3':
          return `### ${b.content}`;
        case 'todo':
          return `[${b.checked ? 'x' : ' '}] ${b.content}`;
        case 'bullet':
          return `• ${b.content}`;
        case 'numbered':
          return `1. ${b.content}`;
        case 'callout':
          return `> ${b.icon || '💡'} ${b.content}`;
        case 'quote':
          return `> ${b.content}`;
        case 'code':
          return `\`\`\`\n${b.content}\n\`\`\``;
        case 'divider':
          return `---`;
        default:
          return b.content;
      }
    })
    .join('\n');
}

const CALLOUT_EMOJIS = ['💡', '🔥', '⚠️', '📌', '🎯', '⭐', '🚀', '✅'];

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
  icon?: string;
  cover?: string;
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
  icon?: string;
  notes?: string;
}

interface MindmapBoard {
  id: string;
  title: string;
  description: string;
  nodes: MindmapNode[];
  theme?: string;
  connectorStyle?: 'curved' | 'straight' | 'elbow';
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

const NOTE_ICONS = ['📝', '💡', '🚀', '💰', '🎯', '🧠', '🔥', '⭐', '📊', '⚡', '📚', '🛠️', '✨'];

const NOTE_COVERS = [
  { id: 'cov_purple', label: 'Roxo Cyber', class: 'from-purple-900/60 via-fuchsia-900/30 to-transparent' },
  { id: 'cov_emerald', label: 'Esmeralda', class: 'from-emerald-900/60 via-teal-900/30 to-transparent' },
  { id: 'cov_cyan', label: 'Oceano', class: 'from-cyan-900/60 via-blue-900/30 to-transparent' },
  { id: 'cov_amber', label: 'Pôr do Sol', class: 'from-amber-900/60 via-orange-900/30 to-transparent' },
  { id: 'cov_rose', label: 'Rosa Neon', class: 'from-rose-900/60 via-pink-900/30 to-transparent' },
];

const VAULT_CATEGORIES = [
  { id: 'bancos', label: '🏦 Bancos & Corretoras', color: '#10b981' },
  { id: 'cartoes', label: '💳 Cartões & Apps', color: '#8b5cf6' },
  { id: 'redes_sociais', label: '🌐 Redes Sociais', color: '#38bdf8' },
  { id: 'trabalho', label: '💼 Trabalho', color: '#f59e0b' },
  { id: 'email', label: '📧 E-mails & Contas', color: '#ec4899' },
  { id: 'outros', label: '🔐 Outros', color: '#94a3b8' },
];

const NODE_COLORS = ['#a855f7', '#10b981', '#38bdf8', '#f59e0b', '#ec4899', '#ef4444', '#6366f1', '#14b8a6'];
const NODE_ICONS = ['', '⭐', '🔥', '✅', '💡', '🎯', '📌', '⚡'];

export const ToolsView: React.FC = () => {
  const { currentView, setCurrentView, showToast, refreshGame } = useFinancial();

  const activeTool: 'notes' | 'mindmap' | 'vault' =
    currentView === 'tools_mindmap'
      ? 'mindmap'
      : currentView === 'tools_vault'
      ? 'vault'
      : 'notes';

  // =========================================================
  // 1. ANOTAÇÕES ESTILO NOTION
  // =========================================================
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [noteSearch, setNoteSearch] = useState('');
  const [noteCategoryFilter, setNoteCategoryFilter] = useState<string>('all');
  const [newCheckItemText, setNewCheckItemText] = useState('');

  // =========================================================
  // 2. MAPA MENTAL ESTILO MINDMASTER
  // =========================================================
  const [mindmaps, setMindmaps] = useState<MindmapBoard[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('root');
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [newMapTitle, setNewMapTitle] = useState('');
  const [zoom, setZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [connectorStyle, setConnectorStyle] = useState<'curved' | 'straight' | 'elbow'>('curved');
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // =========================================================
  // 3. COFRE DE SENHAS CRIPTOGRAFADO
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

  // --- NOTION-STYLE NOTES HANDLERS ---
  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;

  const handleCreateNote = async () => {
    if (!window.electronAPI?.createNote) return;
    const created = await window.electronAPI.createNote({
      title: 'Sem Título',
      content: JSON.stringify([{ id: `b_${Date.now()}_1`, type: 'text', content: '' }]),
      category: noteCategoryFilter !== 'all' ? noteCategoryFilter : 'ideias',
      color: '#a855f7',
      icon: '💡',
      cover: NOTE_COVERS[0].class,
      pinned: false,
      checklist: [],
    });
    const updated = await window.electronAPI.getNotes();
    setNotes(updated);
    if (created?.id) setSelectedNoteId(created.id);
    await refreshGame();
    showToast('Nova página criada no Segundo Cérebro!', 'success');
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

  const currentBlocks: NoteBlock[] = selectedNote
    ? parseContentToBlocks(selectedNote.content)
    : [];

  const handleUpdateBlocks = (nextBlocks: NoteBlock[]) => {
    if (!selectedNote) return;
    handleUpdateNote(selectedNote.id, { content: JSON.stringify(nextBlocks) });
  };

  const handleBlockChange = (blockId: string, patch: Partial<NoteBlock>) => {
    const next = currentBlocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b));
    handleUpdateBlocks(next);
  };

  const handleAddBlockBelow = (afterId?: string, type: BlockType = 'text') => {
    const newBlock: NoteBlock = {
      id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      type,
      content: '',
      checked: false,
      icon: type === 'callout' ? '💡' : undefined,
    };
    if (!afterId) {
      handleUpdateBlocks([...currentBlocks, newBlock]);
      return newBlock.id;
    }
    const idx = currentBlocks.findIndex((b) => b.id === afterId);
    if (idx === -1) {
      handleUpdateBlocks([...currentBlocks, newBlock]);
    } else {
      const next = [...currentBlocks];
      next.splice(idx + 1, 0, newBlock);
      handleUpdateBlocks(next);
    }
    return newBlock.id;
  };

  const handleRemoveBlock = (blockId: string) => {
    if (currentBlocks.length <= 1) {
      handleBlockChange(blockId, { content: '', type: 'text' });
      return;
    }
    const next = currentBlocks.filter((b) => b.id !== blockId);
    handleUpdateBlocks(next);
  };

  const handleMoveBlock = (blockId: string, dir: 'up' | 'down') => {
    const idx = currentBlocks.findIndex((b) => b.id === blockId);
    if (idx === -1) return;
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentBlocks.length) return;
    const next = [...currentBlocks];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);
    handleUpdateBlocks(next);
  };

  const handleChangeBlockType = (blockId: string, type: BlockType) => {
    handleBlockChange(blockId, {
      type,
      icon: type === 'callout' ? '💡' : undefined,
      checked: type === 'todo' ? false : undefined,
    });
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

  // --- MINDMASTER MINDMAP HANDLERS ---
  const selectedMap = mindmaps.find((m) => m.id === selectedMapId) || null;
  const selectedNode =
    selectedMap?.nodes.find((n) => n.id === selectedNodeId) ||
    selectedMap?.nodes[0] ||
    null;

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

  const handleCreateMindmap = async () => {
    if (!window.electronAPI?.createMindmap) return;
    const title = newMapTitle.trim() || `Mapa Mental #${mindmaps.length + 1}`;
    const defaultNodes: MindmapNode[] = [
      { id: 'root', label: title, parentId: null, x: 450, y: 260, color: '#a855f7', icon: '🎯', notes: 'Tópico Central' },
      { id: 'b1', label: 'Estratégia 1', parentId: 'root', x: 200, y: 150, color: '#10b981', icon: '⭐', notes: '' },
      { id: 'b2', label: 'Estratégia 2', parentId: 'root', x: 700, y: 150, color: '#38bdf8', icon: '⚡', notes: '' },
      { id: 'b3', label: 'Próximos Passos', parentId: 'root', x: 450, y: 440, color: '#f59e0b', icon: '🔥', notes: '' },
    ];
    const created = await window.electronAPI.createMindmap({ title, nodes: defaultNodes });
    setNewMapTitle('');
    const updated = await window.electronAPI.getMindmaps();
    setMindmaps(updated);
    if (created?.id) {
      setSelectedMapId(created.id);
      setSelectedNodeId('root');
      setZoom(1);
      setPanOffset({ x: 0, y: 0 });
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

  // Subtópico (Filho) estilo MindMaster (Tab)
  const handleAddChildNode = () => {
    if (!selectedMap) return;
    const parent = selectedNode || selectedMap.nodes[0];
    if (!parent) return;

    const siblings = selectedMap.nodes.filter((n) => n.parentId === parent.id);
    const count = siblings.length;
    const isRoot = parent.parentId === null;
    let newX = parent.x + 220;
    let newY = parent.y + (count - 1) * 75;

    if (isRoot) {
      // Distribui radialmente ao redor do nó central
      const angle = (count * 60 - 30) * (Math.PI / 180);
      newX = Math.round(parent.x + Math.cos(angle) * 230);
      newY = Math.round(parent.y + Math.sin(angle) * 160);
    }

    const newNode: MindmapNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      label: 'Novo Subtópico',
      parentId: parent.id,
      x: newX,
      y: newY,
      color: NODE_COLORS[(selectedMap.nodes.length + 1) % NODE_COLORS.length],
      notes: '',
    };

    saveMapNodes(selectedMap.id, [...selectedMap.nodes, newNode]);
    setSelectedNodeId(newNode.id);
  };

  // Tópico Irmão no mesmo nível estilo MindMaster (Enter)
  const handleAddSiblingNode = () => {
    if (!selectedMap || !selectedNode) return;
    if (selectedNode.parentId === null) {
      handleAddChildNode();
      return;
    }
    const parent = selectedMap.nodes.find((n) => n.id === selectedNode.parentId);
    if (!parent) return;

    const newNode: MindmapNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      label: 'Novo Tópico',
      parentId: parent.id,
      x: selectedNode.x,
      y: selectedNode.y + 80,
      color: selectedNode.color,
      notes: '',
    };

    saveMapNodes(selectedMap.id, [...selectedMap.nodes, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const handleDeleteSelectedNode = () => {
    if (!selectedMap || !selectedNode) return;
    if (selectedNode.parentId === null) {
      showToast('O nó central não pode ser excluído.', 'info');
      return;
    }
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
    saveMapNodes(selectedMap.id, nextNodes);
    setSelectedNodeId('root');
  };

  const handleAutoLayout = () => {
    if (!selectedMap) return;
    const root = selectedMap.nodes.find((n) => n.parentId === null);
    if (!root) return;

    const rootX = 460;
    const rootY = 270;
    const children = selectedMap.nodes.filter((n) => n.parentId === root.id);
    const leftChildren = children.slice(0, Math.ceil(children.length / 2));
    const rightChildren = children.slice(Math.ceil(children.length / 2));

    const nextNodes: MindmapNode[] = selectedMap.nodes.map((n) => {
      if (n.id === root.id) return { ...n, x: rootX, y: rootY };
      return n;
    });

    const layoutBranch = (branchList: MindmapNode[], isLeft: boolean) => {
      const stepY = 110;
      const startY = rootY - ((branchList.length - 1) * stepY) / 2;
      branchList.forEach((child, idx) => {
        const cX = isLeft ? rootX - 250 : rootX + 250;
        const cY = startY + idx * stepY;
        const cNodeIdx = nextNodes.findIndex((x) => x.id === child.id);
        if (cNodeIdx !== -1) nextNodes[cNodeIdx] = { ...nextNodes[cNodeIdx], x: cX, y: cY };

        // Sub-filhos
        const subChildren = selectedMap.nodes.filter((x) => x.parentId === child.id);
        subChildren.forEach((sub, sIdx) => {
          const subX = isLeft ? cX - 220 : cX + 220;
          const subY = cY + (sIdx - (subChildren.length - 1) / 2) * 60;
          const sNodeIdx = nextNodes.findIndex((x) => x.id === sub.id);
          if (sNodeIdx !== -1) nextNodes[sNodeIdx] = { ...nextNodes[sNodeIdx], x: subX, y: subY };
        });
      });
    };

    layoutBranch(leftChildren, true);
    layoutBranch(rightChildren, false);
    saveMapNodes(selectedMap.id, nextNodes);
    showToast('Layout do mapa auto-organizado com sucesso!', 'success');
  };

  // Keyboard navigation for Mindmap
  useEffect(() => {
    if (activeTool !== 'mindmap') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 'Tab') {
        e.preventDefault();
        handleAddChildNode();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleAddSiblingNode();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelectedNode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, selectedMap, selectedNode]);

  // Pan & Drag Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }
    if (!draggingNodeId || !selectedMap || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - panOffset.x) / zoom;
    const mouseY = (e.clientY - rect.top - panOffset.y) / zoom;

    setMindmaps((prev) =>
      prev.map((m) =>
        m.id === selectedMap.id
          ? {
              ...m,
              nodes: m.nodes.map((n) =>
                n.id === draggingNodeId ? { ...n, x: Math.round(mouseX), y: Math.round(mouseY) } : n
              ),
            }
          : m
      )
    );
  };

  const handleCanvasMouseUp = async () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
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

  // --- PASSWORD VAULT HANDLERS ---
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*+-=?';
    let pass = '';
    for (let i = 0; i < 20; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setEditingVault((prev) => (prev ? { ...prev, password: pass } : prev));
    showToast('Senha forte de 20 caracteres gerada!', 'info');
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
    showToast(`${label} copiado!`, 'success');
  };

  // Filtered lists
  const filteredNotes = notes.filter((n) => {
    const matchesCat = noteCategoryFilter === 'all' || n.category === noteCategoryFilter;
    const q = noteSearch.toLowerCase().trim();
    return !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  const filteredVault = vaultItems.filter((v) => {
    const matchesCat = vaultCategoryFilter === 'all' || v.category === vaultCategoryFilter;
    const q = vaultSearch.toLowerCase().trim();
    return !q || v.title.toLowerCase().includes(q) || v.username.toLowerCase().includes(q) || v.url.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Liquid Glass Sub-Navigation */}
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
                Anotações estilo Notion, mapas mentais no padrão MindMaster e cofre de senhas criptografado localmente.
              </p>
            </div>
          </div>
        </div>

        {/* Liquid Glass Tool Switcher */}
        <div className="liquid-glass-well p-1.5 rounded-2xl flex items-center gap-1 self-start">
          {[
            { id: 'tools_notes', key: 'notes', label: 'Anotações (Notion)', icon: StickyNote, count: notes.length },
            { id: 'tools_mindmap', key: 'mindmap', label: 'Mapas Mentais (MindMaster)', icon: Network, count: mindmaps.length },
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
                  isActive ? 'liquid-glass-tab-active text-white' : 'text-slate-400 hover:text-slate-200'
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
          ABA 1: ANOTAÇÕES ESTILO NOTION
         ========================================================= */}
      {activeTool === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[620px]">
          {/* Left Column: Notion Pages Sidebar */}
          <div className="lg:col-span-4 bg-slate-900/80 border border-white/[0.07] rounded-3xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar páginas e notas..."
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
                <span>+ Página</span>
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
                Todas ({notes.length})
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
            <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
              {filteredNotes.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-4">
                  <StickyNote className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-xs font-bold text-slate-300">Nenhuma página encontrada</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Crie notas financeiras, resumos de livros, atas de reunião e planos no Notion do Pigo.
                  </p>
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const isSelected = note.id === selectedNoteId;
                  const catObj = NOTE_CATEGORIES.find((c) => c.id === note.category) || NOTE_CATEGORIES[0];
                  const doneCount = (note.checklist || []).filter((c) => c.done).length;
                  const totalCheck = (note.checklist || []).length;
                  return (
                    <button
                      key={note.id}
                      onClick={() => setSelectedNoteId(note.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-slate-800/90 border-fuchsia-500/50 shadow-lg'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm shrink-0">{note.icon || '📝'}</span>
                          <h3 className="text-xs font-extrabold text-white truncate">
                            {note.title || 'Sem título'}
                          </h3>
                        </div>
                        {note.pinned && (
                          <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400/20" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                        {note.content ? note.content.slice(0, 90) : 'Página em branco...'}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/[0.04] text-[10px] text-slate-500">
                        <span>{catObj.label}</span>
                        {totalCheck > 0 && (
                          <span className="text-emerald-400 font-bold">
                            ✓ {doneCount}/{totalCheck}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Notion-Style Full Editor & Viewer */}
          <div className="lg:col-span-8 bg-slate-900/80 border border-white/[0.07] rounded-3xl p-6 flex flex-col overflow-hidden relative">
            {!selectedNote ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/25 flex items-center justify-center text-fuchsia-400 mb-3">
                  <StickyNote className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-white">Segundo Cérebro Estilo Notion</h3>
                <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
                  Crie documentos ricos com blocos, cabeçalhos, destaques e listas de tarefas organizadas.
                </p>
                <button
                  onClick={handleCreateNote}
                  className="liquid-glass-cta px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-500 text-white text-xs font-extrabold flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Primeira Página</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-4">
                {/* Notion Cover Banner */}
                <div
                  className={`h-24 -mx-6 -mt-6 bg-gradient-to-r ${selectedNote.cover || NOTE_COVERS[0].class} p-4 flex items-end justify-between border-b border-white/[0.07]`}
                >
                  <div className="flex items-center gap-2">
                    {NOTE_COVERS.map((cov) => (
                      <button
                        key={cov.id}
                        type="button"
                        onClick={() => handleUpdateNote(selectedNote.id, { cover: cov.class })}
                        title={`Capa ${cov.label}`}
                        className={`w-4 h-4 rounded-full border border-white/40 bg-gradient-to-r ${cov.class} transition hover:scale-125`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copyToClipboard(serializeBlocksToText(currentBlocks), 'Conteúdo formatado')}
                      className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-black/60 border border-white/20 text-[11px] font-bold text-slate-200 flex items-center gap-1 backdrop-blur-md transition"
                      title="Copiar texto formatado"
                    >
                      <Copy className="w-3.5 h-3.5 text-fuchsia-300" />
                      <span>Copiar</span>
                    </button>
                    <button
                      onClick={() => handleUpdateNote(selectedNote.id, { pinned: !selectedNote.pinned })}
                      className={`p-1 rounded-lg border backdrop-blur-md ${
                        selectedNote.pinned
                          ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                          : 'bg-black/40 border-white/20 text-slate-300'
                      }`}
                      title="Fixar no topo"
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(selectedNote.id)}
                      className="p-1 rounded-lg bg-black/40 hover:bg-rose-500/20 border border-white/20 text-slate-400 hover:text-rose-300 backdrop-blur-md"
                      title="Excluir página"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Notion Title & Emoji Picker */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="relative group">
                    <button
                      type="button"
                      className="text-3xl p-1.5 rounded-xl hover:bg-white/10 transition"
                      title="Alterar emoji da página"
                    >
                      {selectedNote.icon || '📝'}
                    </button>
                    <div className="absolute left-0 top-full mt-1 z-30 hidden group-hover:flex bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-2xl gap-1">
                      {NOTE_ICONS.map((ico) => (
                        <button
                          key={ico}
                          type="button"
                          onClick={() => handleUpdateNote(selectedNote.id, { icon: ico })}
                          className="text-lg hover:scale-125 p-1 transition"
                        >
                          {ico}
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={selectedNote.title}
                    onChange={(e) => handleUpdateNote(selectedNote.id, { title: e.target.value })}
                    placeholder="Sem título..."
                    className="flex-1 bg-transparent text-2xl font-black text-white focus:outline-none"
                  />

                  <select
                    value={selectedNote.category}
                    onChange={(e) => handleUpdateNote(selectedNote.id, { category: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                  >
                    {NOTE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Visual Block Editor (Estilo Notion WYSIWYG) */}
                <div className="w-full flex-1 min-h-[360px] max-h-[460px] bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 overflow-y-auto space-y-2.5 custom-scrollbar">
                  {currentBlocks.map((block, idx) => (
                    <div
                      key={block.id}
                      className="group relative flex items-start gap-2 p-1.5 rounded-xl hover:bg-slate-900/60 transition border border-transparent hover:border-slate-800/80"
                    >
                      {/* Left Block Controls (Hover) */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 pt-1 transition select-none">
                        <select
                          value={block.type}
                          onChange={(e) => handleChangeBlockType(block.id, e.target.value as BlockType)}
                          className="text-[10px] bg-slate-900 border border-slate-700 text-slate-300 rounded px-1 py-0.5 focus:outline-none cursor-pointer"
                          title="Alterar tipo de bloco"
                        >
                          <option value="text">Texto</option>
                          <option value="h1">Título 1</option>
                          <option value="h2">Título 2</option>
                          <option value="h3">Título 3</option>
                          <option value="todo">To-Do</option>
                          <option value="bullet">Marcador</option>
                          <option value="numbered">Numerada</option>
                          <option value="callout">Destaque</option>
                          <option value="quote">Citação</option>
                          <option value="code">Código</option>
                          <option value="divider">Divisor</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleMoveBlock(block.id, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-500 hover:text-slate-200 disabled:opacity-20 transition"
                          title="Mover acima"
                        >
                          <MoveUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveBlock(block.id, 'down')}
                          disabled={idx === currentBlocks.length - 1}
                          className="p-1 text-slate-500 hover:text-slate-200 disabled:opacity-20 transition"
                          title="Mover abaixo"
                        >
                          <MoveDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveBlock(block.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition"
                          title="Excluir bloco"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Visual Block Content */}
                      <div className="flex-1 min-w-0">
                        {block.type === 'h1' && (
                          <input
                            type="text"
                            value={block.content}
                            onChange={(e) => handleBlockChange(block.id, { content: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddBlockBelow(block.id, 'text');
                              } else if (e.key === 'Backspace' && block.content === '' && currentBlocks.length > 1) {
                                e.preventDefault();
                                handleRemoveBlock(block.id);
                              }
                            }}
                            placeholder="Título Grande (H1)..."
                            className="w-full bg-transparent text-xl font-black text-white focus:outline-none placeholder-slate-600 pb-1 border-b border-white/10"
                          />
                        )}

                        {block.type === 'h2' && (
                          <input
                            type="text"
                            value={block.content}
                            onChange={(e) => handleBlockChange(block.id, { content: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddBlockBelow(block.id, 'text');
                              } else if (e.key === 'Backspace' && block.content === '' && currentBlocks.length > 1) {
                                e.preventDefault();
                                handleRemoveBlock(block.id);
                              }
                            }}
                            placeholder="Subtítulo (H2)..."
                            className="w-full bg-transparent text-base font-extrabold text-fuchsia-300 focus:outline-none placeholder-fuchsia-400/40"
                          />
                        )}

                        {block.type === 'h3' && (
                          <input
                            type="text"
                            value={block.content}
                            onChange={(e) => handleBlockChange(block.id, { content: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddBlockBelow(block.id, 'text');
                              } else if (e.key === 'Backspace' && block.content === '' && currentBlocks.length > 1) {
                                e.preventDefault();
                                handleRemoveBlock(block.id);
                              }
                            }}
                            placeholder="Seção (H3)..."
                            className="w-full bg-transparent text-sm font-bold text-cyan-300 focus:outline-none placeholder-cyan-400/40"
                          />
                        )}

                        {block.type === 'todo' && (
                          <div className="flex items-center gap-2.5 w-full">
                            <button
                              type="button"
                              onClick={() => handleBlockChange(block.id, { checked: !block.checked })}
                              className="shrink-0 text-slate-400 hover:text-emerald-400 transition"
                            >
                              {block.checked ? (
                                <CheckSquare className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-500 hover:text-slate-300" />
                              )}
                            </button>
                            <input
                              type="text"
                              value={block.content}
                              onChange={(e) => handleBlockChange(block.id, { content: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddBlockBelow(block.id, 'todo');
                                } else if (e.key === 'Backspace' && block.content === '' && currentBlocks.length > 1) {
                                  e.preventDefault();
                                  handleRemoveBlock(block.id);
                                }
                              }}
                              placeholder="Item de tarefa To-Do..."
                              className={`w-full bg-transparent text-xs focus:outline-none transition ${
                                block.checked ? 'line-through text-slate-500' : 'text-slate-200'
                              }`}
                            />
                          </div>
                        )}

                        {block.type === 'bullet' && (
                          <div className="flex items-center gap-2.5 w-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 ml-1" />
                            <input
                              type="text"
                              value={block.content}
                              onChange={(e) => handleBlockChange(block.id, { content: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddBlockBelow(block.id, 'bullet');
                                } else if (e.key === 'Backspace' && block.content === '' && currentBlocks.length > 1) {
                                  e.preventDefault();
                                  handleRemoveBlock(block.id);
                                }
                              }}
                              placeholder="Item de lista com marcador..."
                              className="w-full bg-transparent text-xs text-slate-200 focus:outline-none placeholder-slate-600"
                            />
                          </div>
                        )}

                        {block.type === 'numbered' && (
                          <div className="flex items-center gap-2.5 w-full">
                            <span className="text-[11px] font-bold text-pink-400 shrink-0 w-4 text-right font-mono">
                              {idx + 1}.
                            </span>
                            <input
                              type="text"
                              value={block.content}
                              onChange={(e) => handleBlockChange(block.id, { content: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddBlockBelow(block.id, 'numbered');
                                } else if (e.key === 'Backspace' && block.content === '' && currentBlocks.length > 1) {
                                  e.preventDefault();
                                  handleRemoveBlock(block.id);
                                }
                              }}
                              placeholder="Item de lista numerada..."
                              className="w-full bg-transparent text-xs text-slate-200 focus:outline-none placeholder-slate-600"
                            />
                          </div>
                        )}

                        {block.type === 'callout' && (
                          <div className="flex items-start gap-3 w-full p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                            <button
                              type="button"
                              onClick={() => {
                                const nextEmoji = CALLOUT_EMOJIS[(CALLOUT_EMOJIS.indexOf(block.icon || '💡') + 1) % CALLOUT_EMOJIS.length];
                                handleBlockChange(block.id, { icon: nextEmoji });
                              }}
                              className="text-base shrink-0 select-none hover:scale-125 transition"
                              title="Clique para alternar o ícone"
                            >
                              {block.icon || '💡'}
                            </button>
                            <textarea
                              value={block.content}
                              onChange={(e) => {
                                handleBlockChange(block.id, { content: e.target.value });
                                e.target.style.height = 'auto';
                                e.target.style.height = `${e.target.scrollHeight}px`;
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAddBlockBelow(block.id, 'text');
                                } else if (e.key === 'Backspace' && block.content === '' && currentBlocks.length > 1) {
                                  e.preventDefault();
                                  handleRemoveBlock(block.id);
                                }
                              }}
                              placeholder="Destaque ou insight importante..."
                              rows={1}
                              className="w-full bg-transparent text-amber-100 text-xs focus:outline-none resize-none overflow-hidden placeholder-amber-200/40 leading-relaxed"
                            />
                          </div>
                        )}

                        {block.type === 'quote' && (
                          <div className="flex items-start gap-3 w-full pl-3 border-l-2 border-fuchsia-500/80 my-0.5">
                            <textarea
                              value={block.content}
                              onChange={(e) => {
                                handleBlockChange(block.id, { content: e.target.value });
                                e.target.style.height = 'auto';
                                e.target.style.height = `${e.target.scrollHeight}px`;
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAddBlockBelow(block.id, 'text');
                                } else if (e.key === 'Backspace' && block.content === '' && currentBlocks.length > 1) {
                                  e.preventDefault();
                                  handleRemoveBlock(block.id);
                                }
                              }}
                              placeholder="Citação ou reflexão inspiradora..."
                              rows={1}
                              className="w-full bg-transparent italic text-slate-300 text-xs focus:outline-none resize-none overflow-hidden placeholder-slate-600 leading-relaxed"
                            />
                          </div>
                        )}

                        {block.type === 'code' && (
                          <div className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 pb-1.5 border-b border-slate-800/80 mb-1.5">
                              <span className="flex items-center gap-1.5"><Code className="w-3 h-3 text-cyan-400" /> Bloco de Código</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(block.content, 'Código')}
                                className="hover:text-white transition"
                              >
                                Copiar
                              </button>
                            </div>
                            <textarea
                              value={block.content}
                              onChange={(e) => {
                                handleBlockChange(block.id, { content: e.target.value });
                                e.target.style.height = 'auto';
                                e.target.style.height = `${e.target.scrollHeight}px`;
                              }}
                              placeholder="// Digite ou cole seu código ou script..."
                              rows={2}
                              className="w-full bg-transparent text-cyan-200 font-mono text-xs focus:outline-none resize-none placeholder-slate-600"
                            />
                          </div>
                        )}

                        {block.type === 'divider' && (
                          <div className="w-full py-2">
                            <hr className="border-t border-slate-800" />
                          </div>
                        )}

                        {block.type === 'text' && (
                          <textarea
                            value={block.content}
                            onChange={(e) => {
                              handleBlockChange(block.id, { content: e.target.value });
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddBlockBelow(block.id, 'text');
                              } else if (e.key === 'Backspace' && block.content === '' && currentBlocks.length > 1) {
                                e.preventDefault();
                                handleRemoveBlock(block.id);
                              }
                            }}
                            placeholder="Digite algo ou aperte Enter para nova linha..."
                            rows={1}
                            className="w-full bg-transparent text-slate-100 text-xs leading-relaxed focus:outline-none resize-none overflow-hidden placeholder-slate-600/70"
                          />
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Quick Add Block Bar */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Adicionar:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddBlockBelow(undefined, 'text')}
                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition"
                    >
                      <span>¶</span> <span>Texto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlockBelow(undefined, 'h1')}
                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition"
                    >
                      <Heading1 className="w-3 h-3 text-fuchsia-400" /> <span>H1</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlockBelow(undefined, 'h2')}
                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition"
                    >
                      <Heading2 className="w-3 h-3 text-purple-400" /> <span>H2</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlockBelow(undefined, 'h3')}
                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition"
                    >
                      <Heading3 className="w-3 h-3 text-cyan-400" /> <span>H3</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlockBelow(undefined, 'todo')}
                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition"
                    >
                      <CheckSquare className="w-3 h-3 text-emerald-400" /> <span>To-Do</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlockBelow(undefined, 'bullet')}
                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition"
                    >
                      <List className="w-3 h-3 text-amber-400" /> <span>Marcador</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlockBelow(undefined, 'numbered')}
                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition"
                    >
                      <ListOrdered className="w-3 h-3 text-pink-400" /> <span>Numerada</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlockBelow(undefined, 'callout')}
                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" /> <span>Destaque</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlockBelow(undefined, 'quote')}
                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition"
                    >
                      <Quote className="w-3 h-3 text-slate-400" /> <span>Citação</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlockBelow(undefined, 'code')}
                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition"
                    >
                      <Code className="w-3 h-3 text-cyan-300" /> <span>Código</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlockBelow(undefined, 'divider')}
                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition"
                    >
                      <Minus className="w-3 h-3 text-slate-500" /> <span>Divisor</span>
                    </button>
                  </div>
                </div>

                {/* Interactive Notion Checklist Footer */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-fuchsia-400" />
                      <span>Tarefas Rápidas da Página</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {(selectedNote.checklist || []).filter((i) => i.done).length}/
                      {(selectedNote.checklist || []).length} concluídas
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Adicionar tarefa e pressionar Enter..."
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
                    <div className="flex flex-wrap gap-2 pt-1 max-h-32 overflow-y-auto custom-scrollbar">
                      {(selectedNote.checklist || []).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleChecklistItem(item.id)}
                            className="flex items-center gap-1.5 text-left"
                          >
                            {item.done ? (
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            )}
                            <span className={item.done ? 'line-through text-slate-500' : 'text-slate-200'}>
                              {item.text}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveChecklistItem(item.id)}
                            className="text-slate-500 hover:text-rose-400 ml-1"
                          >
                            <Trash2 className="w-3 h-3" />
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
          ABA 2: MAPA MENTAL ESTILO MINDMASTER / XMIND
         ========================================================= */}
      {activeTool === 'mindmap' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Panel: Boards & Inspector */}
          <div className="lg:col-span-4 space-y-4">
            {/* Mindmaps List */}
            <div className="bg-slate-900/80 border border-white/[0.07] rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Quadros de Mapas Mentais
                </h3>
                <span className="text-[10px] text-fuchsia-300 font-bold bg-fuchsia-500/10 px-2 py-0.5 rounded-md border border-fuchsia-500/25">
                  MindMaster
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nome do novo mapa..."
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
                  className="liquid-glass-cta px-3.5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-500 text-white text-xs font-extrabold flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Criar</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                {mindmaps.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedMapId(m.id);
                      setSelectedNodeId('root');
                      setZoom(1);
                      setPanOffset({ x: 0, y: 0 });
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      m.id === selectedMapId
                        ? 'bg-fuchsia-500/15 border-fuchsia-500/40 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{m.title}</p>
                      <span className="text-[10px] text-slate-400">{m.nodes.length} tópicos</span>
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

            {/* MindMaster Inspector for the Selected Node */}
            {selectedMap && selectedNode && (
              <div className="bg-slate-900/80 border border-white/[0.07] rounded-3xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-fuchsia-400" />
                    <span>Propriedades do Tópico</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {selectedNode.parentId === null ? 'Tópico Central' : 'Subtópico'}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Texto do Tópico:</label>
                  <input
                    type="text"
                    value={selectedNode.label}
                    onChange={(e) => {
                      const nextNodes = selectedMap.nodes.map((n) =>
                        n.id === selectedNode.id ? { ...n, label: e.target.value } : n
                      );
                      saveMapNodes(selectedMap.id, nextNodes);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-fuchsia-400 font-bold"
                  />
                </div>

                {/* Icon Marker / Badge */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Ícone / Marcador:</label>
                  <div className="flex items-center gap-1.5">
                    {NODE_ICONS.map((ico, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const nextNodes = selectedMap.nodes.map((n) =>
                            n.id === selectedNode.id ? { ...n, icon: ico } : n
                          );
                          saveMapNodes(selectedMap.id, nextNodes);
                        }}
                        className={`w-7 h-7 rounded-lg border text-sm flex items-center justify-center transition ${
                          selectedNode.icon === ico
                            ? 'bg-fuchsia-500/20 border-fuchsia-400 text-white'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {ico || '∅'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Node Color Swatches */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Cor do Ramo:</label>
                  <div className="flex items-center gap-2">
                    {NODE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          const nextNodes = selectedMap.nodes.map((n) =>
                            n.id === selectedNode.id ? { ...n, color: c } : n
                          );
                          saveMapNodes(selectedMap.id, nextNodes);
                        }}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          selectedNode.color === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Node Notes */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Notas / Detalhes Adicionais:</label>
                  <textarea
                    rows={2}
                    value={selectedNode.notes || ''}
                    onChange={(e) => {
                      const nextNodes = selectedMap.nodes.map((n) =>
                        n.id === selectedNode.id ? { ...n, notes: e.target.value } : n
                      );
                      saveMapNodes(selectedMap.id, nextNodes);
                    }}
                    placeholder="Adicione notas rápidas sobre esta ideia..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none resize-none"
                  />
                </div>

                {/* Fast Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAddChildNode}
                    className="py-2 px-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Filho (Tab)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSiblingNode}
                    className="py-2 px-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>Irmão (Enter)</span>
                  </button>
                </div>

                {selectedNode.parentId !== null && (
                  <button
                    type="button"
                    onClick={handleDeleteSelectedNode}
                    className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition mt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Tópico (Del)</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Panel: Interactive MindMaster Infinite Canvas */}
          <div className="lg:col-span-8 bg-slate-900/80 border border-white/[0.07] rounded-3xl p-4 flex flex-col">
            {!selectedMap ? (
              <div className="h-[560px] flex flex-col items-center justify-center text-center p-6">
                <Network className="w-12 h-12 text-fuchsia-400 mb-3" />
                <h3 className="text-base font-black text-white">Criador de Mapas Mentais (MindMaster)</h3>
                <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
                  Planeje projetos, estratégias financeiras e estudos com navegação por teclado (Tab e Enter), zoom e conexões visuais.
                </p>
                <button
                  onClick={handleCreateMindmap}
                  className="liquid-glass-cta px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-500 text-white text-xs font-extrabold flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Primeiro Mapa Mental</span>
                </button>
              </div>
            ) : (
              <>
                {/* MindMaster Toolbar: Zoom, Style & Auto-Layout */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">{selectedMap.title}</h3>
                    <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                      {Math.round(zoom * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Connector Style Switcher */}
                    <div className="flex items-center rounded-xl bg-slate-950 p-0.5 border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setConnectorStyle('curved')}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg transition ${
                          connectorStyle === 'curved' ? 'bg-fuchsia-500 text-white' : 'text-slate-400'
                        }`}
                        title="Conexões Curvas"
                      >
                        Curva
                      </button>
                      <button
                        type="button"
                        onClick={() => setConnectorStyle('elbow')}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg transition ${
                          connectorStyle === 'elbow' ? 'bg-fuchsia-500 text-white' : 'text-slate-400'
                        }`}
                        title="Conexões Angulares"
                      >
                        Angular
                      </button>
                      <button
                        type="button"
                        onClick={() => setConnectorStyle('straight')}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg transition ${
                          connectorStyle === 'straight' ? 'bg-fuchsia-500 text-white' : 'text-slate-400'
                        }`}
                        title="Conexões Retas"
                      >
                        Reta
                      </button>
                    </div>

                    {/* Auto Layout */}
                    <button
                      type="button"
                      onClick={handleAutoLayout}
                      title="Organizar layout automaticamente"
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 transition"
                    >
                      <Layout className="w-3.5 h-3.5 text-cyan-300" />
                      <span className="hidden sm:inline">Auto-Organizar</span>
                    </button>

                    {/* Zoom Buttons */}
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Aproximar (+)"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Afastar (-)"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setZoom(1);
                        setPanOffset({ x: 0, y: 0 });
                      }}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Resetar Zoom e Centralizar"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Canvas Container */}
                <div
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  className={`relative w-full h-[520px] rounded-2xl bg-[#0a0a0c] border border-white/[0.06] overflow-hidden select-none ${
                    isPanning ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                  style={{
                    backgroundImage:
                      'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                >
                  <div
                    style={{
                      transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                      transformOrigin: '0 0',
                      width: '100%',
                      height: '100%',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  >
                    {/* SVG Connector Lines */}
                    <svg className="absolute inset-0 w-[2000px] h-[2000px] pointer-events-none">
                      {selectedMap.nodes.map((node) => {
                        if (!node.parentId) return null;
                        const parent = selectedMap.nodes.find((p) => p.id === node.parentId);
                        if (!parent) return null;

                        let pathData = '';
                        if (connectorStyle === 'straight') {
                          pathData = `M ${parent.x} ${parent.y} L ${node.x} ${node.y}`;
                        } else if (connectorStyle === 'elbow') {
                          const midX = (parent.x + node.x) / 2;
                          pathData = `M ${parent.x} ${parent.y} L ${midX} ${parent.y} L ${midX} ${node.y} L ${node.x} ${node.y}`;
                        } else {
                          // Curved Bézier
                          const midX = (parent.x + node.x) / 2;
                          pathData = `M ${parent.x} ${parent.y} C ${midX} ${parent.y}, ${midX} ${node.y}, ${node.x} ${node.y}`;
                        }

                        return (
                          <path
                            key={`edge_${parent.id}_${node.id}`}
                            d={pathData}
                            stroke={node.color || '#a855f7'}
                            strokeWidth={3}
                            strokeOpacity={0.65}
                            fill="none"
                            strokeLinecap="round"
                          />
                        );
                      })}
                    </svg>

                    {/* Interactive Nodes */}
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
                            borderColor: isSelected ? '#ffffff' : `${node.color}90`,
                            boxShadow: isSelected
                              ? `0 0 26px -2px ${node.color}`
                              : '0 8px 22px -4px rgba(0,0,0,0.65)',
                          }}
                          className={`absolute px-4 py-2.5 rounded-2xl cursor-grab active:cursor-grabbing border-2 transition-shadow select-none ${
                            isRoot
                              ? 'bg-slate-900 font-black text-sm text-white ring-2 ring-fuchsia-500/50'
                              : 'bg-slate-900/95 font-bold text-xs text-slate-100 hover:scale-[1.02]'
                          }`}
                        >
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            {node.icon && <span className="text-sm">{node.icon}</span>}
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
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 px-1">
                  <span>💡 Atalhos MindMaster: <strong>Tab</strong> (novo filho) • <strong>Enter</strong> (novo irmão) • <strong>Del</strong> (excluir)</span>
                  <span>Arraste o fundo para mover a tela</span>
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

          {/* Modal / Form for Creating or Editing a Password */}
          {editingVault && (
            <form
              onSubmit={handleSaveVaultItem}
              className="p-5 rounded-3xl bg-slate-900 border border-emerald-500/40 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>{editingVault.id ? 'Editar Credencial' : 'Guardar Nova Senha no Cofre'}</span>
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
                    onChange={(e) => setEditingVault((p) => ({ ...p, title: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Categoria</label>
                  <select
                    value={editingVault.category || 'bancos'}
                    onChange={(e) => setEditingVault((p) => ({ ...p, category: e.target.value }))}
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
                    onChange={(e) => setEditingVault((p) => ({ ...p, username: e.target.value }))}
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
                      onChange={(e) => setEditingVault((p) => ({ ...p, password: e.target.value }))}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={generateStrongPassword}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 flex items-center gap-1 shrink-0 transition"
                      title="Gerar senha aleatória de 20 caracteres"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Gerar Forte</span>
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Site / URL (Opcional)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={editingVault.url || ''}
                    onChange={(e) => setEditingVault((p) => ({ ...p, url: e.target.value }))}
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
                const catObj = VAULT_CATEGORIES.find((c) => c.id === item.category) || VAULT_CATEGORIES[5];
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-900/85 border border-white/[0.07] hover:border-white/[0.15] transition flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block">{catObj.label}</span>
                          <h4 className="text-sm font-black text-white mt-0.5">{item.title}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleFavoriteVault(item)}
                          className="p-1 text-slate-500 hover:text-amber-400 transition"
                        >
                          <Star className={`w-4 h-4 ${item.favorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                        </button>
                      </div>

                      {item.username && (
                        <div className="mt-3 p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[9px] uppercase font-bold text-slate-500 block">
                              Usuário / Login
                            </span>
                            <span className="text-xs text-slate-200 truncate block">{item.username}</span>
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
                            onClick={() => setRevealedIds((p) => ({ ...p, [item.id]: !p[item.id] }))}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                            title={isRevealed ? 'Ocultar senha' : 'Revelar senha'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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
