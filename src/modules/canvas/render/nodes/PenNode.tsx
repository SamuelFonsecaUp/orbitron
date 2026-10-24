import React from 'react';
import { CanvasNode } from '../../io/jsonCanvas.types';
import { getCanvasColor } from '../colors';

interface PenNodeProps {
  node: CanvasNode;
  isSelected: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export const PenNode: React.FC<PenNodeProps> = ({
  node,
  isSelected,
  onPointerDown,
}) => {
  const color = getCanvasColor(node.color || '6');
  const points = node.orbitron?.penPoints || [];
  if (points.length < 2) return null;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }

  return (
    <g onPointerDown={onPointerDown} className="cursor-pointer">
      {isSelected && (
        <path
          d={d}
          fill="none"
          stroke="#a855f7"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.5}
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
