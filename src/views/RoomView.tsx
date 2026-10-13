import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Lock, Move, Package, RotateCw, Sparkles, X } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { RoomLayout, RoomLayouts } from '../types';
import { IsoBox, IsoOrigin, IsoTile, project, shade } from '../game/iso';
import { PALETTE, PixelIcon, PixelSprite, spriteSize } from '../game/pixel';
import { PIGO, PIGO_BLINK } from '../game/sprites';
import { FLOORS, MOBIS, MobiDef, RoomId, SurfaceDef, WALLPAPERS, getMobi, isUnlocked, unlockLabel } from '../game/mobis';
import { ROOM_D, ROOM_W, canPlace, defaultLayout, findPath, footprint, newUid, occupiedTiles, screenToTile } from '../game/room';

const SCENE_W = 336;
const SCENE_H = 248;
const ORIGIN: IsoOrigin = { x: 152, y: 86 };
const WALL_H = 64;
const PIGO_SCALE = 2;
const STEP_MS = 260;

type Mode =
  | { kind: 'idle' }
  | { kind: 'placing'; mobiId: string; rot: 0 | 1; movingUid?: string };

const ROOMS: { id: RoomId; name: string; subtitle: string; available: boolean }[] = [
  { id: 'finance', name: 'Sala do Tesouro', subtitle: 'Decorada com conquistas financeiras', available: true },
  { id: 'life', name: 'Quarto do Herói', subtitle: 'Libera na Fase 2 (hábitos e tarefas)', available: false },
];

// Miniatura do mobi para o inventário
const MobiPreview: React.FC<{ def: MobiDef; locked: boolean }> = ({ def, locked }) => {
  const o = { x: 40, y: 46 };
  return (
    <svg viewBox="0 0 80 80" width={64} height={64} shapeRendering="crispEdges" style={{ imageRendering: 'pixelated', filter: locked ? 'grayscale(1) brightness(0.5)' : undefined }}>
      <IsoTile origin={o} gx={0} gy={0} color="rgba(255,255,255,0.06)" />
      {def.render({ o, gx: 0, gy: 0, rot: 0 })}
    </svg>
  );
};

