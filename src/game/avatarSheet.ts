/**
 * Avatar a partir de uma folha de corpo base em PNG (pacote oficial: src/game/pack/avatar/base.png).
 *
 * A folha tem as vistas lado a lado (ordem padrão: costas, perfil, frente, 3/4 frente, 3/4 costas),
 * pele em uma cor lisa e contorno escuro. O app "veste" o boneco por regiões (medidas a partir
 * dos pés), adiciona cabelo/chapéu com contorno e gera quadros de caminhada e a pose sentada.
 * Funciona com qualquer arte no mesmo layout — basta trocar o PNG.
 */

export type SheetView = 'back' | 'side' | 'front' | 'front34' | 'back34';

export interface AvatarLookLike {
  skin: string;
  hair: string;
  hairColor: string;
  top: string;
  topColor: string;
  pantsColor: string;
  shoesColor: string;
  hat: string;
  hatColor: string;
}

export interface FigureData {
  view: SheetView;
  w: number;
  h: number;
  px: Uint8ClampedArray; // RGBA recortado (largura w, altura h)
  feetRow: number; // última linha com pixels (pés)
}

export interface ComposedFigure {
  data: Uint8ClampedArray;
  w: number;
  h: number;
  anchorX: number; // centro dos pés
  anchorY: number; // linha logo abaixo dos pés
}

// Regiões do corpo em linhas contadas a partir dos pés (medidas na arte de referência, 79 px de altura)
export interface BodyRows {
  neck: number; // acima disto é cabeça
  shoulder: number;
  sleeveShort: number; // fim da manga curta
  sleeveLong: number; // fim da manga longa (mãos abaixo)
  torsoEnd: number; // fim do tronco / começo da calça
  feet: number; // abaixo disto é sapato
}

export const DEFAULT_ROWS: BodyRows = { neck: 54, shoulder: 53, sleeveShort: 43, sleeveLong: 25, torsoEnd: 22, feet: 3 };

const MARGIN = 10; // espaço em volta para cabelo e chapéus

// ---------- utilidades de cor ----------
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function shadeRgb([r, g, b]: [number, number, number], amount: number): [number, number, number] {
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * (1 + amount))));
  return [f(r), f(g), f(b)];
}

// ---------- leitura da folha ----------
export function parseSheet(
  rgba: Uint8ClampedArray, width: number, height: number,
  views: SheetView[] = ['back', 'side', 'front', 'front34', 'back34'],
  background: [number, number, number] | null = [255, 255, 255],
): FigureData[] {
  const isEmpty = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    if (rgba[i + 3] < 16) return true;
    return Boolean(background && rgba[i] === background[0] && rgba[i + 1] === background[1] && rgba[i + 2] === background[2]);
  };
  const cols: boolean[] = [];
  for (let x = 0; x < width; x++) {
    let any = false;
    for (let y = 0; y < height && !any; y++) if (!isEmpty(x, y)) any = true;
    cols.push(any);
  }
  const ranges: [number, number][] = [];
  let start = -1;
  for (let x = 0; x <= width; x++) {
    if (x < width && cols[x] && start < 0) start = x;
    if ((x === width || !cols[x]) && start >= 0) { ranges.push([start, x - 1]); start = -1; }
  }
  return ranges.slice(0, views.length).map(([x0, x1], idx) => {
    let top = height;
    let bottom = 0;
    for (let y = 0; y < height; y++) for (let x = x0; x <= x1; x++) if (!isEmpty(x, y)) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
    const w = x1 - x0 + 1;
    const h = bottom - top + 1;
    const px = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (isEmpty(x0 + x, top + y)) continue;
        const si = ((top + y) * width + x0 + x) * 4;
        const di = (y * w + x) * 4;
        px[di] = rgba[si]; px[di + 1] = rgba[si + 1]; px[di + 2] = rgba[si + 2]; px[di + 3] = 255;
      }
    }
    return { view: views[idx], w, h, px, feetRow: h - 1 };
  });
}

// ---------- composição ----------
type Kind = 0 | 1 | 2 | 3; // 0 vazio, 1 pele, 2 contorno, 3 outra cor

