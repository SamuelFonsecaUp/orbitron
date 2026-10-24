import React from 'react';
import { CanvasNode } from '../../io/jsonCanvas.types';
import { getCanvasColor } from '../colors';
import { Rect } from '../../scene/types';

interface FileNodeProps {
  node: CanvasNode;
  effectiveRect: Rect;
  isSelected: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

export const FileNode: React.FC<FileNodeProps> = ({
  node,
  effectiveRect,
  isSelected,
  onPointerDown,
  onDoubleClick,
}) => {
  const color = getCanvasColor(node.color || '6');
  const filePath = node.file || '';
  const fileName = filePath.split('/').pop()?.replace('.md', '') || 'Nota';
  const subpath = node.subpath ? `#${node.subpath}` : '';
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

      <rect width={w} height={36} rx={10} fill="#1e293b" />
      <rect y={26} width={w} height={10} fill="#1e293b" />

      <foreignObject x={10} y={8} width={Math.max(10, w - 20)} height={24} className="pointer-events-none">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300 truncate">
          <span>📄</span>
          <span className="truncate">{fileName}{subpath}</span>
        </div>
      </foreignObject>

      <foreignObject x={12} y={44} width={Math.max(10, w - 24)} height={Math.max(10, h - 52)} className="pointer-events-none overflow-hidden">
        <div className="text-xs text-slate-400 font-sans leading-relaxed line-clamp-4">
          {node.text || `Nota: ${filePath}`}
        </div>
      </foreignObject>
    </g>
  );
};
