import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useFinancial, AppView } from '../context/FinancialContext';
import { formatCurrency } from '../utils/formatters';
import { GameWorldState } from '../types';
import { PixelIcon, PixelSprite, PALETTE } from '../game/pixel';
import {
  CLOUD, COIN, CRATE, DRAGON, FLAG, FLAME, GOBLIN_A, GOBLIN_B, GOLD_PILE, HOUSE,
  MOON, PIGO, PIGO_BLINK, SIGN, SUN, TREE, WAGON, WAREHOUSE,
} from '../game/sprites';

// Cena lógica de 320x180 "pixels", ampliada em múltiplos inteiros para ficar nítida
const SCENE_W = 320;
const SCENE_H = 180;
const GROUND_Y = 120;

type ElementKey = string;

interface ElementInfo {
  title: string;
  analogy: string;
  stats: [string, string][];
  action?: { label: string; view: AppView };
}

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  checking: 'Conta corrente',
  savings: 'Poupança',
  cash: 'Dinheiro',
  wallet: 'Carteira digital',
  investment: 'Investimento',
  other: 'Outra',
};

function balanceTier(balance: number): number {
  if (balance <= 0) return 0;
  if (balance < 100000) return 1; // < R$ 1 mil
  if (balance < 1000000) return 2; // < R$ 10 mil
  return 3;
}

