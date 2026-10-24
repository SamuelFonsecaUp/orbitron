import React from 'react';
import { CanvasNode } from '../../io/jsonCanvas.types';
import { getCanvasColor } from '../colors';

interface StickyNodeProps {
  node: CanvasNode;
  isSelected: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

export const StickyNode: React.FC<StickyNodeProps> = ({
  node,
  isSelected,
  onPointerDown,
  onDoubleClick,
}) => {
  const color = getCanvasColor(node.color || '3'); // Yellow default for sticky
  const rotation = node.orbitron?.rotation || 0;
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const fontSize = node.orbitron?.fontSize || 14;

  const foldSize = 16;
  const foldPath = `M ${node.width - foldSize} 0 L ${node.width} ${foldSize} L ${node.width - foldSize} ${foldSize} Z`;

  return (
    <g
      transform={`rotate(${rotation} ${cx} ${cy}) translate(${node.x} ${node.y})`}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      className="cursor-pointer select-none"
    >
      {/* Base sticky note */}
      <rect
        width={node.width}
        height={node.height}
        rx={6}
        fill={color.bg}
        stroke={isSelected ? '#a855f7' : color.border}
        strokeWidth={isSelected ? 2.5 : 1.5}
        className="transition-colors duration-150 filter drop-shadow-md"
      />

      {/* Folded corner */}
      <path
        d={foldPath}
        fill={color.border}
        opacity={0.4}
      />

      {/* Text Content */}
      <foreignObject
        x={12}
        y={12}
        width={Math.max(10, node.width - 24)}
        height={Math.max(10, node.height - 24)}
        className="pointer-events-none overflow-hidden"
      >
        <div
          style={{ fontSize: `${fontSize}px`, color: color.text }}
          className="w-full h-full font-sans break-words whitespace-pre-wrap leading-relaxed select-none"
        >
          {node.text || 'Clique 2x para editar...'}
        </div>
      </foreignObject>
    </g>
  );
};