export function composeFigure(
  fig: FigureData, look: AvatarLookLike,
  opts: { frame?: 0 | 1 | 2; sitting?: boolean; skinRef?: string; rows?: BodyRows } = {},
): ComposedFigure {
  const rows = opts.rows || DEFAULT_ROWS;
  const skinRef = hexToRgb(opts.skinRef || '#fdc996');
  const W = fig.w + MARGIN * 2;
  const H = fig.h + MARGIN * 2;
  const out = new Uint8ClampedArray(W * H * 4);
  const kind: Kind[] = new Array(W * H).fill(0);
  const feet = fig.feetRow + MARGIN;

  // classifica pixels da base
  for (let y = 0; y < fig.h; y++) {
    for (let x = 0; x < fig.w; x++) {
      const si = (y * fig.w + x) * 4;
      if (fig.px[si + 3] === 0) continue;
      const r = fig.px[si], g = fig.px[si + 1], b = fig.px[si + 2];
      const di = ((y + MARGIN) * W + x + MARGIN);
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const skinDist = Math.abs(r - skinRef[0]) + Math.abs(g - skinRef[1]) + Math.abs(b - skinRef[2]);
      kind[di] = skinDist < 60 ? 1 : lum < 70 ? 2 : 3;
      out[di * 4] = r; out[di * 4 + 1] = g; out[di * 4 + 2] = b; out[di * 4 + 3] = 255;
    }
  }

  const yf = (y: number) => feet - y; // linhas acima dos pés
  const set = (x: number, y: number, rgb: [number, number, number], k: Kind = 3) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    out[i * 4] = rgb[0]; out[i * 4 + 1] = rgb[1]; out[i * 4 + 2] = rgb[2]; out[i * 4 + 3] = 255;
    kind[i] = k;
  };
  const added = new Set<number>(); // pixels criados fora da silhueta (ganham contorno)
  const addOutside = (x: number, y: number, rgb: [number, number, number]) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    if (kind[i] === 2) return; // não apaga o contorno do desenho
    if (kind[i] === 0) added.add(i);
    set(x, y, rgb);
  };

  // cabeça: limites e centro
  let headTop = H;
  let hMinX = W;
  let hMaxX = 0;
  for (let y = 0; y < H; y++) {
    if (yf(y) <= rows.neck) continue;
    for (let x = 0; x < W; x++) {
      if (kind[y * W + x] === 0) continue;
      headTop = Math.min(headTop, y);
      hMinX = Math.min(hMinX, x);
      hMaxX = Math.max(hMaxX, x);
    }
  }
  const hcx = Math.round((hMinX + hMaxX) / 2);
  const face: 'center' | 'right' | 'left' | 'none' =
    fig.view === 'front' ? 'center' : fig.view === 'side' ? 'right' : fig.view === 'front34' ? 'left' : 'none';
  const backSide = (x: number) =>
    face === 'none' ? true : face === 'right' ? x < hcx - 1 : face === 'left' ? x > hcx + 1 : false;
  const sideEdge = (x: number) => x <= hMinX + 3 || x >= hMaxX - 3;

  // corridas de pele por linha (para separar braços do tronco)
  const runsOf = (y: number) => {
    const runs: [number, number][] = [];
    let s = -1;
    for (let x = 0; x <= W; x++) {
      const isSkin = x < W && kind[y * W + x] === 1;
      if (isSkin && s < 0) s = x;
      if (!isSkin && s >= 0) { runs.push([s, x - 1]); s = -1; }
    }
    return runs;
  };

  // --- Roupas ---
  const skin = hexToRgb(look.skin);
  const top = look.top === 'terno' ? hexToRgb('#262b44') : look.top === 'jaleco' ? hexToRgb('#f4f4f4') : hexToRgb(look.topColor);
  const pants = hexToRgb(look.pantsColor);
  const shoes = hexToRgb(look.shoesColor);
  const sleeveEnd = look.top === 'regata' ? rows.shoulder + 1 : (look.top === 'manga_longa' || look.top === 'moletom' || look.top === 'terno') ? rows.sleeveLong : rows.sleeveShort;

  for (let y = 0; y < H; y++) {
    const f = yf(y);
    const runs = runsOf(y);
    if (runs.length === 0) continue;
    const body = runs.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a));
    for (const run of runs) {
      const isArm = run !== body && runs.length > 1;
      for (let x = run[0]; x <= run[1]; x++) {
        let c: [number, number, number] = skin;
        if (f > rows.neck) c = skin; // cabeça
        else if (f > rows.shoulder) c = skin; // pescoço
        else if (f > rows.torsoEnd) c = isArm ? (f >= sleeveEnd ? top : skin) : top;
        else if (f > rows.feet) c = isArm && f > rows.torsoEnd - 4 ? skin : pants; // mãos (logo abaixo do tronco) / calça
        else c = shoes;
        set(x, y, c, 1);
      }
    }
  }

  // detalhes da roupa nas vistas de frente
  const torsoTopY = feet - rows.shoulder;
  if (face !== 'none') {
    const tx = face === 'center' ? hcx : face === 'left' ? hcx - 3 : hcx + 4;
    if (look.top === 'terno') {
      for (let dy = 1; dy <= 9; dy++) {
        const half = Math.max(0, 3 - Math.floor(dy / 3));
        for (let dx = -half; dx <= half; dx++) if (kind[(torsoTopY + dy) * W + tx + dx] === 1) set(tx + dx, torsoTopY + dy, [244, 244, 244], 1);
        if (kind[(torsoTopY + dy) * W + tx] === 1) set(tx, torsoTopY + dy, [177, 62, 83], 1);
      }
    } else if (look.top === 'jaleco') {
      const stripe = hexToRgb(look.topColor);
      for (let y = torsoTopY + 1; y < feet - rows.torsoEnd; y++) {
        for (const dx of [-5, -4, 4, 5]) if (kind[y * W + tx + dx] === 1) set(tx + dx, y, stripe, 1);
      }
      if (kind[(torsoTopY + 8) * W + tx - 7] === 1) set(tx - 7, torsoTopY + 8, [255, 205, 117], 1);
    } else if (look.top === 'moletom') {
      const pocket = shadeRgb(top, -0.18);
      for (let y = feet - rows.torsoEnd - 9; y < feet - rows.torsoEnd - 3; y++) {
        for (let dx = -5; dx <= 5; dx++) if (kind[y * W + tx + dx] === 1) set(tx + dx, y, pocket, 1);
      }
    }
  }

  // --- Cabelo ---
  const hair = hexToRgb(look.hairColor);
  const ht = headTop;
  const hairPixel = (x: number, y: number) => {
    const hy = y - ht;
    switch (look.hair) {
      case 'curto': return hy <= 8 || (backSide(x) && hy <= 19) || (face === 'center' && sideEdge(x) && hy <= 12);
      case 'franja': return hy <= 8 || (backSide(x) && hy <= 19) || (face !== 'none' && !backSide(x) && hy <= 12) || (face === 'center' && sideEdge(x) && hy <= 14);
      case 'longo': return hy <= 8 || (backSide(x) && hy <= 23) || (sideEdge(x) && hy <= 20);
      case 'rabo': return hy <= 8 || (backSide(x) && hy <= 19) || (face === 'center' && sideEdge(x) && hy <= 12);
      case 'moicano': return Math.abs(x - hcx) <= 2 && hy <= 11 && (face !== 'center' || hy <= 6);
      case 'black': return hy <= 10 || (backSide(x) && hy <= 21) || (sideEdge(x) && hy <= 15);
      default: return false;
    }
  };
  if (look.hair !== 'careca') {
    for (let y = ht; y < feet - rows.neck; y++) {
      for (let x = hMinX; x <= hMaxX; x++) if (kind[y * W + x] === 1 && hairPixel(x, y)) set(x, y, hair, 3);
    }
    // volume para fora da silhueta
    const crown = (rx: number, ry: number) => {
      for (let y = ht - ry; y <= ht + 2; y++) {
        for (let x = hMinX - rx; x <= hMaxX + rx; x++) {
          const nx = (x - hcx) / ((hMaxX - hMinX) / 2 + rx);
          const ny = (y - (ht + 6)) / (6 + ry);
          if (nx * nx + ny * ny <= 1) addOutside(x, y, hair);
        }
      }
    };
    if (look.hair === 'black') crown(4, 6);
    else if (look.hair === 'moicano') {
      for (let y = ht - 5; y < ht; y++) for (let x = hcx - 2; x <= hcx + 2; x++) addOutside(x, y, hair);
    } else crown(1, 1);
    if (look.hair === 'longo') {
      const fall = (x0: number, x1: number, y0: number, y1: number) => {
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const i = y * W + x;
          if (kind[i] === 0 || kind[i] === 1) addOutside(x, y, hair);
        }
      };
      if (face === 'none') fall(hMinX + 2, hMaxX - 2, ht + 18, ht + 36);
      else if (face === 'center') { fall(hMinX - 1, hMinX + 2, ht + 12, ht + 34); fall(hMaxX - 2, hMaxX + 1, ht + 12, ht + 34); }
      else if (face === 'right') fall(hMinX - 2, hcx - 3, ht + 14, ht + 36);
      else fall(hcx + 3, hMaxX + 2, ht + 14, ht + 36);
    }
    if (look.hair === 'rabo') {
      const bx = face === 'right' ? hMinX - 2 : face === 'left' ? hMaxX + 2 : hcx;
      for (let y = ht + 8; y <= ht + 26; y++) for (let x = bx - 2; x <= bx + 2; x++) {
        if (face === 'center') break;
        addOutside(x, y, hair);
      }
    }
  }

  // --- Chapéus ---
  const hat = hexToRgb(look.hatColor);
  const facingDx = face === 'right' ? 1 : face === 'left' ? -1 : 0;
  switch (look.hat) {
    case 'gorro':
      for (let y = ht - 2; y <= ht + 7; y++) for (let x = hMinX - 1; x <= hMaxX + 1; x++) {
        const i = y * W + x;
        if (y <= ht + 1 ? Math.abs(x - hcx) <= (hMaxX - hMinX) / 2 - (ht + 1 - y) * 2 : kind[i] !== 0 || added.has(i)) {
          addOutside(x, y, y >= ht + 6 ? shadeRgb(hat, 0.2) : hat);
        }
      }
      for (let y = ht - 5; y <= ht - 3; y++) for (let x = hcx - 1; x <= hcx + 1; x++) addOutside(x, y, shadeRgb(hat, 0.35));
      break;
    case 'bone':
      for (let y = ht - 1; y <= ht + 6; y++) for (let x = hMinX; x <= hMaxX; x++) {
        const i = y * W + x;
        if (kind[i] !== 0 || added.has(i) || y <= ht + 1) {
          if (y > ht + 1 || Math.abs(x - hcx) <= (hMaxX - hMinX) / 2 - 2) addOutside(x, y, hat);
        }
      }
      if (face !== 'none') {
        const brim = shadeRgb(hat, -0.2);
        const [b0, b1] = face === 'center' ? [hMinX + 2, hMaxX - 2] : facingDx > 0 ? [hcx, hMaxX + 6] : [hMinX - 6, hcx];
        for (let y = ht + 6; y <= ht + 7; y++) for (let x = b0; x <= b1; x++) addOutside(x, y, brim);
      }
      break;
    case 'coroa': {
      const gold: [number, number, number] = [255, 205, 117];
      for (let y = ht - 5; y <= ht + 1; y++) for (let x = hcx - 8; x <= hcx + 8; x++) addOutside(x, y, y === ht + 1 ? [224, 163, 58] : gold);
      for (const px of [hcx - 8, hcx - 3, hcx + 2, hcx + 7]) for (let y = ht - 8; y <= ht - 6; y++) for (let x = px; x <= px + 1; x++) addOutside(x, y, gold);
      addOutside(hcx - 1, ht - 2, [177, 62, 83]); addOutside(hcx, ht - 2, [177, 62, 83]);
      addOutside(hcx + 4, ht - 2, [65, 166, 246]);
      break;
    }
    case 'cartola': {
      const black: [number, number, number] = [38, 43, 68];
      for (let y = ht - 15; y <= ht + 1; y++) for (let x = hcx - 7; x <= hcx + 7; x++) addOutside(x, y, y >= ht - 3 && y <= ht - 2 ? hat : black);
      for (let y = ht + 2; y <= ht + 3; y++) for (let x = hcx - 11; x <= hcx + 11; x++) addOutside(x, y, [26, 28, 44]);
      break;
    }
    case 'fone': {
      const band: [number, number, number] = [51, 60, 87];
      for (let y = ht - 2; y <= ht - 1; y++) for (let x = hMinX + 3; x <= hMaxX - 3; x++) addOutside(x, y, band);
      const cups = face === 'center' ? [hMinX - 2, hMaxX - 1] : face === 'none' ? [hMinX - 2, hMaxX - 1] : [facingDx > 0 ? hcx - 6 : hcx + 2];
      for (const cx of cups) for (let y = ht + 11; y <= ht + 18; y++) for (let x = cx; x <= cx + 3; x++) addOutside(x, y, hat);
      break;
    }
    default:
      break;
  }

  // contorno nos pixels criados fora do desenho
  const outline: [number, number, number] = [0, 0, 0];
  const toOutline: number[] = [];
  for (const i of added) {
    const x = i % W;
    const y = Math.floor(i / W);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      if (kind[ny * W + nx] === 0) toOutline.push(ny * W + nx);
    }
  }
  for (const i of toOutline) set(i % W, Math.floor(i / W), outline, 2);

  // --- Caminhada: levanta uma perna por quadro ---
  let feetBottom = feet;
  if (opts.frame && !opts.sitting) {
    const legTopY = feet - rows.torsoEnd + 2;
    const sampleY = feet - Math.round(rows.torsoEnd / 2);
    const runs = runsOf(sampleY).filter(r => r[1] - r[0] >= 2);
    if (runs.length >= 2) {
      const split = Math.round((runs[0][1] + runs[runs.length - 1][0]) / 2);
      const lift = (x0: number, x1: number) => {
        for (let y = legTopY; y <= feet; y++) {
          for (let x = x0; x <= x1; x++) {
            const src = y * W + x;
            const dst = (y - 2) * W + x;
            out[dst * 4] = out[src * 4]; out[dst * 4 + 1] = out[src * 4 + 1]; out[dst * 4 + 2] = out[src * 4 + 2]; out[dst * 4 + 3] = out[src * 4 + 3];
          }
        }
        for (let y = feet - 1; y <= feet; y++) for (let x = x0; x <= x1; x++) out[(y * W + x) * 4 + 3] = 0;
      };
      if (opts.frame === 1) lift(0, split - 1);
      else lift(split + 1, W - 1);
    } else {
      // perfil: pernas balançam para os lados
      const dx = opts.frame === 1 ? 1 : -1;
      const copy = out.slice();
      for (let y = feet - rows.torsoEnd + 6; y <= feet; y++) {
        for (let x = 0; x < W; x++) {
          const sx = x - dx;
          const di = (y * W + x) * 4;
          if (sx < 0 || sx >= W) { out[di + 3] = 0; continue; }
          const si = (y * W + sx) * 4;
          out[di] = copy[si]; out[di + 1] = copy[si + 1]; out[di + 2] = copy[si + 2]; out[di + 3] = copy[si + 3];
        }
      }
    }
  }

  // --- Sentado: esconde as canelas (dobradas na frente do assento) ---
  if (opts.sitting) {
    const cut = feet - Math.round(rows.torsoEnd * 0.45);
    for (let y = cut + 1; y < H; y++) for (let x = 0; x < W; x++) out[(y * W + x) * 4 + 3] = 0;
    for (let x = 0; x < W; x++) {
      const above = (cut * W + x) * 4;
      if (out[above + 3]) { out[above] = 0; out[above + 1] = 0; out[above + 2] = 0; }
    }
    feetBottom = cut;
  }

  // âncora: centro dos pixels nas últimas linhas
  let minX = W;
  let maxX = 0;
  for (let y = feetBottom - 3; y <= feetBottom; y++) {
    for (let x = 0; x < W; x++) if (out[(y * W + x) * 4 + 3]) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
  }
  return { data: out, w: W, h: H, anchorX: minX <= maxX ? Math.round((minX + maxX) / 2) : Math.round(W / 2), anchorY: feetBottom + 1 };
}

// Direção do jogo -> vista da folha + espelhamento
export type AvatarFacing = 'se' | 'sw' | 'ne' | 'nw' | 's' | 'n' | 'e' | 'w';

export function viewFor(dir: AvatarFacing): { view: SheetView; flip: boolean } {
  switch (dir) {
    case 'sw': return { view: 'front34', flip: false };
    case 'se': return { view: 'front34', flip: true };
    case 'nw': return { view: 'back34', flip: false };
    case 'ne': return { view: 'back34', flip: true };
    case 'e': return { view: 'side', flip: false };
    case 'w': return { view: 'side', flip: true };
    case 'n': return { view: 'back', flip: false };
    case 's':
    default: return { view: 'front', flip: false };
  }
}