function describe(key: ElementKey, w: GameWorldState): ElementInfo {
  if (key === 'castle') {
    return {
      title: 'Castelo do Tesouro',
      analogy: 'O ouro guardado no castelo é a soma do saldo de todas as suas contas. Quanto maior a pilha, mais rico o Reino.',
      stats: [['Ouro no tesouro', formatCurrency(w.treasury.totalBalance)], ['Contas (prédios)', String(w.buildings.length)]],
      action: { label: 'Ver contas', view: 'accounts' },
    };
  }
  if (key === 'walls') {
    return {
      title: 'Muralhas do Reino',
      analogy: 'Cada camada de muralha é um mês de custo de vida coberto pela sua reserva. Muralhas altas protegem o Reino de imprevistos.',
      stats: [
        ['Camadas erguidas', `${w.walls.layers} de ${w.walls.targetMonths}`],
        ['Cobertura', `${w.walls.coverageMonths} meses`],
        ['Reserva', formatCurrency(w.walls.balance)],
      ],
      action: { label: 'Abrir Reserva', view: 'reserve' },
    };
  }
  if (key === 'dragon') {
    return {
      title: w.dragon.present ? 'O Dragão da Dívida' : 'Céu livre de dragões',
      analogy: w.dragon.present
        ? 'O dragão é a fatura do cartão em aberto. A vida dele é o quanto você deve; pagar as faturas em dia causa dano. As correntes são parcelamentos longos.'
        : 'Nenhuma fatura em aberto: o dragão não ronda o seu Reino.',
      stats: w.dragon.present
        ? [
            ['Vida do dragão (dívida)', formatCurrency(w.dragon.debt)],
            ['Uso do limite', `${w.dragon.utilization}%`],
            ['Correntes (parcelamentos)', String(w.dragon.chains)],
          ]
        : [['Cartões ativos', String(w.dragon.cardsCount)]],
      action: { label: 'Ver cartões', view: 'cards' },
    };
  }
  if (key === 'warehouse') {
    return {
      title: 'Armazém',
      analogy: 'Caixas espalhadas são lançamentos sem categoria. Organizar o armazém ensina a inteligência do Pigo a categorizar sozinha nas próximas importações.',
      stats: [['Caixas fora do lugar', String(w.warehouse.uncategorized)], ['Itens organizados', String(w.warehouse.categorized)]],
      action: { label: 'Ver lançamentos', view: 'transactions' },
    };
  }
  if (key === 'goblins') {
    const monthly = w.goblins.reduce((s, g) => s + (g.frequency === 'weekly' ? Math.round((g.amount * 52) / 12) : g.amount), 0);
    return {
      title: 'Goblins das Assinaturas',
      analogy: 'Cada goblin é uma cobrança recorrente detectada nos seus extratos. Eles mordiscam um pouco do ouro todo mês — vale conferir se ainda fazem sentido.',
      stats: [
        ['Goblins na vila', String(w.goblins.length)],
        ['Ouro levado por mês', formatCurrency(monthly)],
        ...w.goblins.slice(0, 4).map(g => [g.name, formatCurrency(g.amount)] as [string, string]),
      ],
      action: { label: 'Ver na Inteligência', view: 'intelligence' },
    };
  }
  if (key === 'caravan') {
    return {
      title: 'Caravana de Mercadores',
      analogy: 'A caravana chega quando você importa um extrato: ela traz as notícias (lançamentos) do banco para o Reino.',
      stats: [['Última chegada', w.caravan.lastImportAt ? new Date(w.caravan.lastImportAt).toLocaleDateString('pt-BR') : 'Nunca']],
      action: { label: 'Importar extrato', view: 'import' },
    };
  }
  if (key === 'weather') {
    const label = w.weather === 'sunny' ? 'Céu limpo' : w.weather === 'rain' ? 'Chuva' : 'Nublado';
    return {
      title: `Clima: ${label}`,
      analogy: 'O clima reflete a saúde financeira e o resultado do último mês fechado. Mês no azul traz sol e festival na praça.',
      stats: [['Saúde financeira', `${w.healthScore}/100`], ['Último mês no azul?', w.festival ? 'Sim — festival!' : 'Não']],
      action: { label: 'Ver Inteligência', view: 'intelligence' },
    };
  }
  if (key === 'pigo') {
    return {
      title: `Pigo, seu conselheiro`,
      analogy: 'O Pigo acompanha o Reino e dá dicas com base nas suas missões da semana. Em breve: skins e acessórios conquistados jogando.',
      stats: [['Nível do Reino', `${w.level} • ${w.title}`], ['XP total', w.totalXp.toLocaleString('pt-BR')]],
      action: { label: 'Abrir Jornada', view: 'journey' },
    };
  }
  if (key.startsWith('house:')) {
    const b = w.buildings.find(x => `house:${x.id}` === key);
    return {
      title: b ? `Casa: ${b.name}` : 'Casa',
      analogy: 'Cada casa é uma conta bancária. As moedas no telhado mostram o tamanho do saldo; telhado escuro indica saldo negativo.',
      stats: b ? [['Saldo', formatCurrency(b.balance)], ['Tipo', ACCOUNT_TYPE_LABEL[b.type] || b.type]] : [],
      action: { label: 'Ver contas', view: 'accounts' },
    };
  }
  if (key.startsWith('build:')) {
    const g = w.constructions.find(x => `build:${x.id}` === key);
    return {
      title: g ? `Obra: ${g.name}` : 'Obra',
      analogy: 'Cada obra é uma meta financeira. A construção sobe conforme você guarda dinheiro para ela.',
      stats: g ? [['Progresso', `${g.progress}%`], ['Guardado', `${formatCurrency(g.currentAmount)} de ${formatCurrency(g.targetAmount)}`]] : [],
      action: { label: 'Ver metas', view: 'goals' },
    };
  }
  return { title: 'Reino do Pigo', analogy: '', stats: [] };
}

function pigoTip(w: GameWorldState): string {
  const open = w.missions.find(m => m.status === 'in_progress');
  if (w.warehouse.uncategorized > 0) return `Tem ${w.warehouse.uncategorized} caixa(s) fora do lugar no armazém. Bora categorizar?`;
  if (!w.caravan.arrived) return 'A caravana não aparece há dias... que tal importar um extrato?';
  if (w.dragon.present && w.dragon.utilization > 50) return 'O dragão está forte! Pagar a fatura em dia causa dano crítico.';
  if (open) return `Missão da semana: ${open.title}.`;
  if (w.walls.layers < w.walls.targetMonths) return 'Cada aporte na reserva ergue mais uma camada de muralha!';
  return 'O Reino está próspero. Continue assim!';
}

