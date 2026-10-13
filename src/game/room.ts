import { PlacedMobi, RoomLayout } from '../types';
import { IsoOrigin, TILE_H, TILE_W } from './iso';
import { MobiDef, getMobi } from './mobis';

/**
 * Plantas de quarto no formato "mapa de alturas" (como os modelos de quarto clássicos):
 * cada linha é uma fileira em gy; cada caractere é um tile em gx.
 *   'x' = sem piso     '0'..'9' = altura do piso (degraus de STEP_Z)
 * Plantas maiores e com desníveis liberam com o nível da Jornada.
 */

export const STEP_Z = 12; // altura de um degrau (em unidades de pixel da cena, antes da resolução)

export interface RoomModel {
  id: string;
  name: string;
  description: string;
  minLevel: number;
  rows: string[];
  door: [number, number]; // tile de entrada (na parede esquerda)
}

const full = (w: number, h: string = '0') => h.repeat(w);

export const ROOM_MODELS: RoomModel[] = [
  {
    id: 'quartinho', name: 'Quartinho', description: 'Aconchegante para começar.', minLevel: 1,
    rows: Array(6).fill(full(6)), door: [0, 4],
  },
  {
    id: 'sala', name: 'Sala', description: 'Espaço para os primeiros mobis.', minLevel: 1,
    rows: Array(8).fill(full(8)), door: [0, 5],
  },
  {
    id: 'estudio', name: 'Estúdio Largo', description: 'Comprido, bom para escritório.', minLevel: 3,
    rows: Array(6).fill(full(11)), door: [0, 3],
  },
  {
    id: 'em_l', name: 'Planta em L', description: 'Dois ambientes em um.', minLevel: 5,
    rows: [...Array(5).fill(full(11)), ...Array(5).fill(full(5) + 'x'.repeat(6))], door: [0, 7],
  },
  {
    id: 'palco', name: 'Sala com Palco', description: 'Plataforma elevada no fundo.', minLevel: 7,
    rows: [...Array(3).fill(full(10, '1')), ...Array(6).fill(full(10))], door: [0, 6],
  },
  {
    id: 'em_t', name: 'Planta em T', description: 'Corredor central e salão nos fundos.', minLevel: 9,
    rows: [...Array(5).fill(full(13)), ...Array(6).fill('xxxx' + full(5) + 'xxxx')], door: [0, 3],
  },
  {
    id: 'em_u', name: 'Planta em U', description: 'Duas alas abraçando um pátio.', minLevel: 11,
    rows: [...Array(5).fill(full(13)), ...Array(6).fill(full(4) + 'xxxxx' + full(4))], door: [0, 8],
  },
  {
    id: 'mezanino', name: 'Mezanino', description: 'Dois andares com escada.', minLevel: 13,
    rows: [
      '22222200000000',
      '22222200000000',
      '22222200000000',
      '22222200000000',
      '11111100000000',
      ...Array(8).fill(full(14)),
    ],
    door: [0, 9],
  },
  {
    id: 'salao', name: 'Salão', description: 'Grande e livre.', minLevel: 15,
    rows: Array(13).fill(full(17)), door: [0, 9],
  },
  {
    id: 'arena', name: 'Arena', description: 'Arquibancada em volta de um fosso.', minLevel: 18,
    rows: [
      ...Array(2).fill(full(16, '1')),
      ...Array(10).fill('11' + full(12) + '11'),
      ...Array(2).fill(full(16, '1')),
    ],
    door: [0, 7],
  },
  {
    id: 'grande_salao', name: 'Grande Salão', description: 'Palco largo e muito espaço.', minLevel: 20,
    rows: [...Array(3).fill(full(20, '1')), ...Array(14).fill(full(20))], door: [0, 12],
  },
  {
    id: 'mansao', name: 'Mansão', description: 'Três níveis. Para lendas do Pigo.', minLevel: 25,
    rows: [
      ...Array(4).fill(full(10, '2') + full(14, '1')),
      ...Array(2).fill(full(10, '1') + full(14, '1')),
      ...Array(14).fill(full(24)),
    ],
    door: [0, 14],
  },
];

export interface ParsedModel {
  id: string;
  w: number;
  d: number;
  heights: (number | null)[][]; // [gy][gx]
  maxH: number;
  door: [number, number];
  tileCount: number;
}

