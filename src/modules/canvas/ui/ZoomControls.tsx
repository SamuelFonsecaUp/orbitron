import React from 'react';
import { Plus, Minus, Maximize2 } from 'lucide-react';
import { useCanvasStore, canvasStore } from '../store/canvasStore';
import { getNodeAABB } from '../scene/geometry';

interface ZoomControlsProps {
  viewportWidth: number;
  viewportHeight: number;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  viewportWidth,
  viewportHeight,
}) => {
  const camera = useCanvasStore((s) => s.camera);
  const nodes = useCanvasStore((s) => s.nodes);

  const zoomPercent = Math.round(camera.zoom * 100);

  const handleZoomIn = () => {
    canvasStore.setCamera({ zoom: Math.min(4.0, camera.zoom * 1.2) });
  };

  const handleZoomOut = () => {
    canvasStore.setCamera({ zoom: Math.max(0.1, camera.zoom / 1.2) });
  };

  const handleReset = () => {
    canvasStore.setCamera({ zoom: 1.0 });
  };

  const handleFit = () => {
    if (nodes.length === 0) {
      canvasStore.setCamera({ x: 0, y: 0, zoom: 1 });
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of nodes) {
      const box = getNodeAABB(n);
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    }

    const padding = 80;
    const sceneW = maxX - minX + padding * 2;
    const sceneH = maxY - minY + padding * 2;

    const scaleX = viewportWidth / sceneW;
    const scaleY = viewportHeight / sceneH;
    const fitZoom = Math.max(0.1, Math.min(2.0, Math.min(scaleX, scaleY)));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const newCamX = viewportWidth / 2 - centerX * fitZoom;
    const newCamY = viewportHeight / 2 - centerY * fitZoom;

    canvasStore.setCamera({ x: newCamX, y: newCamY, zoom: fitZoom });
  };

  return (
    <div className="absolute bottom-6 right-6 z-20 flex items-center gap-1 p-1.5 rounded-xl canvas-glass-panel">
      <button
        onClick={handleZoomOut}
        className="canvas-tool-btn !w-7 !h-7"
        title="Reduzir Zoom (-)"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={handleReset}
        className="px-2 text-xs font-mono font-medium text-slate-300 hover:text-white"
        title="Redefinir Zoom para 100%"
      >
        {zoomPercent}%
      </button>

      <button
        onClick={handleZoomIn}
        className="canvas-tool-btn !w-7 !h-7"
        title="Aumentar Zoom (+)"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      <div className="w-[1px] h-4 bg-white/10 my-auto mx-0.5" />

      <button
        onClick={handleFit}
        className="canvas-tool-btn !w-7 !h-7"
        title="Ajustar à tela"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
