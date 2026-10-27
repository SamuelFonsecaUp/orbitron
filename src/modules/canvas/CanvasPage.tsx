import React, { useEffect, useRef, useState } from 'react';
import { canvasStore, useCanvasStore } from './store/canvasStore';
import { SvgScene } from './render/SvgScene';
import { Toolbar } from './ui/Toolbar';
import { PropertyPanel } from './ui/PropertyPanel';
import { ZoomControls } from './ui/ZoomControls';
import { MiniMap } from './ui/MiniMap';
import { NodeTextEditor } from './ui/NodeTextEditor';
import { InsertImageModal } from './ui/InsertImageModal';
import { InsertLinkModal } from './ui/InsertLinkModal';
import { InsertLibraryModal } from './ui/InsertLibraryModal';
import { ImageLightboxModal } from './ui/ImageLightboxModal';
import { useResizeObserver } from './hooks/useResizeObserver';
import { useWheelZoom } from './hooks/useWheelZoom';
import { useCanvasKeyboard } from './hooks/useCanvasKeyboard';
import { useCanvasPointer } from './hooks/useCanvasPointer';
import { CanvasNode, CanvasEdge } from './io/jsonCanvas.types';
import { KanbanTask } from '../kanban/types';
import { screenToWorld, calculateFitCamera } from './scene/camera';
import { createAddNodeCommand, createUpdateEdgeCommand } from './scene/commands';
import { createNewPlacedNode } from './hooks/pointerNodeCreation';
import { isImageSource, isWebUrl, normalizeUrl, getDomain } from './scene/nodeUtils';
import './ui/canvas.css';

interface CanvasPageProps {
  filePath: string;
}

