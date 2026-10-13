import React from 'react';
import { BoxColors, IsoBox, IsoOrigin, boxColorsFrom, project } from './iso';
import { PALETTE, PixelSprite, spriteSize } from './pixel';
import { FLAME, PIGO, COIN } from './sprites';

/**
 * Catálogo de mobis (móveis) do quarto, no estilo dos quartos isométricos.
 * Arte original em blocos; cada mobi é liberado por uma conquista ou nível.
 */

export type RoomId = 'finance' | 'life';

export type UnlockRule =
  | { type: 'default' }
  | { type: 'achievement'; id: string; label: string }
  | { type: 'level'; level: number };

export interface MobiCtx {
  o: IsoOrigin;
  gx: number;
  gy: number;
  rot: 0 | 1;
  night?: boolean;
}

export interface MobiDef {
  id: string;
  name: string;
  description: string;
  category: 'assentos' | 'mesas' | 'decoração' | 'tesouro' | 'raros';
  w: number; // pegada em tiles (rotação 0)
  d: number;
  walkable?: boolean; // tapetes: dá para pisar e colocar coisas por cima
  qty: number; // quantas cópias o desbloqueio libera
  rooms: RoomId[];
  unlock: UnlockRule;
  render: (c: MobiCtx) => React.ReactNode;
}

// Caixa em coordenadas locais do mobi (rotação = espelha no eixo diagonal, como nos quartos isométricos clássicos)
function B(c: MobiCtx, x: number, y: number, w: number, d: number, h: number, z: number, colors: BoxColors, key?: React.Key) {
  const [X, Y, W, D] = c.rot ? [y, x, d, w] : [x, y, w, d];
  return <IsoBox key={key} origin={c.o} gx={c.gx + X} gy={c.gy + Y} w={W} d={D} h={h} z={z} colors={colors} />;
}

function P(c: MobiCtx, x: number, y: number, z: number): [number, number] {
  const [X, Y] = c.rot ? [y, x] : [x, y];
  return project(c.o, c.gx + X, c.gy + Y, z);
}

const WOOD = boxColorsFrom('#a0672f');
const DARK_WOOD = boxColorsFrom('#6b4220');
const STEEL = boxColorsFrom('#7d8ea3');
const DARK_STEEL = boxColorsFrom('#4a5568');
const GOLD = boxColorsFrom('#e0a33a');
const WHITE = boxColorsFrom('#d9dde3');

function legs(c: MobiCtx, x: number, y: number, w: number, d: number, h: number, colors: BoxColors) {
  const t = 0.1;
  return [
    B(c, x, y, t, t, h, 0, colors, 'l1'),
    B(c, x + w - t, y, t, t, h, 0, colors, 'l2'),
    B(c, x, y + d - t, t, t, h, 0, colors, 'l3'),
    B(c, x + w - t, y + d - t, t, t, h, 0, colors, 'l4'),
  ];
}

