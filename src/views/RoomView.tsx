import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  FolderOpen, Lock, Maximize2, Minimize2, Minus, Move, Package, PanelRightClose, PanelRightOpen,
  Plus, RefreshCw, RotateCw, Sparkles, X,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { GameAssets, RoomLayout, RoomLayouts } from '../types';
import { IsoBox, IsoOrigin, IsoTile, project, shade } from '../game/iso';
import { PALETTE, PixelIcon, PixelSprite, spriteSize } from '../game/pixel';
import { PIGO, PIGO_BLINK } from '../game/sprites';
import { FLOORS, MOBIS, MobiCtx, MobiDef, RoomId, SurfaceDef, WALLPAPERS, isUnlocked, unlockLabel } from '../game/mobis';
import {
  ROOM_MAX, ROOM_MIN, RoomDims, canPlace, defaultLayout, findPath, footprint, itemsOutside, layoutDims,
  newUid, occupiedTiles, screenToTile,
} from '../game/room';

// Resolução do quarto: unit 2 = tiles de 64x32 px (o dobro de detalhe da versão anterior)
const UNIT = 2;
const MARGIN = 24;
const STEP_MS = 240;
const WALL_HEIGHTS: Record<NonNullable<RoomLayout['wallHeight']>, number> = { baixa: 40, normal: 64, alta: 96 };

type Mode =
  | { kind: 'idle' }
  | { kind: 'placing'; mobiId: string; rot: 0 | 1; movingUid?: string };

type Panel = 'mobis' | 'paredes' | 'pisos' | 'quarto';

const ROOMS: { id: RoomId; name: string; subtitle: string; available: boolean }[] = [
  { id: 'finance', name: 'Sala do Tesouro', subtitle: 'Decorada com conquistas financeiras', available: true },
  { id: 'life', name: 'Quarto do Herói', subtitle: 'Libera na Fase 2 (hábitos e tarefas)', available: false },
];

interface ImageInfo {
  url: string;
  w: number;
  h: number;
}

