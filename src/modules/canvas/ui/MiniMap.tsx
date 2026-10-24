import React, { useMemo } from 'react';
import { useCanvasStore, canvasStore } from '../store/canvasStore';
import { getNodeAABB } from '../scene/geometry';

interface MiniMapProps {
  viewportWidth: number;
  viewportHeight: number;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  viewportWidth,
  viewportHeight,
}) => {
  const camera = useCanvasStore((s) => s.camera);
  const nodes = useCanvasStore((s) => s.nodes);

  const miniW = 160;
  const miniH = 100;

  const bounds = useMemo(() => {
    let minX = -viewportWidth;
    let minY = -viewportHeight;
    let maxX = viewportWidth * 2;
    let maxY = viewportHeight * 2;

    for (const n of nodes) {
      const b = getNodeAABB(n);
      minX = Math.min(minX, b.x - 100);
      minY = Math.min(minY, b.y - 100);
      maxX = Math.max(maxX, b.x + b.width + 100);
      maxY = Math.max(maxY, b.y + b.height + 100);
    }
    return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
  }, [nodes, viewportWidth, viewportHeight]);

  const scale = Math.min(miniW / bounds.w, miniH / bounds.h);

  // Viewport world coordinates
  const vpWorldX = -camera.x / camera.zoom;
  const vpWorldY = -camera.y / camera.zoom;
  const vpWorldW = viewportWidth / camera.zoom;
  const vpWorldH = viewportHeight / camera.zoom;

  const vpMiniX = (vpWorldX - bounds.minX) * scale;
  const vpMiniY = (vpWorldY - bounds.minY) * scale;
  const vpMiniW = vpWorldW * scale;
  const vpMiniH = vpWorldH * scale;

  const handleMiniMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetWorldX = bounds.minX + clickX / scale;
    const targetWorldY = bounds.minY + clickY / scale;

    const newCamX = viewportWidth / 2 - targetWorldX * camera.zoom;
    const newCamY = viewportHeight / 2 - targetWorldY * camera.zoom;

    canvasStore.setCamera({ x: newCamX, y: newCamY });
  };

  return (
    <div className="absolute bottom-6 left-6 z-20 rounded-xl canvas-glass-panel p-1.5 overflow-hidden shadow-2xl">
      <svg
        width={miniW}
        height={miniH}
        onClick={handleMiniMapClick}
        className="block bg-slate-950/60 rounded cursor-crosshair"
      >
        {/* Nodes thumbnail */}
        {nodes.map((n) => {
          const nx = (n.x - bounds.minX) * scale;
          const ny = (n.y - bounds.minY) * scale;
          const nw = Math.max(2, n.width * scale);
          const nh = Math.max(2, n.height * scale);
          return (
            <rect
              key={n.id}
              x={nx}
              y={ny}
              width={nw}
              height={nh}
              rx={1}
              fill="#a855f7"
              opacity={0.6}
            />
          );
        })}

        {/* Viewport box */}
        <rect
          x={vpMiniX}
          y={vpMiniY}
          width={vpMiniW}
          height={vpMiniH}
          fill="rgba(168, 85, 247, 0.15)"
          stroke="#c084fc"
          strokeWidth={1.5}
          rx={2}
        />
      </svg>
    </div>
  );
};
