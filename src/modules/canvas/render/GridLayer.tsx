import React from 'react';
import { Camera } from '../scene/types';

interface GridLayerProps {
  camera: Camera;
  viewportWidth: number;
  viewportHeight: number;
}

export const GridLayer: React.FC<GridLayerProps> = ({
  camera,
  viewportWidth,
  viewportHeight,
}) => {
  const gridSize = 24 * camera.zoom;
  const offsetX = (camera.x * camera.zoom) % gridSize;
  const offsetY = (camera.y * camera.zoom) % gridSize;

  return (
    <g className="pointer-events-none select-none">
      <defs>
        <pattern
          id="orbitron-canvas-grid-pattern"
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <circle
            cx={gridSize / 2}
            cy={gridSize / 2}
            r={Math.max(1, 1.2 * Math.min(1.5, camera.zoom))}
            fill="#334155"
            opacity={0.45}
          />
        </pattern>
      </defs>
      <rect
        width={viewportWidth}
        height={viewportHeight}
        fill="url(#orbitron-canvas-grid-pattern)"
      />
    </g>
  );
};
