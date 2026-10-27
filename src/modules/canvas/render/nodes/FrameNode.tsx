import React, { useState } from 'react';
import { CanvasNode, CanvasSide } from '../../io/jsonCanvas.types';
import { getCanvasColor } from '../colors';
import { Point, Rect } from '../../scene/types';
import { NodeHotspots } from './NodeHotspots';
import { CanvasTheme } from '../../store/canvasStore.types';

interface FrameNodeProps {
  node: CanvasNode;
  effectiveRect: Rect;
  isSelected: boolean;
  theme?: CanvasTheme;
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
  theme = 'dark',
  isTargetCandidate,
  targetSide,
  isConnecting,
  onPointerDown,
  onDoubleClick,
  onAnchorPointerDown,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const color = getCanvasColor(node.color, theme);
  const isFilled = node.orbitron?.filled ?? false;
  const label = node.label || 'Grupo';
  const { x, y, width: w, height: h } = effectiveRect;
  const isLight = theme === 'light';

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
        fill={isFilled ? color.bg : isLight ? 'rgba(0, 0, 0, 0.015)' : 'rgba(255, 255, 255, 0.02)'}
        stroke={isTargetCandidate ? '#38bdf8' : isSelected ? '#a855f7' : color.border}
        strokeWidth={isTargetCandidate ? 2.5 : isSelected ? 2 : 1.5}
        strokeDasharray={isSelected || isTargetCandidate ? undefined : '6 4'}
      />

      <g transform="translate(12, -14)">
        <rect
          width={Math.min(w - 24, Math.max(60, label.length * 9 + 20))}
          height={26}
          rx={6}
          fill={isLight ? '#f5f3ff' : '#1e1b4b'}
          stroke={isSelected ? '#a855f7' : color.border}
          strokeWidth={1.5}
        />
        <text
          x={10}
          y={17}
          fill={isLight ? '#6b21a8' : '#e9d5ff'}
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
