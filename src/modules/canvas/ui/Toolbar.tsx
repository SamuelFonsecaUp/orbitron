import React, { useState, useRef, useEffect } from 'react';
import {
  MousePointer,
  Hand,
  StickyNote,
  Square,
  Circle,
  Diamond,
  Triangle,
  Type,
  ArrowUpRight,
  PenTool,
  LayoutGrid,
  Undo2,
  Redo2,
  Download,
  ChevronDown,
  Image as ImageIcon,
  Link2,
  Sun,
  Moon,
  Grid,
  MoreHorizontal,
  Maximize2,
  RotateCcw,
  Sparkles,
  Lock,
  Check,
  Trash2,
  Copy,
  Keyboard,
  Map,
  FileCode,
  Minus,
  SeparatorVertical,
  FolderPlus,
} from 'lucide-react';
import { useCanvasStore, canvasStore } from '../store/canvasStore';
import { CanvasTool, CanvasShapeType, CanvasGridPattern, CanvasTheme } from '../store/canvasStore.types';
import { CANVAS_THEMES, isThemeUnlocked } from '../store/canvasThemes';
import { createDeleteElementsCommand } from '../scene/commands';
import { useFinancial } from '../../../context/FinancialContext';

interface ToolbarProps {
  onExportImage?: () => void;
  onExportJson?: () => void;
  onInsertImage?: () => void;
  onInsertLink?: () => void;
  onOpenInsertLibrary?: () => void;
  onFitToView?: () => void;
  showMiniMap?: boolean;
  onToggleMiniMap?: () => void;
  boardTitle?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onExportImage,
  onExportJson,
  onInsertImage,
  onInsertLink,
  onOpenInsertLibrary,
  onFitToView,
  showMiniMap = true,
  onToggleMiniMap,
  boardTitle,
}) => {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const toolShape = useCanvasStore((s) => s.toolShape);
  const defaultEdgeRouting = useCanvasStore((s) => s.defaultEdgeRouting) || 'orthogonal';
  const canUndo = useCanvasStore((s) => s.canUndo);
  const canRedo = useCanvasStore((s) => s.canRedo);
  const theme = useCanvasStore((s) => s.theme);
  const gridPattern = useCanvasStore((s) => s.gridPattern);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const [connectorMenuOpen, setConnectorMenuOpen] = useState(false);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Safe level resolution
  let userLevel = 1;
  let showToastFn: ((msg: string, type?: any) => void) | undefined;
  try {
    const fin = useFinancial();
    if (fin?.game?.level) userLevel = fin.game.level;
    showToastFn = fin?.showToast;
  } catch {
    userLevel = 1;
  }

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOptionsMenuOpen(false);
      }
      setShapeMenuOpen(false);
      setConnectorMenuOpen(false);
    };
    if (optionsMenuOpen || shapeMenuOpen || connectorMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [optionsMenuOpen, shapeMenuOpen, connectorMenuOpen]);

  const handleToolSelect = (tool: CanvasTool) => {
    canvasStore.setActiveTool(tool);
    setShapeMenuOpen(false);
  };

  const handleShapeSelect = (shape: CanvasShapeType) => {
    canvasStore.setToolShape(shape);
    canvasStore.setActiveTool('shape');
    setShapeMenuOpen(false);
  };

  const handleCycleGrid = () => {
    const sequence: CanvasGridPattern[] = ['dots', 'lines', 'cross', 'none'];
    const nextIdx = (sequence.indexOf(gridPattern) + 1) % sequence.length;
    canvasStore.setGridPattern(sequence[nextIdx]);
  };

  const setDragTool = (e: React.DragEvent, payload: object) => {
    e.dataTransfer.setData('application/orbitron-tool', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const renderShapeIcon = () => {
    switch (toolShape) {
      case 'ellipse': return <Circle className="w-4 h-4" />;
      case 'diamond': return <Diamond className="w-4 h-4" />;
      case 'triangle': return <Triangle className="w-4 h-4" />;
      case 'divider_horizontal': return <Minus className="w-4 h-4 text-cyan-400" />;
      case 'divider_vertical': return <SeparatorVertical className="w-4 h-4 text-cyan-400" />;
      case 'rectangle':
      default:
        return <Square className="w-4 h-4" />;
    }
  };

  const gridLabel = {
    dots: 'Grade: Pontilhada',
    lines: 'Grade: Linhas Milimetradas',
    cross: 'Grade: Cruzetas Orbitais',
    none: 'Grade: Desativada (Liso)',
  }[gridPattern];

  const handleSelectTheme = (themeId: CanvasTheme, minLevel: number) => {
    if (userLevel < minLevel) {
      if (showToastFn) {
        showToastFn(`Tema bloqueado! Alcance o Nível ${minLevel} na Jornada para desbloquear.`, 'info');
      }
      return;
    }
    canvasStore.setTheme(themeId);
    if (showToastFn) {
      const info = CANVAS_THEMES.find((t) => t.id === themeId);
      showToastFn(`Tema "${info?.name || themeId}" aplicado com sucesso!`, 'success');
    }
  };

  const handleExportDocJson = () => {
    if (onExportJson) {
      onExportJson();
      return;
    }
    const snap = canvasStore.getSnapshot();
    const doc = { nodes: snap.nodes, edges: snap.edges };
    const jsonStr = JSON.stringify(doc, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const clean = (boardTitle || 'Quadro').replace(/\.canvas$/i, '');
    a.download = `${clean}.canvas`;
    a.click();
    URL.revokeObjectURL(url);
    if (showToastFn) showToastFn('Quadro exportado como .canvas (JSON Canvas 1.0)!', 'success');
    setOptionsMenuOpen(false);
  };

  const handleCopyCitation = () => {
    const clean = (boardTitle || 'Quadro Geral').replace(/\.canvas$/i, '');
    const citation = `[[quadro:${clean}]]`;
    navigator.clipboard.writeText(citation);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
    if (showToastFn) {
      showToastFn('Citação copiada! Cole em qualquer anotação para vincular este quadro.', 'success');
    }
  };

  const handleClearBoard = () => {
    if (nodes.length === 0 && edges.length === 0) {
      if (showToastFn) showToastFn('O quadro já está vazio.', 'info');
      return;
    }
    if (window.confirm('Tem certeza de que deseja limpar todos os elementos deste quadro?\n(Dica: você pode desfazer depois com Ctrl+Z)')) {
      canvasStore.dispatch(createDeleteElementsCommand(nodes, edges));
      if (showToastFn) showToastFn('Quadro limpo. Use Ctrl+Z para desfazer.', 'info');
      setOptionsMenuOpen(false);
    }
  };

  return (
    <>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl canvas-glass-panel animate-in fade-in slide-in-from-top-3 duration-200">
        {/* Select */}
        <button
          onClick={() => handleToolSelect('select')}
          className={`canvas-tool-btn ${activeTool === 'select' ? 'active' : ''}`}
          title="Selecionar (V)"
        >
          <MousePointer className="w-4 h-4" />
        </button>

        {/* Hand (Pan) */}
        <button
          onClick={() => handleToolSelect('hand')}
          className={`canvas-tool-btn ${activeTool === 'hand' ? 'active' : ''}`}
          title="Mover tela (Espaço + Arrastar ou H)"
        >
          <Hand className="w-4 h-4" />
        </button>

        <div className="canvas-divider" />

        {/* Sticky Note */}
        <button
          draggable
          onDragStart={(e) => setDragTool(e, { tool: 'sticky' })}
          onClick={() => handleToolSelect('sticky')}
          className={`canvas-tool-btn cursor-grab active:cursor-grabbing ${activeTool === 'sticky' ? 'active' : ''}`}
          title="Nota Adesiva (Arraste ou clique) [S]"
        >
          <StickyNote className="w-4 h-4" />
        </button>

        {/* Shape dropdown & Draggable */}
        <div className="relative">
          <div className="flex items-center">
            <button
              draggable
              onDragStart={(e) => setDragTool(e, { tool: 'shape', shape: toolShape })}
              onClick={() => handleToolSelect('shape')}
              className={`canvas-tool-btn rounded-r-none cursor-grab active:cursor-grabbing ${activeTool === 'shape' ? 'active' : ''}`}
              title="Forma geométrica (Arraste ou clique)"
            >
              {renderShapeIcon()}
            </button>
            <button
              onClick={() => setShapeMenuOpen(!shapeMenuOpen)}
              className={`h-9 px-1 rounded-r-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ${
                activeTool === 'shape' ? 'bg-purple-600/30 text-white' : ''
              }`}
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {shapeMenuOpen && (
            <div className="absolute top-11 left-0 flex flex-col gap-1 p-1.5 rounded-xl canvas-glass-panel shadow-2xl z-30 min-w-[160px]">
              <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 uppercase tracking-wider">
                Formas
              </span>
              <button
                onClick={() => handleShapeSelect('rectangle')}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-purple-600/20 hover:text-purple-300 transition-colors"
              >
                <Square className="w-3.5 h-3.5" /> Retângulo
              </button>
              <button
                onClick={() => handleShapeSelect('ellipse')}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-purple-600/20 hover:text-purple-300 transition-colors"
              >
                <Circle className="w-3.5 h-3.5" /> Elipse
              </button>
              <button
                onClick={() => handleShapeSelect('diamond')}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-purple-600/20 hover:text-purple-300 transition-colors"
              >
                <Diamond className="w-3.5 h-3.5" /> Losango
              </button>
              <button
                onClick={() => handleShapeSelect('triangle')}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-purple-600/20 hover:text-purple-300 transition-colors"
              >
                <Triangle className="w-3.5 h-3.5" /> Triângulo
              </button>

              <div className="h-px bg-white/10 my-1" />
              <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 uppercase tracking-wider">
                Divisores
              </span>
              <button
                onClick={() => handleShapeSelect('divider_horizontal')}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 transition-colors font-medium"
              >
                <Minus className="w-3.5 h-3.5" /> Divisor Horizontal
              </button>
              <button
                onClick={() => handleShapeSelect('divider_vertical')}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 transition-colors font-medium"
              >
                <SeparatorVertical className="w-3.5 h-3.5" /> Divisor Vertical
              </button>
            </div>
          )}
        </div>

        {/* Text */}
        <button
          draggable
          onDragStart={(e) => setDragTool(e, { tool: 'text' })}
          onClick={() => handleToolSelect('text')}
          className={`canvas-tool-btn cursor-grab active:cursor-grabbing ${activeTool === 'text' ? 'active' : ''}`}
          title="Texto livre (Arraste ou clique) [T]"
        >
          <Type className="w-4 h-4" />
        </button>

        {/* Image Tool */}
        <button
          onClick={onInsertImage}
          className="canvas-tool-btn hover:text-fuchsia-400"
          title="Inserir Imagem (Arquivo ou URL) [I]"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        {/* Link Tool */}
        <button
          onClick={onInsertLink}
          className="canvas-tool-btn hover:text-cyan-400"
          title="Inserir Link / Favorito Web [L]"
        >
          <Link2 className="w-4 h-4" />
        </button>

        {/* Library Tool (Insert Kanban Tasks & Vault Notes) */}
        <button
          onClick={onOpenInsertLibrary}
          className="canvas-tool-btn hover:text-emerald-400"
          title="Inserir Tarefa do Kanban ou Nota do Vault"
        >
          <FolderPlus className="w-4 h-4" />
        </button>

        {/* Connector Dropdown & Split Button */}
        <div className="relative">
          <div className="flex items-center">
            <button
              onClick={() => handleToolSelect('connector')}
              className={`canvas-tool-btn rounded-r-none ${activeTool === 'connector' ? 'active' : ''}`}
              title={`Conector / Seta [C] • Tipo ativo: ${
                defaultEdgeRouting === 'straight'
                  ? 'Reta'
                  : defaultEdgeRouting === 'curved'
                  ? 'Curva'
                  : defaultEdgeRouting === 'cyclic'
                  ? 'Cíclica'
                  : 'De Dobra'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setConnectorMenuOpen(!connectorMenuOpen);
                setShapeMenuOpen(false);
              }}
              className={`h-9 px-1 rounded-r-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ${
                activeTool === 'connector' ? 'bg-purple-600/30 text-white' : ''
              }`}
              title="Escolher Tipo de Linha do Conector"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {connectorMenuOpen && (
            <div className="absolute top-11 left-0 flex flex-col gap-1 p-1.5 rounded-xl canvas-glass-panel shadow-2xl z-30 min-w-[150px] text-xs">
              <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 uppercase tracking-wider">
                Tipo de Linha
              </span>
              {[
                { id: 'straight' as const, label: 'Reta', desc: 'Linha direta' },
                { id: 'orthogonal' as const, label: 'De Dobra', desc: 'Ângulo de 90°' },
                { id: 'curved' as const, label: 'Curva', desc: 'Bézier suave' },
                { id: 'cyclic' as const, label: 'Cíclica', desc: 'Loop / Arco cíclico' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    canvasStore.setDefaultEdgeRouting(item.id);
                    canvasStore.setActiveTool('connector');
                    setConnectorMenuOpen(false);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                    defaultEdgeRouting === item.id
                      ? 'bg-purple-600/30 text-purple-200 font-bold'
                      : 'hover:bg-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{item.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{item.desc}</span>
                  </div>
                  {defaultEdgeRouting === item.id && <Check className="w-3.5 h-3.5 text-purple-400 ml-2" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Freehand Pen */}
        <button
          onClick={() => handleToolSelect('pen')}
          className={`canvas-tool-btn ${activeTool === 'pen' ? 'active' : ''}`}
          title="Desenho contínuo (Caneta) [P] • Pressione V ou Esc para selecionar"
        >
          <PenTool className="w-4 h-4" />
        </button>

        {/* Frame / Group */}
        <button
          draggable
          onDragStart={(e) => setDragTool(e, { tool: 'frame' })}
          onClick={() => handleToolSelect('frame')}
          className={`canvas-tool-btn cursor-grab active:cursor-grabbing ${activeTool === 'frame' ? 'active' : ''}`}
          title="Quadro / Grupo (Arraste ou clique)"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>

        <div className="canvas-divider" />

        {/* Undo */}
        <button
          onClick={() => canvasStore.undo()}
          disabled={!canUndo}
          className="canvas-tool-btn disabled:opacity-30 disabled:pointer-events-none"
          title="Desfazer (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {/* Redo */}
        <button
          onClick={() => canvasStore.redo()}
          disabled={!canRedo}
          className="canvas-tool-btn disabled:opacity-30 disabled:pointer-events-none"
          title="Refazer (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="canvas-divider" />

        {/* Theme Quick Switcher: Dark vs Light */}
        <button
          onClick={() => canvasStore.toggleTheme()}
          className={`canvas-tool-btn ${theme === 'light' ? 'text-amber-500' : 'text-indigo-400'}`}
          title={theme === 'dark' ? 'Mudar para modo Branco (White)' : 'Mudar para modo Escuro (Dark)'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Grid Style Toggle */}
        <button
          onClick={handleCycleGrid}
          className="canvas-tool-btn"
          title={gridLabel}
        >
          <Grid className="w-4 h-4" />
        </button>

        {/* Export image shortcut */}
        {onExportImage && (
          <button
            onClick={onExportImage}
            className="canvas-tool-btn hover:text-emerald-400"
            title="Exportar imagem do quadro (PNG)"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        <div className="canvas-divider" />

        {/* 3 PONTOS: MENU COMPLETO DO QUADRO BRANCO (...) */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOptionsMenuOpen(!optionsMenuOpen)}
            className={`canvas-tool-btn ${optionsMenuOpen ? 'active' : ''}`}
            title="Mais Opções do Quadro (...)"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {optionsMenuOpen && (
            <div className="absolute top-12 right-0 w-72 rounded-2xl canvas-glass-panel shadow-2xl z-40 p-3 space-y-3 animate-in fade-in zoom-in-95 duration-150 text-xs">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span className="font-bold text-slate-100">Opções do Quadro</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                  Nível {userLevel}
                </span>
              </div>

              {/* Câmera & Visualização */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                  Câmera & Visualização
                </span>
                {onFitToView && (
                  <button
                    onClick={() => {
                      onFitToView();
                      setOptionsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-slate-200 transition text-left"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Enquadrar Conteúdo (Fit to View)</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    canvasStore.setCamera({ zoom: 1.0 });
                    setOptionsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-slate-200 transition text-left"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Redefinir Zoom para 100%</span>
                </button>
                {onToggleMiniMap && (
                  <button
                    onClick={onToggleMiniMap}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-slate-200 transition text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Map className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Radar Minimapa</span>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${showMiniMap ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                      {showMiniMap ? 'Visível' : 'Oculto'}
                    </span>
                  </button>
                )}
              </div>

              {/* Temas do Quadro (Gamificação / Níveis 15, 25, 35, 50) */}
              <div className="space-y-1.5 pt-1 border-t border-white/10">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Temas do Quadro
                  </span>
                  <span className="text-[10px] text-fuchsia-400 font-mono">
                    {CANVAS_THEMES.filter((t) => isThemeUnlocked(t.id, userLevel)).length} / {CANVAS_THEMES.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {CANVAS_THEMES.map((th) => {
                    const unlocked = isThemeUnlocked(th.id, userLevel);
                    const isActive = theme === th.id;
                    return (
                      <button
                        key={th.id}
                        onClick={() => handleSelectTheme(th.id, th.minLevel)}
                        style={{
                          backgroundColor: th.previewBg,
                          borderColor: isActive ? th.accentColor : th.previewBorder,
                        }}
                        className={`flex flex-col p-2 rounded-xl border text-left transition-all relative overflow-hidden group ${
                          isActive ? 'ring-2 ring-offset-1 ring-offset-black' : 'hover:scale-[1.02]'
                        } ${!unlocked ? 'opacity-65' : ''}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className="font-bold text-[11px] truncate"
                            style={{ color: isActive ? th.accentColor : '#ffffff' }}
                          >
                            {th.name}
                          </span>
                          {!unlocked ? (
                            <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                          ) : isActive ? (
                            <Check className="w-3 h-3 shrink-0" style={{ color: th.accentColor }} />
                          ) : null}
                        </div>
                        <span className="text-[9px] text-slate-400 mt-0.5 truncate">
                          {unlocked ? th.subtitle : `Bloqueado • Nível ${th.minLevel}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exportação & Integrações */}
              <div className="space-y-1 pt-1 border-t border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                  Exportar & Citações
                </span>
                {onExportImage && (
                  <button
                    onClick={() => {
                      onExportImage();
                      setOptionsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-slate-200 transition text-left"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Exportar como Imagem (PNG)</span>
                  </button>
                )}
                <button
                  onClick={handleExportDocJson}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-slate-200 transition text-left"
                >
                  <FileCode className="w-3.5 h-3.5 text-blue-400" />
                  <span>Exportar .canvas (Obsidian)</span>
                </button>
                <button
                  onClick={handleCopyCitation}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-slate-200 transition text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Copy className="w-3.5 h-3.5 text-fuchsia-400" />
                    <span>Copiar Citação para Notas</span>
                  </div>
                  {copiedCitation && (
                    <span className="text-[10px] text-emerald-400 font-bold">Copiado!</span>
                  )}
                </button>
              </div>

              {/* Atalhos & Limpeza */}
              <div className="space-y-1 pt-1 border-t border-white/10">
                <button
                  onClick={() => {
                    setShowShortcutsModal(true);
                    setOptionsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-slate-200 transition text-left"
                >
                  <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Guia de Atalhos de Teclado</span>
                </button>
                <button
                  onClick={handleClearBoard}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-red-500/20 text-red-400 transition text-left"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Limpar Todo o Quadro</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Guia de Atalhos */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl canvas-glass-panel border border-slate-700/80 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-fuchsia-400" />
                <h3 className="font-bold text-white text-sm">Atalhos do Quadro Branco</h3>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-300">Mover a tela (Pan)</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px] text-fuchsia-300">
                  Espaço + Arrastar
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-300">Zoom no cursor</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px] text-fuchsia-300">
                  Scroll do Mouse
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-300">Criar nota de texto</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px] text-slate-300">
                  Duplo clique
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-300">Colar imagem ou link</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px] text-slate-300">
                  Ctrl + V
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-300">Duplicar selecionados</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px] text-slate-300">
                  Ctrl + D
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-300">Alternar Claro / Escuro</span>
                <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px] text-slate-300">
                  Shift + D
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-300">Ferramentas rápidas</span>
                <span className="font-mono text-[11px] text-amber-300">
                  V (Mover), H (Mão), S (Nota), T (Texto), P (Caneta)
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="w-full py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 font-bold text-white text-xs transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};