export const RoomView: React.FC = () => {
  const { game, showToast } = useFinancial();
  const [roomId, setRoomId] = useState<RoomId>('finance');
  const [layouts, setLayouts] = useState<RoomLayouts | null>(null);
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [panel, setPanel] = useState<'mobis' | 'paredes' | 'pisos'>('mobis');
  const [scale, setScale] = useState(2);
  const [pigo, setPigo] = useState<{ pos: [number, number]; path: [number, number][]; flip: boolean }>({ pos: [2, 6], path: [], flip: false });
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Carrega layouts salvos (sincronizados entre computadores)
  useEffect(() => {
    window.electronAPI?.getSettings().then(s => {
      const saved = s?.roomLayouts || {};
      setLayouts({ finance: saved.finance || defaultLayout('finance'), life: saved.life || defaultLayout('life') });
    });
  }, []);

  const layout: RoomLayout | null = layouts ? layouts[roomId] || defaultLayout(roomId) : null;

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

  // Escala da cena para preencher a largura
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(Math.max(1, el.clientWidth / SCENE_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [layouts]);

  // Pigo anda um tile por vez; parado, passeia sozinho de vez em quando
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
    const t = setInterval(() => {
      setPigo(p => {
        if (p.path.length > 0 || mode.kind === 'placing') return p;
        const occ = occupiedTiles(layout.items);
        for (let tries = 0; tries < 10; tries++) {
          const target: [number, number] = [Math.floor(Math.random() * ROOM_W), Math.floor(Math.random() * ROOM_D)];
          if (occ.has(`${target[0]},${target[1]}`)) continue;
          const path = findPath(layout.items, p.pos, target);
          if (path.length > 0 && path.length < 8) return { ...p, path };
        }
        return p;
      });
    }, 5000);
    return () => clearInterval(t);
  }, [layout, mode.kind]);

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
    const t = screenToTile(ORIGIN, (e.clientX - rect.left) / scale, (e.clientY - rect.top) / scale);
    if (t[0] < 0 || t[1] < 0 || t[0] >= ROOM_W || t[1] >= ROOM_D) return null;
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
  const wall = WALLPAPERS.find(w => w.id === layout.wallpaper) || WALLPAPERS[0];
  const floor = FLOORS.find(f => f.id === layout.floor) || FLOORS[0];
  const selectedItem = layout.items.find(i => i.uid === selectedUid) || null;
  const selectedDef = selectedItem ? getMobi(selectedItem.mobiId) : null;
  const placingDef = mode.kind === 'placing' ? getMobi(mode.mobiId) : null;
  const placingValid = Boolean(
    placingDef && hover && mode.kind === 'placing' &&
    canPlace(layout.items, placingDef, hover[0], hover[1], mode.rot, mode.movingUid, mode.movingUid ? undefined : new Set([`${pigo.pos[0]},${pigo.pos[1]}`]))
  );

  const handleSceneClick = (e: React.MouseEvent) => {
    const t = tileFromEvent(e);
    if (mode.kind === 'placing') {
      if (!t || !placingDef) return;
      if (!canPlace(layout.items, placingDef, t[0], t[1], mode.rot, mode.movingUid, mode.movingUid ? undefined : new Set([`${pigo.pos[0]},${pigo.pos[1]}`]))) {
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
      const path = findPath(layout.items, pigo.pos, t);
      if (path.length) setPigo(p => ({ ...p, path }));
    }
  };

  const startPlacing = (def: MobiDef) => {
    setSelectedUid(null);
    setMode({ kind: 'placing', mobiId: def.id, rot: 0 });
  };

  const rotateSelected = () => {
    if (!selectedItem || !selectedDef) return;
    const rot: 0 | 1 = selectedItem.rot ? 0 : 1;
    if (!canPlace(layout.items, selectedDef, selectedItem.gx, selectedItem.gy, rot, selectedItem.uid)) {
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

  // --- Montagem da cena ---
  const o = ORIGIN;
  const floorTiles: React.ReactNode[] = [];
  for (let gx = 0; gx < ROOM_W; gx++) {
    for (let gy = 0; gy < ROOM_D; gy++) {
      floorTiles.push(
        <IsoTile key={`f${gx}-${gy}`} origin={o} gx={gx} gy={gy} color={(gx + gy) % 2 ? floor.colors[1] : floor.colors[0]} outline={shade(floor.colors[1], -0.15)} />
      );
    }
  }

  const stripes: React.ReactNode[] = [];
  for (let i = 1; i < ROOM_W * 2; i += 2) {
    const [x, y] = project(o, i / 2, 0);
    stripes.push(<rect key={`sb${i}`} x={x} y={y - WALL_H} width={1} height={WALL_H - 3} fill={shade(wall.colors[0], -0.08)} />);
  }
  for (let i = 1; i < ROOM_D * 2; i += 2) {
    const [x, y] = project(o, 0, i / 2);
    stripes.push(<rect key={`sl${i}`} x={x} y={y - WALL_H} width={1} height={WALL_H - 3} fill={shade(wall.colors[1], -0.1)} />);
  }

  type Obj = { key: number; node: React.ReactNode };
  const objects: Obj[] = [];
  for (const it of layout.items) {
    const def = getMobi(it.mobiId);
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
  const { w: pw, h: ph } = spriteSize(PIGO);
  const pigoX = Math.round(pigoAnchor[0] - (pw * PIGO_SCALE) / 2);
  const pigoY = Math.round(pigoAnchor[1] - ph * PIGO_SCALE + 4);
  objects.push({
    key: pigo.pos[0] + pigo.pos[1] + 2.01,
    node: (
      <g key="pigo" className={pigo.path.length ? '' : 'pixel-bob'} style={{ pointerEvents: 'none' }}>
        <PixelSprite sprite={PIGO} x={pigoX} y={pigoY} scale={PIGO_SCALE} flip={pigo.flip} />
        <g className="pixel-blink"><PixelSprite sprite={PIGO_BLINK} x={pigoX} y={pigoY} scale={PIGO_SCALE} flip={pigo.flip} /></g>
      </g>
    ),
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

  const ownedMobis = MOBIS.filter(m => m.rooms.includes(roomId));
  const unlockedTotal = ownedMobis.filter(m => isUnlocked(m.unlock, unlockedAchievements, level)).length;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl space-y-4">
        {/* Header + abas de ambiente */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <PixelIcon sprite={PIGO} size={40} />
            <div>
              <h1 className="text-2xl font-pixel font-bold text-white">{room.name}</h1>
              <p className="text-xs text-slate-400">{room.subtitle}. Clique no piso para o Pigo andar; mobis novos chegam com conquistas.</p>
            </div>
          </div>
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
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
          {/* Quarto */}
          <div className="space-y-2">
            <div
              ref={containerRef}
              className="relative rounded-2xl overflow-hidden border-4 border-slate-800 bg-[#14182b]"
              style={{ cursor: mode.kind === 'placing' ? (placingValid ? 'copy' : 'not-allowed') : 'default' }}
            >
              <svg
                ref={svgRef}
                viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
                width={SCENE_W * scale}
                height={SCENE_H * scale}
                shapeRendering="crispEdges"
                className="pixel-scene block"
                onMouseMove={(e) => setHover(tileFromEvent(e))}
                onMouseLeave={() => setHover(null)}
                onClick={handleSceneClick}
              >
                {/* Paredes */}
                <IsoBox origin={o} gx={0} gy={-0.35} w={ROOM_W} d={0.35} h={WALL_H} colors={{ top: '#3a2f2a', left: wall.colors[0], right: shade(wall.colors[0], -0.25), outline: PALETTE.k }} />
                <IsoBox origin={o} gx={-0.35} gy={-0.35} w={0.35} d={ROOM_D + 0.35} h={WALL_H} colors={{ top: '#3a2f2a', left: shade(wall.colors[1], -0.25), right: wall.colors[1], outline: PALETTE.k }} />
                {stripes}
                <IsoBox origin={o} gx={0} gy={-0.08} w={ROOM_W} d={0.08} h={4} colors={{ top: '#5d3a1a', left: '#6b4220', right: '#5d3a1a' }} />
                <IsoBox origin={o} gx={-0.08} gy={0} w={0.08} d={ROOM_D} h={4} colors={{ top: '#5d3a1a', left: '#5d3a1a', right: '#6b4220' }} />
                {/* Janela na parede do fundo */}
                {(() => {
                  const a = project(o, 6, 0, 46);
                  const b = project(o, 8, 0, 46);
                  return (
                    <g>
                      <polygon points={`${a[0]},${a[1]} ${b[0]},${b[1]} ${b[0]},${b[1] + 22} ${a[0]},${a[1] + 22}`} fill={PALETTE.k} />
                      <polygon points={`${a[0] + 2},${a[1] + 2} ${b[0] - 2},${b[1] }  ${b[0] - 2},${b[1] + 20} ${a[0] + 2},${a[1] + 21}`} fill={night ? '#29366f' : '#9fd8ff'} />
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
                {night && <rect x={0} y={0} width={SCENE_W} height={SCENE_H} fill="#0b1030" opacity={0.2} pointerEvents="none" />}
              </svg>

              {mode.kind === 'placing' && placingDef && (
                <div className="absolute top-3 left-3 flex items-center gap-2 font-pixel text-xs bg-[#f4f4f4] text-slate-900 border-2 border-[#1a1c2c] px-2 py-1 shadow-[3px_3px_0_#1a1c2c]">
                  Posicionando: {placingDef.name} • R gira • Esc cancela
                </div>
              )}
            </div>

            {/* Barra de ações do mobi selecionado */}
            {selectedItem && selectedDef && mode.kind === 'idle' && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
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

          {/* Inventário / catálogo */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 h-fit">
            <div className="flex items-center justify-between">
              <span className="font-pixel text-lg text-white">Inventário</span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> {unlockedTotal}/{ownedMobis.length} mobis
              </span>
            </div>
            <div className="flex bg-slate-950/80 p-1 rounded-lg border border-slate-850">
              {([['mobis', 'Mobis'], ['paredes', 'Paredes'], ['pisos', 'Pisos']] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setPanel(k)}
                  className={`flex-1 px-2 py-1 text-[11px] font-semibold rounded-md ${panel === k ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {panel === 'mobis' && (
              <div className="grid grid-cols-2 gap-2 max-h-[520px] overflow-y-auto pr-1">
                {[...ownedMobis]
                  .sort((a, b) => Number(isUnlocked(b.unlock, unlockedAchievements, level)) - Number(isUnlocked(a.unlock, unlockedAchievements, level)))
                  .map(def => {
                    const unlocked = isUnlocked(def.unlock, unlockedAchievements, level);
                    const available = def.qty - (placedCount[def.id] || 0);
                    const active = mode.kind === 'placing' && mode.mobiId === def.id && !mode.movingUid;
                    return (
                      <button
                        key={def.id}
                        disabled={!unlocked || available <= 0}
                        onClick={() => startPlacing(def)}
                        title={unlocked ? def.description : `Bloqueado — ${unlockLabel(def.unlock)}`}
                        className={`relative flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                          active ? 'bg-cyan-500/10 border-cyan-400/50' : unlocked ? 'bg-slate-950/60 border-slate-800 hover:border-amber-500/50' : 'bg-slate-950/30 border-slate-850'
                        } ${unlocked && available <= 0 ? 'opacity-50' : ''}`}
                      >
                        <MobiPreview def={def} locked={!unlocked} />
                        <span className={`text-[11px] font-semibold leading-tight ${unlocked ? 'text-white' : 'text-slate-500'}`}>{def.name}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">
                          {unlocked ? `${Math.max(0, available)} de ${def.qty}` : unlockLabel(def.unlock)}
                        </span>
                        {!unlocked && <Lock className="absolute top-2 right-2 w-3 h-3 text-slate-500" />}
                      </button>
                    );
                  })}
              </div>
            )}

            {(panel === 'paredes' || panel === 'pisos') && (
              <div className="space-y-2">
                {(panel === 'paredes' ? WALLPAPERS : FLOORS).map((s: SurfaceDef) => {
                  const unlocked = isUnlocked(s.unlock, unlockedAchievements, level);
                  const current = panel === 'paredes' ? layout.wallpaper === s.id : layout.floor === s.id;
                  return (
                    <button
                      key={s.id}
                      disabled={!unlocked}
                      onClick={() => updateLayout(l => (panel === 'paredes' ? { ...l, wallpaper: s.id } : { ...l, floor: s.id }))}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl border text-left ${
                        current ? 'bg-amber-500/10 border-amber-500/40' : unlocked ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-slate-950/30 border-slate-850'
                      }`}
                    >
                      <span className="flex w-10 h-8 rounded-md overflow-hidden border border-slate-700 shrink-0" style={{ filter: unlocked ? undefined : 'grayscale(1) brightness(0.5)' }}>
                        <span className="flex-1" style={{ background: s.colors[0] }} />
                        <span className="flex-1" style={{ background: s.colors[1] }} />
                      </span>
                      <span className="min-w-0">
                        <span className={`text-xs font-semibold block ${unlocked ? 'text-white' : 'text-slate-500'}`}>{s.name}</span>
                        <span className="text-[10px] text-slate-500">{unlocked ? (current ? 'Em uso' : 'Clique para usar') : unlockLabel(s.unlock)}</span>
                      </span>
                      {!unlocked && <Lock className="ml-auto w-3.5 h-3.5 text-slate-500" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
