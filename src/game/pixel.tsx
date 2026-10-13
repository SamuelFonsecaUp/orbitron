import React, { memo, useMemo } from 'react';

// Paleta única do jogo (inspirada em paletas de 16 cores clássicas)
export const PALETTE: Record<string, string> = {
  k: '#1a1c2c', // contorno
  w: '#f4f4f4', // branco
  l: '#94b0c2', // pedra clara
  n: '#566c86', // pedra
  N: '#333c57', // pedra escura
  p: '#ff9ec7', // rosa (Pigo)
  P: '#d9638f', // rosa escuro
  r: '#b13e53', // vermelho
  R: '#7a2a3c', // vermelho escuro
  o: '#ef7d57', // laranja
  y: '#ffcd75', // amarelo / ouro
  Y: '#e0a33a', // ouro escuro
  g: '#a7f070', // verde claro
  G: '#38b764', // verde
  D: '#257179', // verde-azulado escuro
  b: '#29366f', // azul escuro
  B: '#3b5dc9', // azul
  c: '#41a6f6', // azul claro
  C: '#73eff7', // ciano
  m: '#8b5a2b', // madeira
  M: '#5d3a1a', // madeira escura
  u: '#c28a4a', // bege
};

export type Sprite = string[];

interface PixelRun {
  x: number;
  y: number;
  w: number;
  color: string;
}

// Converte a matriz de caracteres em "corridas" horizontais da mesma cor (menos <rect>)
function toRuns(sprite: Sprite, overrides: Record<string, string>): PixelRun[] {
  const runs: PixelRun[] = [];
  sprite.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') {
        x++;
        continue;
      }
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      const color = overrides[ch] || PALETTE[ch];
      if (color) runs.push({ x, y, w: end - x, color });
      x = end;
    }
  });
  return runs;
}

export function spriteSize(sprite: Sprite): { w: number; h: number } {
  return { w: Math.max(...sprite.map(r => r.length)), h: sprite.length };
}

interface PixelSpriteProps {
  sprite: Sprite;
  x?: number;
  y?: number;
  scale?: number;
  flip?: boolean;
  // Troca de cores por caractere (ex.: { A: cor da conta } ou skins do Pigo)
  colors?: Record<string, string>;
  className?: string;
  opacity?: number;
}

// Sprite dentro de um <svg> com shape-rendering="crispEdges"
export const PixelSprite: React.FC<PixelSpriteProps> = memo(({ sprite, x = 0, y = 0, scale = 1, flip = false, colors, className, opacity }) => {
  const overridesKey = colors ? JSON.stringify(colors) : '';
  const runs = useMemo(() => toRuns(sprite, colors || {}), [sprite, overridesKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const { w } = spriteSize(sprite);
  const transform = flip
    ? `translate(${x + w * scale} ${y}) scale(${-scale} ${scale})`
    : `translate(${x} ${y}) scale(${scale})`;
  return (
    <g transform={transform} className={className} opacity={opacity}>
      {runs.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.color} />
      ))}
    </g>
  );
});

// Ícone pixel isolado (fora de cenas), com tamanho em px de tela
export const PixelIcon: React.FC<{ sprite: Sprite; size?: number; colors?: Record<string, string>; className?: string }> = ({ sprite, size = 32, colors, className }) => {
  const { w, h } = spriteSize(sprite);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={size}
      height={(size * h) / w}
      shapeRendering="crispEdges"
      className={className}
      style={{ imageRendering: 'pixelated' }}
    >
      <PixelSprite sprite={sprite} colors={colors} />
    </svg>
  );
};