export const MOBIS: MobiDef[] = [
  // ---------- Básicos (sempre disponíveis) ----------
  {
    id: 'cadeira', name: 'Cadeira de Madeira', description: 'Simples e honesta.', category: 'assentos',
    w: 1, d: 1, qty: 4, rooms: ['finance', 'life'], unlock: { type: 'default' },
    render: c => (
      <g>
        {legs(c, 0.2, 0.2, 0.6, 0.6, 6, DARK_WOOD)}
        {B(c, 0.2, 0.2, 0.6, 0.6, 2, 6, WOOD)}
        {B(c, 0.2, 0.2, 0.6, 0.12, 10, 8, WOOD)}
      </g>
    ),
  },
  {
    id: 'mesa', name: 'Mesa Quadrada', description: 'Para planejar o mês.', category: 'mesas',
    w: 1, d: 1, qty: 2, rooms: ['finance', 'life'], unlock: { type: 'default' },
    render: c => (
      <g>
        {legs(c, 0.1, 0.1, 0.8, 0.8, 10, DARK_WOOD)}
        {B(c, 0.05, 0.05, 0.9, 0.9, 2, 10, WOOD)}
      </g>
    ),
  },
  {
    id: 'tapete', name: 'Tapete Listrado', description: 'Dá para pisar e pôr móveis em cima.', category: 'decoração',
    w: 2, d: 2, walkable: true, qty: 2, rooms: ['finance', 'life'], unlock: { type: 'default' },
    render: c => (
      <g>
        {B(c, 0.1, 0.1, 1.8, 1.8, 1, 0, boxColorsFrom('#b13e53'))}
        {B(c, 0.4, 0.4, 1.2, 1.2, 1, 0.5, boxColorsFrom('#ffcd75'))}
        {B(c, 0.7, 0.7, 0.6, 0.6, 1, 0.8, boxColorsFrom('#b13e53'))}
      </g>
    ),
  },
  {
    id: 'planta', name: 'Planta em Vaso', description: 'Um pouco de verde no escritório.', category: 'decoração',
    w: 1, d: 1, qty: 3, rooms: ['finance', 'life'], unlock: { type: 'default' },
    render: c => (
      <g>
        {B(c, 0.3, 0.3, 0.4, 0.4, 6, 0, boxColorsFrom('#c25f3a'))}
        {B(c, 0.2, 0.2, 0.6, 0.6, 7, 6, boxColorsFrom('#2f9e57'))}
        {B(c, 0.32, 0.32, 0.36, 0.36, 5, 13, boxColorsFrom('#4cc46e'))}
      </g>
    ),
  },
  {
    id: 'luminaria', name: 'Luminária de Chão', description: 'Acende à noite.', category: 'decoração',
    w: 1, d: 1, qty: 2, rooms: ['finance', 'life'], unlock: { type: 'default' },
    render: c => (
      <g>
        {B(c, 0.35, 0.35, 0.3, 0.3, 2, 0, DARK_STEEL)}
        {B(c, 0.46, 0.46, 0.08, 0.08, 20, 2, DARK_STEEL)}
        {B(c, 0.25, 0.25, 0.5, 0.5, 6, 20, boxColorsFrom(c.night ? '#fff2a8' : '#f4e3b5'))}
      </g>
    ),
  },

  // ---------- Desbloqueados por conquistas financeiras ----------
  {
    id: 'gaveteiro', name: 'Arquivo de Extratos', description: 'Onde moram os OFX importados.', category: 'mesas',
    w: 1, d: 1, qty: 1, rooms: ['finance'], unlock: { type: 'achievement', id: 'primeiro_extrato', label: 'Primeiro Extrato' },
    render: c => (
      <g>
        {B(c, 0.15, 0.25, 0.7, 0.55, 22, 0, STEEL)}
        {B(c, 0.25, 0.8, 0.5, 0.02, 1, 16, DARK_STEEL)}
        {B(c, 0.25, 0.8, 0.5, 0.02, 1, 9, DARK_STEEL)}
      </g>
    ),
  },
  {
    id: 'estante_pastas', name: 'Estante de Pastas', description: 'Dez extratos organizados.', category: 'mesas',
    w: 2, d: 1, qty: 1, rooms: ['finance'], unlock: { type: 'achievement', id: 'extratos_10', label: 'Arquivista' },
    render: c => (
      <g>
        {B(c, 0.1, 0.2, 1.8, 0.6, 30, 0, WOOD)}
        {['#b13e53', '#3b5dc9', '#38b764', '#ffcd75', '#ef7d57', '#41a6f6'].map((col, i) => B(c, 0.2 + i * 0.27, 0.8, 0.2, 0.02, 9, 18, boxColorsFrom(col), `f1${i}`))}
        {['#38b764', '#ef7d57', '#3b5dc9', '#b13e53', '#41a6f6', '#ffcd75'].map((col, i) => B(c, 0.2 + i * 0.27, 0.8, 0.2, 0.02, 9, 4, boxColorsFrom(col), `f2${i}`))}
      </g>
    ),
  },
  {
    id: 'caixas', name: 'Caixas Organizadoras', description: '100 lançamentos no lugar certo.', category: 'decoração',
    w: 1, d: 1, qty: 2, rooms: ['finance', 'life'], unlock: { type: 'achievement', id: 'categorizador_100', label: 'Organizador' },
    render: c => (
      <g>
        {B(c, 0.1, 0.1, 0.8, 0.8, 7, 0, boxColorsFrom('#3b5dc9'))}
        {B(c, 0.15, 0.15, 0.7, 0.7, 7, 7, boxColorsFrom('#38b764'))}
        {B(c, 0.25, 0.25, 0.5, 0.5, 6, 14, boxColorsFrom('#ef7d57'))}
      </g>
    ),
  },
  {
    id: 'escrivaninha', name: 'Escrivaninha com Computador', description: 'Caixa de entrada zerada.', category: 'mesas',
    w: 2, d: 1, qty: 1, rooms: ['finance', 'life'], unlock: { type: 'achievement', id: 'caixa_zero', label: 'Caixa de Entrada Zero' },
    render: c => (
      <g>
        {B(c, 0.1, 0.15, 0.2, 0.7, 12, 0, DARK_WOOD)}
        {B(c, 1.7, 0.15, 0.2, 0.7, 12, 0, DARK_WOOD)}
        {B(c, 0.05, 0.1, 1.9, 0.8, 2, 12, WOOD)}
        {B(c, 0.7, 0.25, 0.6, 0.12, 10, 14, DARK_STEEL)}
        {B(c, 0.75, 0.37, 0.5, 0.01, 8, 15, boxColorsFrom('#41a6f6'))}
        {B(c, 0.7, 0.55, 0.6, 0.2, 1, 14, WHITE)}
      </g>
    ),
  },
  {
    id: 'vaso_azul', name: 'Vaso "No Azul"', description: 'Primeiro mês fechado no azul.', category: 'decoração',
    w: 1, d: 1, qty: 1, rooms: ['finance', 'life'], unlock: { type: 'achievement', id: 'mes_azul', label: 'No Azul' },
    render: c => (
      <g>
        {B(c, 0.3, 0.3, 0.4, 0.4, 10, 0, boxColorsFrom('#3b5dc9'))}
        {B(c, 0.35, 0.35, 0.1, 0.1, 6, 10, boxColorsFrom('#38b764'))}
        {B(c, 0.55, 0.45, 0.1, 0.1, 8, 10, boxColorsFrom('#38b764'))}
        {B(c, 0.28, 0.28, 0.22, 0.22, 3, 16, boxColorsFrom('#73eff7'))}
        {B(c, 0.5, 0.4, 0.22, 0.22, 3, 18, boxColorsFrom('#ffcd75'))}
      </g>
    ),
  },
  {
    id: 'sofa_azul', name: 'Sofá Trimestre Azul', description: 'Três meses seguidos no azul.', category: 'assentos',
    w: 2, d: 1, qty: 1, rooms: ['finance', 'life'], unlock: { type: 'achievement', id: 'azul_3', label: 'Trimestre Azul' },
    render: c => {
      const blue = boxColorsFrom('#3b5dc9');
      return (
        <g>
          {B(c, 0.05, 0.1, 1.9, 0.3, 14, 0, blue)}
          {B(c, 0.05, 0.4, 0.3, 0.5, 9, 0, blue)}
          {B(c, 1.65, 0.4, 0.3, 0.5, 9, 0, blue)}
          {B(c, 0.35, 0.4, 1.3, 0.5, 6, 0, boxColorsFrom('#41a6f6'))}
        </g>
      );
    },
  },
  {
    id: 'estatua_pigo', name: 'Cofrinho Pigo', description: 'Seu primeiro aporte na reserva.', category: 'tesouro',
    w: 1, d: 1, qty: 1, rooms: ['finance'], unlock: { type: 'achievement', id: 'primeira_reserva', label: 'Primeiro Tijolo' },
    render: c => {
      const top = P(c, 0.5, 0.5, 8);
      const { w, h } = spriteSize(PIGO);
      return (
        <g>
          {B(c, 0.15, 0.15, 0.7, 0.7, 8, 0, WHITE)}
          <PixelSprite sprite={PIGO} x={top[0] - w / 2} y={top[1] - h + 2} />
        </g>
      );
    },
  },
  {
    id: 'cofre', name: 'Cofre de Aço', description: 'Um mês de custo de vida guardado.', category: 'tesouro',
    w: 1, d: 1, qty: 1, rooms: ['finance'], unlock: { type: 'achievement', id: 'reserva_1', label: 'Um Mês de Paz' },
    render: c => {
      const dial = P(c, 0.5, 0.9, 9);
      return (
        <g>
          {B(c, 0.1, 0.1, 0.8, 0.8, 18, 0, DARK_STEEL)}
          <rect x={dial[0] - 2} y={dial[1] - 2} width={4} height={4} fill={PALETTE.y} />
          <rect x={dial[0] - 1} y={dial[1] - 1} width={2} height={2} fill={PALETTE.k} />
        </g>
      );
    },
  },
  {
    id: 'cofre_forte', name: 'Cofre-Forte', description: 'Três meses de custo de vida protegidos.', category: 'tesouro',
    w: 2, d: 2, qty: 1, rooms: ['finance'], unlock: { type: 'achievement', id: 'reserva_3', label: 'Colchão Seguro' },
    render: c => {
      const center = P(c, 1, 1.9, 16);
      return (
        <g>
          {B(c, 0.1, 0.1, 1.8, 1.8, 32, 0, STEEL)}
          <circle cx={center[0]} cy={center[1]} r={7} fill={PALETTE.N} />
          <circle cx={center[0]} cy={center[1]} r={4} fill={PALETTE.y} />
          <rect x={center[0] - 1} y={center[1] - 6} width={2} height={12} fill={PALETTE.N} />
        </g>
      );
    },
  },
  {
    id: 'estatua_ouro', name: 'Estátua Dourada do Pigo', description: 'Reserva completa. Lendário.', category: 'raros',
    w: 2, d: 2, qty: 1, rooms: ['finance', 'life'], unlock: { type: 'achievement', id: 'reserva_completa', label: 'Fortaleza' },
    render: c => {
      const top = P(c, 1, 1, 12);
      const { w, h } = spriteSize(PIGO);
      return (
        <g>
          {B(c, 0.2, 0.2, 1.6, 1.6, 6, 0, WHITE)}
          {B(c, 0.4, 0.4, 1.2, 1.2, 6, 6, boxColorsFrom('#b9c2cc'))}
          <PixelSprite sprite={PIGO} x={top[0] - w} y={top[1] - h * 2 + 3} scale={2} colors={{ p: '#ffcd75', P: '#e0a33a', y: '#fff4c2' }} />
        </g>
      );
    },
  },
  {
    id: 'telescopio', name: 'Telescópio de Detetive', description: 'Achou 5 assinaturas escondidas.', category: 'decoração',
    w: 1, d: 1, qty: 1, rooms: ['finance', 'life'], unlock: { type: 'achievement', id: 'detetive', label: 'Detetive de Assinaturas' },
    render: c => (
      <g>
        {B(c, 0.45, 0.45, 0.1, 0.1, 14, 0, DARK_WOOD)}
        {B(c, 0.2, 0.2, 0.1, 0.1, 10, 0, DARK_WOOD)}
        {B(c, 0.7, 0.25, 0.1, 0.1, 10, 0, DARK_WOOD)}
        {B(c, 0.15, 0.4, 0.75, 0.2, 5, 14, GOLD)}
      </g>
    ),
  },
  {
    id: 'relogio', name: 'Relógio de Pêndulo', description: '4 semanas seguidas importando.', category: 'decoração',
    w: 1, d: 1, qty: 1, rooms: ['finance', 'life'], unlock: { type: 'achievement', id: 'semanas_4', label: 'Ritmo Semanal' },
    render: c => {
      const face = P(c, 0.5, 0.75, 30);
      return (
        <g>
          {B(c, 0.25, 0.3, 0.5, 0.45, 38, 0, DARK_WOOD)}
          <rect x={face[0] - 3} y={face[1] - 3} width={6} height={6} fill={PALETTE.w} />
          <rect x={face[0]} y={face[1] - 2} width={1} height={3} fill={PALETTE.k} />
        </g>
      );
    },
  },
  {
    id: 'registradora', name: 'Caixa Registradora', description: '3 faturas pagas em dia.', category: 'tesouro',
    w: 1, d: 1, qty: 1, rooms: ['finance'], unlock: { type: 'achievement', id: 'fatura_3', label: 'Pagador Pontual' },
    render: c => (
      <g>
        {B(c, 0.1, 0.1, 0.8, 0.8, 10, 0, WOOD)}
        {B(c, 0.25, 0.25, 0.5, 0.5, 6, 10, DARK_STEEL)}
        {B(c, 0.3, 0.25, 0.4, 0.12, 4, 16, boxColorsFrom('#38b764'))}
      </g>
    ),
  },
  {
    id: 'balanca', name: 'Balança do Orçamento', description: '5 tetos de orçamento cumpridos.', category: 'decoração',
    w: 1, d: 1, qty: 1, rooms: ['finance'], unlock: { type: 'achievement', id: 'orcamento_5', label: 'Dentro do Teto' },
    render: c => (
      <g>
        {B(c, 0.3, 0.3, 0.4, 0.4, 2, 0, GOLD)}
        {B(c, 0.46, 0.46, 0.08, 0.08, 18, 2, GOLD)}
        {B(c, 0.1, 0.45, 0.8, 0.1, 1, 20, GOLD)}
        {B(c, 0.05, 0.35, 0.3, 0.3, 1, 14, GOLD)}
        {B(c, 0.65, 0.35, 0.3, 0.3, 1, 14, GOLD)}
      </g>
    ),
  },
  {
    id: 'quadro_missoes', name: 'Quadro de Missões', description: '10 missões semanais concluídas.', category: 'decoração',
    w: 1, d: 1, qty: 1, rooms: ['finance', 'life'], unlock: { type: 'achievement', id: 'missoes_10', label: 'Caçador de Missões' },
    render: c => (
      <g>
        {B(c, 0.2, 0.4, 0.08, 0.08, 20, 0, DARK_WOOD)}
        {B(c, 0.72, 0.4, 0.08, 0.08, 20, 0, DARK_WOOD)}
        {B(c, 0.1, 0.48, 0.8, 0.06, 16, 8, boxColorsFrom('#c28a4a'))}
        {B(c, 0.2, 0.54, 0.2, 0.01, 4, 16, WHITE)}
        {B(c, 0.5, 0.54, 0.25, 0.01, 5, 10, boxColorsFrom('#ffcd75'))}
      </g>
    ),
  },

  // ---------- Desbloqueados por nível ----------
  {
    id: 'aquario', name: 'Aquário', description: 'Nível 5 da Jornada.', category: 'raros',
    w: 2, d: 1, qty: 1, rooms: ['finance', 'life'], unlock: { type: 'level', level: 5 },
    render: c => {
      const fish = P(c, 1, 0.9, 14);
      return (
        <g>
          {B(c, 0.05, 0.15, 1.9, 0.7, 8, 0, DARK_WOOD)}
          {B(c, 0.1, 0.2, 1.8, 0.6, 12, 8, boxColorsFrom('#41a6f6'))}
          <rect x={fish[0] - 8} y={fish[1] - 1} width={3} height={2} fill={PALETTE.o} />
          <rect x={fish[0] + 4} y={fish[1] - 4} width={3} height={2} fill={PALETTE.y} />
        </g>
      );
    },
  },
  {
    id: 'lareira', name: 'Lareira', description: 'Nível 10 da Jornada.', category: 'raros',
    w: 2, d: 1, qty: 1, rooms: ['finance', 'life'], unlock: { type: 'level', level: 10 },
    render: c => {
      const fire = P(c, 1, 0.9, 2);
      return (
        <g>
          {B(c, 0.05, 0.1, 1.9, 0.8, 24, 0, boxColorsFrom('#9c4a3a'))}
          {B(c, 0, 0.05, 2, 0.9, 3, 24, boxColorsFrom('#c9d8e2'))}
          <rect x={fire[0] - 7} y={fire[1] - 12} width={14} height={11} fill={PALETTE.k} />
          <PixelSprite sprite={FLAME} x={fire[0] - 4} y={fire[1] - 9} scale={2} />
        </g>
      );
    },
  },
  {
    id: 'trono', name: 'Trono do Regente', description: 'Nível 15 da Jornada.', category: 'raros',
    w: 1, d: 1, qty: 1, rooms: ['finance', 'life'], unlock: { type: 'level', level: 15 },
    render: c => (
      <g>
        {B(c, 0.1, 0.1, 0.8, 0.8, 8, 0, GOLD)}
        {B(c, 0.1, 0.1, 0.8, 0.2, 28, 8, boxColorsFrom('#b13e53'))}
        {B(c, 0.2, 0.3, 0.6, 0.6, 2, 8, boxColorsFrom('#b13e53'))}
      </g>
    ),
  },
  {
    id: 'fonte_moedas', name: 'Fonte de Moedas', description: 'Nível 20 da Jornada.', category: 'raros',
    w: 2, d: 2, qty: 1, rooms: ['finance', 'life'], unlock: { type: 'level', level: 20 },
    render: c => {
      const top = P(c, 1, 1, 22);
      return (
        <g>
          {B(c, 0.1, 0.1, 1.8, 1.8, 6, 0, WHITE)}
          {B(c, 0.25, 0.25, 1.5, 1.5, 1, 5, boxColorsFrom('#41a6f6'))}
          {B(c, 0.85, 0.85, 0.3, 0.3, 16, 6, WHITE)}
          <PixelSprite sprite={COIN} x={top[0] - 2} y={top[1] - 5} />
        </g>
      );
    },
  },
];

