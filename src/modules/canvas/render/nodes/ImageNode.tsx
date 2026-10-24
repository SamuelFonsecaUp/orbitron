import React from 'react';
import { CanvasNode } from '../../io/jsonCanvas.types';
import { getCanvasColor } from '../colors';
import { Rect } from '../../scene/types';

interface ImageNodeProps {
  node: CanvasNode;
  effectiveRect: Rect;
  isSelected: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

export const ImageNode: React.FC<ImageNodeProps> = ({
  node,
  effectiveRect,
  isSelected,
  onPointerDown,
  onDoubleClick,
}) => {
  const color = getCanvasColor(node.color);
  const src = node.url || node.file || '';
  const { x, y, width: w, height: h } = effectiveRect;

  return (
    <g
      transform={`translate(${x} ${y})`}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      className="cursor-pointer select-none"
    >
      <rect
        width={w}
        height={h}
        rx={10}
        fill="#0f172a"
        stroke={isSelected ? '#a855f7' : color.border}
        strokeWidth={isSelected ? 2.5 : 1.5}
        filter="drop-shadow(0 10px 18px rgba(0,0,0,0.35))"
      />

      <foreignObject x={2} y={2} width={Math.max(10, w - 4)} height={Math.max(10, h - 4)} className="pointer-events-none overflow-hidden rounded-lg">
        <div className="w-full h-full flex items-center justify-center bg-slate-900">
          {src ? (
            <img
              src={src}
              alt="Anexo"
              className="w-full h-full object-contain pointer-events-none select-none"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
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
