import React from 'react';
import { CanvasNode } from '../../io/jsonCanvas.types';
import { getCanvasColor } from '../colors';
import { Rect } from '../../scene/types';

interface TextNodeProps {
  node: CanvasNode;
  effectiveRect: Rect;
  effectiveRotation: number;
  isSelected: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

export const TextNode: React.FC<TextNodeProps> = ({
  node,
  effectiveRect,
  effectiveRotation,
  isSelected,
  onPointerDown,
  onDoubleClick,
}) => {
  const color = getCanvasColor(node.color);
  const { x, y, width: w, height: h } = effectiveRect;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const fontSize = node.orbitron?.fontSize || 16;

  return (
    <g
      transform={`rotate(${effectiveRotation} ${cx} ${cy}) translate(${x} ${y})`}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      className="cursor-pointer select-none"
    >
      {isSelected && (
        <rect
          width={w}
          height={h}
          rx={6}
          fill="none"
          stroke="#a855f7"
          strokeWidth={1.5}
          strokeDasharray="4 2"
        />
      )}

      <foreignObject
        x={4}
        y={4}
        width={Math.max(10, w - 8)}
        height={Math.max(10, h - 8)}
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