export const CanvasPage: React.FC<CanvasPageProps> = ({ filePath }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const size = useResizeObserver(containerRef);
  const [editingNode, setEditingNode] = useState<CanvasNode | null>(null);
  const [showMiniMap, setShowMiniMap] = useState(true);

  // Modals state
  const [isInsertImageOpen, setIsInsertImageOpen] = useState(false);
  const [isInsertLinkOpen, setIsInsertLinkOpen] = useState(false);
  const [isInsertLibraryOpen, setIsInsertLibraryOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; caption?: string } | null>(null);

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const camera = useCanvasStore((s) => s.camera);
  const selection = useCanvasStore((s) => s.selection);
  const snapGuides = useCanvasStore((s) => s.snapGuides);
  const toolColor = useCanvasStore((s) => s.toolColor);
  const theme = useCanvasStore((s) => s.theme);
  const gridPattern = useCanvasStore((s) => s.gridPattern);

  useWheelZoom(containerRef);
  useCanvasKeyboard();

  const {
    selectionBox, ephemeral, isSpaceActive, isSpaceDragging,
    onCanvasPointerDown, onNodePointerDown,
    onAnchorPointerDown, onHandlePointerDown, onRotateHandlePointerDown,
    onEdgePointerDown, onPointerMove, onPointerUp,
  } = useCanvasPointer(svgRef);

  useEffect(() => {
    let isCancelled = false;
    const load = async () => {
      try {
        const api = (window as any).electronAPI?.canvas || (window as any).orbitronCanvasApi;
        if (api?.read) {
          const res = await api.read(filePath);
          if (!isCancelled && res?.doc) canvasStore.loadDocument(filePath, res.doc, res.hash || '');
        }
      } catch (err) { console.error('[CanvasPage] Erro ao carregar quadro:', err); }
    };
    load();
    const handleBeforeUnload = () => { canvasStore.flushSave(); };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      isCancelled = true;
      canvasStore.flushSave();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [filePath]);

  // Global Clipboard Paste (Ctrl+V) for images, links and text
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      const rect = containerRef.current?.getBoundingClientRect();
      const centerScreen = rect
        ? { x: rect.width / 2, y: rect.height / 2 }
        : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      const ptWorld = screenToWorld(centerScreen, camera);

      // Check for image blob in clipboard
      if (e.clipboardData?.items) {
        for (const item of Array.from(e.clipboardData.items)) {
          if (item.type.startsWith('image/')) {
            const blob = item.getAsFile();
            if (blob) {
              e.preventDefault();
              const reader = new FileReader();
              reader.onload = () => {
                const dataUrl = reader.result as string;
                const img = new Image();
                img.onload = () => {
                  const targetWidth = 360;
                  const ratio = img.naturalHeight / (img.naturalWidth || 1);
                  const targetHeight = Math.round(targetWidth * (ratio || 0.75));
                  const imgNode: CanvasNode = {
                    id: `img-${Date.now()}`,
                    type: 'link',
                    url: dataUrl,
                    x: Math.round(ptWorld.x - targetWidth / 2),
                    y: Math.round(ptWorld.y - targetHeight / 2),
                    width: targetWidth,
                    height: Math.min(650, Math.max(120, targetHeight)),
                    color: toolColor,
                    orbitron: { shape: 'image' },
                  };
                  canvasStore.dispatch(createAddNodeCommand(imgNode));
                  canvasStore.setSelection([imgNode.id]);
                };
                img.src = dataUrl;
              };
              reader.readAsDataURL(blob);
              return;
            }
          }
        }
      }

      // Check for plain text or web URL in clipboard
      const text = e.clipboardData?.getData('text/plain')?.trim();
      if (text) {
        if (isWebUrl(text)) {
          e.preventDefault();
          if (isImageSource(text)) {
            const imgNode: CanvasNode = {
              id: `img-${Date.now()}`,
              type: 'link',
              url: text,
              x: Math.round(ptWorld.x - 180),
              y: Math.round(ptWorld.y - 120),
              width: 360,
              height: 240,
              color: toolColor,
              orbitron: { shape: 'image' },
            };
            canvasStore.dispatch(createAddNodeCommand(imgNode));
            canvasStore.setSelection([imgNode.id]);
          } else {
            const norm = normalizeUrl(text);
            const domain = getDomain(norm);
            const linkNode: CanvasNode = {
              id: `link-${Date.now()}`,
              type: 'link',
              url: norm,
              label: domain,
              x: Math.round(ptWorld.x - 160),
              y: Math.round(ptWorld.y - 65),
              width: 320,
              height: 130,
              color: toolColor,
            };
            canvasStore.dispatch(createAddNodeCommand(linkNode));
            canvasStore.setSelection([linkNode.id]);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [camera, toolColor]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ptWorld = screenToWorld({ x: e.clientX - rect.left, y: e.clientY - rect.top }, camera);

    const toolData = e.dataTransfer.getData('application/orbitron-tool');
    if (toolData) {
      try {
        const { tool, shape } = JSON.parse(toolData);
        const node = createNewPlacedNode(tool, shape || 'rectangle', toolColor, ptWorld);
        canvasStore.dispatch(createAddNodeCommand(node));
        return;
      } catch (err) {}
    }

    const noteData = e.dataTransfer.getData('application/orbitron-note');
    if (noteData) {
      try {
        const { relativePath, title } = JSON.parse(noteData);
        const fileNode: CanvasNode = {
          id: `file-${Date.now()}`,
          type: 'file',
          file: relativePath,
          x: Math.round(ptWorld.x - 140),
          y: Math.round(ptWorld.y - 80),
          width: 280,
          height: 160,
          color: toolColor,
          text: title,
        };
        canvasStore.dispatch(createAddNodeCommand(fileNode));
        return;
      } catch (err) {}
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const img = new Image();
          img.onload = () => {
            const targetWidth = 360;
            const ratio = img.naturalHeight / (img.naturalWidth || 1);
            const targetHeight = Math.round(targetWidth * (ratio || 0.75));
            const imgNode: CanvasNode = {
              id: `img-${Date.now()}`,
              type: 'link',
              url: dataUrl,
              label: file.name.replace(/\.[^/.]+$/, ''),
              x: Math.round(ptWorld.x - targetWidth / 2),
              y: Math.round(ptWorld.y - targetHeight / 2),
              width: targetWidth,
              height: Math.min(650, Math.max(120, targetHeight)),
              color: toolColor,
              orbitron: { shape: 'image' },
            };
            canvasStore.dispatch(createAddNodeCommand(imgNode));
            canvasStore.setSelection([imgNode.id]);
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(file);
        return;
      }
    }

    const text = e.dataTransfer.getData('text/plain');
    if (text) {
      const trimmed = text.trim();
      if (isWebUrl(trimmed)) {
        if (isImageSource(trimmed)) {
          const imgNode: CanvasNode = {
            id: `img-${Date.now()}`,
            type: 'link',
            url: trimmed,
            x: Math.round(ptWorld.x - 180),
            y: Math.round(ptWorld.y - 120),
            width: 360,
            height: 240,
            color: toolColor,
            orbitron: { shape: 'image' },
          };
          canvasStore.dispatch(createAddNodeCommand(imgNode));
          canvasStore.setSelection([imgNode.id]);
        } else {
          const norm = normalizeUrl(trimmed);
          const domain = getDomain(norm);
          const linkNode: CanvasNode = {
            id: `link-${Date.now()}`,
            type: 'link',
            url: norm,
            label: domain,
            x: Math.round(ptWorld.x - 160),
            y: Math.round(ptWorld.y - 65),
            width: 320,
            height: 130,
            color: toolColor,
          };
          canvasStore.dispatch(createAddNodeCommand(linkNode));
          canvasStore.setSelection([linkNode.id]);
        }
        return;
      }
      const node = createNewPlacedNode('sticky', 'sticky', toolColor, ptWorld);
      node.text = text;
      canvasStore.dispatch(createAddNodeCommand(node));
      canvasStore.setSelection([node.id]);
    }
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const ptWorld = screenToWorld({ x: e.clientX - rect.left, y: e.clientY - rect.top }, camera);
    const target = e.target as HTMLElement;
    if (target.tagName === 'svg' || target.classList.contains('canvas-grid-bg') || target.tagName === 'line') {
      const node = createNewPlacedNode('sticky', 'sticky', toolColor, ptWorld);
      canvasStore.dispatch(createAddNodeCommand(node));
      canvasStore.setSelection([node.id]);
      setEditingNode(node);
    }
  };

  const handleNodeDoubleClick = (_e: React.MouseEvent, node: CanvasNode) => {
    if (node.type === 'link' || node.orbitron?.shape === 'link') {
      if (isImageSource(node.url)) {
        setLightboxImage({ src: node.url || '', caption: node.label || node.text });
      } else {
        const currentUrl = node.url || '';
        const newUrl = window.prompt('Editar URL do link:', currentUrl);
        if (newUrl !== null) {
          const currentLabel = node.label || node.text || '';
          const newLabel = window.prompt('Editar título do link (opcional):', currentLabel);
          const norm = normalizeUrl(newUrl);
          canvasStore.dispatch(
            createAddNodeCommand({
              ...node,
              url: norm,
              label: newLabel !== null ? newLabel.trim() : node.label,
            })
          );
        }
      }
      return;
    }

    if (isImageSource(node.url || node.file)) {
      setLightboxImage({ src: node.url || node.file || '', caption: node.label || node.text });
      return;
    }

    setEditingNode(node);
  };

  const handleEdgeDoubleClick = (_e: React.MouseEvent, edge: CanvasEdge) => {
    const current = edge.label || '';
    const newLabel = window.prompt('Rótulo da conexão:', current);
    if (newLabel !== null) {
      canvasStore.dispatch(createUpdateEdgeCommand(edge.id, { label: current }, { label: newLabel.trim() }));
    }
  };

  const handleInsertImageSubmit = (src: string, caption?: string) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const centerScreen = rect
      ? { x: rect.width / 2, y: rect.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ptWorld = screenToWorld(centerScreen, camera);

    const img = new Image();
    img.onload = () => {
      const targetWidth = 380;
      const ratio = img.naturalHeight / (img.naturalWidth || 1);
      const targetHeight = Math.round(targetWidth * (ratio || 0.75));
      const imgNode: CanvasNode = {
        id: `img-${Date.now()}`,
        type: 'link',
        url: src,
        label: caption,
        x: Math.round(ptWorld.x - targetWidth / 2),
        y: Math.round(ptWorld.y - targetHeight / 2),
        width: targetWidth,
        height: Math.min(650, Math.max(120, targetHeight)),
        color: toolColor,
        orbitron: { shape: 'image' },
      };
      canvasStore.dispatch(createAddNodeCommand(imgNode));
      canvasStore.setSelection([imgNode.id]);
    };
    img.onerror = () => {
      const imgNode: CanvasNode = {
        id: `img-${Date.now()}`,
        type: 'link',
        url: src,
        label: caption,
        x: Math.round(ptWorld.x - 180),
        y: Math.round(ptWorld.y - 120),
        width: 360,
        height: 240,
        color: toolColor,
        orbitron: { shape: 'image' },
      };
      canvasStore.dispatch(createAddNodeCommand(imgNode));
      canvasStore.setSelection([imgNode.id]);
    };
    img.src = src;
  };

  const handleInsertLinkSubmit = (url: string, title?: string, note?: string) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const centerScreen = rect
      ? { x: rect.width / 2, y: rect.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ptWorld = screenToWorld(centerScreen, camera);

    const domain = getDomain(url);
    const linkNode: CanvasNode = {
      id: `link-${Date.now()}`,
      type: 'link',
      url,
      label: title || domain,
      text: note,
      x: Math.round(ptWorld.x - 160),
      y: Math.round(ptWorld.y - 65),
      width: 320,
      height: 130,
      color: toolColor,
    };
    canvasStore.dispatch(createAddNodeCommand(linkNode));
    canvasStore.setSelection([linkNode.id]);
  };

  const handleInsertTask = (task: KanbanTask) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const centerScreen = rect
      ? { x: rect.width / 2, y: rect.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ptWorld = screenToWorld(centerScreen, camera);

    const taskNode: CanvasNode = {
      id: `kanban-${task.id}-${Date.now().toString(36)}`,
      type: 'text',
      x: Math.round(ptWorld.x - 130),
      y: Math.round(ptWorld.y - 75),
      width: 260,
      height: 150,
      color: task.priority === 'urgent' ? '1' : task.priority === 'high' ? '2' : '4',
      text: task.title,
      orbitron: {
        shape: 'kanban_task',
        taskId: task.id,
        taskTitle: task.title,
        taskPriority: task.priority,
        taskColumnId: task.columnId,
      },
    };
    canvasStore.dispatch(createAddNodeCommand(taskNode));
    canvasStore.setSelection([taskNode.id]);
  };

  const handleInsertNote = (note: { path: string; title: string; snippet?: string }) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const centerScreen = rect
      ? { x: rect.width / 2, y: rect.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ptWorld = screenToWorld(centerScreen, camera);

    const noteNode: CanvasNode = {
      id: `vault-${Date.now().toString(36)}`,
      type: 'file',
      x: Math.round(ptWorld.x - 140),
      y: Math.round(ptWorld.y - 85),
      width: 280,
      height: 170,
      file: note.path,
      color: '6',
      text: note.snippet || note.title,
      orbitron: {
        shape: 'vault_note',
        notePath: note.path,
        noteTitle: note.title,
        noteSnippet: note.snippet,
      },
    };
    canvasStore.dispatch(createAddNodeCommand(noteNode));
    canvasStore.setSelection([noteNode.id]);
  };

  const handleExportImage = async () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    try {
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svgEl);
      const url = URL.createObjectURL(new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' }));
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = size.width;
        canvas.height = size.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = theme === 'light' ? '#ffffff' : '#090d16';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          const api = (window as any).electronAPI?.canvas || (window as any).orbitronCanvasApi;
          if (api?.exportImage) await api.exportImage(filePath, 'png', dataUrl);
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (e) { console.error('[CanvasPage] Erro ao exportar imagem:', e); }
  };

  const isLight = theme === 'light';

  const handleFitToView = () => {
    const nextCam = calculateFitCamera(nodes, size.width, size.height);
    canvasStore.setCamera(nextCam);
  };

  const boardTitle = filePath ? filePath.split(/[\\/]/).pop()?.replace(/\.canvas$/i, '') : 'Quadro Geral';

  return (
    <div
      ref={containerRef}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
      onDrop={handleDrop}
      className={`relative w-full h-full overflow-hidden select-none transition-colors duration-200 ${
        isLight
          ? 'bg-[#f8fafc] canvas-theme-light'
          : theme === 'blueprint'
          ? 'bg-[#071527] canvas-theme-blueprint'
          : theme === 'cyberpunk'
          ? 'bg-[#0e041d] canvas-theme-cyberpunk'
          : theme === 'golden'
          ? 'bg-[#130f06] canvas-theme-golden'
          : theme === 'cosmic'
          ? 'bg-[#060410] canvas-theme-cosmic'
          : 'bg-[#090d16] canvas-theme-dark'
      } ${isSpaceDragging ? 'canvas-space-dragging' : isSpaceActive ? 'canvas-space-active' : ''}`}
    >
      <Toolbar
        onExportImage={handleExportImage}
        onInsertImage={() => setIsInsertImageOpen(true)}
        onInsertLink={() => setIsInsertLinkOpen(true)}
        onOpenInsertLibrary={() => setIsInsertLibraryOpen(true)}
        onFitToView={handleFitToView}
        showMiniMap={showMiniMap}
        onToggleMiniMap={() => setShowMiniMap(!showMiniMap)}
        boardTitle={boardTitle}
      />
      <PropertyPanel />
      <ZoomControls viewportWidth={size.width} viewportHeight={size.height} />
      {showMiniMap && <MiniMap viewportWidth={size.width} viewportHeight={size.height} />}

      {nodes.length === 0 && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className={`p-6 rounded-2xl text-center text-sm max-w-sm backdrop-blur-md animate-in fade-in duration-300 shadow-2xl border ${
              isLight
                ? 'bg-white/90 border-slate-200 text-slate-600 shadow-slate-200/50'
                : 'bg-slate-900/70 border-slate-800 text-slate-400'
            }`}
          >
            <p className={`font-semibold mb-1.5 text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
              ✨ Quadro em Branco
            </p>
            <p className="text-xs leading-relaxed">
              Dê um duplo clique para criar notas, cole imagens ou links com <kbd className="px-1.5 py-0.5 rounded bg-black/10 font-mono text-[10px]">Ctrl+V</kbd>, ou use a barra de ferramentas acima!
            </p>
          </div>
        </div>
      )}

      <SvgScene
        svgRef={svgRef}
        nodes={nodes}
        edges={edges}
        camera={camera}
        selection={selection}
        snapGuides={snapGuides}
        viewportWidth={size.width}
        viewportHeight={size.height}
        theme={theme}
        gridPattern={gridPattern}
        selectionBox={selectionBox}
        ephemeral={ephemeral}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onCanvasDoubleClick={handleCanvasDoubleClick}
        onNodePointerDown={onNodePointerDown}
        onNodeDoubleClick={handleNodeDoubleClick}
        onAnchorPointerDown={onAnchorPointerDown}
        onEdgePointerDown={onEdgePointerDown}
        onEdgeDoubleClick={handleEdgeDoubleClick}
        onHandlePointerDown={onHandlePointerDown}
        onRotateHandlePointerDown={onRotateHandlePointerDown}
        onPreviewImage={(src, label) => setLightboxImage({ src, caption: label })}
      />

      {editingNode && (
        <NodeTextEditor node={editingNode} camera={camera} onClose={() => setEditingNode(null)} />
      )}

      {/* Modal Inserir Imagem */}
      <InsertImageModal
        isOpen={isInsertImageOpen}
        theme={theme}
        onClose={() => setIsInsertImageOpen(false)}
        onSubmit={handleInsertImageSubmit}
      />

      {/* Modal Inserir Link */}
      <InsertLinkModal
        isOpen={isInsertLinkOpen}
        theme={theme}
        onClose={() => setIsInsertLinkOpen(false)}
        onSubmit={handleInsertLinkSubmit}
      />

      {/* Modal Inserir Itens da Biblioteca (Kanban e Vault) */}
      <InsertLibraryModal
        isOpen={isInsertLibraryOpen}
        theme={theme}
        onClose={() => setIsInsertLibraryOpen(false)}
        onInsertTask={handleInsertTask}
        onInsertNote={handleInsertNote}
      />

      {/* Lightbox / Visualizador de Imagem em Tela Cheia */}
      <ImageLightboxModal
        isOpen={Boolean(lightboxImage)}
        src={lightboxImage?.src || null}
        caption={lightboxImage?.caption}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
};