const cache = new Map<string, ParsedModel>();

export function getModel(id: string | undefined): RoomModel {
  return ROOM_MODELS.find(m => m.id === id) || ROOM_MODELS[1];
}

export function parseModel(model: RoomModel): ParsedModel {
  const hit = cache.get(model.id);
  if (hit) return hit;
  const w = Math.max(...model.rows.map(r => r.length));
  const heights = model.rows.map(row => {
    const out: (number | null)[] = [];
    for (let gx = 0; gx < w; gx++) {
      const ch = row[gx] ?? 'x';
      out.push(ch >= '0' && ch <= '9' ? Number(ch) : null);
    }
    return out;
  });
  const flat = heights.flat().filter((h): h is number => h !== null);
  const parsed = { id: model.id, w, d: heights.length, heights, maxH: Math.max(...flat), door: model.door, tileCount: flat.length };
  cache.set(model.id, parsed);
  return parsed;
}

export function tileHeight(pm: ParsedModel, gx: number, gy: number): number | null {
  if (gx < 0 || gy < 0 || gy >= pm.d || gx >= pm.w) return null;
  return pm.heights[gy][gx];
}

export function footprint(def: MobiDef, rot: 0 | 1): { w: number; d: number } {
  return rot ? { w: def.d, d: def.w } : { w: def.w, d: def.d };
}

function key(gx: number, gy: number) {
  return `${gx},${gy}`;
}

type Lookup = (id: string) => MobiDef | undefined;

// Tiles ocupados por móveis sólidos (tapetes não bloqueiam)
export function occupiedTiles(items: PlacedMobi[], ignoreUid?: string, lookup: Lookup = getMobi): Set<string> {
  const set = new Set<string>();
  for (const it of items) {
    if (it.uid === ignoreUid) continue;
    const def = lookup(it.mobiId);
    if (!def || def.walkable) continue;
    const { w, d } = footprint(def, it.rot);
    for (let x = 0; x < w; x++) for (let y = 0; y < d; y++) set.add(key(it.gx + x, it.gy + y));
  }
  return set;
}

// A pegada inteira precisa ter piso e estar na mesma altura; retorna a altura ou null
export function footprintHeight(pm: ParsedModel, gx: number, gy: number, w: number, d: number): number | null {
  const base = tileHeight(pm, gx, gy);
  if (base === null) return null;
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < d; y++) {
      if (tileHeight(pm, gx + x, gy + y) !== base) return null;
    }
  }
  return base;
}

export function canPlace(
  items: PlacedMobi[], def: MobiDef, gx: number, gy: number, rot: 0 | 1, pm: ParsedModel,
  opts: { ignoreUid?: string; blocked?: Set<string>; lookup?: Lookup } = {},
): boolean {
  const { w, d } = footprint(def, rot);
  if (footprintHeight(pm, gx, gy, w, d) === null) return false;
  // a porta precisa ficar livre
  if (!def.walkable && pm.door[0] >= gx && pm.door[0] < gx + w && pm.door[1] >= gy && pm.door[1] < gy + d) return false;
  if (def.walkable) return true;
  const occ = occupiedTiles(items, opts.ignoreUid, opts.lookup);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < d; y++) {
      if (occ.has(key(gx + x, gy + y)) || opts.blocked?.has(key(gx + x, gy + y))) return false;
    }
  }
  return true;
}

// Mobis que não cabem na planta (ao trocar de planta, voltam ao inventário)
export function itemsNotFitting(items: PlacedMobi[], pm: ParsedModel, lookup: Lookup = getMobi): PlacedMobi[] {
  return items.filter(it => {
    const def = lookup(it.mobiId);
    if (!def) return false;
    const { w, d } = footprint(def, it.rot);
    return footprintHeight(pm, it.gx, it.gy, w, d) === null;
  });
}

