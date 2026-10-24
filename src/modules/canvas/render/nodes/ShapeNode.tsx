import React from 'react';
import { CanvasNode } from '../../io/jsonCanvas.types';
import { getCanvasColor } from '../colors';

interface ShapeNodeProps {
  node: CanvasNode;
  isSelected: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

export const ShapeNode: React.FC<ShapeNodeProps> = ({
  node,
  isSelected,
  onPointerDown,
  onDoubleClick,
}) => {
  const shape = node.orbitron?.shape || 'rectangle';
  const color = getCanvasColor(node.color);
  const rotation = node.orbitron?.rotation || 0;
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const fontSize = node.orbitron?.fontSize || 14;

  const strokeColor = isSelected ? '#a855f7' : color.border;
  const strokeWidth = isSelected ? 2.5 : 1.5;

  const renderShapeSvg = () => {
    const w = node.width;
    const h = node.height;

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
          />
        );
      }

      case 'rectangle':
      default:
        return (
          <rect
            width={w}
            height={h}
            rx={8}
            fill={color.bg}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );
    }
  };

  return (
    <g
      transform={`rotate(${rotation} ${cx} ${cy}) translate(${node.x} ${node.y})`}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      className="cursor-pointer select-none"
    >
      {renderShapeSvg()}

      {/* Centered text */}
      <foreignObject
        x={10}
        y={10}
        width={Math.max(10, node.width - 20)}
        height={Math.max(10, node.height - 20)}
        className="pointer-events-none overflow-hidden"
      >
        <div
          style={{ fontSize: `${fontSize}px`, color: color.text }}
          className="w-full h-full flex items-center justify-center text-center font-sans break-words whitespace-pre-wrap select-none p-1"
        >
          {node.text}
        </div>
      </foreignObject>
    </g>
  );
};
