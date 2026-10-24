import React from 'react';
import { CanvasNode } from '../../io/jsonCanvas.types';
import { getCanvasColor } from '../colors';

interface FileNodeProps {
  node: CanvasNode;
  isSelected: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

export const FileNode: React.FC<FileNodeProps> = ({
  node,
  isSelected,
  onPointerDown,
  onDoubleClick,
}) => {
  const color = getCanvasColor(node.color || '6');
  const filePath = node.file || '';
  const fileName = filePath.split('/').pop()?.replace('.md', '') || 'Nota';
  const subpath = node.subpath ? `#${node.subpath}` : '';

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
        className="drop-shadow-lg"
      />

      {/* Header bar */}
      <rect
        width={node.width}
        height={36}
        rx={8}
        fill="#1e293b"
      />
      <rect
        y={28}
        width={node.width}
        height={8}
        fill="#1e293b"
      />

      <foreignObject
        x={10}
        y={8}
        width={node.width - 20}
        height={24}
        className="pointer-events-none"
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300 truncate">
          <span>📄</span>
          <span className="truncate">{fileName}{subpath}</span>
        </div>
      </foreignObject>

      {/* Content preview */}
      <foreignObject
        x={12}
        y={44}
        width={node.width - 24}
        height={node.height - 52}
        className="pointer-events-none overflow-hidden"
      >
        <div className="text-xs text-slate-400 font-sans leading-relaxed line-clamp-4">
          {node.text || `Link para nota do vault: ${filePath}`}
        </div>
      </foreignObject>
    </g>
  );
};
