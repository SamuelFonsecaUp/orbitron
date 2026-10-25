import React, { useState } from 'react';
import { CanvasNode, CanvasSide } from '../../io/jsonCanvas.types';
import { getCanvasColor } from '../colors';
import { Point, Rect } from '../../scene/types';
import { NodeHotspots } from './NodeHotspots';

interface FrameNodeProps {
  node: CanvasNode;
  effectiveRect: Rect;
  isSelected: boolean;
  isTargetCandidate?: boolean;
  targetSide?: CanvasSide;
  isConnecting?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onAnchorPointerDown?: (e: React.PointerEvent, side: CanvasSide, pt: Point) => void;
}

export const FrameNode: React.FC<FrameNodeProps> = ({
  node,
  effectiveRect,
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
  const isFilled = node.orbitron?.filled ?? false;
  const label = node.label || 'Grupo';
  const { x, y, width: w, height: h } = effectiveRect;

  return (
    <g
      transform={`translate(${x} ${y})`}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      className="cursor-pointer select-none"
    >
      <rect
        width={w}
        height={h}
        rx={12}
        fill={isFilled ? color.bg : 'rgba(255, 255, 255, 0.02)'}
        stroke={isTargetCandidate ? '#38bdf8' : isSelected ? '#a855f7' : color.border}
        strokeWidth={isTargetCandidate ? 2.5 : isSelected ? 2 : 1.5}
        strokeDasharray={isSelected || isTargetCandidate ? undefined : '6 4'}
      />

      <g transform="translate(12, -14)">
        <rect
          width={Math.min(w - 24, Math.max(60, label.length * 9 + 20))}
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
