import React, { useState } from 'react';
import { CanvasNode, CanvasSide } from '../../io/jsonCanvas.types';
import { getCanvasColor } from '../colors';
import { Point, Rect } from '../../scene/types';
import { NodeHotspots } from './NodeHotspots';

interface ShapeNodeProps {
  node: CanvasNode;
  effectiveRect: Rect;
  effectiveRotation: number;
  isSelected: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onAnchorPointerDown?: (e: React.PointerEvent, side: CanvasSide, pt: Point) => void;
}

export const ShapeNode: React.FC<ShapeNodeProps> = ({
  node,
  effectiveRect,
  effectiveRotation,
  isSelected,
  onPointerDown,
  onDoubleClick,
  onAnchorPointerDown,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const shape = node.orbitron?.shape || 'rectangle';
  const color = getCanvasColor(node.color);
  const { x, y, width: w, height: h } = effectiveRect;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const fontSize = node.orbitron?.fontSize || 14;

  const strokeColor = isSelected ? '#a855f7' : color.border;
  const strokeWidth = isSelected ? 2.5 : 2;

  const renderShapeSvg = () => {
    switch (shape) {
      case 'ellipse':
        return (
          <ellipse
            cx={w / 2}
            cy={h / 2}
            rx={w / 2}
            ry={h / 2}
            fill={color.bg}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            filter="drop-shadow(0 6px 14px rgba(0,0,0,0.3))"
          />
        );

      case 'diamond': {
        const points = `${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`;
        return (
          <polygon
            points={points}
            fill={color.bg}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            filter="drop-shadow(0 6px 14px rgba(0,0,0,0.3))"
          />
        );
      }

      case 'triangle': {
        const points = `${w / 2},0 ${w},${h} 0,${h}`;
        return (
          <polygon
            points={points}
            fill={color.bg}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            filter="drop-shadow(0 6px 14px rgba(0,0,0,0.3))"
          />
        );
      }

      case 'rectangle':
      default:
        return (
          <rect
            width={w}
            height={h}
            rx={10}
            fill={color.bg}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            filter="drop-shadow(0 6px 14px rgba(0,0,0,0.3))"
          />
        );
    }
  };

  return (
    <g
      transform={`rotate(${effectiveRotation} ${cx} ${cy}) translate(${x} ${y})`}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      className="cursor-pointer select-none"
    >
      {renderShapeSvg()}

      {/* Centered text */}
      <foreignObject
        x={12}
        y={12}
        width={Math.max(10, w - 24)}
        height={Math.max(10, h - 24)}
        className="pointer-events-none overflow-hidden"
      >
        <div
          style={{ fontSize: `${fontSize}px`, color: color.text }}
          className="w-full h-full flex items-center justify-center text-center font-sans font-semibold break-words whitespace-pre-wrap select-none p-1"
        >
          {node.text}
        </div>
      </foreignObject>

      {/* Hotspots */}
      <NodeHotspots
        width={w}
        height={h}
        visible={isHovered || isSelected}
        onAnchorPointerDown={(e, side, pt) => {
          onAnchorPointerDown?.(e, side, { x: x + pt.x, y: y + pt.y });
        }}
      />
    </g>
  );
};
