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
  Timer,
  ThumbsUp,
  Undo2,
  Redo2,
  Cloud,
  Type,
  Play,
  Pause,
  HelpCircle,
  Layers,
  PenTool,
  ArrowRight,
  ChevronUp,
  Smile,
  Rocket,
  Menu,
  ListTree,
  Folder,
  FolderPlus,
  FolderOpen,
  ArrowLeft,
  Octagon,
  Diamond,
  Circle,
  Hexagon,
  Link2,
  Unlink,
  MousePointer,
  Edit2,
  X,
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

export type LucidShapeType = 'cloud' | 'capsule' | 'octagon' | 'diamond' | 'sticky' | 'rectangle';

export interface NodeConnection {
  targetId: string;
  label?: string;
}

export interface MindmapNode {
  id: string;
  label: string;
  parentId?: string | null;
  connections?: NodeConnection[];
  x: number;
  y: number;
  color: string;
  icon?: string;
  notes?: string;
  shape?: LucidShapeType;
  lineLabel?: string;
}

export interface BoardEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  color?: string;
}

export function getBoardEdges(nodes: MindmapNode[]): BoardEdge[] {
  const edges: BoardEdge[] = [];
  if (!Array.isArray(nodes)) return edges;
  const edgeSet = new Set<string>();

  nodes.forEach((node) => {
    // 1. Conexões livres M:N explícitas
    if (node.connections && Array.isArray(node.connections)) {
      node.connections.forEach((conn, idx) => {
        const key = `${node.id}->${conn.targetId}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push({
            id: `edge_${node.id}_${conn.targetId}_${idx}`,
            sourceId: node.id,
            targetId: conn.targetId,
            label: conn.label || '',
            color: node.color,
          });
        }
      });
    }

    // 2. Conexões herdadas via parentId (retrocompatibilidade)
    if (node.parentId) {
      const key = `${node.parentId}->${node.id}`;
      const revKey = `${node.id}->${node.parentId}`;
      if (!edgeSet.has(key) && !edgeSet.has(revKey)) {
        edgeSet.add(key);
        edges.push({
          id: `edge_leg_${node.parentId}_${node.id}`,
          sourceId: node.parentId,
          targetId: node.id,
          label: node.lineLabel || '',
          color: node.color,
        });
      }
    }
  });

  return edges;
}

export const LUCID_FAN_PALETTES = [
  {
    name: 'Purples & Pinks',
    colors: ['#5b21b6', '#7c3aed', '#8b5cf6', '#a855f7', '#c084fc', '#d946ef', '#f472b6', '#fbcfe8'],
  },
  {
    name: 'Reds & Yellows',
    colors: ['#b91c1c', '#dc2626', '#ea580c', '#f97316', '#fb923c', '#f59e0b', '#facc15', '#fef08a'],
  },
  {
    name: 'Teals & Blues',
    colors: ['#047857', '#10b981', '#14b8a6', '#06b6d4', '#0284c7', '#2563eb', '#3b82f6', '#93c5fa'],
  },
  {
    name: 'Earth & Grays',
    colors: ['#57534e', '#78716c', '#a8a29e', '#1e293b', '#334155', '#64748b', '#94a3b8', '#f8fafc'],
  },
];

export const LUCID_SHAPES: { type: LucidShapeType; label: string; desc: string }[] = [
  { type: 'cloud', label: 'Nuvem', desc: 'Ideia central e pensamentos' },
  { type: 'capsule', label: 'Cápsula', desc: 'Conceito e objetivos' },
  { type: 'octagon', label: 'Octógono', desc: 'Questão crítica ou parada' },
  { type: 'diamond', label: 'Losango', desc: 'Decisão ou dilema' },
  { type: 'sticky', label: 'Post-it', desc: 'Nota rápida adesiva' },
  { type: 'rectangle', label: 'Cartão', desc: 'Bloco estruturado' },
];

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
  { id: 'ideias', label: 'Ideias', color: '#a855f7' },
  { id: 'financas', label: 'Finanças', color: '#10b981' },
  { id: 'projetos', label: 'Projetos', color: '#38bdf8' },
  { id: 'estudos', label: 'Estudos', color: '#f59e0b' },
  { id: 'pessoal', label: 'Pessoal', color: '#ec4899' },
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
  { id: 'bancos', label: 'Bancos e Corretoras', color: '#10b981' },
  { id: 'cartoes', label: 'Cartões e Aplicativos', color: '#8b5cf6' },
  { id: 'redes_sociais', label: 'Redes Sociais', color: '#38bdf8' },
  { id: 'trabalho', label: 'Trabalho e Negócios', color: '#f59e0b' },
  { id: 'email', label: 'E-mails e Acessos', color: '#ec4899' },
  { id: 'outros', label: 'Outros Registros', color: '#94a3b8' },
];

const NODE_COLORS = ['#a855f7', '#10b981', '#38bdf8', '#f59e0b', '#ec4899', '#ef4444', '#6366f1', '#14b8a6'];

const ToolsViewInner: React.FC = () => {
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
  // 2. QUADRO VISUAL INTERATIVO ESTILO LUCIDSPARK
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

  // Estados de navegação por pastas e documentos (Hub inicial estilo Lucidspark)
  const [lucidViewMode, setLucidViewMode] = useState<'folders' | 'canvas'>('folders');
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [folders, setFolders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pigo_lucid_folders');
      return saved ? JSON.parse(saved) : ['Geral', 'Estratégia', 'Finanças', 'Projetos', 'Estudos'];
    } catch {
      return ['Geral', 'Estratégia', 'Finanças', 'Projetos', 'Estudos'];
    }
  });
  const [folderSearch, setFolderSearch] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [newFolderModalOpen, setNewFolderModalOpen] = useState<boolean>(false);

  // Estados de conexões livres entre nós
  const [connectingFromNodeId, setConnectingFromNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Estados específicos estilo Lucidspark
  const [lucidStickyDrawerOpen, setLucidStickyDrawerOpen] = useState(false);
  const [lucidShapesMenuOpen, setLucidShapesMenuOpen] = useState(false);
  const [lucidActiveColor, setLucidActiveColor] = useState<string>('#6366f1');
  const [lucidStickyInput, setLucidStickyInput] = useState<string>('');
  const [lucidBatchInput, setLucidBatchInput] = useState<string>('');
  const [lucidBatchModalOpen, setLucidBatchModalOpen] = useState<boolean>(false);
  const [lucidOutlineOpen, setLucidOutlineOpen] = useState<boolean>(false);
  const [lucidTimerOpen, setLucidTimerOpen] = useState<boolean>(false);
  const [lucidTimerSeconds, setLucidTimerSeconds] = useState<number>(300); // 5 min
  const [lucidTimerActive, setLucidTimerActive] = useState<boolean>(false);

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

  // Timer countdown do Lucidspark
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (lucidTimerActive && lucidTimerSeconds > 0) {
      interval = setInterval(() => {
        setLucidTimerSeconds((s) => {
          if (s <= 1) {
            setLucidTimerActive(false);
            showToast('⏱️ O tempo do Brainstorming no Lucidspark terminou!', 'info');
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lucidTimerActive, lucidTimerSeconds, showToast]);

  // Gestão de Pastas estilo Lucidspark
  const handleCreateFolder = () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    if (folders.includes(trimmed)) {
      showToast('Esta pasta já existe.', 'info');
      return;
    }
    const next = [...folders, trimmed];
    setFolders(next);
    localStorage.setItem('pigo_lucid_folders', JSON.stringify(next));
    setActiveFolder(trimmed);
    setNewFolderName('');
    setNewFolderModalOpen(false);
    showToast(`Pasta "${trimmed}" criada!`, 'success');
  };

  const handleDeleteFolder = (folderName: string) => {
    if (folderName === 'Geral') {
      showToast('A pasta Geral é o repositório padrão e não pode ser removida.', 'info');
      return;
    }
    const next = folders.filter((f) => f !== folderName);
    setFolders(next);
    localStorage.setItem('pigo_lucid_folders', JSON.stringify(next));
    if (activeFolder === folderName) setActiveFolder('all');
    showToast(`Pasta "${folderName}" removida.`, 'info');
  };

  const handleCreateBoardInFolder = async (folderName?: string) => {
    if (!window.electronAPI?.createMindmap) return;
    const targetFolder = folderName || (activeFolder !== 'all' ? activeFolder : 'Geral');
    const title = `Quadro #${mindmaps.length + 1}`;
    const defaultNodes: MindmapNode[] = [
      { id: 'n1', label: 'Ideia Central', x: 500, y: 260, color: '#6366f1', shape: 'cloud', connections: [{ targetId: 'n2', label: 'Estratégia' }, { targetId: 'n3', label: 'Ação' }] },
      { id: 'n2', label: 'Estratégia Principal', x: 250, y: 150, color: '#8b5cf6', shape: 'capsule', connections: [] },
      { id: 'n3', label: 'Plano de Execução', x: 750, y: 150, color: '#0ea5e9', shape: 'capsule', connections: [] },
    ];

    const created = await window.electronAPI.createMindmap({
      title,
      description: targetFolder,
      nodes: defaultNodes,
    });
    const updated = await window.electronAPI.getMindmaps();
    setMindmaps(updated);
    if (created?.id) {
      setSelectedMapId(created.id);
      setSelectedNodeId('n1');
      setZoom(1);
      setPanOffset({ x: 0, y: 0 });
      setLucidViewMode('canvas');
    }
    await refreshGame();
    showToast(`Quadro criado na pasta "${targetFolder}"!`, 'success');
  };

  const handleDeleteMindmap = async (id: string) => {
    if (!window.electronAPI?.deleteMindmap) return;
    await window.electronAPI.deleteMindmap(id);
    const updated = await window.electronAPI.getMindmaps();
    setMindmaps(updated);
    setSelectedMapId(updated[0]?.id || null);
    showToast('Quadro excluído.', 'info');
  };

  // Conectar dois nós livremente (M:N Graph)
  const handleConnectNodes = (sourceId: string, targetId: string) => {
    if (!selectedMap || sourceId === targetId) return;
    const sourceNode = selectedMap.nodes.find((n) => n.id === sourceId);
    if (!sourceNode) return;

    const existing = (sourceNode.connections || []).some((c) => c.targetId === targetId);
    if (existing) {
      showToast('Esses elementos já estão conectados.', 'info');
      setConnectingFromNodeId(null);
      return;
    }

    const nextNodes = selectedMap.nodes.map((n) => {
      if (n.id === sourceId) {
        return {
          ...n,
          connections: [...(n.connections || []), { targetId, label: '' }],
        };
      }
      return n;
    });

    saveMapNodes(selectedMap.id, nextNodes);
    setConnectingFromNodeId(null);
    showToast('Conexão estabelecida com sucesso!', 'success');
  };

  // Remover conexão entre dois nós
  const handleDisconnect = (sourceId: string, targetId: string) => {
    if (!selectedMap) return;
    const nextNodes = selectedMap.nodes.map((n) => {
      if (n.id === sourceId) {
        return {
          ...n,
          connections: (n.connections || []).filter((c) => c.targetId !== targetId),
          parentId: n.parentId === targetId ? null : n.parentId,
        };
      }
      if (n.id === targetId && n.parentId === sourceId) {
        return { ...n, parentId: null };
      }
      return n;
    });
    saveMapNodes(selectedMap.id, nextNodes);
    setSelectedEdgeId(null);
    showToast('Conexão removida.', 'info');
  };

  // Atualizar rótulo de texto na linha de conexão
  const handleUpdateEdgeLabel = (sourceId: string, targetId: string, label: string) => {
    if (!selectedMap) return;
    const nextNodes = selectedMap.nodes.map((n) => {
      if (n.id === sourceId) {
        const conns = (n.connections || []).map((c) =>
          c.targetId === targetId ? { ...c, label } : c
        );
        return { ...n, connections: conns, lineLabel: n.parentId === targetId ? label : n.lineLabel };
      }
      if (n.id === targetId && n.parentId === sourceId) {
        return { ...n, lineLabel: label };
      }
      return n;
    });
    saveMapNodes(selectedMap.id, nextNodes);
  };

  // Criar elemento livremente ao dar clique duplo no canvas
  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (e.target !== canvasRef.current && (e.target as HTMLElement).tagName !== 'svg') return;
    if (!selectedMap || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = Math.round((e.clientX - rect.left - panOffset.x) / zoom);
    const clickY = Math.round((e.clientY - rect.top - panOffset.y) / zoom);

    const newNode: MindmapNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      label: 'Novo Tópico',
      x: clickX,
      y: clickY,
      color: lucidActiveColor,
      shape: 'sticky',
      connections: [],
      notes: '',
    };

    saveMapNodes(selectedMap.id, [...selectedMap.nodes, newNode]);
    setSelectedNodeId(newNode.id);
    showToast('Novo elemento adicionado livremente no canvas!', 'info');
  };

  // Subtópico conectado
  const handleAddChildNode = (shape?: LucidShapeType) => {
    if (!selectedMap) return;
    const parent = selectedNode || selectedMap.nodes[0];
    if (!parent) return;

    const newNodeId = `node_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    const newX = parent.x + 220 + (Math.random() * 40 - 20);
    const newY = parent.y + (Math.random() * 80 - 40);

    const newNode: MindmapNode = {
      id: newNodeId,
      label: 'Novo Tópico',
      x: newX,
      y: newY,
      color: lucidActiveColor || parent.color || '#6366f1',
      shape: shape || parent.shape || 'cloud',
      connections: [],
      notes: '',
    };

    const nextNodes = selectedMap.nodes.map((n) =>
      n.id === parent.id
        ? { ...n, connections: [...(n.connections || []), { targetId: newNodeId, label: '' }] }
        : n
    );

    saveMapNodes(selectedMap.id, [...nextNodes, newNode]);
    setSelectedNodeId(newNodeId);
  };

  const handleAddSiblingNode = () => {
    handleAddChildNode();
  };

  // Criar post-it do leque
  const handleAddStickyFromDrawer = () => {
    if (!selectedMap || !lucidStickyInput.trim()) return;
    const newNode: MindmapNode = {
      id: `sticky_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      label: lucidStickyInput.trim(),
      x: (selectedNode ? selectedNode.x + 180 : 500) + (Math.random() * 40 - 20),
      y: (selectedNode ? selectedNode.y + 40 : 280) + (Math.random() * 40 - 20),
      color: lucidActiveColor,
      shape: 'sticky',
      connections: [],
      notes: '',
    };
    saveMapNodes(selectedMap.id, [...selectedMap.nodes, newNode]);
    setSelectedNodeId(newNode.id);
    setLucidStickyInput('');
    showToast('Post-it adicionado ao quadro!', 'success');
  };

  // Criar em lote
  const handleBatchAddStickies = () => {
    if (!selectedMap || !lucidBatchInput.trim()) return;
    const lines = lucidBatchInput
      .split('\n')
      .map((l) => l.trim().replace(/^[-*•\d.]+\s*/, ''))
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    const startX = 260;
    const startY = 220;
    const perRow = 3;
    const newNodes: MindmapNode[] = lines.map((line, idx) => {
      const col = idx % perRow;
      const row = Math.floor(idx / perRow);
      return {
        id: `sticky_batch_${Date.now()}_${idx}`,
        label: line,
        x: startX + col * 170,
        y: startY + row * 150,
        color: lucidActiveColor,
        shape: 'sticky',
        connections: [],
        notes: '',
      };
    });

    saveMapNodes(selectedMap.id, [...selectedMap.nodes, ...newNodes]);
    setLucidBatchInput('');
    setLucidBatchModalOpen(false);
    showToast(`${newNodes.length} post-its adicionados em lote!`, 'success');
  };

  // Adicionar forma rápida
  const handleAddShape = (shape: LucidShapeType) => {
    if (!selectedMap) return;
    const newNode: MindmapNode = {
      id: `shape_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      label:
        shape === 'cloud'
          ? 'Ideia Central'
          : shape === 'capsule'
          ? 'Objetivo'
          : shape === 'octagon'
          ? 'Alerta Crítico'
          : shape === 'diamond'
          ? 'Decisão'
          : 'Novo Bloco',
      x: (selectedNode ? selectedNode.x + 200 : 500) + (Math.random() * 40 - 20),
      y: (selectedNode ? selectedNode.y + 40 : 280) + (Math.random() * 60 - 30),
      color: lucidActiveColor,
      shape,
      connections: [],
      notes: '',
    };
    saveMapNodes(selectedMap.id, [...selectedMap.nodes, newNode]);
    setSelectedNodeId(newNode.id);
    setLucidShapesMenuOpen(false);
    showToast(`Forma "${shape}" adicionada!`, 'success');
  };

  const handleDeleteSelectedNode = () => {
    if (!selectedMap || !selectedNode) return;
    if (selectedMap.nodes.length <= 1) {
      showToast('O quadro precisa conter pelo menos um nó.', 'info');
      return;
    }
    const nodeId = selectedNode.id;
    const nextNodes = selectedMap.nodes
      .filter((n) => n.id !== nodeId)
      .map((n) => ({
        ...n,
        connections: (n.connections || []).filter((c) => c.targetId !== nodeId),
        parentId: n.parentId === nodeId ? null : n.parentId,
      }));
    saveMapNodes(selectedMap.id, nextNodes);
    setSelectedNodeId(nextNodes[0]?.id || 'root');
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
          ABA 2: QUADRO VISUAL DE IDEIAS ESTILO LUCIDSPARK
         ========================================================= */}
      {activeTool === 'mindmap' && (
        <div className="w-full">
          {/* =======================================================
              MODO 1: HUB DE PASTAS E DOCUMENTOS ESTILO LUCIDSPARK
             ======================================================= */}
          {lucidViewMode === 'folders' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Header do Hub de Documentos */}
              <div className="p-5 rounded-3xl bg-slate-900/90 border border-white/[0.08] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-xl">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                      <span>Documentos e Quadros Lucidspark</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Organize seus projetos, estratégias e sessões de brainstorming estruturados em pastas.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar quadros..."
                      value={folderSearch}
                      onChange={(e) => setFolderSearch(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-60"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setNewFolderModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Nova Pasta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCreateBoardInFolder()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition transform hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Quadro</span>
                  </button>
                </div>
              </div>

              {/* Grid Principal: Sidebar de Pastas + Cards de Quadros */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Coluna Esquerda: Navegador de Pastas */}
                <div className="lg:col-span-3 space-y-2">
                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/[0.08] shadow-lg space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-3 py-1 block">
                      Pastas de Organização
                    </span>

                    {/* Todos os Quadros */}
                    <button
                      type="button"
                      onClick={() => setActiveFolder('all')}
                      className={`w-full px-3 py-2.5 rounded-xl text-left text-xs font-bold flex items-center justify-between transition ${
                        activeFolder === 'all'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Layers className="w-4 h-4 shrink-0" />
                        <span className="truncate">Todos os Quadros</span>
                      </div>
                      <span className="text-[10px] opacity-75 font-mono">{mindmaps.length}</span>
                    </button>

                    {/* Lista de Pastas Individuais */}
                    {folders.map((folder) => {
                      const count = mindmaps.filter((m) => (m.description || 'Geral') === folder).length;
                      const isActive = activeFolder === folder;
                      return (
                        <div
                          key={folder}
                          className={`group w-full px-3 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'text-slate-300 hover:bg-slate-800/80'
                          }`}
                          onClick={() => setActiveFolder(folder)}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Folder className="w-4 h-4 shrink-0 text-indigo-400 group-hover:text-white" />
                            <span className="text-xs font-bold truncate">{folder}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] opacity-75 font-mono">{count}</span>
                            {folder !== 'Geral' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFolder(folder);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-300 p-0.5 transition"
                                title="Excluir Pasta"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setNewFolderModalOpen(true)}
                      className="w-full mt-2 px-3 py-2 rounded-xl text-left text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-600/10 flex items-center gap-2 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Criar Nova Pasta</span>
                    </button>
                  </div>
                </div>

                {/* Coluna Direita: Cards de Quadros da Pasta */}
                <div className="lg:col-span-9 space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span className="font-bold flex items-center gap-1.5 text-slate-200">
                      <Folder className="w-4 h-4 text-indigo-400" />
                      <span>Pasta Atual:</span>
                      <span className="text-indigo-300">
                        {activeFolder === 'all' ? 'Todos os Quadros' : activeFolder}
                      </span>
                    </span>
                    <span>
                      {
                        mindmaps.filter(
                          (m) =>
                            (activeFolder === 'all' || (m.description || 'Geral') === activeFolder) &&
                            (!folderSearch || m.title.toLowerCase().includes(folderSearch.toLowerCase()))
                        ).length
                      }{' '}
                      quadros encontrados
                    </span>
                  </div>

                  {/* Grid de Quadros */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {mindmaps
                      .filter(
                        (m) =>
                          (activeFolder === 'all' || (m.description || 'Geral') === activeFolder) &&
                          (!folderSearch || m.title.toLowerCase().includes(folderSearch.toLowerCase()))
                      )
                      .map((board) => {
                        const boardNodes = Array.isArray(board.nodes) ? board.nodes : [];
                        const edges = getBoardEdges(boardNodes);
                        return (
                          <div
                            key={board.id}
                            className="group p-4 rounded-3xl bg-slate-900/85 border border-white/[0.08] hover:border-indigo-500/50 shadow-xl flex flex-col justify-between transition-all duration-200 hover:-translate-y-1"
                          >
                            <div>
                              {/* Miniatura Visual Estilizada do Quadro */}
                              <div
                                onClick={() => {
                                  setSelectedMapId(board.id);
                                  setSelectedNodeId(boardNodes[0]?.id || 'root');
                                  setLucidViewMode('canvas');
                                }}
                                className="h-32 w-full rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center p-3 relative overflow-hidden cursor-pointer group-hover:border-indigo-500/30"
                                style={{
                                  backgroundImage:
                                    'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
                                  backgroundSize: '16px 16px',
                                }}
                              >
                                <div className="flex flex-wrap items-center justify-center gap-1.5 opacity-80 pointer-events-none">
                                  {boardNodes.slice(0, 4).map((n) => (
                                    <span
                                      key={n.id}
                                      style={{ backgroundColor: n.color }}
                                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-white shadow truncate max-w-[100px]"
                                    >
                                      {n.label}
                                    </span>
                                  ))}
                                </div>
                                <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <span className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-black flex items-center gap-1 shadow-lg">
                                    <span>Abrir Quadro</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </span>
                                </div>
                              </div>

                              {/* Título e Pasta */}
                              <div className="pt-3.5 space-y-1">
                                <h4 className="text-sm font-black text-white truncate">{board.title}</h4>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold flex items-center gap-1">
                                    <Folder className="w-3 h-3 text-indigo-400" />
                                    <span>{board.description || 'Geral'}</span>
                                  </span>
                                  <span>•</span>
                                  <span>{boardNodes.length} nós</span>
                                  <span>•</span>
                                  <span>{edges.length} conexões</span>
                                </div>
                              </div>
                            </div>

                            {/* Ações do Card */}
                            <div className="pt-4 flex items-center justify-between border-t border-slate-800/80 mt-3">
                              <select
                                value={board.description || 'Geral'}
                                onChange={(e) => {
                                  if (window.electronAPI?.updateMindmap) {
                                    window.electronAPI.updateMindmap(board.id, {
                                      description: e.target.value,
                                    });
                                    setMindmaps((prev) =>
                                      prev.map((b) =>
                                        b.id === board.id ? { ...b, description: e.target.value } : b
                                      )
                                    );
                                    showToast(`Quadro movido para a pasta "${e.target.value}".`, 'success');
                                  }
                                }}
                                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                                title="Mover para outra pasta"
                              >
                                {folders.map((f) => (
                                  <option key={f} value={f}>
                                    Pasta: {f}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => handleDeleteMindmap(board.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                                title="Excluir Quadro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                    {/* Card de Adição Rápida */}
                    <div
                      onClick={() => handleCreateBoardInFolder()}
                      className="p-6 rounded-3xl border-2 border-dashed border-slate-800 hover:border-indigo-500/60 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] transition-all group"
                    >
                      <div className="p-3 rounded-2xl bg-slate-800 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition mb-2 shadow">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                        Criar Novo Quadro em Branco
                      </span>
                      <span className="text-[11px] text-slate-500 mt-1">
                        Inicie um quadro 100% livre na pasta atual
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal de Criação de Nova Pasta */}
              {newFolderModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        <FolderPlus className="w-4 h-4 text-indigo-400" />
                        <span>Criar Nova Pasta</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setNewFolderModalOpen(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Nome da pasta (ex: Estratégia 2026)..."
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateFolder();
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setNewFolderModalOpen(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateFolder}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                      >
                        Criar Pasta
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =======================================================
              MODO 2: EDITOR CANVAS 100% DA ALTURA ESTILO LUCIDSPARK
             ======================================================= */}
          {lucidViewMode === 'canvas' && selectedMap && (
            <div className="relative w-full h-[calc(100vh-100px)] min-h-[720px] rounded-3xl bg-[#0b0c10] border border-white/[0.08] shadow-2xl flex flex-col overflow-hidden select-none animate-in fade-in duration-150">
              {/* Top Lucidspark Header Bar */}
              <div className="h-14 px-4 bg-slate-900/90 border-b border-white/[0.08] flex items-center justify-between z-20 backdrop-blur-md shrink-0">
                {/* Botão de Retorno para Pastas + Título + Status */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setLucidViewMode('folders')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700/80 transition shadow"
                    title="Retornar para o Hub de Pastas e Documentos"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Pastas</span>
                  </button>

                  <div className="h-4 w-px bg-white/10" />

                  <input
                    type="text"
                    value={selectedMap.title}
                    onChange={(e) => saveMapNodes(selectedMap.id, selectedMap.nodes, e.target.value)}
                    className="bg-transparent text-sm font-black text-white focus:outline-none focus:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-transparent focus:border-indigo-500/50 transition max-w-[220px]"
                    title="Renomear este quadro"
                  />

                  {/* Seletor de Pasta do Quadro Atual */}
                  <select
                    value={selectedMap.description || 'Geral'}
                    onChange={(e) => {
                      if (window.electronAPI?.updateMindmap) {
                        window.electronAPI.updateMindmap(selectedMap.id, {
                          description: e.target.value,
                        });
                        setMindmaps((prev) =>
                          prev.map((b) =>
                            b.id === selectedMap.id ? { ...b, description: e.target.value } : b
                          )
                        );
                        showToast(`Quadro associado à pasta "${e.target.value}".`, 'info');
                      }
                    }}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none hidden sm:inline"
                    title="Alterar pasta deste quadro"
                  >
                    {folders.map((f) => (
                      <option key={f} value={f}>
                        Pasta: {f}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                    <Cloud className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Salvo</span>
                  </div>

                  {/* Indicador de Conexão Ativa */}
                  {connectingFromNodeId && (
                    <div className="px-2.5 py-1 rounded-xl bg-indigo-600/30 border border-indigo-400 text-indigo-200 text-xs font-bold animate-pulse flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Modo Conectar: Clique no nó de destino</span>
                      <button
                        type="button"
                        onClick={() => setConnectingFromNodeId(null)}
                        className="ml-1 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Header: Timer, Style, Share */}
                <div className="flex items-center gap-2">
                  {/* Seletor de Estilo de Conexão */}
                  <div className="flex items-center rounded-xl bg-slate-950 p-0.5 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setConnectorStyle('curved')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg transition ${
                        connectorStyle === 'curved' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                      }`}
                      title="Conexões Curvas Bézier"
                    >
                      Curva
                    </button>
                    <button
                      type="button"
                      onClick={() => setConnectorStyle('elbow')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg transition ${
                        connectorStyle === 'elbow' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                      }`}
                      title="Conexões Angulares 90°"
                    >
                      Angular
                    </button>
                    <button
                      type="button"
                      onClick={() => setConnectorStyle('straight')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg transition ${
                        connectorStyle === 'straight' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                      }`}
                      title="Conexões Retas"
                    >
                      Reta
                    </button>
                  </div>

                  {/* Auto-Organizar */}
                  <button
                    type="button"
                    onClick={handleAutoLayout}
                    className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Auto-organizar layout"
                  >
                    <Layout className="w-4 h-4 text-indigo-400" />
                  </button>

                  {/* Timer de Brainstorming */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setLucidTimerOpen((v) => !v)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                        lucidTimerActive
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse'
                          : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                      title="Timer de Sessão"
                    >
                      <Timer className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-mono">
                        {Math.floor(lucidTimerSeconds / 60)}:{(lucidTimerSeconds % 60).toString().padStart(2, '0')}
                      </span>
                    </button>

                    {lucidTimerOpen && (
                      <div className="absolute right-0 top-full mt-2 w-60 p-3.5 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-50 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-white">
                          <span>Timer de Sessão</span>
                          <span className="font-mono text-amber-400 text-sm">
                            {Math.floor(lucidTimerSeconds / 60)}:{(lucidTimerSeconds % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[60, 180, 300, 600].map((sec) => (
                            <button
                              key={sec}
                              type="button"
                              onClick={() => {
                                setLucidTimerSeconds(sec);
                                setLucidTimerActive(false);
                              }}
                              className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300"
                            >
                              {sec / 60}m
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setLucidTimerActive((v) => !v)}
                            className="flex-1 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1 transition"
                          >
                            {lucidTimerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            <span>{lucidTimerActive ? 'Pausar' : 'Iniciar'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLucidTimerSeconds(300);
                              setLucidTimerActive(false);
                            }}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="Resetar 5 min"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botão de Compartilhar */}
                  <button
                    type="button"
                    onClick={() => {
                      copyToClipboard(window.location.href, 'Quadro Lucidspark');
                      showToast('Link do quadro copiado!', 'success');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Compartilhar</span>
                  </button>
                </div>
              </div>

              {/* Dock Lateral Flutuante Profissional (Sem emojis) */}
              <div className="absolute left-4 top-20 z-20 flex flex-col items-center bg-slate-900/95 border border-white/[0.08] rounded-2xl p-1.5 shadow-2xl space-y-1.5 backdrop-blur-xl">
                {/* Criar Post-it com Leque de Cores */}
                <button
                  type="button"
                  onClick={() => {
                    setLucidStickyDrawerOpen((v) => !v);
                    setLucidShapesMenuOpen(false);
                  }}
                  className={`p-2.5 rounded-xl transition ${
                    lucidStickyDrawerOpen
                      ? 'bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/30'
                      : 'text-amber-400 hover:bg-amber-400/20'
                  }`}
                  title="Post-its & Leque de Cores"
                >
                  <StickyNote className="w-5 h-5" />
                </button>

                {/* Menu de Formas */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setLucidShapesMenuOpen((v) => !v);
                      setLucidStickyDrawerOpen(false);
                    }}
                    className={`p-2.5 rounded-xl transition ${
                      lucidShapesMenuOpen
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                    title="Inserir Formas: Nuvem, Cápsula, Octógono, Losango, Cartão"
                  >
                    <Layers className="w-5 h-5 text-cyan-400" />
                  </button>

                  {lucidShapesMenuOpen && (
                    <div className="absolute left-full top-0 ml-3 w-56 p-2 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-40 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-2 block">
                        Inserir Forma
                      </span>
                      {LUCID_SHAPES.map((shape) => (
                        <button
                          key={shape.type}
                          type="button"
                          onClick={() => handleAddShape(shape.type)}
                          className="w-full px-2.5 py-2 rounded-xl hover:bg-slate-800 text-left text-xs font-bold text-slate-200 flex items-center gap-2.5 transition"
                        >
                          <span className="p-1 rounded bg-slate-800 text-indigo-400">
                            {shape.type === 'cloud' && <Cloud className="w-3.5 h-3.5" />}
                            {shape.type === 'capsule' && <Circle className="w-3.5 h-3.5" />}
                            {shape.type === 'octagon' && <Octagon className="w-3.5 h-3.5" />}
                            {shape.type === 'diamond' && <Diamond className="w-3.5 h-3.5" />}
                            {shape.type === 'sticky' && <StickyNote className="w-3.5 h-3.5" />}
                            {shape.type === 'rectangle' && <Square className="w-3.5 h-3.5" />}
                          </span>
                          <div>
                            <div>{shape.label}</div>
                            <span className="text-[10px] font-normal text-slate-400">{shape.desc}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modo Conectar Livre */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedNode) {
                      setConnectingFromNodeId(selectedNode.id);
                      showToast('Clique no elemento de destino para criar a conexão.', 'info');
                    } else {
                      showToast('Selecione primeiro um elemento e clique para conectar.', 'info');
                    }
                  }}
                  className={`p-2.5 rounded-xl transition ${
                    connectingFromNodeId
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Conectar Elementos Livremente"
                >
                  <Link2 className="w-5 h-5 text-indigo-400" />
                </button>

                {/* Criar em Lote */}
                <button
                  type="button"
                  onClick={() => setLucidBatchModalOpen(true)}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
                  title="Criar Post-its em Lote (Colar Lista)"
                >
                  <ListOrdered className="w-5 h-5 text-pink-400" />
                </button>

                {/* Adicionar Rápido */}
                <button
                  type="button"
                  onClick={() => handleAddChildNode()}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
                  title="Adicionar Subtópico"
                >
                  <Plus className="w-5 h-5 text-emerald-400" />
                </button>
              </div>

              {/* Gaveta de Leques de Cores do Lucidspark (Sem Emojis) */}
              {lucidStickyDrawerOpen && (
                <div className="absolute left-20 top-20 z-30 w-88 bg-slate-900/98 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl space-y-3.5 select-none animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                    <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <StickyNote className="w-4 h-4 text-amber-400" />
                      <span>Adicionar Post-its ao Quadro</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setLucidStickyDrawerOpen(false)}
                      className="text-slate-500 hover:text-white text-xs p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 4 Linhas de Leques */}
                  <div className="space-y-2 py-1">
                    {LUCID_FAN_PALETTES.map((palette, pIdx) => (
                      <div key={pIdx} className="flex items-center justify-center gap-1">
                        {palette.colors.map((c) => {
                          const isChosen = lucidActiveColor === c;
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setLucidActiveColor(c)}
                              style={{ backgroundColor: c }}
                              className={`w-7 h-10 rounded-md transition-all flex items-center justify-center ${
                                isChosen
                                  ? 'scale-115 ring-2 ring-white shadow-xl -translate-y-1 z-10'
                                  : 'hover:scale-105 opacity-85 hover:opacity-100'
                              }`}
                              title={c}
                            >
                              {isChosen && <Check className="w-3.5 h-3.5 text-white drop-shadow font-black" />}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Digitar e Enter */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-[11px] font-bold text-slate-300 block">
                      Digite e pressione Enter para criar post-it:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Escreva sua ideia aqui..."
                        value={lucidStickyInput}
                        onChange={(e) => setLucidStickyInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddStickyFromDrawer();
                          }
                        }}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                      />
                      <button
                        type="button"
                        onClick={handleAddStickyFromDrawer}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                      >
                        Criar
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setLucidStickyDrawerOpen(false);
                        setLucidBatchModalOpen(true);
                      }}
                      className="w-full text-left text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 pt-1 transition"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                      <span>Colar listas ou parágrafos para criar em lote</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Modal de Criação em Lote */}
              {lucidBatchModalOpen && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        <ListOrdered className="w-4 h-4 text-indigo-400" />
                        <span>Criar Post-its em Lote</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setLucidBatchModalOpen(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Cole sua lista de ideias ou parágrafos. Cada linha será transformada em um post-it separado na cor selecionada.
                    </p>

                    <textarea
                      rows={6}
                      value={lucidBatchInput}
                      onChange={(e) => setLucidBatchInput(e.target.value)}
                      placeholder="Primeira ideia&#10;Segunda ideia&#10;Terceira reflexão..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 custom-scrollbar resize-none"
                    />

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setLucidBatchModalOpen(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleBatchAddStickies}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Gerar Post-its</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Canvas 100% da Altura com Grade de Pontos */}
              <div
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onDoubleClick={handleCanvasDoubleClick}
                className={`relative w-full flex-1 overflow-hidden select-none ${
                  isPanning ? 'cursor-grabbing' : 'cursor-grab'
                }`}
                style={{
                  backgroundImage:
                    'radial-gradient(rgba(255,255,255,0.18) 1.5px, transparent 1.5px)',
                  backgroundSize: '28px 28px',
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
                  {/* Conexões Livres M:N com Rótulos de Texto */}
                  <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none overflow-visible">
                    {getBoardEdges(selectedMap.nodes).map((edge) => {
                      const source = selectedMap.nodes.find((n) => n.id === edge.sourceId);
                      const target = selectedMap.nodes.find((n) => n.id === edge.targetId);
                      if (!source || !target) return null;

                      const midX = (source.x + target.x) / 2;
                      const midY = (source.y + target.y) / 2;

                      let pathData = '';
                      if (connectorStyle === 'straight') {
                        pathData = `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
                      } else if (connectorStyle === 'elbow') {
                        pathData = `M ${source.x} ${source.y} L ${midX} ${source.y} L ${midX} ${target.y} L ${target.x} ${target.y}`;
                      } else {
                        // Curved Bézier
                        pathData = `M ${source.x} ${source.y} C ${midX} ${source.y}, ${midX} ${target.y}, ${target.x} ${target.y}`;
                      }

                      const isEdgeSelected = selectedEdgeId === edge.id;

                      return (
                        <g key={edge.id}>
                          <path
                            d={pathData}
                            stroke={isEdgeSelected ? '#ffffff' : edge.color || '#6366f1'}
                            strokeWidth={isEdgeSelected ? 3.5 : 2.5}
                            strokeOpacity={isEdgeSelected ? 1 : 0.75}
                            fill="none"
                            strokeLinecap="round"
                            className="cursor-pointer pointer-events-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEdgeId(edge.id);
                            }}
                          />

                          {/* Rótulo de Linha e Controles de Conexão */}
                          {(edge.label || isEdgeSelected) && (
                            <foreignObject
                              x={midX - 90}
                              y={midY - 18}
                              width={180}
                              height={36}
                              className="overflow-visible pointer-events-auto"
                            >
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className={`px-2.5 py-1 rounded-xl bg-slate-900 border text-center flex items-center justify-between gap-1 shadow-xl backdrop-blur-md ${
                                  isEdgeSelected ? 'border-indigo-400 ring-2 ring-indigo-500/40' : 'border-slate-700'
                                }`}
                              >
                                <input
                                  type="text"
                                  placeholder="Rótulo da linha..."
                                  value={edge.label || ''}
                                  onChange={(e) =>
                                    handleUpdateEdgeLabel(edge.sourceId, edge.targetId, e.target.value)
                                  }
                                  className="bg-transparent text-[10px] font-bold text-slate-200 focus:outline-none w-full text-center"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDisconnect(edge.sourceId, edge.targetId)}
                                  className="text-slate-500 hover:text-rose-400 p-0.5"
                                  title="Remover conexão"
                                >
                                  <Unlink className="w-3 h-3" />
                                </button>
                              </div>
                            </foreignObject>
                          )}
                        </g>
                      );
                    })}
                  </svg>

                  {/* Nós / Elementos Criados Livremente no Canvas */}
                  {selectedMap.nodes.map((node) => {
                    const isSelected = node.id === selectedNode?.id;
                    const shape: LucidShapeType = node.shape || 'cloud';

                    return (
                      <div
                        key={node.id}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (connectingFromNodeId && connectingFromNodeId !== node.id) {
                            handleConnectNodes(connectingFromNodeId, node.id);
                          } else {
                            setSelectedNodeId(node.id);
                            setDraggingNodeId(node.id);
                          }
                        }}
                        style={{
                          left: `${node.x}px`,
                          top: `${node.y}px`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className={`group absolute cursor-grab active:cursor-grabbing transition-transform ${
                          connectingFromNodeId && connectingFromNodeId !== node.id
                            ? 'ring-4 ring-indigo-400 animate-pulse cursor-pointer'
                            : ''
                        }`}
                      >
                        {/* 4 Âncoras de Conexão Livre (Top, Right, Bottom, Left) */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (connectingFromNodeId && connectingFromNodeId !== node.id) {
                              handleConnectNodes(connectingFromNodeId, node.id);
                            } else {
                              setConnectingFromNodeId(node.id);
                              showToast('Modo Conectar: Clique no nó de destino.', 'info');
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-indigo-500 hover:bg-white text-white hover:text-slate-900 flex items-center justify-center text-[10px] font-black shadow-lg cursor-pointer transition z-30"
                          title="Conectar por cima"
                        >
                          +
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (connectingFromNodeId && connectingFromNodeId !== node.id) {
                              handleConnectNodes(connectingFromNodeId, node.id);
                            } else {
                              setConnectingFromNodeId(node.id);
                              showToast('Modo Conectar: Clique no nó de destino.', 'info');
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 rounded-full bg-indigo-500 hover:bg-white text-white hover:text-slate-900 flex items-center justify-center text-[10px] font-black shadow-lg cursor-pointer transition z-30"
                          title="Conectar pela direita"
                        >
                          +
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (connectingFromNodeId && connectingFromNodeId !== node.id) {
                              handleConnectNodes(connectingFromNodeId, node.id);
                            } else {
                              setConnectingFromNodeId(node.id);
                              showToast('Modo Conectar: Clique no nó de destino.', 'info');
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-indigo-500 hover:bg-white text-white hover:text-slate-900 flex items-center justify-center text-[10px] font-black shadow-lg cursor-pointer transition z-30"
                          title="Conectar por baixo"
                        >
                          +
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (connectingFromNodeId && connectingFromNodeId !== node.id) {
                              handleConnectNodes(connectingFromNodeId, node.id);
                            } else {
                              setConnectingFromNodeId(node.id);
                              showToast('Modo Conectar: Clique no nó de destino.', 'info');
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 rounded-full bg-indigo-500 hover:bg-white text-white hover:text-slate-900 flex items-center justify-center text-[10px] font-black shadow-lg cursor-pointer transition z-30"
                          title="Conectar pela esquerda"
                        >
                          +
                        </div>

                        {/* Barra de Ações Rápidas Flutuante sobre o Nó Selecionado */}
                        {isSelected && (
                          <div
                            onMouseDown={(e) => e.stopPropagation()}
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2 py-1 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl flex items-center gap-1.5 z-40 select-none animate-in fade-in duration-100"
                          >
                            <select
                              value={shape}
                              onChange={(e) => {
                                const nextNodes = selectedMap.nodes.map((n) =>
                                  n.id === node.id
                                    ? { ...n, shape: e.target.value as LucidShapeType }
                                    : n
                                );
                                saveMapNodes(selectedMap.id, nextNodes);
                              }}
                              className="text-[10px] bg-slate-950 border border-slate-700 text-slate-200 rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
                              title="Alterar forma"
                            >
                              <option value="cloud">Nuvem</option>
                              <option value="capsule">Cápsula</option>
                              <option value="octagon">Octógono</option>
                              <option value="diamond">Losango</option>
                              <option value="sticky">Post-it</option>
                              <option value="rectangle">Cartão</option>
                            </select>

                            <input
                              type="color"
                              value={node.color}
                              onChange={(e) => {
                                const nextNodes = selectedMap.nodes.map((n) =>
                                  n.id === node.id ? { ...n, color: e.target.value } : n
                                );
                                saveMapNodes(selectedMap.id, nextNodes);
                              }}
                              className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                              title="Alterar cor"
                            />

                            <button
                              type="button"
                              onClick={() => {
                                setConnectingFromNodeId(node.id);
                                showToast('Clique no nó de destino para estabelecer a conexão.', 'info');
                              }}
                              className="p-1 rounded text-slate-400 hover:text-indigo-300"
                              title="Conectar a outro nó"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAddChildNode()}
                              className="p-1 rounded text-slate-400 hover:text-emerald-400"
                              title="Adicionar nó conectado"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={handleDeleteSelectedNode}
                              className="p-1 rounded text-slate-400 hover:text-rose-400"
                              title="Excluir nó"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* FORMA 1: NUVEM (CLOUD) */}
                        {shape === 'cloud' && (
                          <div className="relative flex items-center justify-center min-w-[150px] max-w-[210px] min-h-[95px] p-6">
                            <svg
                              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible drop-shadow-xl"
                              preserveAspectRatio="none"
                              viewBox="0 0 160 100"
                            >
                              <path
                                d="M 28,75 A 20,20 0 0,1 18,38 A 26,26 0 0,1 65,16 A 35,35 0 0,1 122,20 A 24,24 0 0,1 146,48 A 20,20 0 0,1 138,76 A 16,16 0 0,1 115,86 L 45,86 A 18,18 0 0,1 28,75 Z"
                                fill={node.color}
                                stroke={isSelected ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                                strokeWidth={isSelected ? 3 : 1.5}
                              />
                            </svg>
                            <input
                              type="text"
                              value={node.label}
                              onChange={(e) => {
                                const nextNodes = selectedMap.nodes.map((n) =>
                                  n.id === node.id ? { ...n, label: e.target.value } : n
                                );
                                saveMapNodes(selectedMap.id, nextNodes);
                              }}
                              className="relative z-10 bg-transparent text-white font-extrabold text-xs text-center leading-snug w-full focus:outline-none select-text"
                            />
                          </div>
                        )}

                        {/* FORMA 2: CÁPSULA (PILL) */}
                        {shape === 'capsule' && (
                          <div
                            style={{
                              backgroundColor: node.color,
                              borderColor: isSelected ? '#ffffff' : 'rgba(255,255,255,0.3)',
                            }}
                            className={`rounded-full px-5 py-3 border-2 shadow-2xl flex items-center justify-center min-w-[140px] max-w-[220px] text-center ${
                              isSelected ? 'ring-4 ring-white/30 scale-105' : ''
                            }`}
                          >
                            <input
                              type="text"
                              value={node.label}
                              onChange={(e) => {
                                const nextNodes = selectedMap.nodes.map((n) =>
                                  n.id === node.id ? { ...n, label: e.target.value } : n
                                );
                                saveMapNodes(selectedMap.id, nextNodes);
                              }}
                              className="bg-transparent text-white font-bold text-xs leading-snug w-full text-center focus:outline-none select-text"
                            />
                          </div>
                        )}

                        {/* FORMA 3: OCTÓGONO */}
                        {shape === 'octagon' && (
                          <div
                            style={{
                              backgroundColor: node.color,
                              clipPath:
                                'polygon(28% 0%, 72% 0%, 100% 28%, 100% 72%, 72% 100%, 28% 100%, 0% 72%, 0% 28%)',
                              outline: isSelected ? '3px solid #ffffff' : 'none',
                            }}
                            className="w-[145px] h-[100px] shadow-2xl flex items-center justify-center p-4 text-center"
                          >
                            <input
                              type="text"
                              value={node.label}
                              onChange={(e) => {
                                const nextNodes = selectedMap.nodes.map((n) =>
                                  n.id === node.id ? { ...n, label: e.target.value } : n
                                );
                                saveMapNodes(selectedMap.id, nextNodes);
                              }}
                              className="bg-transparent text-white font-bold text-xs leading-snug w-full text-center focus:outline-none select-text px-1"
                            />
                          </div>
                        )}

                        {/* FORMA 4: LOSANGO (DIAMOND) */}
                        {shape === 'diamond' && (
                          <div
                            style={{
                              backgroundColor: node.color,
                              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                              outline: isSelected ? '3px solid #ffffff' : 'none',
                            }}
                            className="w-[140px] h-[100px] shadow-2xl flex items-center justify-center p-5 text-center"
                          >
                            <input
                              type="text"
                              value={node.label}
                              onChange={(e) => {
                                const nextNodes = selectedMap.nodes.map((n) =>
                                  n.id === node.id ? { ...n, label: e.target.value } : n
                                );
                                saveMapNodes(selectedMap.id, nextNodes);
                              }}
                              className="bg-transparent text-white font-bold text-[11px] leading-tight w-full text-center focus:outline-none select-text"
                            />
                          </div>
                        )}

                        {/* FORMA 5: POST-IT (STICKY NOTE) */}
                        {shape === 'sticky' && (
                          <div
                            style={{
                              backgroundColor: node.color,
                              borderColor: isSelected ? '#ffffff' : 'rgba(0,0,0,0.15)',
                            }}
                            className={`w-[145px] min-h-[115px] p-3 rounded-sm shadow-2xl flex flex-col justify-between text-left border-2 transform rotate-[-0.5deg] ${
                              isSelected ? 'ring-4 ring-amber-400/50 scale-105' : ''
                            }`}
                          >
                            <textarea
                              rows={3}
                              value={node.label}
                              onChange={(e) => {
                                const nextNodes = selectedMap.nodes.map((n) =>
                                  n.id === node.id ? { ...n, label: e.target.value } : n
                                );
                                saveMapNodes(selectedMap.id, nextNodes);
                              }}
                              className={`bg-transparent font-semibold text-xs leading-snug w-full resize-none focus:outline-none select-text ${
                                node.color === '#ffffff' ||
                                node.color.endsWith('8a') ||
                                node.color.endsWith('e8') ||
                                node.color.endsWith('fa')
                                  ? 'text-slate-900'
                                  : 'text-white'
                              }`}
                            />
                            {node.notes && (
                              <span
                                className={`text-[10px] truncate pt-1 opacity-75 ${
                                  node.color === '#ffffff' ||
                                  node.color.endsWith('8a') ||
                                  node.color.endsWith('e8')
                                    ? 'text-slate-700'
                                    : 'text-slate-200'
                                }`}
                              >
                                {node.notes}
                              </span>
                            )}
                          </div>
                        )}

                        {/* FORMA 6: CARTÃO (RECTANGLE) */}
                        {shape === 'rectangle' && (
                          <div
                            style={{
                              backgroundColor: node.color,
                              borderColor: isSelected ? '#ffffff' : 'rgba(255,255,255,0.25)',
                            }}
                            className={`rounded-2xl px-4 py-3 border-2 shadow-2xl flex items-center justify-center min-w-[140px] max-w-[210px] text-center ${
                              isSelected ? 'ring-4 ring-white/30 scale-105' : ''
                            }`}
                          >
                            <input
                              type="text"
                              value={node.label}
                              onChange={(e) => {
                                const nextNodes = selectedMap.nodes.map((n) =>
                                  n.id === node.id ? { ...n, label: e.target.value } : n
                                );
                                saveMapNodes(selectedMap.id, nextNodes);
                              }}
                              className="bg-transparent text-white font-bold text-xs leading-snug w-full text-center focus:outline-none select-text"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Controles Flutuantes Inferiores (Zoom, Outline, Atalhos) */}
              <div className="absolute right-4 bottom-4 z-20 flex items-center gap-1.5 bg-slate-900/95 border border-white/[0.08] rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl">
                <button
                  type="button"
                  onClick={() => setLucidOutlineOpen((v) => !v)}
                  className={`p-2 rounded-xl transition ${
                    lucidOutlineOpen ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Estrutura de Ideias (Outline)"
                >
                  <ListTree className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.3, Number((z - 0.1).toFixed(2))))}
                  className="p-2 rounded-xl text-slate-400 hover:text-white transition"
                  title="Afastar (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <span
                  onClick={() => {
                    setZoom(1);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className="px-2 py-1 text-xs font-mono font-bold text-slate-200 cursor-pointer hover:text-indigo-400 select-none"
                  title="Resetar 100%"
                >
                  {Math.round(zoom * 100)}%
                </span>

                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.0, Number((z + 0.1).toFixed(2))))}
                  className="p-2 rounded-xl text-slate-400 hover:text-white transition"
                  title="Aproximar (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-white transition"
                  title="Centralizar Visualização"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    showToast(
                      'Dicas: Clique duas vezes no canvas para criar livremente. Clique nos pontos nas bordas dos nós para conectá-los.',
                      'info'
                    );
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-white transition"
                  title="Dicas de Uso"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>

              {/* Gaveta de Outline Retrátil */}
              {lucidOutlineOpen && (
                <div className="absolute right-4 top-16 bottom-16 z-30 w-72 bg-slate-900/98 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl flex flex-col select-none animate-in fade-in slide-in-from-right-4 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      <ListTree className="w-4 h-4 text-indigo-400" />
                      <span>Estrutura do Quadro ({selectedMap.nodes.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setLucidOutlineOpen(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1.5 pt-2 custom-scrollbar pr-1">
                    {selectedMap.nodes.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => setSelectedNodeId(n.id)}
                        className={`p-2 rounded-xl flex items-center justify-between cursor-pointer text-xs font-bold transition ${
                          n.id === selectedNode?.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-950/70 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: n.color }}
                          />
                          <span className="truncate">{n.label}</span>
                        </div>
                        <span className="text-[10px] opacity-75 shrink-0 uppercase font-mono">
                          {n.shape || 'cloud'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ToolsErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ToolsView error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-slate-900/90 border border-slate-800 rounded-3xl max-w-lg mx-auto my-12 text-slate-200 shadow-2xl backdrop-blur-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-3">
            <X className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">Ops! Ocorreu um problema ao carregar as Ferramentas.</h3>
          <p className="text-xs text-slate-400 mb-5 font-mono bg-slate-950/80 p-2.5 rounded-xl border border-white/5 break-words">
            {this.state.error?.message || 'Erro inesperado'}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30"
          >
            Tentar Novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const ToolsView: React.FC = () => (
  <ToolsErrorBoundary>
    <ToolsViewInner />
  </ToolsErrorBoundary>
);

