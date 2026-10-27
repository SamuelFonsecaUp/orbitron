import React, { useState } from 'react';
import { CanvasNode, CanvasSide } from '../../io/jsonCanvas.types';
import { getCanvasColor } from '../colors';
import { Point, Rect } from '../../scene/types';
import { NodeHotspots } from './NodeHotspots';
import { CanvasTheme } from '../../store/canvasStore.types';
import { FileText, ExternalLink, Folder } from 'lucide-react';

interface VaultNoteNodeProps {
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

export const VaultNoteNode: React.FC<VaultNoteNodeProps> = ({
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
  const { x, y, width: w, height: h } = effectiveRect;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const isLight = theme === 'light';

  const notePath = node.orbitron?.notePath || node.file || '';
  const noteTitle =
    node.orbitron?.noteTitle ||
    notePath.split('/').pop()?.replace(/\.md$/i, '') ||
    'Nota do Vault';
  const folder = notePath.includes('/') ? notePath.split('/')[0] : 'Geral';
  const snippet = node.orbitron?.noteSnippet || node.text || 'Clique para visualizar ou editar no Vault...';

  const handleOpenVault = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Dispatch navigation to notes view
    window.dispatchEvent(
      new CustomEvent('orbitron:navigate', { detail: { view: 'tools_notes' } })
    );
    // Open the specific page in the vault
    if (notePath) {
      window.dispatchEvent(
        new CustomEvent('orbitron:open-vault-page', { detail: { path: notePath } })
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
      {/* Outer Card Background */}
      <rect
        width={w}
        height={h}
        rx={12}
        fill={isLight ? '#ffffff' : '#0d1117'}
        stroke={isTargetCandidate ? '#38bdf8' : isSelected ? '#a855f7' : isLight ? '#e2e8f0' : '#1e293b'}
        strokeWidth={isTargetCandidate ? 2.5 : isSelected ? 2.5 : 1.5}
        filter={
          isLight
            ? 'drop-shadow(0 6px 16px rgba(0,0,0,0.06))'
            : 'drop-shadow(0 10px 22px rgba(0,0,0,0.45))'
        }
      />

      {/* Top Header Strip (Vault Purple) */}
      <rect
        width={w}
        height={6}
        rx={3}
        fill="#a855f7"
        opacity={0.9}
        className="pointer-events-none"
      />

      {/* Interactive HTML Card Body via foreignObject */}
      <foreignObject
        x={0}
        y={6}
        width={w}
        height={Math.max(10, h - 6)}
        className="overflow-hidden"
      >
        <div className="w-full h-full p-3 flex flex-col justify-between font-sans text-left">
          {/* Header row: Environment/Folder tag + Note title */}
          <div>
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-purple-500/30 bg-purple-500/15 text-purple-300 flex items-center gap-1 truncate">
                <Folder className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{folder}</span>
              </span>

              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                .md
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-1">
              <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <h4
                className={`text-xs font-bold truncate ${
                  isLight ? 'text-slate-800' : 'text-slate-100'
                }`}
                title={noteTitle}
              >
                {noteTitle}
              </h4>
            </div>

            {/* Markdown Snippet Preview */}
            <p
              className={`text-[11px] leading-relaxed line-clamp-3 mt-2 ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              {snippet}
            </p>
          </div>

          {/* Bottom row: Path hint + Open in Vault button */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-700/30 text-[10px]">
            <span className="truncate text-slate-400 font-mono text-[9px]">
              {notePath}
            </span>

            <button
              type="button"
              onClick={handleOpenVault}
              title="Abrir nota no Vault (Editor Markdown)"
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors text-[10px] font-semibold ${
                isLight
                  ? 'hover:bg-slate-100 text-purple-600'
                  : 'hover:bg-purple-900/30 text-purple-400 hover:text-purple-300'
              }`}
            >
              <span>Abrir</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </foreignObject>

      {/* Connection hotspots on 4 sides */}
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
