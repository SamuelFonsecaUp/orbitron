import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useFinancial, AppView } from '../context/FinancialContext';
import { formatCurrency } from '../utils/formatters';
import { GameWorldState } from '../types';
import { PixelIcon, PixelSprite, PALETTE, Sprite, spriteSize } from '../game/pixel';
import {
  CLOUD, COIN, CRATE, DRAGON, FLAG, FLAME, GOBLIN_A, GOBLIN_B, GOLD_PILE,
  MOON, PIGO, PIGO_BLINK, SIGN, SUN, WAGON,
} from '../game/sprites';
import {
  BoxColors, IsoBox, IsoGhostBox, IsoOrigin, IsoRoof, IsoTile, boxColorsFrom, project, shade, tileAnchor,
} from '../game/iso';

// Cena isométrica: ilha de GRID x GRID tiles, projetada num quadro lógico de SCENE_W x SCENE_H pixels
const GRID = 14;
const SCENE_W = 464;
const SCENE_H = 330;
const ORIGIN: IsoOrigin = { x: SCENE_W / 2, y: 92 };

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

// --- Paletas dos sólidos ---
const STONE: BoxColors = { top: PALETTE.l, left: PALETTE.n, right: PALETTE.N, outline: PALETTE.k };
const STONE_LIGHT: BoxColors = { top: '#c9d8e2', left: PALETTE.l, right: PALETTE.n, outline: PALETTE.k };
const PLASTER: BoxColors = { top: '#e8c99a', left: PALETTE.u, right: shade(PALETTE.u, -0.3), outline: PALETTE.k };
const WOOD: BoxColors = { top: PALETTE.u, left: PALETTE.m, right: PALETTE.M, outline: PALETTE.k };
const ISLAND: BoxColors = { top: PALETTE.G, left: PALETTE.m, right: PALETTE.M, outline: PALETTE.k };

// Posições fixas no mapa (gx, gy) — a vila é sempre a mesma, os dados mudam o que aparece nela
const HOUSE_SLOTS: [number, number][] = [[0.5, 0.5], [0.5, 3.5], [0.5, 6.5], [0.5, 9.5], [3.5, 11.5], [11.5, 11.5]];
const BUILD_SLOTS: [number, number][] = [[4, 0.4], [6.5, 0.4], [9, 0.4]];
const TREE_SPOTS: [number, number, number][] = [
  [2.7, 0.3, 1], [12.6, 0.4, 1.2], [13.1, 1.6, 0.9], [13.1, 9.3, 1.1], [12.2, 9.8, 0.8],
  [10.2, 12.6, 1], [0.3, 13.1, 1.2], [12.9, 13, 1], [2.9, 3.2, 0.8], [10.6, 1.8, 0.8],
];
const PATH_TILES: [number, number][] = [[6, 10], [6, 11], [6, 12], [6, 13]];
const CRATE_SPOTS: [number, number][] = [
  [11.2, 5.6], [12, 5.7], [12.8, 5.5], [11.5, 6.5], [12.4, 6.6], [13.2, 6.4],
  [11.1, 7.4], [12, 7.5], [12.9, 7.4], [11.6, 8.3],
];
const PIGO_TILE: [number, number] = [2, 11.6];
const GOBLIN_SPOTS: [number, number][] = [[7.6, 11.1], [8.4, 11.6], [7.4, 12.2], [8.6, 12.5], [9.1, 11.2], [7.9, 13]];

// Personagens e itens em escala 2 para ficarem legíveis ao lado dos prédios
const CHAR_SCALE = 2;

// Posição de um sprite "em pé" com a base no centro do ponto informado
function standing(sprite: Sprite, anchor: [number, number], scale = CHAR_SCALE): { x: number; y: number } {
  const { w, h } = spriteSize(sprite);
  return { x: Math.round(anchor[0] - (w * scale) / 2), y: Math.round(anchor[1] - h * scale + scale) };
}

