import React, { useState, useMemo } from 'react';
import { CanvasNode, CanvasSide } from '../../io/jsonCanvas.types';
import { getCanvasColor } from '../colors';
import { Point, Rect } from '../../scene/types';
import { NodeHotspots } from './NodeHotspots';
import { CanvasTheme } from '../../store/canvasStore.types';
import { getDomain, normalizeUrl } from '../../scene/nodeUtils';
import { ExternalLink, Globe, Copy, Check, Lock, Sparkles } from 'lucide-react';

interface LinkNodeProps {
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

// Generate brand/domain specific gradients for the visual banner
function getDomainGradient(domain: string, isLight: boolean): { from: string; to: string; accent: string } {
  const d = domain.toLowerCase();
  if (d.includes('github')) return { from: '#24292e', to: '#0d1117', accent: '#a855f7' };
  if (d.includes('youtube')) return { from: '#991b1b', to: '#450a0a', accent: '#ef4444' };
  if (d.includes('google')) return { from: '#1e3a8a', to: '#172554', accent: '#38bdf8' };
  if (d.includes('figma')) return { from: '#831843', to: '#500724', accent: '#ec4899' };
  if (d.includes('notion')) return { from: '#1e293b', to: '#0f172a', accent: '#94a3b8' };
  if (d.includes('spotify')) return { from: '#064e3b', to: '#022c22', accent: '#10b981' };
  if (d.includes('twitter') || d.includes('x.com')) return { from: '#0284c7', to: '#0369a1', accent: '#38bdf8' };

  if (isLight) {
    return { from: '#f1f5f9', to: '#e2e8f0', accent: '#8b5cf6' };
  }
  return { from: '#1e1b4b', to: '#0f172a', accent: '#a855f7' };
}

export const LinkNode: React.FC<LinkNodeProps> = ({
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
  const [copied, setCopied] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  const rawUrl = node.url || node.file || '';
  const fullUrl = normalizeUrl(rawUrl);
  const domain = getDomain(rawUrl);
  const title = node.label || domain || 'Link Web';
  const color = getCanvasColor(node.color, theme);
  const { x, y, width: w, height: h } = effectiveRect;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const isLight = theme === 'light';

  const brand = useMemo(() => getDomainGradient(domain, isLight), [domain, isLight]);
  const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : '';

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fullUrl) return;
    try {
      const electronShell = (window as any).electronAPI?.shell;
      if (electronShell?.openExternal) {
        electronShell.openExternal(fullUrl);
      } else {
        window.open(fullUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fullUrl) return;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const bannerHeight = Math.min(42, Math.max(30, Math.round(h * 0.28)));

  return (
    <g
      transform={`rotate(${effectiveRotation} ${cx} ${cy}) translate(${x} ${y})`}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      className="cursor-pointer select-none"
    >
      <defs>
        <linearGradient id={`grad-banner-${node.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={brand.from} />
          <stop offset="100%" stopColor={brand.to} />
        </linearGradient>
        <linearGradient id={`grad-border-${node.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={brand.accent} stopOpacity={0.8} />
          <stop offset="100%" stopColor={color.border} stopOpacity={0.4} />
        </linearGradient>
      </defs>

      {/* Outer Card Body */}
      <rect
        width={w}
        height={h}
        rx={14}
        fill={isLight ? '#ffffff' : '#0c101c'}
        stroke={
          isTargetCandidate
            ? '#38bdf8'
            : isSelected
            ? '#c084fc'
            : isHovered
            ? brand.accent
            : isLight
            ? '#e2e8f0'
            : '#1e293b'
        }
        strokeWidth={isTargetCandidate ? 3 : isSelected ? 2.5 : isHovered ? 1.75 : 1.25}
        filter={
          isLight
            ? 'drop-shadow(0 10px 25px rgba(0,0,0,0.07))'
            : isSelected || isHovered
            ? `drop-shadow(0 12px 30px rgba(0,0,0,0.6)) drop-shadow(0 0 16px ${brand.accent}33)`
            : 'drop-shadow(0 12px 28px rgba(0,0,0,0.5))'
        }
        className="transition-all duration-200"
      />

      {/* Decorative Top Banner */}
      <clipPath id={`clip-banner-${node.id}`}>
        <rect width={w} height={bannerHeight} rx={14} />
      </clipPath>
      <g clipPath={`url(#clip-banner-${node.id})`}>
        <rect
          width={w}
          height={bannerHeight + 14}
          fill={`url(#grad-banner-${node.id})`}
          opacity={isLight ? 0.9 : 0.95}
        />
        {/* Subtle mesh lines */}
        <line
          x1={0}
          y1={bannerHeight - 1}
          x2={w}
          y2={bannerHeight - 1}
          stroke={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}
          strokeWidth={1}
        />
      </g>

      {/* Card Content via ForeignObject */}
      <foreignObject
        x={0}
        y={0}
        width={w}
        height={h}
        className="overflow-hidden rounded-2xl pointer-events-auto"
      >
        <div className="w-full h-full flex flex-col justify-between font-sans p-3.5 select-none">
          {/* Top Row: Floating Favicon Badge & Domain Pill */}
          <div className="flex items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-2 min-w-0">
              {/* Favicon Container */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-md border transition-transform duration-200 ${
                  isHovered ? 'scale-105' : ''
                } ${
                  isLight
                    ? 'bg-white border-slate-200 shadow-slate-300/40'
                    : 'bg-slate-900/90 border-white/15 shadow-black/60'
                }`}
              >
                {!faviconError && faviconUrl ? (
                  <img
                    src={faviconUrl}
                    alt={domain}
                    className="w-5 h-5 object-contain pointer-events-none"
                    onError={() => setFaviconError(true)}
                  />
                ) : (
                  <Globe className={`w-4 h-4 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
                )}
              </div>

              {/* Domain & Protocol Badge */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md flex items-center gap-1 truncate ${
                    isLight
                      ? 'bg-white/95 text-slate-800 border border-slate-200 shadow-sm'
                      : 'bg-black/60 text-slate-200 border border-white/10 shadow-sm backdrop-blur-md'
                  }`}
                >
                  <Lock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{domain || 'LINK'}</span>
                </span>
              </div>
            </div>

            {/* Quick Actions in Header */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleCopy}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  copied
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isLight
                    ? 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200 shadow-sm'
                    : 'bg-black/40 hover:bg-black/60 text-slate-300 border border-white/10'
                }`}
                title={copied ? 'Copiado!' : 'Copiar URL'}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Middle: Title & Snippet */}
          <div className="my-auto py-1 min-w-0">
            <h4
              className={`font-bold text-sm leading-snug line-clamp-2 transition-colors ${
                isLight
                  ? 'text-slate-900 group-hover:text-purple-600'
                  : 'text-white group-hover:text-purple-300'
              }`}
            >
              {title}
            </h4>
            {node.text && node.text !== title && (
              <p
                className={`text-xs mt-1 line-clamp-2 leading-relaxed ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                {node.text}
              </p>
            )}
          </div>

          {/* Bottom Bar: Clean URL and Open Button */}
          <div
            className={`pt-2 border-t flex items-center justify-between gap-2 text-xs ${
              isLight ? 'border-slate-100' : 'border-slate-800/80'
            }`}
          >
            <span
              className={`truncate font-mono text-[11px] max-w-[65%] ${
                isLight ? 'text-slate-500' : 'text-slate-500'
              }`}
              title={rawUrl}
            >
              {rawUrl.replace(/^https?:\/\//i, '')}
            </span>

            <button
              type="button"
              onClick={handleOpenLink}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/25 transition-all transform hover:scale-[1.03] active:scale-95 shrink-0"
              title="Abrir no navegador"
            >
              <span>Abrir</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </foreignObject>

      {/* Magnetic Hotspots for 4-way connections */}
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
