import React, { useState } from 'react';
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
} from 'lucide-react';
import { useCanvasStore, canvasStore } from '../store/canvasStore';
import { CanvasTool, CanvasShapeType } from '../store/canvasStore.types';

interface ToolbarProps {
  onExportImage?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onExportImage }) => {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const toolShape = useCanvasStore((s) => s.toolShape);
  const canUndo = useCanvasStore((s) => s.canUndo);
  const canRedo = useCanvasStore((s) => s.canRedo);
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);

  const handleToolSelect = (tool: CanvasTool) => {
    canvasStore.setActiveTool(tool);
    setShapeMenuOpen(false);
  };

  const handleShapeSelect = (shape: CanvasShapeType) => {
    canvasStore.setToolShape(shape);
    canvasStore.setActiveTool('shape');
    setShapeMenuOpen(false);
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
      case 'rectangle':
      default:
        return <Square className="w-4 h-4" />;
    }
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl canvas-glass-panel">
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
        title="Mover tela (Espaço ou H)"
      >
        <Hand className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-5 bg-white/10 my-auto mx-0.5" />

      {/* Sticky Note - Draggable & Clickable */}
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
            className={`h-9 px-1 rounded-r-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ${activeTool === 'shape' ? 'bg-purple-600/30 text-white' : ''}`}
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {shapeMenuOpen && (
          <div className="absolute top-11 left-0 flex flex-col gap-1 p-1.5 rounded-xl canvas-glass-panel shadow-2xl z-30">
            <button
              onClick={() => handleShapeSelect('rectangle')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-purple-600/20 hover:text-white"
            >
              <Square className="w-3.5 h-3.5" /> Retângulo
            </button>
            <button
              onClick={() => handleShapeSelect('ellipse')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-purple-600/20 hover:text-white"
            >
              <Circle className="w-3.5 h-3.5" /> Elipse
            </button>
            <button
              onClick={() => handleShapeSelect('diamond')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-purple-600/20 hover:text-white"
            >
              <Diamond className="w-3.5 h-3.5" /> Losango
            </button>
            <button
              onClick={() => handleShapeSelect('triangle')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-purple-600/20 hover:text-white"
            >
              <Triangle className="w-3.5 h-3.5" /> Triângulo
            </button>
          </div>
        )}
      </div>

      {/* Text - Draggable & Clickable */}
      <button
        draggable
        onDragStart={(e) => setDragTool(e, { tool: 'text' })}
        onClick={() => handleToolSelect('text')}
        className={`canvas-tool-btn cursor-grab active:cursor-grabbing ${activeTool === 'text' ? 'active' : ''}`}
        title="Texto livre (Arraste ou clique) [T]"
      >
        <Type className="w-4 h-4" />
      </button>

      {/* Connector */}
      <button
        onClick={() => handleToolSelect('connector')}
        className={`canvas-tool-btn ${activeTool === 'connector' ? 'active' : ''}`}
        title="Conector / Seta [C]"
      >
        <ArrowUpRight className="w-4 h-4" />
      </button>

      {/* Freehand Pen */}
      <button
        onClick={() => handleToolSelect('pen')}
        className={`canvas-tool-btn ${activeTool === 'pen' ? 'active' : ''}`}
        title="Desenho livre (Caneta) [P]"
      >
        <PenTool className="w-4 h-4" />
      </button>

      {/* Frame / Group - Draggable & Clickable */}
      <button
        draggable
        onDragStart={(e) => setDragTool(e, { tool: 'frame' })}
        onClick={() => handleToolSelect('frame')}
        className={`canvas-tool-btn cursor-grab active:cursor-grabbing ${activeTool === 'frame' ? 'active' : ''}`}
        title="Quadro / Grupo (Arraste ou clique)"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-5 bg-white/10 my-auto mx-0.5" />

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

      {/* Export image */}
      {onExportImage && (
        <>
          <div className="w-[1px] h-5 bg-white/10 my-auto mx-0.5" />
          <button
            onClick={onExportImage}
            className="canvas-tool-btn"
            title="Exportar imagem do quadro (PNG)"
          >
            <Download className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
};
