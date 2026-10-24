import React from 'react';
import { CanvasNode } from '../../io/jsonCanvas.types';
import { getCanvasColor } from '../colors';

interface TextNodeProps {
  node: CanvasNode;
  isSelected: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

export const TextNode: React.FC<TextNodeProps> = ({
  node,
  isSelected,
  onPointerDown,
  onDoubleClick,
}) => {
  const color = getCanvasColor(node.color);
  const rotation = node.orbitron?.rotation || 0;
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const fontSize = node.orbitron?.fontSize || 16;

  return (
    <g
      transform={`rotate(${rotation} ${cx} ${cy}) translate(${node.x} ${node.y})`}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      className="cursor-pointer select-none"
    >
      {isSelected && (
        <rect
          width={node.width}
          height={node.height}
          rx={4}
          fill="none"
          stroke="#a855f7"
          strokeWidth={1.5}
          strokeDasharray="4 2"
        />
      )}

      <foreignObject
        x={4}
        y={4}
        width={Math.max(10, node.width - 8)}
        height={Math.max(10, node.height - 8)}
        className="pointer-events-none overflow-hidden"
      >
        <div
          style={{ fontSize: `${fontSize}px`, color: color.text }}
          className="w-full h-full font-sans font-medium break-words whitespace-pre-wrap select-none p-1"
        >
          {node.text || 'Texto vazio...'}
        </div>
      </foreignObject>
    </g>
  );
};
