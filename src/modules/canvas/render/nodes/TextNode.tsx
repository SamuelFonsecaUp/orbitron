import React, { useState } from 'react';
import { CanvasNode, CanvasSide } from '../../io/jsonCanvas.types';
import { getCanvasColor } from '../colors';
import { Point, Rect } from '../../scene/types';
import { NodeHotspots } from './NodeHotspots';

interface TextNodeProps {
  node: CanvasNode;
  effectiveRect: Rect;
  effectiveRotation: number;
  isSelected: boolean;
  isTargetCandidate?: boolean;
  targetSide?: CanvasSide;
  isConnecting?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onAnchorPointerDown?: (e: React.PointerEvent, side: CanvasSide, pt: Point) => void;
}

export const TextNode: React.FC<TextNodeProps> = ({
  node,
  effectiveRect,
  effectiveRotation,
  isSelected,
  isTargetCandidate,
  targetSide,
  isConnecting,
  onPointerDown,
  onDoubleClick,
  onAnchorPointerDown,
}) => {
  const [isHovered, setIsHovered] = useState(false);
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
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      className="cursor-pointer select-none"
    >
      {(isSelected || isTargetCandidate) && (
        <rect
          width={w}
          height={h}
          rx={6}
          fill="none"
          stroke={isTargetCandidate ? '#38bdf8' : '#a855f7'}
          strokeWidth={isTargetCandidate ? 2.5 : 1.5}
          strokeDasharray={isTargetCandidate ? undefined : '4 2'}
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

      {/* Hotspots */}
      <NodeHotspots
        width={w}
        height={h}
        visible={isHovered || isSelected || Boolean(isConnecting)}
        isTargetCandidate={isTargetCandidate}
        activeSide={targetSide}
        onAnchorPointerDown={(e, side, pt) => {
          onAnchorPointerDown?.(e, side, { x: x + pt.x, y: y + pt.y });
        }}
      />
    </g>
  );
};
