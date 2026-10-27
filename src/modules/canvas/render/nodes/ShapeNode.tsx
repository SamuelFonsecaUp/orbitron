import React, { useState } from 'react';
import { CanvasNode, CanvasSide } from '../../io/jsonCanvas.types';
import { getCanvasColor } from '../colors';
import { Point, Rect } from '../../scene/types';
import { NodeHotspots } from './NodeHotspots';
import { CanvasTheme } from '../../store/canvasStore.types';

interface ShapeNodeProps {
  node: CanvasNode;
  effectiveRect: Rect;
  effectiveRotation: number;
  isSelected: boolean;
  theme?: CanvasTheme;
  isTargetCandidate?: boolean;
  targetSide?: CanvasSide;
  isConnecting?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onAnchorPointerDown?: (e: React.PointerEvent, side: CanvasSide, pt: Point) => void;
}

export const ShapeNode: React.FC<ShapeNodeProps> = ({
  node,
  effectiveRect,
  effectiveRotation,
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
  const shape = node.orbitron?.shape || 'rectangle';
  const color = getCanvasColor(node.color, theme);
  const { x, y, width: w, height: h } = effectiveRect;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const fontSize = node.orbitron?.fontSize || 14;
  const shadowFilter = theme === 'light' ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.08))' : 'drop-shadow(0 6px 14px rgba(0,0,0,0.3))';

  const strokeColor = isTargetCandidate ? '#38bdf8' : isSelected ? '#a855f7' : color.border;
  const strokeWidth = isTargetCandidate ? 3 : isSelected ? 2.5 : 2;

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
            filter={shadowFilter}
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
            filter={shadowFilter}
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
            filter={shadowFilter}
          />
        );
      }

      case 'divider_horizontal': {
        const midY = h / 2;
        const textStr = (node.text || node.label || '').trim();
        const textLen = textStr.length;
        const pillWidth = textLen > 0 ? Math.min(w - 20, Math.max(70, textLen * 9 + 30)) : 0;
        const pillLeft = (w - pillWidth) / 2;
        const pillRight = pillLeft + pillWidth;

        return (
          <g>
            {/* Transparent hit area for easy click & selection */}
            <rect width={w} height={Math.max(28, h)} fill="transparent" />

            {textLen > 0 ? (
              <>
                <line
                  x1={0}
                  y1={midY}
                  x2={pillLeft - 6}
                  y2={midY}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
                <line
                  x1={pillRight + 6}
                  y1={midY}
                  x2={w}
                  y2={midY}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
                <circle cx={4} cy={midY} r={3} fill={strokeColor} />
                <circle cx={w - 4} cy={midY} r={3} fill={strokeColor} />

                {/* Text Badge Pill */}
                <rect
                  x={pillLeft}
                  y={midY - 12}
                  width={pillWidth}
                  height={24}
                  rx={12}
                  fill={theme === 'light' ? '#f1f5f9' : '#0f172a'}
                  stroke={strokeColor}
                  strokeWidth={1.5}
                />
                <text
                  x={w / 2}
                  y={midY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={color.text || strokeColor}
                  fontSize={Math.min(fontSize, 12)}
                  fontWeight="bold"
                  className="font-sans select-none pointer-events-none tracking-wide"
                >
                  {textStr}
                </text>
              </>
            ) : (
              <>
                <line
                  x1={0}
                  y1={midY}
                  x2={w}
                  y2={midY}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
                <circle cx={4} cy={midY} r={3} fill={strokeColor} />
                <circle cx={w - 4} cy={midY} r={3} fill={strokeColor} />
              </>
            )}
          </g>
        );
      }

      case 'divider_vertical': {
        const midX = w / 2;
        const textStr = (node.text || node.label || '').trim();
        const textLen = textStr.length;
        const pillHeight = textLen > 0 ? Math.min(h - 20, 28) : 0;
        const pillTop = (h - pillHeight) / 2;
        const pillBottom = pillTop + pillHeight;

        return (
          <g>
            {/* Transparent hit area */}
            <rect width={Math.max(28, w)} height={h} fill="transparent" />

            {textLen > 0 ? (
              <>
                <line
                  x1={midX}
                  y1={0}
                  x2={midX}
                  y2={pillTop - 6}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
                <line
                  x1={midX}
                  y1={pillBottom + 6}
                  x2={midX}
                  y2={h}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
                <circle cx={midX} cy={4} r={3} fill={strokeColor} />
                <circle cx={midX} cy={h - 4} r={3} fill={strokeColor} />

                {/* Center Badge */}
                <rect
                  x={midX - 35}
                  y={pillTop}
                  width={70}
                  height={pillHeight}
                  rx={8}
                  fill={theme === 'light' ? '#f1f5f9' : '#0f172a'}
                  stroke={strokeColor}
                  strokeWidth={1.5}
                />
                <text
                  x={midX}
                  y={h / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={color.text || strokeColor}
                  fontSize={Math.min(fontSize, 11)}
                  fontWeight="bold"
                  className="font-sans select-none pointer-events-none truncate"
                >
                  {textStr.slice(0, 8)}
                </text>
              </>
            ) : (
              <>
                <line
                  x1={midX}
                  y1={0}
                  x2={midX}
                  y2={h}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
                <circle cx={midX} cy={4} r={3} fill={strokeColor} />
                <circle cx={midX} cy={h - 4} r={3} fill={strokeColor} />
              </>
            )}
          </g>
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
            filter={shadowFilter}
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

      {/* Centered text for normal shapes */}
      {shape !== 'divider_horizontal' && shape !== 'divider_vertical' && (
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
      )}

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
