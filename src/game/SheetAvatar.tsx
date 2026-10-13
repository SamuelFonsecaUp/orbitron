import React, { useEffect, useState } from 'react';
import { ASSET_PACK, packFileUrl } from './pack';
import { AvatarFacing, AvatarLookLike, ComposedFigure, FigureData, composeFigure, parseSheet, viewFor } from './avatarSheet';

/**
 * Carrega a folha do corpo base (pacote oficial) no navegador e desenha o avatar vestido.
 * Cada combinação visual + direção + quadro é gerada uma vez e guardada em cache.
 */

interface LoadedSheet {
  figures: FigureData[];
  skin: string;
}

let sheetPromise: Promise<LoadedSheet | null> | null = null;
const imageCache = new Map<string, { url: string; fig: ComposedFigure }>();

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function loadAvatarSheet(): Promise<LoadedSheet | null> {
  if (sheetPromise) return sheetPromise;
  const cfg = ASSET_PACK.avatar;
  const url = packFileUrl(cfg?.base);
  if (!cfg || !url) {
    sheetPromise = Promise.resolve(null);
    return sheetPromise;
  }
  sheetPromise = new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const figures = parseSheet(data, canvas.width, canvas.height, cfg.views, cfg.background ? hexToRgb(cfg.background) : null);
      resolve(figures.length ? { figures, skin: cfg.skin || '#fdc996' } : null);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
  return sheetPromise;
}

export function useAvatarSheet(): LoadedSheet | null {
  const [sheet, setSheet] = useState<LoadedSheet | null>(null);
  useEffect(() => {
    let alive = true;
    loadAvatarSheet().then(s => { if (alive) setSheet(s); });
    return () => { alive = false; };
  }, []);
  return sheet;
}

function render(sheet: LoadedSheet, look: AvatarLookLike, dir: AvatarFacing, frame: 0 | 1 | 2, sitting: boolean) {
  const { view } = viewFor(dir);
  const key = `${JSON.stringify(look)}|${view}|${frame}|${sitting}`;
  const hit = imageCache.get(key);
  if (hit) return hit;
  const figure = sheet.figures.find(f => f.view === view) || sheet.figures[0];
  const fig = composeFigure(figure, look, { frame, sitting, skinRef: sheet.skin });
  const canvas = document.createElement('canvas');
  canvas.width = fig.w;
  canvas.height = fig.h;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(new ImageData(new Uint8ClampedArray(fig.data), fig.w, fig.h), 0, 0);
  const entry = { url: canvas.toDataURL('image/png'), fig };
  if (imageCache.size > 400) imageCache.clear();
  imageCache.set(key, entry);
  return entry;
}

interface SheetAvatarProps {
  sheet: LoadedSheet;
  look: AvatarLookLike;
  dir: AvatarFacing;
  frame?: 0 | 1 | 2;
  sitting?: boolean;
  x: number; // pé do personagem na cena
  y: number;
}

// Avatar dentro de um <svg>
export const SheetAvatar: React.FC<SheetAvatarProps> = ({ sheet, look, dir, frame = 0, sitting = false, x, y }) => {
  const { url, fig } = render(sheet, look, dir, frame, sitting);
  const { flip } = viewFor(dir);
  const left = flip ? x - (fig.w - fig.anchorX) : x - fig.anchorX;
  const top = y - fig.anchorY;
  return (
    <image
      href={url}
      x={left}
      y={top}
      width={fig.w}
      height={fig.h}
      style={{ imageRendering: 'pixelated' }}
      transform={flip ? `translate(${2 * left + fig.w} 0) scale(-1 1)` : undefined}
    />
  );
};

// Vitrine com as 5 vistas (provador)
export const SheetAvatarViews: React.FC<{ sheet: LoadedSheet; look: AvatarLookLike; height?: number; dirs?: AvatarFacing[] }> = ({
  sheet, look, height = 110, dirs = ['n', 'e', 's', 'sw', 'nw'],
}) => {
  const cell = 46;
  const h = 100;
  return (
    <svg viewBox={`0 0 ${cell * dirs.length} ${h}`} width="100%" height={height} shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
      {dirs.map((d, i) => (
        <SheetAvatar key={d} sheet={sheet} look={look} dir={d} x={i * cell + cell / 2} y={h - 4} />
      ))}
    </svg>
  );
};