// --- Elementos procedurais (pedra, castelo, muralha, obras) ---
const Stone: React.FC<{ x: number; y: number; w: number; h: number; base?: string; mortar?: string }> = ({ x, y, w, h, base = PALETTE.n, mortar = PALETTE.N }) => {
  const rows = [];
  for (let ry = 0; ry < h; ry += 3) {
    const offset = (ry / 3) % 2 === 0 ? 0 : 3;
    for (let rx = -offset; rx < w; rx += 6) {
      const bx = Math.max(0, rx);
      const bw = Math.min(w, rx + 6) - bx;
      if (bw > 0) rows.push(<rect key={`${rx}-${ry}`} x={x + bx} y={y + ry} width={bw - 1 > 0 ? bw - 1 : bw} height={Math.min(2, h - ry)} fill={base} />);
    }
  }
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={mortar} />
      {rows}
    </g>
  );
};

const Crenellations: React.FC<{ x: number; y: number; w: number; color?: string }> = ({ x, y, w, color = PALETTE.n }) => {
  const teeth = [];
  for (let i = 0; i < w; i += 4) {
    teeth.push(<rect key={i} x={x + i} y={y} width={Math.min(2, w - i)} height={3} fill={color} />);
  }
  return <g>{teeth}</g>;
};

const Castle: React.FC<{ x: number; y: number; festival: boolean; night: boolean }> = ({ x, y, festival, night }) => {
  const window = night ? PALETTE.y : PALETTE.b;
  return (
    <g>
      {/* torres */}
      <Stone x={x} y={y + 6} w={12} h={50} />
      <Crenellations x={x} y={y + 3} w={12} />
      <Stone x={x + 40} y={y + 6} w={12} h={50} />
      <Crenellations x={x + 40} y={y + 3} w={12} />
      {/* corpo central */}
      <Stone x={x + 12} y={y + 18} w={28} h={38} base={PALETTE.l} mortar={PALETTE.n} />
      <Crenellations x={x + 12} y={y + 15} w={28} color={PALETTE.l} />
      {/* janelas e portão */}
      <rect x={x + 4} y={y + 16} width={3} height={5} fill={window} />
      <rect x={x + 45} y={y + 16} width={3} height={5} fill={window} />
      <rect x={x + 19} y={y + 26} width={3} height={4} fill={window} />
      <rect x={x + 30} y={y + 26} width={3} height={4} fill={window} />
      <rect x={x + 21} y={y + 40} width={10} height={16} fill={PALETTE.k} />
      <rect x={x + 22} y={y + 41} width={8} height={15} fill={PALETTE.M} />
      <rect x={x + 26} y={y + 41} width={1} height={15} fill={PALETTE.k} />
      {/* bandeiras nas torres */}
      <PixelSprite sprite={FLAG} x={x + 5} y={y - 8} colors={{ A: festival ? PALETTE.y : PALETTE.r }} />
      <PixelSprite sprite={FLAG} x={x + 45} y={y - 8} colors={{ A: festival ? PALETTE.y : PALETTE.r }} />
      {/* bandeirolas de festival */}
      {festival && Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} x={x + 8 + i * 4} y={y + 6 + (i % 2)} width={2} height={2} fill={[PALETTE.r, PALETTE.y, PALETTE.G, PALETTE.c][i % 4]} />
      ))}
    </g>
  );
};

const Walls: React.FC<{ layers: number; target: number; partial: number }> = ({ layers, target, partial }) => {
  const x = 104;
  const w = 112;
  const layerH = 3;
  const shown = Math.min(layers, target);
  const maxH = target * layerH;
  const builtH = shown * layerH;
  const gateX = x + w / 2 - 6;
  return (
    <g>
      {/* contorno das camadas planejadas */}
      <rect x={x} y={GROUND_Y - maxH} width={w} height={maxH - builtH} fill={PALETTE.l} fillOpacity={0.08} stroke={PALETTE.w} strokeOpacity={0.55} strokeDasharray="2 2" strokeWidth={0.5} />
      {/* fundação */}
      <rect x={x} y={GROUND_Y - 1} width={gateX - x} height={1} fill={PALETTE.N} />
      <rect x={gateX + 12} y={GROUND_Y - 1} width={x + w - gateX - 12} height={1} fill={PALETTE.N} />
      {/* camada em construção: preenchida proporcionalmente à fração do próximo mês */}
      {partial > 0 && shown < target && (
        <rect x={x} y={GROUND_Y - builtH - layerH} width={Math.max(1, Math.round(w * partial))} height={layerH} fill={PALETTE.n} opacity={0.85} />
      )}
      {builtH > 0 && (
        <>
          <Stone x={x} y={GROUND_Y - builtH} w={gateX - x} h={builtH} />
          <Stone x={gateX + 12} y={GROUND_Y - builtH} w={x + w - gateX - 12} h={builtH} />
          <Crenellations x={x} y={GROUND_Y - builtH - 3} w={gateX - x} />
          <Crenellations x={gateX + 12} y={GROUND_Y - builtH - 3} w={x + w - gateX - 12} />
        </>
      )}
    </g>
  );
};

