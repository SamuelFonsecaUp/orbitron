import { Sprite } from './pixel';

// Convenções: '.' = transparente; letras = cores da PALETTE; 'A' = cor customizável (override)

// --- Pigo, o mascote (cofrinho) ---
export const PIGO: Sprite = [
  '...kk......kk...',
  '..kPpk....kpPk..',
  '..kppkkkkkkppk..',
  '.kppppkyykppppk.',
  'kppppppppppppppk',
  'kppwkppppppwkppk',
  'kppkkppppppkkppk',
  'kpppkkkkkkkkpppk',
  'kppPkPkPPkPkPppk',
  'kpppkkkkkkkkpppk',
  '.kppppppppppppk.',
  '..kkppppppppkk..',
  '...kPk....kPk...',
  '...kk......kk...',
];

export const PIGO_BLINK: Sprite = PIGO.map((row, i) =>
  i === 5 ? 'kppkkppppppkkppk' : i === 6 ? 'kppppppppppppppk' : row
);

// Skins do Pigo (troca de paleta) — base para a futura loja de cosméticos
export const PIGO_SKINS: Record<string, { name: string; colors: Record<string, string> }> = {
  classico: { name: 'Clássico', colors: {} },
  ouro: { name: 'Pigo de Ouro', colors: { p: '#ffcd75', P: '#e0a33a', y: '#fff4c2' } },
  menta: { name: 'Menta', colors: { p: '#a7f070', P: '#38b764' } },
  noite: { name: 'Noturno', colors: { p: '#73eff7', P: '#3b5dc9', y: '#f4f4f4' } },
};

// --- Construções ---
export const HOUSE: Sprite = [
  '.......kk.......',
  '......kAAk......',
  '.....kAAAAk.....',
  '....kAAAAAAk....',
  '...kAAAAAAAAk...',
  '..kAAAAAAAAAAk..',
  '.kkkkkkkkkkkkkk.',
  '..kuuuuuuuuuuk..',
  '..kukkuuuukkuk..',
  '..kukCuuuukCuk..',
  '..kukkuuuukkuk..',
  '..kuuuukkuuuuk..',
  '..kuuuukmkuuuk..',
  '..kuuuukmkuuuk..',
  '..kkkkkkkkkkkk..',
];

export const WAREHOUSE: Sprite = [
  '......kkkkkkkkkkkk......',
  '....kkMMMMMMMMMMMMkk....',
  '..kkMMMMMMMMMMMMMMMMkk..',
  'kkMMMMMMMMMMMMMMMMMMMMkk',
  'kkkkkkkkkkkkkkkkkkkkkkkk',
  '.kmmmmmmmmmmmmmmmmmmmmk.',
  '.kmuuuuuuuuuuuuuuuuuumk.',
  '.kmukkkkkkkkkkkkkkkkumk.',
  '.kmukMMMMMMMMMMMMMMkumk.',
  '.kmukMkMMkMMkMMkMMMkumk.',
  '.kmukMMMMMMMMMMMMMMkumk.',
  '.kmukMkMMkMMkMMkMMMkumk.',
  '.kmukMMMMMMMMMMMMMMkumk.',
  '.kmukkkkkkkkkkkkkkkkumk.',
  '.kkkkkkkkkkkkkkkkkkkkkk.',
];

export const CRATE: Sprite = [
  'kkkkkkkk',
  'kummmmuk',
  'kmukkumk',
  'kmkuukmk',
  'kmkuukmk',
  'kmukkumk',
  'kummmmuk',
  'kkkkkkkk',
];

export const COIN: Sprite = [
  '.kkk.',
  'kyyyk',
  'kyYyk',
  'kyyyk',
  '.kkk.',
];

export const GOLD_PILE: Sprite = [
  '.....kkk.....',
  '...kkyyykk...',
  '..kyyYyyyyk..',
  '.kyyyyyYyyyk.',
  'kyYyyyyyyyYyk',
  'kkkkkkkkkkkkk',
];

// --- Criaturas ---
export const GOBLIN_A: Sprite = [
  '.kk..kk.',
  'kGGkkGGk',
  'kGkGGkGk',
  '.kGGGGk.',
  '..kyyk..',
  '.kGkkGk.',
  '.kk..kk.',
];

export const GOBLIN_B: Sprite = [
  '.kk..kk.',
  'kGGkkGGk',
  'kGkGGkGk',
  '.kGGGGk.',
  '..kyyk..',
  '..kGGk..',
  '..kkkk..',
];

export const DRAGON: Sprite = [
  '............kk..........',
  '...........kRRk.........',
  '..........kRRRRk........',
  '...kkk...kRRRRRRk.......',
  '..krrrk.kRRRRRRRRk......',
  '.krwkrrkkkkkkkkkkk......',
  'krrrrrrrrrrrrrrrrrk.....',
  'kyykrrrrrrrrrrrrrrrk....',
  '.kkkrrrrrrrrrrrrrrrrk...',
  '....krrrrrrrrrrrrrrrrk..',
  '....krrkkrrrrrkkrrrrrrk.',
  '....krk..krrrk..krk.krrk',
  '....kk...kkkk....kk..kkk',
];

export const FLAME: Sprite = [
  '..y.',
  '.yoy',
  'yoro',
  '.yo.',
];

// --- Cenário ---
export const TREE: Sprite = [
  '...kkkk...',
  '..kGGGGk..',
  '.kGgGGGGk.',
  'kGGGGGgGGk',
  'kGgGGGGGGk',
  'kGGGGgGGGk',
  '.kGGGGGGk.',
  '..kkGGkk..',
  '....km....',
  '....km....',
  '...kmmk...',
];

export const CLOUD: Sprite = [
  '....kkkk........',
  '..kkwwwwkk.kkk..',
  '.kwwwwwwwwkwwwk.',
  'kwwwwwwwwwwwwwwk',
  'kwwwwwwwwwwwwwwk',
  '.kkkkkkkkkkkkkk.',
];

export const SUN: Sprite = [
  '...y..y...',
  '.y..yy..y.',
  '...yyyy...',
  'y.yyyyyy.y',
  '.yyyyyyyy.',
  '.yyyyyyyy.',
  'y.yyyyyy.y',
  '...yyyy...',
  '.y..yy..y.',
  '...y..y...',
];

export const MOON: Sprite = [
  '..kkkk..',
  '.kwwwlk.',
  'kwwwlk..',
  'kwwwk...',
  'kwwwk...',
  'kwwwlk..',
  '.kwwwlk.',
  '..kkkk..',
];

export const FLAG: Sprite = [
  'kkkkk.',
  'kAAAAk',
  'kAAAk.',
  'kAAAAk',
  'kkkkk.',
  'k.....',
  'k.....',
  'k.....',
  'k.....',
  'k.....',
];

export const WAGON: Sprite = [
  '....kkkkkkkkkk......',
  '...kwwwwwwwwwwk.....',
  '..kwwwwwwwwwwwwk....',
  '..kwwwwwwwwwwwwk....',
  '..kkkkkkkkkkkkkkk...',
  '..kmmmmmmmmmmmmmk.kk',
  '..kmmmmmmmmmmmmmkkuk',
  '..kkkkkkkkkkkkkkk...',
  '...knk......knk.....',
  '..knlnk....knlnk....',
  '...knk......knk.....',
];

export const SIGN: Sprite = [
  'kkkkkkkkkk',
  'kuuuuuuuuk',
  'kukkukkkuk',
  'kuuuuuuuuk',
  'kkkkkkkkkk',
  '....km....',
  '....km....',
];
