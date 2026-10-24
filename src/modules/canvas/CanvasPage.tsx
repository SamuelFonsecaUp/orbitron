import React, { useEffect, useRef, useState } from 'react';
import { canvasStore, useCanvasStore } from './store/canvasStore';
import { SvgScene } from './render/SvgScene';
import { Toolbar } from './ui/Toolbar';
import { PropertyPanel } from './ui/PropertyPanel';
import { ZoomControls } from './ui/ZoomControls';
import { MiniMap } from './ui/MiniMap';
import { NodeTextEditor } from './ui/NodeTextEditor';
import { useResizeObserver } from './hooks/useResizeObserver';
import { useWheelZoom } from './hooks/useWheelZoom';
import { useCanvasKeyboard } from './hooks/useCanvasKeyboard';
import { useCanvasPointer } from './hooks/useCanvasPointer';
import { CanvasNode } from './io/jsonCanvas.types';
import { screenToWorld } from './scene/camera';
import { createAddNodeCommand } from './scene/commands';
import { createNewPlacedNode } from './hooks/pointerNodeCreation';
import './ui/canvas.css';

interface CanvasPageProps {
  filePath: string;
}

export const CanvasPage: React.FC<CanvasPageProps> = ({ filePath }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const size = useResizeObserver(containerRef);
  const [editingNode, setEditingNode] = useState<CanvasNode | null>(null);

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const camera = useCanvasStore((s) => s.camera);
  const selection = useCanvasStore((s) => s.selection);
  const snapGuides = useCanvasStore((s) => s.snapGuides);
  const toolColor = useCanvasStore((s) => s.toolColor);

  useWheelZoom(containerRef);
  useCanvasKeyboard();

  const {
    selectionBox, ephemeral, onCanvasPointerDown, onNodePointerDown,
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ptWorld = screenToWorld({ x: e.clientX - rect.left, y: e.clientY - rect.top }, camera);

    // 1. Dragged from Toolbar (Sticky, Shape, Text, Frame)
    const toolData = e.dataTransfer.getData('application/orbitron-tool');
    if (toolData) {
      try {
        const { tool, shape } = JSON.parse(toolData);
        const node = createNewPlacedNode(tool, shape || 'rectangle', toolColor, ptWorld);
        canvasStore.dispatch(createAddNodeCommand(node));
        return;
      } catch (err) {}
    }

    // 2. Dragged from Vault Sidebar (Markdown note or file)
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

    // 3. Dragged image file from desktop
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          const imgNode: CanvasNode = {
            id: `img-${Date.now()}`,
            type: 'link',
            url: reader.result as string,
            x: Math.round(ptWorld.x - 150),
            y: Math.round(ptWorld.y - 120),
            width: 300,
            height: 240,
            color: toolColor,
          };
          canvasStore.dispatch(createAddNodeCommand(imgNode));
        };
        reader.readAsDataURL(file);
        return;
      }
    }

    // 4. Fallback plain text drop
    const text = e.dataTransfer.getData('text/plain');
    if (text) {
      const node = createNewPlacedNode('sticky', 'sticky', toolColor, ptWorld);
      node.text = text;
      canvasStore.dispatch(createAddNodeCommand(node));
    }
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
          ctx.fillStyle = '#090d16';
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

  return (
    <div
      ref={containerRef}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
      onDrop={handleDrop}
      className="relative w-full h-full overflow-hidden bg-[#090d16] select-none"
    >
      <Toolbar onExportImage={handleExportImage} />
      <PropertyPanel />
      <ZoomControls viewportWidth={size.width} viewportHeight={size.height} />
      <MiniMap viewportWidth={size.width} viewportHeight={size.height} />

      {nodes.length === 0 && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 text-center text-slate-400 text-sm max-w-sm backdrop-blur-md animate-in fade-in duration-300 shadow-2xl">
            <p className="font-semibold text-white mb-1.5 text-base">✨ Quadro em Branco</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Arraste notas adesivas ou formas diretamente da barra superior, ou puxe notas da barra lateral para cá!
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
        selectionBox={selectionBox}
        ephemeral={ephemeral}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onNodePointerDown={onNodePointerDown}
        onNodeDoubleClick={(_e, node) => setEditingNode(node)}
        onAnchorPointerDown={onAnchorPointerDown}
        onEdgePointerDown={onEdgePointerDown}
        onHandlePointerDown={onHandlePointerDown}
        onRotateHandlePointerDown={onRotateHandlePointerDown}
      />

      {editingNode && (
        <NodeTextEditor node={editingNode} camera={camera} onClose={() => setEditingNode(null)} />
      )}
    </div>
  );
};
