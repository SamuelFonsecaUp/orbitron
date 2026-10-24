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

  useWheelZoom(containerRef);
  useCanvasKeyboard();

  const {
    selectionBox,
    ephemeral,
    onCanvasPointerDown,
    onNodePointerDown,
    onAnchorPointerDown,
    onHandlePointerDown,
    onRotateHandlePointerDown,
    onEdgePointerDown,
    onPointerMove,
    onPointerUp,
  } = useCanvasPointer(svgRef);

  useEffect(() => {
    let isCancelled = false;
    const load = async () => {
      try {
        const api = (window as any).electronAPI?.canvas || (window as any).orbitronCanvasApi;
        if (api?.read) {
          const res = await api.read(filePath);
          if (!isCancelled && res?.doc) {
            canvasStore.loadDocument(filePath, res.doc, res.hash || '');
          }
        }
      } catch (err) {
        console.error('[CanvasPage] Erro ao carregar quadro:', err);
      }
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
    } catch (e) {
      console.error('[CanvasPage] Erro ao exportar imagem:', e);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-[#090d16] select-none">
      {/* Floating Lucidspark Toolbar */}
      <Toolbar onExportImage={handleExportImage} />

      {/* Floating Property Panel for selected items */}
      <PropertyPanel />

      {/* Zoom and Fit Controls */}
      <ZoomControls viewportWidth={size.width} viewportHeight={size.height} />

      {/* Interactive MiniMap */}
      <MiniMap viewportWidth={size.width} viewportHeight={size.height} />

      {/* Empty State Helper hint when canvas has 0 nodes */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-sm max-w-sm backdrop-blur-sm animate-in fade-in duration-300">
            <p className="font-semibold text-white mb-1">✨ Quadro Infinito Vazio</p>
            <p className="text-xs text-slate-400">
              Clique em <span className="text-purple-400 font-medium">Nota</span> ou <span className="text-purple-400 font-medium">Formas</span> na barra superior e clique no quadro para criar ideias livres.
            </p>
          </div>
        </div>
      )}

      {/* SVG Canvas Scene */}
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

      {/* Inline text editor */}
      {editingNode && (
        <NodeTextEditor
          node={editingNode}
          camera={camera}
          onClose={() => setEditingNode(null)}
        />
      )}
    </div>
  );
};