// Árvore em blocos (mesmo estilo isométrico das construções)
const IsoTree: React.FC<{ gx: number; gy: number; size?: number }> = ({ gx, gy, size = 1 }) => {
  const f = 0.7 * size;
  const c = (f - 0.18) / 2;
  return (
    <g>
      <IsoBox origin={ORIGIN} gx={gx + c} gy={gy + c} w={0.18} d={0.18} h={7} colors={WOOD} />
      <IsoBox origin={ORIGIN} gx={gx} gy={gy} w={f} d={f} h={Math.round(9 * size)} z={6} colors={boxColorsFrom('#2f9e57')} />
      <IsoBox origin={ORIGIN} gx={gx + f * 0.2} gy={gy + f * 0.2} w={f * 0.6} d={f * 0.6} h={Math.round(5 * size)} z={6 + Math.round(9 * size)} colors={boxColorsFrom('#4cc46e')} />
    </g>
  );
};

interface Drawable {
  key: number;
  node: React.ReactNode;
}

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

// Montagem de toda a cena com ordenação por profundidade (pintor isométrico)
function buildScene(world: GameWorldState, night: boolean, selected: ElementKey | null, onSelect: (k: ElementKey) => void): { ground: React.ReactNode; objects: React.ReactNode[] } {
  const o = ORIGIN;
  const items: Drawable[] = [];
  const click = (id: string, label: string, node: React.ReactNode) => (
    <Clickable id={id} selected={selected} onSelect={onSelect} label={label}>{node}</Clickable>
  );

  // --- Chão: ilha flutuante, textura quadriculada e estrada ---
  const tiles: React.ReactNode[] = [];
  const grassAlt = shade(PALETTE.G, 0.1);
  for (let gx = 0; gx < GRID; gx++) {
    for (let gy = 0; gy < GRID; gy++) {
      if ((gx + gy) % 2 === 0) tiles.push(<IsoTile key={`t${gx}-${gy}`} origin={o} gx={gx} gy={gy} color={grassAlt} />);
    }
  }
  const path = PATH_TILES.map(([gx, gy]) => <IsoTile key={`p${gx}-${gy}`} origin={o} gx={gx} gy={gy} color={PALETTE.u} />);
  // pátio interno do castelo
  const courtyard: React.ReactNode[] = [];
  for (let gx = 4; gx < 10; gx++) {
    for (let gy = 4; gy < 10; gy++) {
      courtyard.push(<IsoTile key={`c${gx}-${gy}`} origin={o} gx={gx} gy={gy} color={(gx + gy) % 2 ? '#7a8ea3' : '#8aa0b5'} />);
    }
  }
  const ground = (
    <g>
      <IsoBox origin={o} gx={0} gy={0} w={GRID} d={GRID} h={12} z={-12} colors={ISLAND} />
      {tiles}
      {courtyard}
      {path}
    </g>
  );

  // --- Muralhas (reserva): altura = meses cobertos; contorno tracejado = meta ---
  const target = Math.max(1, world.walls.targetMonths);
  const coverage = Math.min(world.walls.coverageMonths, target);
  const wallH = Math.max(1, Math.round(coverage * 4));
  const ghostH = target * 4;
  const wallSegments: { gx: number; gy: number; w: number; d: number; key: number }[] = [
    { gx: 3, gy: 3, w: 7, d: 0.5, key: 0.1 },     // fundo-direita
    { gx: 3, gy: 3.5, w: 0.5, d: 6.5, key: 0.2 }, // fundo-esquerda
    { gx: 9.5, gy: 3.5, w: 0.5, d: 6.5, key: 20.5 }, // frente-direita
    { gx: 3, gy: 9.5, w: 3, d: 0.5, key: 16.5 },  // frente-esquerda (antes do portão)
    { gx: 7, gy: 9.5, w: 3, d: 0.5, key: 20.6 },  // frente-esquerda (depois do portão)
  ];
  for (const seg of wallSegments) {
    items.push({
      key: seg.key,
      node: click('walls', 'Muralhas', (
        <g>
          <IsoBox origin={o} gx={seg.gx} gy={seg.gy} w={seg.w} d={seg.d} h={wallH} colors={STONE} />
          {wallH >= 4 && Array.from({ length: Math.floor(Math.max(seg.w, seg.d)) }).map((_, i) => (
            <IsoBox
              key={i}
              origin={o}
              gx={seg.w > seg.d ? seg.gx + i + 0.25 : seg.gx}
              gy={seg.w > seg.d ? seg.gy : seg.gy + i + 0.25}
              w={seg.w > seg.d ? 0.5 : seg.w}
              d={seg.w > seg.d ? seg.d : 0.5}
              h={3}
              z={wallH}
              colors={STONE_LIGHT}
            />
          ))}
          {ghostH > wallH && (
            <IsoGhostBox origin={o} gx={seg.gx} gy={seg.gy} w={seg.w} d={seg.d} h={ghostH - wallH} z={wallH} color={PALETTE.w} opacity={0.6} />
          )}
        </g>
      )),
    });
  }

  // --- Castelo (tesouro) ---
  const doorBase = project(o, 6.5, 8);
  const flagBase = project(o, 6.5, 6.5, 46);
  const windowColor = night ? PALETTE.y : PALETTE.b;
  items.push({
    key: 16,
    node: click('castle', 'Castelo do Tesouro', (
      <g>
        <IsoBox origin={o} gx={5} gy={5} w={3} d={3} h={26} colors={STONE} />
        {[[5, 5], [7.5, 5], [5, 7.5], [7.5, 7.5], [6.25, 5], [5, 6.25], [7.5, 6.25], [6.25, 7.5]].map(([gx, gy], i) => (
          <IsoBox key={i} origin={o} gx={gx} gy={gy} w={0.5} d={0.5} h={4} z={26} colors={STONE_LIGHT} />
        ))}
        <IsoBox origin={o} gx={6} gy={6} w={1} d={1} h={46} colors={STONE_LIGHT} />
        {[[6, 6], [6.75, 6], [6, 6.75], [6.75, 6.75]].map(([gx, gy], i) => (
          <IsoBox key={i} origin={o} gx={gx} gy={gy} w={0.25} d={0.25} h={3} z={46} colors={STONE} />
        ))}
        {/* porta e janelas na face voltada para o portão */}
        <rect x={doorBase[0] - 3} y={doorBase[1] - 11} width={6} height={11} fill={PALETTE.k} />
        <rect x={doorBase[0] - 2} y={doorBase[1] - 10} width={4} height={10} fill={PALETTE.M} />
        {[[5.6, 18], [7.4, 18]].map(([gx, z], i) => {
          const p = project(o, gx, 8, z);
          return <rect key={i} x={p[0] - 1} y={p[1] - 4} width={2} height={4} fill={windowColor} />;
        })}
        {[[8, 5.6, 18], [8, 7.4, 18], [6.5, 7, 38], [7, 6.5, 38]].map(([gx, gy, z], i) => {
          const p = project(o, gx, gy, z);
          return <rect key={`w${i}`} x={p[0] - 1} y={p[1] - 4} width={2} height={4} fill={windowColor} />;
        })}
        <PixelSprite sprite={FLAG} x={flagBase[0]} y={flagBase[1] - 10} colors={{ A: world.festival ? PALETTE.y : PALETTE.r }} />
        {world.festival && [[5, 8, 26], [8, 8, 26], [8, 5, 26]].flatMap(([gx, gy, z], j) => {
          const a = project(o, gx, gy, z);
          const b = flagBase;
          return Array.from({ length: 8 }).map((_, i) => (
            <rect
              key={`${j}-${i}`}
              x={Math.round(a[0] + ((b[0] - a[0]) * i) / 8)}
              y={Math.round(a[1] + ((b[1] + 6 - a[1]) * i) / 8)}
              width={2}
              height={2}
              fill={[PALETTE.r, PALETTE.y, PALETTE.G, PALETTE.c][i % 4]}
            />
          ));
        })}
      </g>
    )),
  });

  // --- Tesouro: pilhas de ouro na frente do portão ---
  const piles = Math.min(3, balanceTier(world.treasury.totalBalance));
  items.push({
    key: 17.2,
    node: click('castle', 'Tesouro', (
      <g>
        {Array.from({ length: Math.max(1, piles) }).map((_, i) => {
          const p = standing(GOLD_PILE, tileAnchor(o, 6 + (i - (piles - 1) / 2) * 0.7, 10.6 + (i % 2) * 0.3));
          return <PixelSprite key={i} sprite={GOLD_PILE} x={p.x} y={p.y} scale={CHAR_SCALE} opacity={piles === 0 ? 0.35 : 1} />;
        })}
      </g>
    )),
  });

  // --- Casas (contas) ---
  world.buildings.slice(0, HOUSE_SLOTS.length).forEach((b, i) => {
    const [gx, gy] = HOUSE_SLOTS[i];
    const roofColor = b.balance < 0 ? PALETTE.N : b.color || PALETTE.r;
    const tier = balanceTier(b.balance);
    const apex = project(o, gx + 1, gy + 1, 22);
    const door = project(o, gx + 1, gy + 2);
    const win = project(o, gx + 2, gy + 1, 7);
    items.push({
      key: gx + gy + 4,
      node: click(`house:${b.id}`, `Conta ${b.name}`, (
        <g>
          <IsoBox origin={o} gx={gx} gy={gy} w={2} d={2} h={12} colors={PLASTER} />
          <rect x={door[0] - 2} y={door[1] - 8} width={4} height={8} fill={PALETTE.M} />
          <rect x={win[0] - 1} y={win[1] - 3} width={3} height={3} fill={night ? PALETTE.y : PALETTE.C} />
          <IsoRoof origin={o} gx={gx - 0.1} gy={gy - 0.1} w={2.2} d={2.2} z={12} h={11} color={roofColor} />
          {Array.from({ length: tier }).map((_, c) => (
            <PixelSprite key={c} sprite={COIN} x={apex[0] - 7 + c * 5} y={apex[1] - 8 - (c % 2) * 2} />
          ))}
        </g>
      )),
    });
  });

  // --- Armazém (categorização) ---
  items.push({
    key: 13.5 + 5,
    node: click('warehouse', 'Armazém', (
      <g>
        <IsoBox origin={o} gx={11} gy={3} w={2.5} d={2} h={14} colors={WOOD} />
        {(() => {
          const door = project(o, 12.25, 5);
          return <rect x={door[0] - 4} y={door[1] - 10} width={8} height={10} fill={PALETTE.k} />;
        })()}
        <IsoRoof origin={o} gx={10.9} gy={2.9} w={2.7} d={2.2} z={14} h={8} color={PALETTE.r} />
      </g>
    )),
  });
  const crates = Math.min(world.warehouse.uncategorized, CRATE_SPOTS.length);
  if (crates === 0) {
    const p = standing(SIGN, tileAnchor(o, 11.6, 5.6));
    items.push({ key: 17.4, node: click('warehouse', 'Armazém organizado', <PixelSprite sprite={SIGN} x={p.x} y={p.y} scale={CHAR_SCALE} />) });
  }
  CRATE_SPOTS.slice(0, crates).forEach(([gx, gy], i) => {
    items.push({
      key: gx + gy + 0.9,
      node: click('warehouse', 'Caixa sem categoria', <IsoBox key={i} origin={o} gx={gx} gy={gy} w={0.55} d={0.55} h={7} colors={WOOD} />),
    });
  });

  // --- Obras (metas) ---
  world.constructions.slice(0, BUILD_SLOTS.length).forEach((g, i) => {
    const [gx, gy] = BUILD_SLOTS[i];
    const fullH = 30;
    const built = Math.max(1, Math.round((fullH * g.progress) / 100));
    const top = project(o, gx + 0.75, gy + 0.75, fullH);
    items.push({
      key: gx + gy + 3,
      node: click(`build:${g.id}`, `Meta ${g.name}`, (
        <g>
          <IsoBox origin={o} gx={gx} gy={gy} w={1.5} d={1.5} h={built} colors={boxColorsFrom(g.color || PALETTE.B)} />
          {built < fullH && <IsoGhostBox origin={o} gx={gx} gy={gy} w={1.5} d={1.5} h={fullH - built} z={built} color={PALETTE.u} />}
          {g.progress >= 100 && <PixelSprite sprite={FLAG} x={top[0]} y={top[1] - 10} colors={{ A: PALETTE.G }} />}
        </g>
      )),
    });
  });

  // --- Goblins (assinaturas) ---
  world.goblins.slice(0, GOBLIN_SPOTS.length).forEach((_, i) => {
    const [gx, gy] = GOBLIN_SPOTS[i];
    const p = standing(GOBLIN_A, tileAnchor(o, gx - 0.5, gy - 0.5));
    items.push({
      key: gx + gy,
      node: click('goblins', 'Goblins das assinaturas', (
        <g>
          <g className="pixel-frame-a" style={{ animationDelay: `${i * 0.2}s` }}><PixelSprite sprite={GOBLIN_A} x={p.x} y={p.y} scale={CHAR_SCALE} flip={i % 2 === 1} /></g>
          <g className="pixel-frame-b" style={{ animationDelay: `${i * 0.2}s` }}><PixelSprite sprite={GOBLIN_B} x={p.x} y={p.y} scale={CHAR_SCALE} flip={i % 2 === 1} /></g>
        </g>
      )),
    });
  });

  // --- Caravana (extrato recente) ---
  if (world.caravan.arrived) {
    const p = standing(WAGON, tileAnchor(o, 5.6, 12.6));
    items.push({ key: 18.5, node: click('caravan', 'Caravana', <g className="pixel-bob"><PixelSprite sprite={WAGON} x={p.x} y={p.y} scale={CHAR_SCALE} /></g>) });
  }

  // --- Árvores ---
  TREE_SPOTS.forEach(([gx, gy, size], i) => {
    items.push({ key: gx + gy + 1.4 * size, node: <IsoTree key={i} gx={gx} gy={gy} size={size} /> });
  });

  // --- Pigo ---
  const pigoAnchor = tileAnchor(o, PIGO_TILE[0], PIGO_TILE[1]);
  const pg = standing(PIGO, pigoAnchor);
  items.push({
    key: PIGO_TILE[0] + PIGO_TILE[1] + 1,
    node: click('pigo', 'Pigo', (
      <g className="pixel-bob">
        <PixelSprite sprite={PIGO} x={pg.x} y={pg.y} scale={CHAR_SCALE} />
        <g className="pixel-blink"><PixelSprite sprite={PIGO_BLINK} x={pg.x} y={pg.y} scale={CHAR_SCALE} /></g>
      </g>
    )),
  });

  items.sort((a, b) => a.key - b.key);
  return { ground, objects: items.map((it, i) => <React.Fragment key={i}>{it.node}</React.Fragment>) };
}

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

  const scene = useMemo(
    () => (world ? buildScene(world, night, selected, setSelected) : null),
    [world, night, selected]
  );

  if (!world || !scene) {
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
  const dragonScale = world.dragon.utilization > 50 ? 2 : 1;
  const dragonX = dragonScale === 2 ? 340 : 370;
  const dragonY = dragonScale === 2 ? 14 : 24;

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
          <div ref={containerRef} className="relative rounded-2xl overflow-hidden border-4 border-slate-800" style={{ background: sky[1] }} onClick={() => setSelected(null)}>
            <svg
              viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
              width={SCENE_W * scale}
              height={SCENE_H * scale}
              shapeRendering="crispEdges"
              className="pixel-scene block"
            >
              {/* Céu */}
              {Array.from({ length: 8 }).map((_, i) => (
                <rect key={i} x={0} y={i * 42} width={SCENE_W} height={42} fill={i < 3 ? sky[0] : sky[1]} opacity={1 - i * 0.03} />
              ))}
              {night && Array.from({ length: 36 }).map((_, i) => (
                <rect key={i} x={(i * 53) % SCENE_W} y={(i * 29) % 110} width={1} height={1} fill="#f4f4f4" className={i % 3 === 0 ? 'pixel-twinkle' : undefined} />
              ))}
              <Clickable id="weather" selected={selected} onSelect={setSelected} label="Clima">
                {night ? <PixelSprite sprite={MOON} x={22} y={14} /> : world.weather !== 'rain' && <PixelSprite sprite={SUN} x={20} y={12} />}
              </Clickable>
              {Array.from({ length: cloudCount }).map((_, i) => (
                <g key={i} className="pixel-drift" style={{ animationDelay: `${-i * 17}s`, animationDuration: `${70 + i * 12}s` }}>
                  <PixelSprite sprite={CLOUD} x={0} y={12 + (i * 17) % 60} colors={cloudColors} />
                </g>
              ))}

              {/* Ilha + objetos ordenados por profundidade */}
              {scene.ground}
              {scene.objects}

              {/* Dragão (dívida) sobrevoando */}
              {world.dragon.present && (
                <Clickable id="dragon" selected={selected} onSelect={setSelected} label="Dragão da dívida">
                  <g className="pixel-hover">
                    <PixelSprite sprite={DRAGON} x={dragonX} y={dragonY} scale={dragonScale} />
                    {world.dragon.utilization > 70 && <PixelSprite sprite={FLAME} x={dragonX - 4 * dragonScale} y={dragonY + 7 * dragonScale} scale={dragonScale} />}
                    <rect x={dragonX} y={dragonY - 7} width={30} height={3} fill={PALETTE.k} />
                    <rect x={dragonX + 1} y={dragonY - 6} width={Math.max(1, Math.round(28 * Math.min(1, world.dragon.utilization / 100)))} height={1} fill={PALETTE.r} />
                    {Array.from({ length: Math.min(world.dragon.chains, 4) }).map((_, i) => (
                      <rect key={i} x={dragonX + 10 * dragonScale + i * 3} y={dragonY + 13 * dragonScale} width={1} height={6 + i} fill={PALETTE.l} />
                    ))}
                  </g>
                </Clickable>
              )}

              {/* Chuva e noite */}
              {world.weather === 'rain' && Array.from({ length: 60 }).map((_, i) => (
                <rect
                  key={i}
                  x={(i * 41) % SCENE_W}
                  y={0}
                  width={1}
                  height={3}
                  fill="#c8dcff"
                  opacity={0.7}
                  className="pixel-rain"
                  style={{ animationDelay: `${-(i % 9) * 0.1}s`, animationDuration: '1.2s' }}
                />
              ))}
              {night && <rect x={0} y={0} width={SCENE_W} height={SCENE_H} fill="#0b1030" opacity={0.25} pointerEvents="none" />}
            </svg>

            {/* Fala do Pigo no canto livre (céu abaixo da ilha) */}
            <button
              onClick={(e) => { e.stopPropagation(); setSelected('pigo'); }}
              className="absolute left-3 bottom-3 flex items-start gap-2 font-pixel text-[12px] leading-tight text-slate-900 bg-[#f4f4f4] border-2 border-[#1a1c2c] px-2 py-1.5 max-w-[260px] text-left shadow-[3px_3px_0_#1a1c2c]"
            >
              <PixelIcon sprite={PIGO} size={22} className="shrink-0 mt-0.5" />
              <span>{pigoTip(world)}</span>
            </button>
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
            ['walls', 'Muralhas', `${world.walls.coverageMonths}/${world.walls.targetMonths} meses de reserva`, CRATE, { m: PALETTE.n, u: PALETTE.l, M: PALETTE.N }],
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