const Construction: React.FC<{ x: number; y: number; progress: number; color: string }> = ({ x, y, progress, color }) => {
  const h = 26;
  const built = Math.round((h * progress) / 100);
  return (
    <g>
      <rect x={x} y={y + h - built} width={14} height={built} fill={color} />
      {Array.from({ length: Math.floor(built / 3) }).map((_, i) => (
        <rect key={i} x={x} y={y + h - built + i * 3} width={14} height={1} fill={PALETTE.k} opacity={0.25} />
      ))}
      {/* andaime */}
      <rect x={x - 1} y={y} width={1} height={h} fill={PALETTE.m} />
      <rect x={x + 14} y={y} width={1} height={h} fill={PALETTE.m} />
      {[0, 9, 18].map(dy => <rect key={dy} x={x - 1} y={y + dy} width={16} height={1} fill={PALETTE.u} />)}
      {progress >= 100 && <PixelSprite sprite={FLAG} x={x + 5} y={y - 10} colors={{ A: PALETTE.G }} />}
    </g>
  );
};

// Agrupa um elemento clicável da cena
const Clickable: React.FC<{ id: ElementKey; selected: ElementKey | null; onSelect: (k: ElementKey) => void; children: React.ReactNode; label: string }> = ({ id, selected, onSelect, children, label }) => (
  <g
    className={`pixel-clickable ${selected === id ? 'pixel-selected' : ''}`}
    onClick={(e) => { e.stopPropagation(); onSelect(id); }}
    role="button"
    aria-label={label}
  >
    {children}
  </g>
);

