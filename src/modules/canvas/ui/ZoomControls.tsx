import React from 'react';
import { Plus, Minus, Maximize2 } from 'lucide-react';
import { useCanvasStore, canvasStore } from '../store/canvasStore';
import { calculateFitCamera } from '../scene/camera';

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
    const nextCam = calculateFitCamera(nodes, viewportWidth, viewportHeight);
    canvasStore.setCamera(nextCam);
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
