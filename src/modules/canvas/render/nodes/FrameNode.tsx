import React from 'react';
import { CanvasNode } from '../../io/jsonCanvas.types';
import { getCanvasColor } from '../colors';

interface FrameNodeProps {
  node: CanvasNode;
  isSelected: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

export const FrameNode: React.FC<FrameNodeProps> = ({
  node,
  isSelected,
  onPointerDown,
  onDoubleClick,
}) => {
  const color = getCanvasColor(node.color);
  const isFilled = node.orbitron?.filled ?? false;
  const label = node.label || 'Grupo';

  return (
    <g
      transform={`translate(${node.x} ${node.y})`}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      className="cursor-pointer select-none"
    >
      {/* Background container */}
      <rect
        width={node.width}
        height={node.height}
        rx={10}
        fill={isFilled ? color.bg : 'rgba(255, 255, 255, 0.02)'}
        stroke={isSelected ? '#a855f7' : color.border}
        strokeWidth={isSelected ? 2 : 1.5}
        strokeDasharray={isSelected ? undefined : '6 4'}
      />

      {/* Label tab header */}
      <g transform="translate(12, -14)">
        <rect
          width={Math.min(node.width - 24, Math.max(60, label.length * 9 + 20))}
          height={26}
          rx={6}
          fill="#1e1b4b"
          stroke={isSelected ? '#a855f7' : color.border}
          strokeWidth={1.5}
        />
        <text
          x={10}
          y={17}
          fill="#e9d5ff"
          fontSize={12}
          fontWeight="bold"
          className="font-sans pointer-events-none select-none"
        >
          {label}
        </text>
      </g>
    </g>
  );
};
