import React, { memo, useMemo } from 'react';
import { PALETTE } from './pixel';

/**
 * Motor isométrico em pixel art (projeção 2:1).
 * Coordenadas de grade (gx, gy) em tiles; z/h em pixels de jogo.
 * As faces são rasterizadas em "corridas" de pixels inteiros, então as
 * bordas inclinadas saem em escadinha como em pixel art feita à mão.
 */

export const TILE_W = 32;
export const TILE_H = 16;

export interface IsoOrigin {
  x: number;
  y: number;
  // Resolução: 1 = tiles de 32x16; 2 = tiles de 64x32 (o dobro de detalhe). Alturas escalam junto.
  unit?: number;
}

export type Pt = [number, number];

export function project(origin: IsoOrigin, gx: number, gy: number, z = 0): Pt {
  const u = origin.unit ?? 1;
  return [
    Math.round(origin.x + (gx - gy) * (TILE_W / 2) * u),
    Math.round(origin.y + (gx + gy) * (TILE_H / 2) * u - z * u),
  ];
}

interface Run {
  x: number;
  y: number;
  w: number;
  h: number;
  c: string;
}

// Preenchimento de polígono por varredura em pixels inteiros
function fillPolygon(pts: Pt[], color: string, runs: Run[]) {
  const ys = pts.map(p => p[1]);
  const minY = Math.floor(Math.min(...ys));
  const maxY = Math.ceil(Math.max(...ys));
  for (let y = minY; y < maxY; y++) {
    const sy = y + 0.5;
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[(i + 1) % pts.length];
      if ((y1 <= sy && y2 > sy) || (y2 <= sy && y1 > sy)) {
        xs.push(x1 + ((sy - y1) * (x2 - x1)) / (y2 - y1));
      }
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const xa = Math.round(xs[i]);
      const xb = Math.round(xs[i + 1]);
      if (xb > xa) runs.push({ x: xa, y, w: xb - xa, h: 1, c: color });
    }
  }
}

// Linha de pixels (DDA); dashed pula pixels alternados
function strokeLine(a: Pt, b: Pt, color: string, runs: Run[], dashed = false) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const n = Math.max(Math.abs(dx), Math.abs(dy));
  for (let i = 0; i <= n; i++) {
    if (dashed && i % 4 >= 2) continue;
    const x = Math.round(a[0] + (dx * i) / (n || 1));
    const y = Math.round(a[1] + (dy * i) / (n || 1));
    runs.push({ x, y, w: 1, h: 1, c: color });
  }
}

function strokePolygon(pts: Pt[], color: string, runs: Run[], dashed = false) {
  for (let i = 0; i < pts.length; i++) strokeLine(pts[i], pts[(i + 1) % pts.length], color, runs, dashed);
}

// Agrupa as corridas por cor num único <path> cada (muito menos elementos no DOM).
// A ordem de pintura entre cores é preservada pela primeira aparição de cada cor.
function runsToPaths(runs: Run[]): { color: string; d: string }[] {
  const order: string[] = [];
  const byColor = new Map<string, string[]>();
  for (const r of runs) {
    let list = byColor.get(r.c);
    if (!list) {
      list = [];
      byColor.set(r.c, list);
      order.push(r.c);
    }
    list.push(`M${r.x} ${r.y}h${r.w}v${r.h}h${-r.w}z`);
  }
  return order.map(color => ({ color, d: byColor.get(color)!.join('') }));
}

const Runs: React.FC<{ runs: Run[]; opacity?: number }> = memo(({ runs, opacity }) => {
  const paths = useMemo(() => runsToPaths(runs), [runs]);
  return (
    <g opacity={opacity}>
      {paths.map(p => <path key={p.color} d={p.d} fill={p.color} />)}
    </g>
  );
});

export interface BoxColors {
  top: string;
  left: string;
  right: string;
  outline?: string;
}

