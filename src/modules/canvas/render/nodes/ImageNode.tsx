import React from 'react';
import { CanvasNode } from '../../io/jsonCanvas.types';
import { getCanvasColor } from '../colors';

interface ImageNodeProps {
  node: CanvasNode;
  isSelected: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

export const ImageNode: React.FC<ImageNodeProps> = ({
  node,
  isSelected,
  onPointerDown,
  onDoubleClick,
}) => {
  const color = getCanvasColor(node.color);
  const src = node.url || node.file || '';

  return (
    <g
      transform={`translate(${node.x} ${node.y})`}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      className="cursor-pointer select-none"
    >
      <rect
        width={node.width}
        height={node.height}
        rx={8}
        fill="#0f172a"
        stroke={isSelected ? '#a855f7' : color.border}
        strokeWidth={isSelected ? 2.5 : 1.5}
      />

      <foreignObject
        x={2}
        y={2}
        width={node.width - 4}
        height={node.height - 4}
        className="pointer-events-none overflow-hidden rounded-md"
      >
        <div className="w-full h-full flex items-center justify-center bg-slate-900">
          {src ? (
            <img
              src={src}
              alt="Anexo do Quadro"
              className="w-full h-full object-contain pointer-events-none select-none"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="text-slate-500 text-xs text-center p-2">
              🖼️ Nenhuma imagem anexada
            </div>
          )}
        </div>
      </foreignObject>
    </g>
  );
};
