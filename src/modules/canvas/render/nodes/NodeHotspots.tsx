import React from 'react';
import { CanvasSide } from '../../io/jsonCanvas.types';
import { Point } from '../../scene/types';

interface NodeHotspotsProps {
  width: number;
  height: number;
  visible: boolean;
  isTargetCandidate?: boolean;
  activeSide?: CanvasSide;
  onAnchorPointerDown?: (e: React.PointerEvent, side: CanvasSide, pt: Point) => void;
}

export const NodeHotspots: React.FC<NodeHotspotsProps> = ({
  width,
  height,
  visible,
  isTargetCandidate,
  activeSide,
  onAnchorPointerDown,
}) => {
  if (!visible && !isTargetCandidate) return null;

  const anchors: { side: CanvasSide; x: number; y: number }[] = [
    { side: 'top', x: width / 2, y: 0 },
    { side: 'right', x: width, y: height / 2 },
    { side: 'bottom', x: width / 2, y: height },
    { side: 'left', x: 0, y: height / 2 },
  ];

  return (
    <g className="node-hotspots animate-in fade-in duration-150">
      {/* Target candidate magnetic halo when hovered with connection wire */}
      {isTargetCandidate && (
        <rect
          x={-4}
          y={-4}
          width={width + 8}
          height={height + 8}
          rx={12}
          fill="rgba(56, 189, 248, 0.08)"
          stroke="#38bdf8"
          strokeWidth={2.5}
          strokeDasharray="6 3"
          className="animate-pulse pointer-events-none"
        />
      )}

      {anchors.map(({ side, x, y }) => {
        const isAnchorActive = isTargetCandidate && activeSide === side;
        return (
          <g key={side} transform={`translate(${x}, ${y})`}>
            {/* Generous touch target for seamless dragging */}
            <circle
              r={16}
              fill="transparent"
              className="cursor-crosshair"
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onAnchorPointerDown?.(e, side, { x, y });
              }}
            />
            {/* Visual anchor dot */}
            <circle
              r={isAnchorActive ? 6.5 : 4.5}
              fill={isAnchorActive ? '#38bdf8' : '#ffffff'}
              stroke={isAnchorActive ? '#0284c7' : '#a855f7'}
              strokeWidth={isAnchorActive ? 2.5 : 2}
              className={`transition-all duration-150 pointer-events-none filter drop-shadow-sm ${
                isAnchorActive ? 'scale-125' : 'hover:scale-150'
              }`}
            />
            {isAnchorActive && (
              <circle
                r={10}
                fill="none"
                stroke="#38bdf8"
                strokeWidth={1.5}
                className="animate-ping pointer-events-none opacity-75"
              />
            )}
          </g>
        );
      })}
    </g>
  );
};
