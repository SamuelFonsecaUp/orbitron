import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { composeFigure, parseSheet, viewFor, SheetView, AvatarLookLike } from '../src/game/avatarSheet';

// Decodificador PNG mínimo (RGBA/RGB 8 bits) só para o teste
function decodePng(buf: Buffer): { w: number; h: number; rgba: Uint8ClampedArray } {
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  const colorType = buf[25];
  const bpp = colorType === 6 ? 4 : 3;
  let pos = 8;
  const chunks: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IDAT') chunks.push(buf.subarray(pos + 8, pos + 8 + len));
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(chunks));
  const stride = w * bpp;
  const rgba = new Uint8ClampedArray(w * h * 4);
  let prev = Buffer.alloc(stride);
  let i = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[i++];
    const line = Buffer.from(raw.subarray(i, i + stride));
    i += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? line[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      if (f === 1) line[x] = (line[x] + a) & 255;
      else if (f === 2) line[x] = (line[x] + b) & 255;
      else if (f === 3) line[x] = (line[x] + ((a + b) >> 1)) & 255;
      else if (f === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        line[x] = (line[x] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
      }
    }
    for (let x = 0; x < w; x++) {
      rgba[(y * w + x) * 4] = line[x * bpp];
      rgba[(y * w + x) * 4 + 1] = line[x * bpp + 1];
      rgba[(y * w + x) * 4 + 2] = line[x * bpp + 2];
      rgba[(y * w + x) * 4 + 3] = bpp === 4 ? line[x * bpp + 3] : 255;
    }
    prev = line;
  }
  return { w, h, rgba };
}

function encodePng(w: number, h: number, rgba: Uint8ClampedArray): Buffer {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type: string, data: Buffer) => {
    const t = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const sheetPath = path.join(__dirname, '..', 'src', 'game', 'pack', 'avatar', 'base.png');
const sheet = decodePng(fs.readFileSync(sheetPath));
const figures = parseSheet(sheet.rgba, sheet.w, sheet.h);

const look: AvatarLookLike = {
  skin: '#f1c7a1', hair: 'curto', hairColor: '#5d3a1a', top: 'camiseta', topColor: '#3b5dc9',
  pantsColor: '#333c57', shoesColor: '#b13e53', hat: 'nenhum', hatColor: '#b13e53',
};

const colorAt = (c: { data: Uint8ClampedArray; w: number }, x: number, y: number) =>
  '#' + [0, 1, 2].map(k => c.data[(y * c.w + x) * 4 + k].toString(16).padStart(2, '0')).join('');

describe('Avatar from the base body sheet', () => {
  it('finds the five views of the base sheet', () => {
    expect(figures.map(f => f.view)).toEqual(['back', 'side', 'front', 'front34', 'back34']);
    for (const f of figures) {
      expect(f.h).toBeGreaterThan(70);
      expect(f.w).toBeGreaterThan(20);
    }
  });

  it('dresses each body region with the chosen colors', () => {
    const front = figures.find(f => f.view === 'front')!;
    const c = composeFigure(front, look);
    const midX = c.anchorX;
    const feet = c.anchorY - 1;
    expect(colorAt(c, midX + 4, feet - 1)).toBe('#b13e53'); // sapato
    expect(colorAt(c, midX + 4, feet - 12)).toBe('#333c57'); // calça
    expect(colorAt(c, midX + 4, feet - 35)).toBe('#3b5dc9'); // camiseta
    expect(colorAt(c, midX, feet - 66)).toBe('#f1c7a1'); // testa (pele escolhida)
    expect(colorAt(c, midX + 4, feet - 74)).toBe('#5d3a1a'); // cabelo no topo
  });

  it('renders every direction, style and pose without losing the feet anchor', () => {
    const hairs = ['curto', 'franja', 'longo', 'rabo', 'moicano', 'black', 'careca'];
    const tops = ['camiseta', 'manga_longa', 'regata', 'moletom', 'terno', 'jaleco'];
    const hats = ['nenhum', 'gorro', 'bone', 'fone', 'cartola', 'coroa'];
    for (const dir of ['se', 'sw', 'ne', 'nw', 's', 'n', 'e', 'w'] as const) {
      const { view } = viewFor(dir);
      const fig = figures.find(f => f.view === view)!;
      for (let i = 0; i < 6; i++) {
        const c = composeFigure(fig, { ...look, hair: hairs[i], top: tops[i], hat: hats[i] }, { frame: (i % 3) as 0 | 1 | 2, sitting: i === 5 });
        expect(c.anchorY).toBeGreaterThan(40);
        expect(c.anchorX).toBeGreaterThan(5);
        expect(c.data.length).toBe(c.w * c.h * 4);
      }
    }
  });

  it('writes a preview strip when PIGO_AVATAR_PREVIEW is set', () => {
    const outPath = process.env.PIGO_AVATAR_PREVIEW;
    if (!outPath) return;
    const looks: AvatarLookLike[] = [
      look,
      { ...look, hair: 'longo', hairColor: '#ffcd75', top: 'jaleco', topColor: '#38b764', hat: 'fone', pantsColor: '#566c86', skin: '#c68650' },
      { ...look, hair: 'black', hairColor: '#1a1c2c', top: 'terno', hat: 'cartola', skin: '#6b3f22', shoesColor: '#1a1c2c' },
      { ...look, hair: 'franja', hairColor: '#b13e53', top: 'moletom', topColor: '#a855f7', hat: 'coroa', skin: '#ffe0c7' },
    ];
    const dirs = ['n', 'e', 's', 'sw', 'nw', 'se'] as const;
    const cells = looks.flatMap(l => dirs.map(d => {
      const { view, flip } = viewFor(d);
      const c = composeFigure(figures.find(f => f.view === (view as SheetView))!, l);
      return { c, flip };
    }));
    const cw = 64, ch = 110;
    const W = cw * dirs.length, H = ch * looks.length;
    const img = new Uint8ClampedArray(W * H * 4).fill(255);
    cells.forEach(({ c, flip }, idx) => {
      const ox = (idx % dirs.length) * cw + cw / 2 - c.anchorX;
      const oy = Math.floor(idx / dirs.length) * ch + ch - 6 - c.anchorY;
      for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) {
        const sx = flip ? c.w - 1 - x : x;
        const si = (y * c.w + sx) * 4;
        if (!c.data[si + 3]) continue;
        const dx = ox + (flip ? x + (2 * c.anchorX - c.w + 1) : x);
        const dy = oy + y;
        if (dx < 0 || dy < 0 || dx >= W || dy >= H) continue;
        const di = (dy * W + dx) * 4;
        img[di] = c.data[si]; img[di + 1] = c.data[si + 1]; img[di + 2] = c.data[si + 2]; img[di + 3] = 255;
      }
    });
    fs.writeFileSync(outPath, encodePng(W, H, img));
  });
});