// Carrega dimensões das imagens enviadas pelo usuário
function useImageInfos(sources: Record<string, string>): Record<string, ImageInfo> {
  const [infos, setInfos] = useState<Record<string, ImageInfo>>({});
  const key = Object.keys(sources).sort().join('|') + Object.values(sources).map(v => v.length).join(',');
  useEffect(() => {
    let cancelled = false;
    const entries = Object.entries(sources);
    if (entries.length === 0) {
      setInfos({});
      return;
    }
    Promise.all(entries.map(([name, url]) => new Promise<[string, ImageInfo]>(resolve => {
      const img = new Image();
      img.onload = () => resolve([name, { url, w: img.naturalWidth, h: img.naturalHeight }]);
      img.onerror = () => resolve([name, { url, w: 0, h: 0 }]);
      img.src = url;
    }))).then(list => {
      if (!cancelled) setInfos(Object.fromEntries(list.filter(([, i]) => i.w > 0)));
    });
    return () => { cancelled = true; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return infos;
}

// Mobi desenhado com a imagem do usuário: losango do chão encostado na borda de baixo da imagem
function imageRender(def: { w: number; d: number }, img: ImageInfo, imgRot1: ImageInfo | undefined, offset: { x: number; y: number }) {
  return (c: MobiCtx) => {
    const { w, d } = c.rot ? { w: def.d, d: def.w } : { w: def.w, d: def.d };
    const left = project(c.o, c.gx, c.gy + d)[0];
    const right = project(c.o, c.gx + w, c.gy)[0];
    const bottom = project(c.o, c.gx + w, c.gy + d)[1];
    const useRot1 = c.rot === 1 && imgRot1;
    const pic = useRot1 ? imgRot1! : img;
    const x = Math.round((left + right) / 2 - pic.w / 2 + offset.x);
    const y = Math.round(bottom - pic.h + offset.y);
    const mirror = c.rot === 1 && !imgRot1;
    return (
      <image
        href={pic.url}
        x={x}
        y={y}
        width={pic.w}
        height={pic.h}
        style={{ imageRendering: 'pixelated' }}
        transform={mirror ? `translate(${2 * x + pic.w} 0) scale(-1 1)` : undefined}
      />
    );
  };
}

// Miniatura do mobi para o inventário
const MobiPreview: React.FC<{ def: MobiDef; locked: boolean }> = ({ def, locked }) => {
  const o: IsoOrigin = { x: 64, y: 92, unit: UNIT };
  const vbX = 64 - def.d * 32 - 8;
  const vbW = (def.w + def.d) * 32 + 16;
  const vbH = 92 + (def.w + def.d) * 16 + 6;
  return (
    <svg
      viewBox={`${vbX} 0 ${vbW} ${vbH}`}
      width={64}
      height={64}
      shapeRendering="crispEdges"
      style={{ imageRendering: 'pixelated', filter: locked ? 'grayscale(1) brightness(0.5)' : undefined }}
    >
      {def.render({ o, gx: 0, gy: 0, rot: 0 })}
    </svg>
  );
};

export const RoomView: React.FC = () => {
  const { game, showToast } = useFinancial();
  const [roomId, setRoomId] = useState<RoomId>('finance');
  const [layouts, setLayouts] = useState<RoomLayouts | null>(null);
  const [assets, setAssets] = useState<GameAssets | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [panel, setPanel] = useState<Panel>('mobis');
  const [panelOpen, setPanelOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [pigo, setPigo] = useState<{ pos: [number, number]; path: [number, number][]; flip: boolean }>({ pos: [2, 5], path: [], flip: false });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const night = useMemo(() => {
    const h = new Date().getHours();
    return h >= 19 || h < 6;
  }, []);

  const unlockedAchievements = useMemo(
    () => new Set((game?.achievements || []).filter(a => a.unlocked).map(a => a.id)),
    [game]
  );
  const level = game?.level || 1;

  // --- Assets do usuário ---
  const loadAssets = useCallback(async () => {
    if (!window.electronAPI?.getGameAssets) return;
    try {
      setAssets(await window.electronAPI.getGameAssets());
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const mobiImages = useImageInfos(assets?.mobis || {});
  const floorImages = useImageInfos(assets?.floors || {});
  const wallImages = useImageInfos(assets?.walls || {});
  const pigoImages = useImageInfos(assets?.pigo ? { pigo: assets.pigo } : {});

  // Catálogo efetivo: mobis do jogo (com imagem do usuário quando houver) + mobis novos do usuário
  const catalog: MobiDef[] = useMemo(() => {
    const manifest = assets?.manifest?.mobis || {};
    const offsetOf = (id: string) => ({ x: manifest[id]?.offsetX || 0, y: manifest[id]?.offsetY || 0 });
    const base = MOBIS.map(m => (mobiImages[m.id]
      ? { ...m, render: imageRender(m, mobiImages[m.id], mobiImages[`${m.id}_r1`], offsetOf(m.id)) }
      : m));
    const known = new Set(MOBIS.map(m => m.id));
    const custom: MobiDef[] = Object.keys(mobiImages)
      .filter(name => !name.endsWith('_r1') && !known.has(name))
      .map(name => {
        const entry = manifest[name] || {};
        const w = Math.max(1, Math.round(entry.w || 1));
        const d = Math.max(1, Math.round(entry.d || 1));
        return {
          id: name,
          name: entry.name || name.replace(/[_-]+/g, ' '),
          description: 'Mobi personalizado (seu asset).',
          category: 'decoração' as const,
          w, d,
          walkable: Boolean(entry.walkable),
          qty: 99,
          rooms: ['finance', 'life'] as RoomId[],
          unlock: { type: 'default' as const },
          render: imageRender({ w, d }, mobiImages[name], mobiImages[`${name}_r1`], offsetOf(name)),
        };
      });
    return [...base, ...custom];
  }, [assets, mobiImages]);

  const lookup = useCallback((id: string) => catalog.find(m => m.id === id), [catalog]);

  const wallOptions: SurfaceDef[] = useMemo(() => [
    ...WALLPAPERS,
    ...Object.keys(wallImages).map(name => ({ id: `asset:${name}`, name: `${name} (seu asset)`, colors: ['#888888', '#777777'] as [string, string], unlock: { type: 'default' as const } })),
  ], [wallImages]);
  const floorOptions: SurfaceDef[] = useMemo(() => [
    ...FLOORS,
    ...Object.keys(floorImages).map(name => ({ id: `asset:${name}`, name: `${name} (seu asset)`, colors: ['#888888', '#777777'] as [string, string], unlock: { type: 'default' as const } })),
  ], [floorImages]);

  // --- Layout salvo (sincronizado entre computadores) ---
  useEffect(() => {
    window.electronAPI?.getSettings().then(s => {
      const saved = s?.roomLayouts || {};
      setLayouts({ finance: saved.finance || defaultLayout('finance'), life: saved.life || defaultLayout('life') });
    });
  }, []);

  const layout: RoomLayout | null = layouts ? layouts[roomId] || defaultLayout(roomId) : null;
  const dims: RoomDims = layout ? layoutDims(layout) : { w: 10, d: 8 };
  const wallH = WALL_HEIGHTS[layout?.wallHeight || 'normal'];

  const persist = useCallback((next: RoomLayouts) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      window.electronAPI?.updateSettings({ roomLayouts: next }).catch(() => showToast('Não foi possível salvar o quarto.', 'error'));
    }, 400);
  }, [showToast]);

  const updateLayout = useCallback((fn: (l: RoomLayout) => RoomLayout) => {
    setLayouts(prev => {
      if (!prev) return prev;
      const next = { ...prev, [roomId]: fn(prev[roomId] || defaultLayout(roomId)) };
      persist(next);
      return next;
    });
  }, [roomId, persist]);

  // --- Geometria da cena (depende do tamanho do quarto e da altura da parede) ---
  const scene = useMemo(() => {
    const tileX = 16 * UNIT;
    const tileY = 8 * UNIT;
    const origin: IsoOrigin = { x: MARGIN + dims.d * tileX + 12, y: MARGIN + wallH * UNIT + 12, unit: UNIT };
    const width = (dims.w + dims.d) * tileX + MARGIN * 2 + 24;
    const height = origin.y + (dims.w + dims.d) * tileY + MARGIN + 16;
    return { origin, width, height };
  }, [dims.w, dims.d, wallH]);
  const o = scene.origin;

  // Escala para caber inteiro na área disponível (largura e altura)
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => setScale(Math.max(0.5, Math.min(el.clientWidth / scene.width, el.clientHeight / scene.height)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scene.width, scene.height, layouts, panelOpen, isFullscreen]);

  // Tela cheia de verdade (API do navegador/Electron)
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await wrapperRef.current?.requestFullscreen();
    } catch (e) {
      showToast('Tela cheia indisponível neste modo.', 'info');
    }
  };

  // --- Pigo: anda um tile por vez; parado, passeia sozinho ---
  useEffect(() => {
    const t = setInterval(() => {
      setPigo(p => {
        if (p.path.length === 0) return p;
        const [next, ...rest] = p.path;
        const dx = next[0] - p.pos[0] - (next[1] - p.pos[1]);
        return { pos: next, path: rest, flip: dx === 0 ? p.flip : dx < 0 };
      });
    }, STEP_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!layout) return;
    setPigo(p => (p.pos[0] >= dims.w || p.pos[1] >= dims.d ? { pos: [0, 0], path: [], flip: p.flip } : p));
    const t = setInterval(() => {
      setPigo(p => {
        if (p.path.length > 0 || mode.kind === 'placing') return p;
        const occ = occupiedTiles(layout.items, undefined, lookup);
        for (let tries = 0; tries < 10; tries++) {
          const target: [number, number] = [Math.floor(Math.random() * dims.w), Math.floor(Math.random() * dims.d)];
          if (occ.has(`${target[0]},${target[1]}`)) continue;
          const path = findPath(layout.items, p.pos, target, dims, lookup);
          if (path.length > 0 && path.length < 10) return { ...p, path };
        }
        return p;
      });
    }, 5000);
    return () => clearInterval(t);
  }, [layout, mode.kind, dims.w, dims.d, lookup]); // eslint-disable-line react-hooks/exhaustive-deps

  // Atalhos: R gira, Esc cancela
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMode({ kind: 'idle' }); setSelectedUid(null); }
      if ((e.key === 'r' || e.key === 'R') && mode.kind === 'placing') setMode({ ...mode, rot: mode.rot ? 0 : 1 });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode]);

  const placedCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const room of Object.values(layouts || {})) {
      for (const it of room?.items || []) counts[it.mobiId] = (counts[it.mobiId] || 0) + 1;
    }
    return counts;
  }, [layouts]);

  const tileFromEvent = (e: React.MouseEvent): [number, number] | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const t = screenToTile(o, (e.clientX - rect.left) / scale, (e.clientY - rect.top) / scale);
    if (t[0] < 0 || t[1] < 0 || t[0] >= dims.w || t[1] >= dims.d) return null;
    return t;
  };

  if (!layout || !layouts) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
        <PixelIcon sprite={PIGO} size={48} className="pixel-bob" />
        <span className="text-sm font-pixel">Abrindo o quarto...</span>
      </div>
    );
  }

  const room = ROOMS.find(r => r.id === roomId)!;
  const wallDef = wallOptions.find(w => w.id === layout.wallpaper) || WALLPAPERS[0];
  const floorDef = floorOptions.find(f => f.id === layout.floor) || FLOORS[0];
  const wallColors: [string, string] = layout.wallpaper === 'custom' && layout.customWall ? layout.customWall : wallDef.colors;
  const floorColors: [string, string] = layout.floor === 'custom' && layout.customFloor ? layout.customFloor : floorDef.colors;
  const wallTexture = layout.wallpaper.startsWith('asset:') ? wallImages[layout.wallpaper.slice(6)] : undefined;
  const floorTexture = layout.floor.startsWith('asset:') ? floorImages[layout.floor.slice(6)] : undefined;
  const selectedItem = layout.items.find(i => i.uid === selectedUid) || null;
  const selectedDef = selectedItem ? lookup(selectedItem.mobiId) : null;
  const placingDef = mode.kind === 'placing' ? lookup(mode.mobiId) : null;
  const pigoBlock = new Set([`${pigo.pos[0]},${pigo.pos[1]}`]);
  const placingValid = Boolean(
    placingDef && hover && mode.kind === 'placing' &&
    canPlace(layout.items, placingDef, hover[0], hover[1], mode.rot, mode.movingUid, mode.movingUid ? undefined : pigoBlock, dims, lookup)
  );

  const handleSceneClick = (e: React.MouseEvent) => {
    const t = tileFromEvent(e);
    if (mode.kind === 'placing') {
      if (!t || !placingDef) return;
      if (!canPlace(layout.items, placingDef, t[0], t[1], mode.rot, mode.movingUid, mode.movingUid ? undefined : pigoBlock, dims, lookup)) {
        showToast('Não cabe aqui: escolha um espaço livre no piso.', 'info');
        return;
      }
      if (mode.movingUid) {
        updateLayout(l => ({ ...l, items: l.items.map(i => (i.uid === mode.movingUid ? { ...i, gx: t[0], gy: t[1], rot: mode.rot } : i)) }));
        setSelectedUid(mode.movingUid);
      } else {
        const uid = newUid();
        updateLayout(l => ({ ...l, items: [...l.items, { uid, mobiId: mode.mobiId, gx: t[0], gy: t[1], rot: mode.rot }] }));
        setSelectedUid(uid);
      }
      setMode({ kind: 'idle' });
      return;
    }
    setSelectedUid(null);
    if (t) {
      const path = findPath(layout.items, pigo.pos, t, dims, lookup);
      if (path.length) setPigo(p => ({ ...p, path }));
    }
  };

  const rotateSelected = () => {
    if (!selectedItem || !selectedDef) return;
    const rot: 0 | 1 = selectedItem.rot ? 0 : 1;
    if (!canPlace(layout.items, selectedDef, selectedItem.gx, selectedItem.gy, rot, selectedItem.uid, undefined, dims, lookup)) {
      showToast('Sem espaço para girar aqui.', 'info');
      return;
    }
    updateLayout(l => ({ ...l, items: l.items.map(i => (i.uid === selectedItem.uid ? { ...i, rot } : i)) }));
  };

  const pickUpSelected = () => {
    if (!selectedItem) return;
    updateLayout(l => ({ ...l, items: l.items.filter(i => i.uid !== selectedItem.uid) }));
    setSelectedUid(null);
  };

  // Redimensionar: mobis que ficariam do lado de fora voltam ao inventário
  const resizeRoom = (axis: 'width' | 'depth', delta: number) => {
    const next = { w: dims.w, d: dims.d };
    if (axis === 'width') next.w = Math.min(ROOM_MAX, Math.max(ROOM_MIN, dims.w + delta));
    else next.d = Math.min(ROOM_MAX, Math.max(ROOM_MIN, dims.d + delta));
    if (next.w === dims.w && next.d === dims.d) return;
    const outside = itemsOutside(layout.items, next, lookup);
    updateLayout(l => ({
      ...l,
      width: next.w,
      depth: next.d,
      items: l.items.filter(i => !outside.some(x => x.uid === i.uid)),
    }));
    if (outside.length) showToast(`${outside.length} mobi(s) ficaram fora e voltaram ao inventário.`, 'info');
  };

  // --- Montagem da cena ---
  const floorTiles: React.ReactNode[] = [];
  const tileOutline = shade(floorColors[1], -0.18);
  for (let gx = 0; gx < dims.w; gx++) {
    for (let gy = 0; gy < dims.d; gy++) {
      if (floorTexture) {
        const [ex, ey] = project(o, gx, gy);
        const s = floorTexture.w;
        floorTiles.push(
          <image
            key={`f${gx}-${gy}`}
            href={floorTexture.url}
            width={floorTexture.w}
            height={floorTexture.h}
            style={{ imageRendering: 'pixelated' }}
            transform={`matrix(${(16 * UNIT) / s} ${(8 * UNIT) / s} ${(-16 * UNIT) / s} ${(8 * UNIT) / s} ${ex} ${ey})`}
          />
        );
      } else {
        floorTiles.push(
          <IsoTile key={`f${gx}-${gy}`} origin={o} gx={gx} gy={gy} color={(gx + gy) % 2 ? floorColors[1] : floorColors[0]} outline={tileOutline} />
        );
      }
    }
  }

  // Paredes: textura do usuário inclinada por segmento, ou listras de cor
  const wallDecor: React.ReactNode[] = [];
  if (wallTexture) {
    for (let i = 0; i < dims.w; i++) {
      const [ex, ey] = project(o, i, 0, wallH);
      wallDecor.push(
        <image key={`wb${i}`} href={wallTexture.url} width={wallTexture.w} height={wallTexture.h} style={{ imageRendering: 'pixelated' }}
          transform={`matrix(${(16 * UNIT) / wallTexture.w} ${(8 * UNIT) / wallTexture.w} 0 ${(wallH * UNIT) / wallTexture.h} ${ex} ${ey})`} />
      );
    }
    for (let j = 0; j < dims.d; j++) {
      const [ex, ey] = project(o, 0, j + 1, wallH);
      wallDecor.push(
        <image key={`wl${j}`} href={wallTexture.url} width={wallTexture.w} height={wallTexture.h} style={{ imageRendering: 'pixelated' }}
          transform={`matrix(${(16 * UNIT) / wallTexture.w} ${(-8 * UNIT) / wallTexture.w} 0 ${(wallH * UNIT) / wallTexture.h} ${ex} ${ey})`} />
      );
    }
    // sombreado da parede esquerda
    const a = project(o, 0, 0, wallH);
    const b = project(o, 0, dims.d, wallH);
    const bb = project(o, 0, dims.d);
    const ab = project(o, 0, 0);
    wallDecor.push(<polygon key="shade" points={`${a[0]},${a[1]} ${b[0]},${b[1]} ${bb[0]},${bb[1]} ${ab[0]},${ab[1]}`} fill="#000" opacity={0.15} />);
  } else {
    for (let i = 1; i < dims.w * 2; i += 2) {
      const [x, y] = project(o, i / 2, 0);
      wallDecor.push(<rect key={`sb${i}`} x={x} y={y - wallH * UNIT} width={UNIT} height={(wallH - 3) * UNIT} fill={shade(wallColors[0], -0.08)} />);
    }
    for (let i = 1; i < dims.d * 2; i += 2) {
      const [x, y] = project(o, 0, i / 2);
      wallDecor.push(<rect key={`sl${i}`} x={x} y={y - wallH * UNIT} width={UNIT} height={(wallH - 3) * UNIT} fill={shade(wallColors[1], -0.1)} />);
    }
  }

  type Obj = { key: number; node: React.ReactNode };
  const objects: Obj[] = [];
  for (const it of layout.items) {
    const def = lookup(it.mobiId);
    if (!def || it.uid === (mode.kind === 'placing' ? mode.movingUid : undefined)) continue;
    const { w, d } = footprint(def, it.rot);
    const selected = it.uid === selectedUid;
    objects.push({
      key: def.walkable ? -100 + it.gx + it.gy : it.gx + w + it.gy + d,
      node: (
        <g
          key={it.uid}
          className={`${mode.kind === 'idle' ? 'pixel-clickable' : ''} ${selected ? 'pixel-selected' : ''}`}
          onClick={(e) => {
            if (mode.kind !== 'idle') return;
            e.stopPropagation();
            setSelectedUid(it.uid);
          }}
        >
          {def.render({ o, gx: it.gx, gy: it.gy, rot: it.rot, night })}
        </g>
      ),
    });
  }

  const pigoAnchor = project(o, pigo.pos[0] + 0.5, pigo.pos[1] + 0.5);
  const customPigo = pigoImages.pigo;
  const pigoOffset = assets?.manifest?.pigo || {};
  let pigoNode: React.ReactNode;
  if (customPigo) {
    const x = Math.round(pigoAnchor[0] - customPigo.w / 2 + (pigoOffset.offsetX || 0));
    const y = Math.round(pigoAnchor[1] - customPigo.h + 4 + (pigoOffset.offsetY || 0));
    pigoNode = (
      <image href={customPigo.url} x={x} y={y} width={customPigo.w} height={customPigo.h} style={{ imageRendering: 'pixelated' }}
        transform={pigo.flip ? `translate(${2 * x + customPigo.w} 0) scale(-1 1)` : undefined} />
    );
  } else {
    const ps = 2 * UNIT;
    const { w: pw, h: ph } = spriteSize(PIGO);
    const px = Math.round(pigoAnchor[0] - (pw * ps) / 2);
    const py = Math.round(pigoAnchor[1] - ph * ps + 4 * UNIT);
    pigoNode = (
      <>
        <PixelSprite sprite={PIGO} x={px} y={py} scale={ps} flip={pigo.flip} />
        <g className="pixel-blink"><PixelSprite sprite={PIGO_BLINK} x={px} y={py} scale={ps} flip={pigo.flip} /></g>
      </>
    );
  }
  objects.push({
    key: pigo.pos[0] + pigo.pos[1] + 2.01,
    node: <g key="pigo" className={pigo.path.length ? '' : 'pixel-bob'} style={{ pointerEvents: 'none' }}>{pigoNode}</g>,
  });
  objects.sort((a, b) => a.key - b.key);

  // Prévia do mobi sendo posicionado
  let preview: React.ReactNode = null;
  if (placingDef && hover && mode.kind === 'placing') {
    const { w, d } = footprint(placingDef, mode.rot);
    const tiles: React.ReactNode[] = [];
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < d; y++) {
        tiles.push(<IsoTile key={`pv${x}-${y}`} origin={o} gx={hover[0] + x} gy={hover[1] + y} color={placingValid ? 'rgba(115,239,247,0.35)' : 'rgba(239,68,68,0.45)'} outline={placingValid ? PALETTE.C : '#ef4444'} />);
      }
    }
    preview = (
      <g style={{ pointerEvents: 'none' }}>
        {tiles}
        <g opacity={0.75}>{placingDef.render({ o, gx: hover[0], gy: hover[1], rot: mode.rot, night })}</g>
      </g>
    );
  }

  const roomMobis = catalog.filter(m => m.rooms.includes(roomId));
  const unlockedTotal = roomMobis.filter(m => isUnlocked(m.unlock, unlockedAchievements, level)).length;

  const surfaceList = (kind: 'paredes' | 'pisos') => {
    const options = kind === 'paredes' ? wallOptions : floorOptions;
    const currentId = kind === 'paredes' ? layout.wallpaper : layout.floor;
    const custom = kind === 'paredes' ? (layout.customWall || wallColors) : (layout.customFloor || floorColors);
    return (
      <div className="space-y-2">
        {options.map((s: SurfaceDef) => {
          const unlocked = isUnlocked(s.unlock, unlockedAchievements, level);
          const isAsset = s.id.startsWith('asset:');
          const img = isAsset ? (kind === 'paredes' ? wallImages : floorImages)[s.id.slice(6)] : undefined;
          return (
            <button
              key={s.id}
              disabled={!unlocked}
              onClick={() => updateLayout(l => (kind === 'paredes' ? { ...l, wallpaper: s.id } : { ...l, floor: s.id }))}
              className={`w-full flex items-center gap-3 p-2 rounded-xl border text-left ${
                currentId === s.id ? 'bg-amber-500/10 border-amber-500/40' : unlocked ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-slate-950/30 border-slate-850'
              }`}
            >
              <span className="flex w-10 h-8 rounded-md overflow-hidden border border-slate-700 shrink-0" style={{ filter: unlocked ? undefined : 'grayscale(1) brightness(0.5)' }}>
                {img ? <img src={img.url} className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} alt="" /> : (
                  <>
                    <span className="flex-1" style={{ background: s.colors[0] }} />
                    <span className="flex-1" style={{ background: s.colors[1] }} />
                  </>
                )}
              </span>
              <span className="min-w-0">
                <span className={`text-xs font-semibold block truncate ${unlocked ? 'text-white' : 'text-slate-500'}`}>{s.name}</span>
                <span className="text-[10px] text-slate-500">{unlocked ? (currentId === s.id ? 'Em uso' : 'Clique para usar') : unlockLabel(s.unlock)}</span>
              </span>
              {!unlocked && <Lock className="ml-auto w-3.5 h-3.5 text-slate-500" />}
            </button>
          );
        })}
        {/* Cores livres */}
        <div className={`p-2 rounded-xl border ${currentId === 'custom' ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-950/60 border-slate-800'}`}>
          <span className="text-xs font-semibold text-white block mb-1.5">Cores livres</span>
          <div className="flex items-center gap-2">
            {[0, 1].map(idx => (
              <label key={idx} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <input
                  type="color"
                  value={custom[idx]}
                  onChange={(e) => {
                    const value = e.target.value;
                    updateLayout(l => {
                      const base: [string, string] = kind === 'paredes' ? [...(l.customWall || wallColors)] as [string, string] : [...(l.customFloor || floorColors)] as [string, string];
                      base[idx] = value;
                      return kind === 'paredes' ? { ...l, wallpaper: 'custom', customWall: base } : { ...l, floor: 'custom', customFloor: base };
                    });
                  }}
                  className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                {kind === 'paredes' ? (idx === 0 ? 'Parede do fundo' : 'Parede lateral') : (idx === 0 ? 'Tile A' : 'Tile B')}
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={wrapperRef} className={`h-full flex flex-col ${isFullscreen ? 'bg-[#0b0e1a] p-3' : 'p-4'} gap-3`}>
      {/* Header + abas de ambiente */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <PixelIcon sprite={PIGO} size={32} />
          <div>
            <h1 className="text-xl font-pixel font-bold text-white leading-none">{room.name}</h1>
            <p className="text-[11px] text-slate-400 mt-1">{room.subtitle} • {dims.w}×{dims.d} tiles • clique no piso para o Pigo andar</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-850">
            {ROOMS.map(r => (
              <button
                key={r.id}
                disabled={!r.available}
                onClick={() => { setRoomId(r.id); setMode({ kind: 'idle' }); setSelectedUid(null); }}
                title={r.available ? r.name : r.subtitle}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-pixel transition-all ${
                  roomId === r.id ? 'bg-amber-500/20 text-amber-300' : r.available ? 'text-slate-300 hover:text-white' : 'text-slate-600 cursor-not-allowed'
                }`}
              >
                {!r.available && <Lock className="w-3 h-3" />}
                {r.name}
              </button>
            ))}
          </div>
          <button onClick={() => setPanelOpen(v => !v)} title={panelOpen ? 'Esconder inventário' : 'Mostrar inventário'} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white">
            {panelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>
          <button onClick={toggleFullscreen} title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-3">
        {/* Palco do quarto */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div
            ref={stageRef}
            className="relative flex-1 min-h-0 rounded-2xl overflow-hidden border-4 border-slate-800 bg-[#14182b] flex items-center justify-center"
            style={{ cursor: mode.kind === 'placing' ? (placingValid ? 'copy' : 'not-allowed') : 'default' }}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${scene.width} ${scene.height}`}
              width={scene.width * scale}
              height={scene.height * scale}
              shapeRendering="crispEdges"
              className="pixel-scene block"
              onMouseMove={(e) => setHover(tileFromEvent(e))}
              onMouseLeave={() => setHover(null)}
              onClick={handleSceneClick}
            >
              {/* Paredes */}
              <IsoBox origin={o} gx={0} gy={-0.3} w={dims.w} d={0.3} h={wallH} colors={{ top: '#3a2f2a', left: wallColors[0], right: shade(wallColors[0], -0.25), outline: PALETTE.k }} />
              <IsoBox origin={o} gx={-0.3} gy={-0.3} w={0.3} d={dims.d + 0.3} h={wallH} colors={{ top: '#3a2f2a', left: shade(wallColors[1], -0.25), right: wallColors[1], outline: PALETTE.k }} />
              {wallDecor}
              <IsoBox origin={o} gx={0} gy={-0.06} w={dims.w} d={0.06} h={4} colors={{ top: '#5d3a1a', left: '#6b4220', right: '#5d3a1a' }} />
              <IsoBox origin={o} gx={-0.06} gy={0} w={0.06} d={dims.d} h={4} colors={{ top: '#5d3a1a', left: '#5d3a1a', right: '#6b4220' }} />
              {/* Janela na parede do fundo */}
              {dims.w >= 6 && (() => {
                const wx = Math.max(1, dims.w - 4);
                const top = Math.min(wallH - 10, 46);
                const a = project(o, wx, 0, top);
                const b = project(o, wx + 2, 0, top);
                const hgt = 22 * UNIT;
                return (
                  <g>
                    <polygon points={`${a[0]},${a[1]} ${b[0]},${b[1]} ${b[0]},${b[1] + hgt} ${a[0]},${a[1] + hgt}`} fill={PALETTE.k} />
                    <polygon points={`${a[0] + 3},${a[1] + 3} ${b[0] - 3},${b[1]} ${b[0] - 3},${b[1] + hgt - 3} ${a[0] + 3},${a[1] + hgt}`} fill={night ? '#29366f' : '#9fd8ff'} />
                    <line x1={(a[0] + b[0]) / 2} y1={(a[1] + b[1]) / 2 + 2} x2={(a[0] + b[0]) / 2} y2={(a[1] + b[1]) / 2 + hgt - 2} stroke={PALETTE.k} strokeWidth={UNIT} />
                  </g>
                );
              })()}

              {/* Piso */}
              {floorTiles}
              {hover && mode.kind === 'idle' && (
                <IsoTile origin={o} gx={hover[0]} gy={hover[1]} color="rgba(255,255,255,0.18)" outline={PALETTE.w} />
              )}

              {objects.map((ob, i) => <React.Fragment key={i}>{ob.node}</React.Fragment>)}
              {preview}
              {night && <rect x={0} y={0} width={scene.width} height={scene.height} fill="#0b1030" opacity={0.18} pointerEvents="none" />}
            </svg>

            {mode.kind === 'placing' && placingDef && (
              <div className="absolute top-3 left-3 flex items-center gap-2 font-pixel text-xs bg-[#f4f4f4] text-slate-900 border-2 border-[#1a1c2c] px-2 py-1 shadow-[3px_3px_0_#1a1c2c]">
                Posicionando: {placingDef.name} • R gira • Esc cancela
              </div>
            )}
          </div>

          {/* Barra de ações do mobi selecionado */}
          {selectedItem && selectedDef && mode.kind === 'idle' && (
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div>
                <span className="font-pixel text-sm text-amber-300">{selectedDef.name}</span>
                <span className="text-[11px] text-slate-400 block">{selectedDef.description}</span>
              </div>
              <div className="flex gap-1.5">
                <button onClick={rotateSelected} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750">
                  <RotateCw className="w-3.5 h-3.5" /> Girar
                </button>
                <button
                  onClick={() => { setMode({ kind: 'placing', mobiId: selectedItem.mobiId, rot: selectedItem.rot, movingUid: selectedItem.uid }); setSelectedUid(null); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750"
                >
                  <Move className="w-3.5 h-3.5" /> Mover
                </button>
                <button onClick={pickUpSelected} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750">
                  <Package className="w-3.5 h-3.5" /> Guardar
                </button>
                <button onClick={() => setSelectedUid(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Inventário / personalização */}
        {panelOpen && (
          <div className="w-[300px] shrink-0 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3 min-h-0">
            <div className="flex items-center justify-between shrink-0">
              <span className="font-pixel text-lg text-white">Inventário</span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> {unlockedTotal}/{roomMobis.length}
              </span>
            </div>
            <div className="grid grid-cols-4 bg-slate-950/80 p-1 rounded-lg border border-slate-850 shrink-0">
              {([['mobis', 'Mobis'], ['paredes', 'Paredes'], ['pisos', 'Pisos'], ['quarto', 'Quarto']] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setPanel(k)}
                  className={`px-1 py-1 text-[11px] font-semibold rounded-md ${panel === k ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              {panel === 'mobis' && (
                <div className="grid grid-cols-2 gap-2">
                  {[...roomMobis]
                    .sort((a, b) => Number(isUnlocked(b.unlock, unlockedAchievements, level)) - Number(isUnlocked(a.unlock, unlockedAchievements, level)))
                    .map(def => {
                      const unlocked = isUnlocked(def.unlock, unlockedAchievements, level);
                      const available = def.qty - (placedCount[def.id] || 0);
                      const active = mode.kind === 'placing' && mode.mobiId === def.id && !mode.movingUid;
                      return (
                        <button
                          key={def.id}
                          disabled={!unlocked || available <= 0}
                          onClick={() => { setSelectedUid(null); setMode({ kind: 'placing', mobiId: def.id, rot: 0 }); }}
                          title={unlocked ? def.description : `Bloqueado — ${unlockLabel(def.unlock)}`}
                          className={`relative flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                            active ? 'bg-cyan-500/10 border-cyan-400/50' : unlocked ? 'bg-slate-950/60 border-slate-800 hover:border-amber-500/50' : 'bg-slate-950/30 border-slate-850'
                          } ${unlocked && available <= 0 ? 'opacity-50' : ''}`}
                        >
                          <MobiPreview def={def} locked={!unlocked} />
                          <span className={`text-[11px] font-semibold leading-tight ${unlocked ? 'text-white' : 'text-slate-500'}`}>{def.name}</span>
                          <span className="text-[10px] text-slate-500 mt-0.5">
                            {unlocked ? (def.qty >= 99 ? 'Seu asset' : `${Math.max(0, available)} de ${def.qty}`) : unlockLabel(def.unlock)}
                          </span>
                          {!unlocked && <Lock className="absolute top-2 right-2 w-3 h-3 text-slate-500" />}
                        </button>
                      );
                    })}
                </div>
              )}

              {panel === 'paredes' && surfaceList('paredes')}
              {panel === 'pisos' && surfaceList('pisos')}

              {panel === 'quarto' && (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-300 block mb-2">Tamanho do quarto</span>
                    {([['width', 'Largura', dims.w], ['depth', 'Profundidade', dims.d]] as const).map(([axis, label, value]) => (
                      <div key={axis} className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">{label}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => resizeRoom(axis, -1)} disabled={value <= ROOM_MIN} className="p-1.5 rounded-md bg-slate-800 text-slate-200 disabled:opacity-30"><Minus className="w-3 h-3" /></button>
                          <span className="font-pixel text-sm text-white w-8 text-center">{value}</span>
                          <button onClick={() => resizeRoom(axis, 1)} disabled={value >= ROOM_MAX} className="p-1.5 rounded-md bg-slate-800 text-slate-200 disabled:opacity-30"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                    <span className="text-[10px] text-slate-500">De {ROOM_MIN} a {ROOM_MAX} tiles. Ao diminuir, mobis do lado de fora voltam ao inventário.</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-300 block mb-2">Altura das paredes</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['baixa', 'normal', 'alta'] as const).map(hgt => (
                        <button
                          key={hgt}
                          onClick={() => updateLayout(l => ({ ...l, wallHeight: hgt }))}
                          className={`py-1.5 rounded-lg text-xs font-semibold border capitalize ${(layout.wallHeight || 'normal') === hgt ? 'bg-amber-500/15 border-amber-500/40 text-amber-200' : 'bg-slate-950/60 border-slate-800 text-slate-300'}`}
                        >
                          {hgt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <span className="text-xs font-semibold text-white block">Seus assets (pixel art)</span>
                    <span className="text-[11px] text-slate-400 block">
                      Solte PNGs na pasta de assets para trocar mobis, pisos, paredes e o Pigo — ou criar mobis novos. Guia completo no arquivo LEIA-ME.txt da pasta.
                    </span>
                    <span className="text-[10px] text-slate-500 block break-all">{assets?.folder}</span>
                    <div className="flex gap-1.5">
                      <button onClick={() => window.electronAPI?.openGameAssetsFolder()} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750">
                        <FolderOpen className="w-3.5 h-3.5" /> Abrir pasta
                      </button>
                      <button
                        onClick={async () => { await loadAssets(); showToast('Assets recarregados!', 'success'); }}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-750"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Recarregar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
