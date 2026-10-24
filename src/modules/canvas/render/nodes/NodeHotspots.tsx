import React from 'react';
import { CanvasSide } from '../../io/jsonCanvas.types';
import { Point } from '../../scene/types';

interface NodeHotspotsProps {
  width: number;
  height: number;
  visible: boolean;
  onAnchorPointerDown?: (e: React.PointerEvent, side: CanvasSide, pt: Point) => void;
}

export const NodeHotspots: React.FC<NodeHotspotsProps> = ({
  width,
  height,
  visible,
  onAnchorPointerDown,
}) => {
  if (!visible) return null;

  const anchors: { side: CanvasSide; x: number; y: number }[] = [
    { side: 'top', x: width / 2, y: 0 },
    { side: 'right', x: width, y: height / 2 },
    { side: 'bottom', x: width / 2, y: height },
    { side: 'left', x: 0, y: height / 2 },
  ];

  return (
    <g className="node-hotspots animate-in fade-in duration-150">
      {anchors.map(({ side, x, y }) => (
        <g key={side} transform={`translate(${x}, ${y})`}>
          {/* Larger invisible hit area */}
          <circle
            r={12}
            fill="transparent"
            className="cursor-crosshair"
            onPointerDown={(e) => {
              e.stopPropagation();
              onAnchorPointerDown?.(e, side, { x, y });
            }}
          />
          {/* Visible dot */}
          <circle
            r={4.5}
            fill="#ffffff"
            stroke="#a855f7"
            strokeWidth={2}
            className="pointer-events-none filter drop-shadow-sm transition-transform hover:scale-150"
          />
        </g>
      ))}
    </g>
  );
};
