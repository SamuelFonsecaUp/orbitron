import React from 'react';
import { CanvasNode } from '../../io/jsonCanvas.types';
import { getCanvasColor } from '../colors';
import { Rect } from '../../scene/types';

interface PenNodeProps {
  node: CanvasNode;
  effectiveRect?: Rect;
  isSelected: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export const PenNode: React.FC<PenNodeProps> = ({
  node,
  effectiveRect,
  isSelected,
  onPointerDown,
}) => {
  const color = getCanvasColor(node.color || '6');
  const points = node.orbitron?.penPoints || [];
  if (points.length < 2) return null;

  // Smooth freehand curve with quadratic midpoint smoothing
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
  }
  if (points.length > 1) {
    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y}`;
  }

  // Handle both legacy absolute coordinates (when node.x == 0 and node.y == 0) and new relative coordinates
  const isLegacy = node.x === 0 && node.y === 0;
  const posX = isLegacy ? 0 : (effectiveRect ? effectiveRect.x : node.x);
  const posY = isLegacy ? 0 : (effectiveRect ? effectiveRect.y : node.y);

  return (
    <g
      transform={`translate(${posX}, ${posY})`}
      onPointerDown={onPointerDown}
      className="cursor-pointer select-none"
    >
      {/* Invisible wider hit-path to easily select thin pen strokes */}
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={18}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {isSelected && (
        <path
          d={d}
          fill="none"
          stroke="#a855f7"
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.4}
        />
      )}
      <path
        d={d}
        fill="none"
        stroke={color.accent}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
};
