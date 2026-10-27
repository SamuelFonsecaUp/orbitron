import React, { useState } from 'react';
import { CanvasNode, CanvasSide } from '../../io/jsonCanvas.types';
import { Point, Rect } from '../../scene/types';
import { NodeHotspots } from './NodeHotspots';
import { CanvasTheme } from '../../store/canvasStore.types';
import { Maximize2, Image as ImageIcon, ExternalLink, RefreshCw } from 'lucide-react';
import { canvasStore } from '../../store/canvasStore';
import { createUpdateNodeCommand } from '../../scene/commands';

interface ImageNodeProps {
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
  onPreviewImage?: (src: string, label?: string) => void;
}

export const ImageNode: React.FC<ImageNodeProps> = ({
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
  onPreviewImage,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>(
    node.backgroundStyle === 'cover' ? 'cover' : 'contain'
  );

  const src = node.url || node.file || '';
  const { x, y, width: w, height: h } = effectiveRect;
  const isLight = theme === 'light';
  const caption = node.label || node.text || '';

  const handleToggleFit = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextFit = fitMode === 'contain' ? 'cover' : 'contain';
    setFitMode(nextFit);
    canvasStore.dispatch(
      createUpdateNodeCommand(
        node.id,
        { backgroundStyle: node.backgroundStyle },
        { backgroundStyle: nextFit }
      )
    );
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPreviewImage && src) {
      onPreviewImage(src, caption);
    } else if (src.startsWith('http')) {
      window.open(src, '_blank');
    }
  };

  const showBorder = isSelected || isTargetCandidate || (isHovered && Boolean(src && !hasError));

  return (
    <g
      transform={`translate(${x} ${y})`}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      className="cursor-pointer select-none"
    >
      {/* Selection / Hover Indicator Bounding Box - NO OPAQUE CARD BACKGROUND FILL! */}
      {showBorder && (
        <rect
          width={w}
          height={h}
          rx={8}
          fill="none"
          stroke={
            isTargetCandidate
              ? '#38bdf8'
              : isSelected
              ? '#a855f7'
              : 'rgba(168, 85, 247, 0.45)'
          }
          strokeWidth={isTargetCandidate ? 2.5 : isSelected ? 2 : 1.5}
          strokeDasharray={isSelected || isTargetCandidate ? undefined : '4 4'}
          className="transition-all duration-100 pointer-events-none"
        />
      )}

      {/* Pure Image Container without opaque background - Transparent PNGs shine through! */}
      <foreignObject
        x={0}
        y={0}
        width={Math.max(10, w)}
        height={Math.max(10, h)}
        className="overflow-hidden"
      >
        <div className="relative w-full h-full flex items-center justify-center bg-transparent">
          {src && !hasError ? (
            <img
              src={src}
              alt={caption || 'Imagem'}
              style={{ objectFit: fitMode }}
              className="w-full h-full pointer-events-none select-none drop-shadow-sm transition-all duration-150"
              onError={() => setHasError(true)}
            />
          ) : (
            /* Error / Missing Image Placeholder */
            <div
              className={`flex flex-col items-center justify-center p-4 text-center rounded-2xl border border-dashed w-full h-full ${
                isLight
                  ? 'bg-slate-100/70 border-slate-300 text-slate-600'
                  : 'bg-slate-900/40 border-slate-700/80 text-slate-400'
              }`}
            >
              <div
                className={`p-3 rounded-full mb-2 ${
                  isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <ImageIcon className="w-6 h-6" />
              </div>
              <span className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {hasError ? 'Falha ao carregar imagem' : 'Nenhuma imagem anexada'}
              </span>
              {hasError && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHasError(false);
                  }}
                  className="mt-2 text-[11px] text-purple-400 hover:text-purple-300 underline pointer-events-auto flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Tentar novamente</span>
                </button>
              )}
            </div>
          )}

          {/* Hover Floating Controls Bar */}
          {src && !hasError && isHovered && (
            <div className="absolute top-2 right-2 flex items-center gap-1 p-1 rounded-xl bg-black/75 backdrop-blur-md border border-white/15 z-10 animate-in fade-in duration-100 pointer-events-auto shadow-xl">
              <button
                type="button"
                onClick={handleToggleFit}
                className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold text-white bg-white/20 hover:bg-white/30 transition"
                title={`Ajuste atual: ${fitMode === 'contain' ? 'Conter (Sem cortar)' : 'Preencher (Cortar)'}`}
              >
                {fitMode === 'contain' ? 'FIT' : 'CROP'}
              </button>
              <button
                type="button"
                onClick={handleExpand}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition"
                title="Visualizar em tamanho real"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              {src.startsWith('http') && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(src, '_blank');
                  }}
                  className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition"
                  title="Abrir URL original"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Optional Caption Badge - Floating pill without ruining transparency */}
          {caption && src && !hasError && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/75 text-white backdrop-blur-md shadow-lg truncate max-w-[85%] border border-white/10 pointer-events-none">
              {caption}
            </div>
          )}
        </div>
      </foreignObject>

      {/* Connectors Hotspots */}
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