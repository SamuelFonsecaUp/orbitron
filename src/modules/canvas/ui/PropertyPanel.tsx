import React from 'react';
import { Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useCanvasStore, canvasStore } from '../store/canvasStore';
import { CANVAS_COLORS } from '../render/colors';
import {
  createUpdateNodeCommand,
  createUpdateEdgeCommand,
  createDeleteElementsCommand,
  createReorderNodesCommand,
} from '../scene/commands';

export const PropertyPanel: React.FC = () => {
  const selection = useCanvasStore((s) => s.selection);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  if (selection.length === 0) return null;

  const selectedNodes = nodes.filter((n) => selection.includes(n.id));
  const selectedEdges = edges.filter((e) => selection.includes(e.id));

  const handleColorChange = (colorId: string) => {
    canvasStore.setToolColor(colorId);
    selectedNodes.forEach((node) => {
      canvasStore.dispatch(
        createUpdateNodeCommand(node.id, { color: node.color }, { color: colorId })
      );
    });
    selectedEdges.forEach((edge) => {
      canvasStore.dispatch(
        createUpdateEdgeCommand(edge.id, { color: edge.color }, { color: colorId })
      );
    });
  };

  const handleFontSizeChange = (size: number) => {
    selectedNodes.forEach((node) => {
      const prevSize = node.orbitron?.fontSize || 14;
      canvasStore.dispatch(
        createUpdateNodeCommand(
          node.id,
          { orbitron: { ...node.orbitron, fontSize: prevSize } },
          { orbitron: { ...node.orbitron, fontSize: size } }
        )
      );
    });
  };

  const handleRoutingChange = (routing: 'orthogonal' | 'bezier' | 'straight') => {
    selectedEdges.forEach((edge) => {
      const prev = edge.orbitron?.routing || 'orthogonal';
      canvasStore.dispatch(
        createUpdateEdgeCommand(
          edge.id,
          { orbitron: { ...edge.orbitron, routing: prev } },
          { orbitron: { ...edge.orbitron, routing } }
        )
      );
    });
  };

  const handleBringToFront = () => {
    const unselected = nodes.filter((n) => !selection.includes(n.id));
    const newOrder = [...unselected, ...selectedNodes].map((n) => n.id);
    canvasStore.dispatch(createReorderNodesCommand(nodes.map((n) => n.id), newOrder));
  };

  const handleSendToBack = () => {
    const unselected = nodes.filter((n) => !selection.includes(n.id));
    const newOrder = [...selectedNodes, ...unselected].map((n) => n.id);
    canvasStore.dispatch(createReorderNodesCommand(nodes.map((n) => n.id), newOrder));
  };

  const handleDelete = () => {
    canvasStore.dispatch(createDeleteElementsCommand(selectedNodes, selectedEdges));
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-2 rounded-xl canvas-glass-panel">
      {/* Colors palette */}
      <div className="flex items-center gap-1.5 px-1">
        {Object.entries(CANVAS_COLORS).map(([id, col]) => (
          <button
            key={id}
            onClick={() => handleColorChange(id)}
            style={{ backgroundColor: col.border }}
            className="w-5 h-5 rounded-full border border-white/20 hover:scale-125 transition-transform"
            title={col.name}
          />
        ))}
      </div>

      {selectedNodes.length > 0 && (
        <>
          <div className="w-[1px] h-5 bg-white/10 my-auto" />
          {/* Font Sizes */}
          <div className="flex items-center gap-1">
            {[12, 14, 18, 24].map((sz) => (
              <button
                key={sz}
                onClick={() => handleFontSizeChange(sz)}
                className="px-2 py-0.5 rounded text-xs text-slate-300 hover:text-white hover:bg-white/10"
              >
                {sz}
              </button>
            ))}
          </div>
        </>
      )}

      {selectedEdges.length > 0 && (
        <>
          <div className="w-[1px] h-5 bg-white/10 my-auto" />
          {/* Routing Types */}
          <div className="flex items-center gap-1 text-xs text-slate-300">
            <button
              onClick={() => handleRoutingChange('orthogonal')}
              className="px-2 py-0.5 rounded hover:bg-white/10 hover:text-white"
            >
              Ortogonal
            </button>
            <button
              onClick={() => handleRoutingChange('bezier')}
              className="px-2 py-0.5 rounded hover:bg-white/10 hover:text-white"
            >
              Curva
            </button>
            <button
              onClick={() => handleRoutingChange('straight')}
              className="px-2 py-0.5 rounded hover:bg-white/10 hover:text-white"
            >
              Reta
            </button>
          </div>
        </>
      )}

      {selectedNodes.length > 0 && (
        <>
          <div className="w-[1px] h-5 bg-white/10 my-auto" />
          {/* Reordering */}
          <button
            onClick={handleBringToFront}
            className="canvas-tool-btn !w-7 !h-7"
            title="Trazer para frente"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleSendToBack}
            className="canvas-tool-btn !w-7 !h-7"
            title="Enviar para trás"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </>
      )}

      <div className="w-[1px] h-5 bg-white/10 my-auto" />

      {/* Delete */}
      <button
        onClick={handleDelete}
        className="canvas-tool-btn !w-7 !h-7 text-red-400 hover:text-red-300 hover:bg-red-500/20"
        title="Excluir (Delete)"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