export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 255) * (1 + amount));
  const g = clamp(((n >> 8) & 255) * (1 + amount));
  const b = clamp((n & 255) * (1 + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function boxColorsFrom(base: string): BoxColors {
  return { top: shade(base, 0.25), left: base, right: shade(base, -0.3), outline: PALETTE.k };
}

interface IsoBoxProps {
  origin: IsoOrigin;
  gx: number;
  gy: number;
  w: number;
  d: number;
  h: number;
  z?: number;
  colors: BoxColors;
  opacity?: number;
}

// Sólido isométrico: topo + faces esquerda/direita visíveis
export const IsoBox: React.FC<IsoBoxProps> = ({ origin, gx, gy, w, d, h, z = 0, colors, opacity }) => {
  const runs = useMemo(() => {
    const out: Run[] = [];
    const A = project(origin, gx, gy, z + h);
    const B = project(origin, gx + w, gy, z + h);
    const C = project(origin, gx + w, gy + d, z + h);
    const D = project(origin, gx, gy + d, z + h);
    const Bb = project(origin, gx + w, gy, z);
    const Cb = project(origin, gx + w, gy + d, z);
    const Db = project(origin, gx, gy + d, z);
    if (h > 0) {
      fillPolygon([D, C, Cb, Db], colors.left, out);
      fillPolygon([C, B, Bb, Cb], colors.right, out);
    }
    fillPolygon([A, B, C, D], colors.top, out);
    if (colors.outline) {
      if (h > 0) {
        strokePolygon([D, C, Cb, Db], colors.outline, out);
        strokePolygon([C, B, Bb, Cb], colors.outline, out);
      }
      strokePolygon([A, B, C, D], colors.outline, out);
    }
    return out;
  }, [origin.x, origin.y, origin.unit, gx, gy, w, d, h, z, colors.top, colors.left, colors.right, colors.outline]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Runs runs={runs} opacity={opacity} />;
};

// Contorno tracejado de um sólido (planejado / ainda não construído)
export const IsoGhostBox: React.FC<Omit<IsoBoxProps, 'colors'> & { color: string }> = ({ origin, gx, gy, w, d, h, z = 0, color, opacity }) => {
  const runs = useMemo(() => {
    const out: Run[] = [];
    const A = project(origin, gx, gy, z + h);
    const B = project(origin, gx + w, gy, z + h);
    const C = project(origin, gx + w, gy + d, z + h);
    const D = project(origin, gx, gy + d, z + h);
    const Bb = project(origin, gx + w, gy, z);
    const Cb = project(origin, gx + w, gy + d, z);
    const Db = project(origin, gx, gy + d, z);
    strokePolygon([A, B, C, D], color, out, true);
    strokeLine(D, Db, color, out, true);
    strokeLine(C, Cb, color, out, true);
    strokeLine(B, Bb, color, out, true);
    return out;
  }, [origin.x, origin.y, origin.unit, gx, gy, w, d, h, z, color]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Runs runs={runs} opacity={opacity} />;
};

// Telhado de quatro águas sobre uma base w x d na altura z
export const IsoRoof: React.FC<{ origin: IsoOrigin; gx: number; gy: number; w: number; d: number; z: number; h: number; color: string }> = ({ origin, gx, gy, w, d, z, h, color }) => {
  const runs = useMemo(() => {
    const out: Run[] = [];
    const A = project(origin, gx, gy, z);
    const B = project(origin, gx + w, gy, z);
    const C = project(origin, gx + w, gy + d, z);
    const D = project(origin, gx, gy + d, z);
    const apex = project(origin, gx + w / 2, gy + d / 2, z + h);
    fillPolygon([A, B, apex], shade(color, 0.15), out);
    fillPolygon([D, A, apex], shade(color, 0.05), out);
    fillPolygon([D, C, apex], color, out);
    fillPolygon([C, B, apex], shade(color, -0.3), out);
    strokePolygon([D, C, apex], PALETTE.k, out);
    strokePolygon([C, B, apex], PALETTE.k, out);
    strokeLine(A, B, PALETTE.k, out);
    strokeLine(D, A, PALETTE.k, out);
    return out;
  }, [origin.x, origin.y, origin.unit, gx, gy, w, d, z, h, color]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Runs runs={runs} />;
};

// Tile de chão (losango) com cor própria
export const IsoTile: React.FC<{ origin: IsoOrigin; gx: number; gy: number; color: string; outline?: string }> = ({ origin, gx, gy, color, outline }) => {
  const runs = useMemo(() => {
    const out: Run[] = [];
    const pts: Pt[] = [project(origin, gx, gy), project(origin, gx + 1, gy), project(origin, gx + 1, gy + 1), project(origin, gx, gy + 1)];
    fillPolygon(pts, color, out);
    if (outline) strokePolygon(pts, outline, out);
    return out;
  }, [origin.x, origin.y, origin.unit, gx, gy, color, outline]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Runs runs={runs} />;
};

// Ponto de apoio (base central) de um tile para posicionar sprites em pé
export function tileAnchor(origin: IsoOrigin, gx: number, gy: number): Pt {
  return project(origin, gx + 0.5, gy + 0.5);
}
