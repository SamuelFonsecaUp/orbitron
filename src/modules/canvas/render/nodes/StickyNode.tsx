import React, { useState } from 'react';
import { CanvasNode, CanvasSide } from '../../io/jsonCanvas.types';
import { getCanvasColor } from '../colors';
import { Point, Rect } from '../../scene/types';
import { NodeHotspots } from './NodeHotspots';

interface StickyNodeProps {
  node: CanvasNode;
  effectiveRect: Rect;
  effectiveRotation: number;
  isSelected: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onAnchorPointerDown?: (e: React.PointerEvent, side: CanvasSide, pt: Point) => void;
}

export const StickyNode: React.FC<StickyNodeProps> = ({
  node,
  effectiveRect,
  effectiveRotation,
  isSelected,
  onPointerDown,
  onDoubleClick,
  onAnchorPointerDown,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const color = getCanvasColor(node.color || '3'); // Lucid Yellow default
  const { x, y, width, height } = effectiveRect;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const fontSize = node.orbitron?.fontSize || 15;

  const fold = 18;
  const foldPath = `M ${width - fold} 0 L ${width} ${fold} L ${width - fold} ${fold} Z`;

  return (
    <g
      transform={`rotate(${effectiveRotation} ${cx} ${cy}) translate(${x} ${y})`}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      className="cursor-pointer select-none"
    >
      {/* Sticky note shadow and body */}
      <rect
        width={width}
        height={height}
        rx={8}
        fill={color.bg}
        stroke={isSelected ? '#a855f7' : color.border}
        strokeWidth={isSelected ? 2.5 : 1.5}
        filter="drop-shadow(0 10px 18px rgba(0,0,0,0.35))"
        className="transition-all duration-75"
      />

      {/* Subtle top adhesive tape highlight */}
      <rect
        x={width / 2 - 28}
        y={-4}
        width={56}
        height={8}
        rx={2}
        fill="rgba(255, 255, 255, 0.4)"
        className="pointer-events-none"
      />

      {/* Folded corner */}
      <path
        d={foldPath}
        fill={color.border}
        opacity={0.6}
        className="pointer-events-none"
      />

      {/* Text Content */}
      <foreignObject
        x={14}
        y={14}
        width={Math.max(10, width - 28)}
        height={Math.max(10, height - 28)}
        className="pointer-events-none overflow-hidden"
      >
        <div
          style={{ fontSize: `${fontSize}px`, color: color.text }}
          className="w-full h-full font-sans font-medium break-words whitespace-pre-wrap leading-relaxed select-none"
        >
          {node.text || 'Clique 2x para escrever...'}
        </div>
      </foreignObject>

      {/* Lucidspark connection hotspots on 4 sides */}
      <NodeHotspots
        width={width}
        height={height}
        visible={isHovered || isSelected}
        onAnchorPointerDown={(e, side, pt) => {
          onAnchorPointerDown?.(e, side, { x: x + pt.x, y: y + pt.y });
        }}
      />
    </g>
  );
};
