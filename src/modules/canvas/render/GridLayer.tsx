import React from 'react';
import { Camera } from '../scene/types';
import { CanvasTheme, CanvasGridPattern } from '../store/canvasStore.types';

interface GridLayerProps {
  camera: Camera;
  viewportWidth: number;
  viewportHeight: number;
  theme?: CanvasTheme;
  gridPattern?: CanvasGridPattern;
}

export const GridLayer: React.FC<GridLayerProps> = ({
  camera,
  viewportWidth,
  viewportHeight,
  theme = 'dark',
  gridPattern = 'dots',
}) => {
  if (gridPattern === 'none') {
    return null;
  }

  const gridSize = 24 * camera.zoom;
  const offsetX = (camera.x * camera.zoom) % gridSize;
  const offsetY = (camera.y * camera.zoom) % gridSize;

  // Theme-specific colors
  const colors = (() => {
    switch (theme) {
      case 'blueprint':
        return {
          stroke: '#0e3158',
          dot: '#38bdf8',
          cross: '#0284c7',
          dotOpacity: 0.75,
          strokeOpacity: 0.85,
        };
      case 'cyberpunk':
        return {
          stroke: '#280b52',
          dot: '#ec4899',
          cross: '#c084fc',
          dotOpacity: 0.8,
          strokeOpacity: 0.75,
        };
      case 'golden':
        return {
          stroke: '#2d2208',
          dot: '#eab308',
          cross: '#ca8a04',
          dotOpacity: 0.75,
          strokeOpacity: 0.8,
        };
      case 'cosmic':
        return {
          stroke: '#1f103b',
          dot: '#fb7185',
          cross: '#e11d48',
          dotOpacity: 0.85,
          strokeOpacity: 0.65,
        };
      case 'light':
        return {
          stroke: '#cbd5e1',
          dot: '#94a3b8',
          cross: '#94a3b8',
          dotOpacity: 0.65,
          strokeOpacity: 0.8,
        };
      case 'dark':
      default:
        return {
          stroke: '#1e293b',
          dot: '#334155',
          cross: '#475569',
          dotOpacity: 0.45,
          strokeOpacity: 0.6,
        };
    }
  })();

  const renderPatternContent = () => {
    switch (gridPattern) {
      case 'lines':
        return (
          <path
            d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={1}
            opacity={colors.strokeOpacity}
          />
        );

      case 'cross':
        return (
          <path
            d={`M ${gridSize / 2 - 3} ${gridSize / 2} h 6 M ${gridSize / 2} ${gridSize / 2 - 3} v 6`}
            fill="none"
            stroke={colors.cross}
            strokeWidth={1.2}
            opacity={colors.dotOpacity}
          />
        );

      case 'dots':
      default:
        return (
          <>
            <circle
              cx={gridSize / 2}
              cy={gridSize / 2}
              r={Math.max(1, 1.25 * Math.min(1.5, camera.zoom))}
              fill={colors.dot}
              opacity={colors.dotOpacity}
            />
            {theme === 'cosmic' && (
              <circle
                cx={gridSize / 4}
                cy={gridSize / 4}
                r={0.8}
                fill="#ffffff"
                opacity={0.4}
              />
            )}
          </>
        );
    }
  };

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
          {renderPatternContent()}
        </pattern>
      </defs>
      <rect
        width={viewportWidth}
        height={viewportHeight}
        fill="url(#orbitron-canvas-grid-pattern)"
        className="canvas-grid-bg"
      />
    </g>
  );
};