// Caminho mais curto (4 direções): sobe/desce no máximo 1 degrau por passo.
// allowTarget libera o destino mesmo ocupado (ex.: sentar numa cadeira).
export function findPath(
  items: PlacedMobi[], from: [number, number], to: [number, number], pm: ParsedModel,
  opts: { lookup?: Lookup; allowTarget?: boolean } = {},
): [number, number][] {
  const occ = occupiedTiles(items, undefined, opts.lookup);
  const targetKey = key(to[0], to[1]);
  if (tileHeight(pm, to[0], to[1]) === null) return [];
  if (occ.has(targetKey) && !opts.allowTarget) return [];
  const queue: [number, number][] = [from];
  const prev = new Map<string, string | null>([[key(from[0], from[1]), null]]);
  while (queue.length) {
    const [x, y] = queue.shift()!;
    if (x === to[0] && y === to[1]) break;
    const h = tileHeight(pm, x, y) ?? 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      const k = key(nx, ny);
      const nh = tileHeight(pm, nx, ny);
      if (nh === null || Math.abs(nh - h) > 1 || prev.has(k)) continue;
      if (occ.has(k) && k !== targetKey) continue;
      prev.set(k, key(x, y));
      queue.push([nx, ny]);
    }
  }
  if (!prev.has(targetKey)) return [];
  const path: [number, number][] = [];
  let cur: string | null = targetKey;
  while (cur && cur !== key(from[0], from[1])) {
    const [x, y] = cur.split(',').map(Number);
    path.unshift([x, y]);
    cur = prev.get(cur) ?? null;
  }
  return path;
}

// Paredes só no contorno de trás "em escada" (nunca na frente de um piso)
export function wallSegments(pm: ParsedModel): { back: { gx: number; gy: number }[]; left: { gx: number; gy: number }[] } {
  const back: { gx: number; gy: number }[] = [];
  const left: { gx: number; gy: number }[] = [];
  let minY = Infinity;
  for (let gx = 0; gx < pm.w; gx++) {
    let y0 = -1;
    for (let gy = 0; gy < pm.d; gy++) if (pm.heights[gy][gx] !== null) { y0 = gy; break; }
    if (y0 < 0) continue;
    if (y0 <= minY) back.push({ gx, gy: y0 });
    minY = Math.min(minY, y0);
  }
  let minX = Infinity;
  for (let gy = 0; gy < pm.d; gy++) {
    let x0 = -1;
    for (let gx = 0; gx < pm.w; gx++) if (pm.heights[gy][gx] !== null) { x0 = gx; break; }
    if (x0 < 0) continue;
    if (x0 <= minX) left.push({ gx: x0, gy });
    minX = Math.min(minX, x0);
  }
  return { back, left };
}

// Qual tile está sob o cursor, considerando a altura de cada tile (testa da frente para trás)
export function pickTile(pm: ParsedModel, origin: IsoOrigin, x: number, y: number): [number, number] | null {
  const u = origin.unit ?? 1;
  const hw = (TILE_W / 2) * u;
  const hh = (TILE_H / 2) * u;
  for (let s = pm.w + pm.d - 2; s >= 0; s--) {
    for (let gx = Math.min(s, pm.w - 1); gx >= 0 && s - gx < pm.d; gx--) {
      const gy = s - gx;
      const h = pm.heights[gy]?.[gx];
      if (h === null || h === undefined) continue;
      // centro do losango no topo do tile
      const cx = origin.x + (gx - gy) * hw;
      const cy = origin.y + (gx + gy + 1) * hh - h * STEP_Z * u;
      if (Math.abs(x - cx) / hw + Math.abs(y - cy) / hh <= 1) return [gx, gy];
    }
  }
  return null;
}

export function newUid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function defaultLayout(room: 'finance' | 'life'): RoomLayout {
  if (room === 'life') {
    return { model: 'quartinho', wallpaper: 'verde', floor: 'madeira', items: [] };
  }
  return {
    model: 'sala',
    wallpaper: 'creme',
    floor: 'madeira',
    items: [
      { uid: newUid(), mobiId: 'tapete', gx: 3, gy: 2, rot: 0 },
      { uid: newUid(), mobiId: 'mesa', gx: 3, gy: 2, rot: 0 },
      { uid: newUid(), mobiId: 'cadeira', gx: 4, gy: 2, rot: 1 },
      { uid: newUid(), mobiId: 'planta', gx: 0, gy: 0, rot: 0 },
      { uid: newUid(), mobiId: 'luminaria', gx: 7, gy: 0, rot: 0 },
    ],
  };
}