export const KingdomView: React.FC = () => {
  const { setCurrentView, showToast } = useFinancial();
  const [world, setWorld] = useState<GameWorldState | null>(null);
  const [selected, setSelected] = useState<ElementKey | null>(null);
  const [scale, setScale] = useState(2);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!window.electronAPI?.getGameWorld) return;
    try {
      setWorld(await window.electronAPI.getGameWorld());
    } catch (e) {
      console.error(e);
      showToast('Não foi possível carregar o Reino.', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  // Escala inteira para manter cada pixel do jogo nítido
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(Math.max(1, el.clientWidth / SCENE_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [world]);

  const night = useMemo(() => {
    const h = new Date().getHours();
    return h >= 19 || h < 6;
  }, []);

  if (!world) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
        <PixelIcon sprite={PIGO} size={48} className="pixel-bob" />
        <span className="text-sm font-pixel">Construindo o Reino...</span>
      </div>
    );
  }

  const info = describe(selected || 'castle', world);
  const sky = world.weather === 'rain'
    ? (night ? ['#141a2e', '#1f2740'] : ['#4a5a78', '#6d7f9c'])
    : world.weather === 'cloudy'
      ? (night ? ['#141a2e', '#23305a'] : ['#7fa3c7', '#a9c3dc'])
      : (night ? ['#0f1630', '#29366f'] : ['#41a6f6', '#9fd8ff']);
  const cloudCount = world.weather === 'sunny' ? 2 : world.weather === 'cloudy' ? 4 : 5;
  const cloudColors = world.weather === 'rain' ? { w: '#94b0c2' } : night ? { w: '#566c86' } : undefined;
  const goldPiles = Math.min(3, balanceTier(world.treasury.totalBalance));
  const goblins = world.goblins.slice(0, 6);
  const crates = Math.min(world.warehouse.uncategorized, 10);
  const housesShown = world.buildings.slice(0, 8);
  const dragonScale = world.dragon.utilization > 50 ? 2 : 1;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <PixelIcon sprite={PIGO} size={40} />
            <div>
              <h1 className="text-2xl font-pixel font-bold text-white">Reino do Pigo</h1>
              <p className="text-xs text-slate-400">
                Suas finanças viram uma vila: ela cresce, se protege e enfrenta dragões conforme o seu dinheiro real.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-pixel text-sm text-amber-300">Nível {world.level} • {world.title}</span>
            <button
              onClick={load}
              className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
              title="Atualizar o Reino"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
          {/* Scene */}
          <div ref={containerRef} className="relative rounded-2xl overflow-hidden border-4 border-slate-800 bg-black" onClick={() => setSelected(null)}>
            <svg
              viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
              width={SCENE_W * scale}
              height={SCENE_H * scale}
              shapeRendering="crispEdges"
              className="pixel-scene block mx-auto"
            >
              {/* Céu em faixas */}
              {Array.from({ length: 6 }).map((_, i) => (
                <rect key={i} x={0} y={i * 20} width={SCENE_W} height={20} fill={i < 3 ? sky[0] : sky[1]} opacity={1 - i * 0.04} />
              ))}
              {night && Array.from({ length: 24 }).map((_, i) => (
                <rect key={i} x={(i * 53) % SCENE_W} y={(i * 29) % 70} width={1} height={1} fill="#f4f4f4" className={i % 3 === 0 ? 'pixel-twinkle' : undefined} />
              ))}

              <Clickable id="weather" selected={selected} onSelect={setSelected} label="Clima">
                {night ? <PixelSprite sprite={MOON} x={18} y={10} /> : world.weather !== 'rain' && <PixelSprite sprite={SUN} x={16} y={8} />}
              </Clickable>

              {Array.from({ length: cloudCount }).map((_, i) => (
                <g key={i} className="pixel-drift" style={{ animationDelay: `${-i * 17}s`, animationDuration: `${60 + i * 12}s` }}>
                  <PixelSprite sprite={CLOUD} x={0} y={10 + (i * 13) % 40} colors={cloudColors} />
                </g>
              ))}

              {/* Colinas ao fundo */}
              <rect x={0} y={96} width={90} height={24} fill="#2f7d55" />
              <rect x={20} y={88} width={50} height={8} fill="#2f7d55" />
              <rect x={220} y={92} width={100} height={28} fill="#2f7d55" />
              <rect x={250} y={84} width={50} height={8} fill="#2f7d55" />

              {/* Chão */}
              <rect x={0} y={GROUND_Y} width={SCENE_W} height={SCENE_H - GROUND_Y} fill={PALETTE.G} />
              <rect x={0} y={GROUND_Y} width={SCENE_W} height={2} fill={PALETTE.g} />
              {Array.from({ length: 30 }).map((_, i) => (
                <rect key={i} x={(i * 37) % SCENE_W} y={GROUND_Y + 6 + ((i * 11) % 50)} width={2} height={1} fill={PALETTE.g} opacity={0.6} />
              ))}
              {/* Estrada */}
              <rect x={0} y={150} width={SCENE_W} height={8} fill={PALETTE.u} />
              <rect x={0} y={150} width={SCENE_W} height={1} fill={PALETTE.m} />
              <rect x={154} y={120} width={12} height={30} fill={PALETTE.u} />

              {/* Árvores decorativas */}
              <PixelSprite sprite={TREE} x={92} y={108} />
              <PixelSprite sprite={TREE} x={4} y={160} />
              <PixelSprite sprite={TREE} x={302} y={108} />
              <PixelSprite sprite={TREE} x={210} y={160} />

              {/* Casas = contas */}
              {housesShown.map((b, i) => {
                const col = i % 4;
                const row = Math.floor(i / 4);
                const hx = 6 + col * 21;
                const hy = 104 + row * 24;
                const tier = balanceTier(b.balance);
                return (
                  <Clickable key={b.id} id={`house:${b.id}`} selected={selected} onSelect={setSelected} label={`Conta ${b.name}`}>
                    <PixelSprite sprite={HOUSE} x={hx} y={hy} colors={{ A: b.balance < 0 ? PALETTE.N : b.color || PALETTE.r }} />
                    {Array.from({ length: tier }).map((_, c) => (
                      <PixelSprite key={c} sprite={COIN} x={hx + 3 + c * 4} y={hy - 6 - (c % 2)} />
                    ))}
                  </Clickable>
                );
              })}

              {/* Castelo + tesouro */}
              <Clickable id="castle" selected={selected} onSelect={setSelected} label="Castelo do Tesouro">
                <Castle x={134} y={62} festival={world.festival} night={night} />
              </Clickable>

              {/* Muralhas = reserva */}
              <Clickable id="walls" selected={selected} onSelect={setSelected} label="Muralhas">
                <Walls layers={world.walls.layers} target={world.walls.targetMonths} partial={world.walls.coverageMonths - world.walls.layers} />
                <rect x={104} y={GROUND_Y - world.walls.targetMonths * 3} width={112} height={world.walls.targetMonths * 3} fill="transparent" />
              </Clickable>

              <Clickable id="castle" selected={selected} onSelect={setSelected} label="Tesouro">
                {Array.from({ length: Math.max(1, goldPiles) }).map((_, i) => (
                  <PixelSprite key={i} sprite={GOLD_PILE} x={147 + i * 9 - (goldPiles - 1) * 4} y={128 - (i % 2) * 2} opacity={goldPiles === 0 ? 0.35 : 1} />
                ))}
              </Clickable>

              {/* Goblins = assinaturas */}
              {goblins.length > 0 && (
                <Clickable id="goblins" selected={selected} onSelect={setSelected} label="Goblins das assinaturas">
                  {goblins.map((_, i) => {
                    const gx = 176 + (i % 3) * 10 + (i > 2 ? 5 : 0);
                    const gy = 126 + (i > 2 ? 12 : 0);
                    return (
                      <g key={i} style={{ animationDelay: `${i * 0.2}s` }}>
                        <g className="pixel-frame-a" style={{ animationDelay: `${i * 0.2}s` }}><PixelSprite sprite={GOBLIN_A} x={gx} y={gy} flip={i % 2 === 1} /></g>
                        <g className="pixel-frame-b" style={{ animationDelay: `${i * 0.2}s` }}><PixelSprite sprite={GOBLIN_B} x={gx} y={gy} flip={i % 2 === 1} /></g>
                      </g>
                    );
                  })}
                </Clickable>
              )}

              {/* Armazém = categorização */}
              <Clickable id="warehouse" selected={selected} onSelect={setSelected} label="Armazém">
                <PixelSprite sprite={WAREHOUSE} x={258} y={124} />
                {crates === 0
                  ? <PixelSprite sprite={SIGN} x={244} y={132} />
                  : Array.from({ length: crates }).map((_, i) => (
                      <PixelSprite key={i} sprite={CRATE} x={228 + (i * 11) % 80} y={140 + Math.floor(i / 5) * 9 + (i % 2) * 2} />
                    ))}
              </Clickable>

              {/* Obras = metas */}
              {world.constructions.slice(0, 3).map((g, i) => (
                <Clickable key={g.id} id={`build:${g.id}`} selected={selected} onSelect={setSelected} label={`Meta ${g.name}`}>
                  <Construction x={228 + i * 24} y={94} progress={g.progress} color={g.color || PALETTE.B} />
                </Clickable>
              ))}

              {/* Dragão = dívida do cartão */}
              {world.dragon.present && (
                <Clickable id="dragon" selected={selected} onSelect={setSelected} label="Dragão da dívida">
                  <g className="pixel-hover">
                    <PixelSprite sprite={DRAGON} x={dragonScale === 2 ? 236 : 262} y={dragonScale === 2 ? 16 : 30} scale={dragonScale} />
                    {world.dragon.utilization > 70 && <PixelSprite sprite={FLAME} x={dragonScale === 2 ? 228 : 257} y={dragonScale === 2 ? 30 : 37} scale={dragonScale} />}
                    {/* barra de vida = dívida em relação ao limite */}
                    <rect x={258} y={22} width={30} height={3} fill={PALETTE.k} />
                    <rect x={259} y={23} width={Math.max(1, Math.round(28 * Math.min(1, world.dragon.utilization / 100)))} height={1} fill={PALETTE.r} />
                    {Array.from({ length: Math.min(world.dragon.chains, 4) }).map((_, i) => (
                      <rect key={i} x={272 + i * 3} y={44} width={1} height={6 + i} fill={PALETTE.l} />
                    ))}
                  </g>
                </Clickable>
              )}

              {/* Caravana = extrato recente */}
              {world.caravan.arrived && (
                <Clickable id="caravan" selected={selected} onSelect={setSelected} label="Caravana">
                  <g className="pixel-bob"><PixelSprite sprite={WAGON} x={92} y={142} /></g>
                </Clickable>
              )}

              {/* Pigo */}
              <Clickable id="pigo" selected={selected} onSelect={setSelected} label="Pigo">
                <g className="pixel-bob">
                  <PixelSprite sprite={PIGO} x={30} y={158} />
                  <g className="pixel-blink"><PixelSprite sprite={PIGO_BLINK} x={30} y={158} /></g>
                </g>
              </Clickable>

              {/* Chuva */}
              {world.weather === 'rain' && Array.from({ length: 40 }).map((_, i) => (
                <rect
                  key={i}
                  x={(i * 41) % SCENE_W}
                  y={0}
                  width={1}
                  height={3}
                  fill="#c8dcff"
                  opacity={0.7}
                  className="pixel-rain"
                  style={{ animationDelay: `${-(i % 9) * 0.1}s` }}
                />
              ))}
            </svg>

            {/* Balão de fala do Pigo */}
            <div
              className="absolute font-pixel text-[11px] leading-tight text-slate-900 bg-[#f4f4f4] border-2 border-[#1a1c2c] px-2 py-1 max-w-[220px] pointer-events-none"
              style={{ left: `calc(50% - ${(SCENE_W * scale) / 2}px + ${48 * scale}px)`, top: `${150 * scale}px` }}
            >
              {pigoTip(world)}
            </div>
          </div>

          {/* Painel de inspeção */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 h-fit">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Inspecionar</span>
            <h2 className="text-lg font-pixel font-bold text-amber-300">{info.title}</h2>
            <p className="text-xs text-slate-300 leading-relaxed">{info.analogy}</p>
            <div className="space-y-1.5">
              {info.stats.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2 text-xs border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400 truncate">{label}</span>
                  <span className="text-white font-semibold text-right">{value}</span>
                </div>
              ))}
            </div>
            {info.action && (
              <button
                onClick={() => setCurrentView(info.action!.view)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500"
              >
                {info.action.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <p className="text-[10px] text-slate-500">Clique em qualquer elemento da vila para inspecionar.</p>
          </div>
        </div>

        {/* Legenda */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {([
            ['walls', 'Muralhas', `${world.walls.layers}/${world.walls.targetMonths} meses de reserva`, CRATE, { m: PALETTE.n, u: PALETTE.l, M: PALETTE.N }],
            ['dragon', 'Dragão', world.dragon.present ? `${formatCurrency(world.dragon.debt)} em faturas` : 'Nenhum à vista', DRAGON, undefined],
            ['warehouse', 'Armazém', `${world.warehouse.uncategorized} sem categoria`, CRATE, undefined],
            ['goblins', 'Goblins', `${world.goblins.length} assinaturas ativas`, GOBLIN_A, undefined],
            ['castle', 'Tesouro', formatCurrency(world.treasury.totalBalance), GOLD_PILE, undefined],
            ['caravan', 'Caravana', world.caravan.arrived ? 'Chegou esta semana' : 'Importe um extrato', WAGON, undefined],
            ['weather', 'Clima', `Saúde ${world.healthScore}/100`, world.weather === 'rain' ? CLOUD : SUN, undefined],
            ['pigo', 'Pigo', `Nível ${world.level}`, PIGO, undefined],
          ] as const).map(([key, label, detail, sprite, colors]) => (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${selected === key ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}`}
            >
              <span className="w-8 flex justify-center shrink-0"><PixelIcon sprite={sprite} size={24} colors={colors as Record<string, string> | undefined} /></span>
              <span className="min-w-0">
                <span className="font-pixel text-sm text-white block">{label}</span>
                <span className="text-[11px] text-slate-400 block truncate">{detail}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