// --- Paredes e pisos ---
export interface SurfaceDef {
  id: string;
  name: string;
  colors: [string, string];
  unlock: UnlockRule;
}

export const WALLPAPERS: SurfaceDef[] = [
  { id: 'creme', name: 'Creme', colors: ['#e8d8b8', '#d6c29c'], unlock: { type: 'default' } },
  { id: 'azul', name: 'Azul Calmo', colors: ['#7fa3c7', '#6b8fb5'], unlock: { type: 'default' } },
  { id: 'verde', name: 'Verde Folha', colors: ['#7fbf8a', '#69a874'], unlock: { type: 'level', level: 3 } },
  { id: 'vinho', name: 'Vinho Clássico', colors: ['#8a3a4a', '#74303e'], unlock: { type: 'achievement', id: 'azul_3', label: 'Trimestre Azul' } },
  { id: 'ouro', name: 'Ouro do Tesouro', colors: ['#e0b04a', '#c99a38'], unlock: { type: 'achievement', id: 'reserva_completa', label: 'Fortaleza' } },
];

export const FLOORS: SurfaceDef[] = [
  { id: 'madeira', name: 'Madeira', colors: ['#a0672f', '#8f5b28'], unlock: { type: 'default' } },
  { id: 'xadrez', name: 'Xadrez', colors: ['#d9dde3', '#566c86'], unlock: { type: 'default' } },
  { id: 'azulejo', name: 'Azulejo Verde', colors: ['#7fbf8a', '#5ea06b'], unlock: { type: 'level', level: 3 } },
  { id: 'marmore', name: 'Mármore', colors: ['#eef1f4', '#cfd6de'], unlock: { type: 'achievement', id: 'reserva_1', label: 'Um Mês de Paz' } },
  { id: 'tapete_real', name: 'Tapete Real', colors: ['#b13e53', '#9c3447'], unlock: { type: 'achievement', id: 'semanas_12', label: 'Relógio Suíço' } },
];

export function isUnlocked(rule: UnlockRule, unlockedAchievements: Set<string>, level: number): boolean {
  if (rule.type === 'default') return true;
  if (rule.type === 'level') return level >= rule.level;
  return unlockedAchievements.has(rule.id);
}

export function unlockLabel(rule: UnlockRule): string {
  if (rule.type === 'default') return 'Disponível';
  if (rule.type === 'level') return `Nível ${rule.level}`;
  return `Conquista: ${rule.label}`;
}

export function getMobi(id: string): MobiDef | undefined {
  return MOBIS.find(m => m.id === id);
}
