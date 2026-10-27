import { CanvasTheme } from './canvasStore.types';

export interface CanvasThemeInfo {
  id: CanvasTheme;
  name: string;
  subtitle: string;
  description: string;
  minLevel: number;
  previewBg: string;
  previewBorder: string;
  accentColor: string;
  badge?: string;
}

export const CANVAS_THEMES: CanvasThemeInfo[] = [
  {
    id: 'dark',
    name: 'Escuro Cosmos',
    subtitle: 'Padrão',
    description: 'Fundo clássico do espaço profundo em ardósia escuro',
    minLevel: 1,
    previewBg: '#090d16',
    previewBorder: '#334155',
    accentColor: '#a855f7',
  },
  {
    id: 'light',
    name: 'Branco Lousa',
    subtitle: 'Padrão',
    description: 'Quadro branco limpo para máxima clareza e contraste diurno',
    minLevel: 1,
    previewBg: '#f8fafc',
    previewBorder: '#cbd5e1',
    accentColor: '#8b5cf6',
  },
  {
    id: 'blueprint',
    name: 'Blueprint Técnico',
    subtitle: 'Nível 15 • Colonizador',
    description: 'Papel milimetrado de engenharia orbital com grade ciano',
    minLevel: 15,
    previewBg: '#071527',
    previewBorder: '#0284c7',
    accentColor: '#38bdf8',
    badge: 'Nível 15',
  },
  {
    id: 'cyberpunk',
    name: 'Neon Cyberpunk',
    subtitle: 'Nível 25 • Senhor das Estrelas',
    description: 'Grade ultravioleta retro-futurista com pulsos em néon magenta',
    minLevel: 25,
    previewBg: '#0e041d',
    previewBorder: '#9333ea',
    accentColor: '#ec4899',
    badge: 'Nível 25',
  },
  {
    id: 'golden',
    name: 'Matriz Dourada',
    subtitle: 'Nível 35 • Soberano Galáctico',
    description: 'Obsidiana nobre com detalhes refinados em ouro champanhe',
    minLevel: 35,
    previewBg: '#130f06',
    previewBorder: '#ca8a04',
    accentColor: '#eab308',
    badge: 'Nível 35',
  },
  {
    id: 'cosmic',
    name: 'Cosmo Estelar Final',
    subtitle: 'Nível 50 • Arquiteto Supremo',
    description: 'Nebulosa estelar suprema com poeira cósmica e estrelas cintilantes',
    minLevel: 50,
    previewBg: '#060410',
    previewBorder: '#e11d48',
    accentColor: '#f43f5e',
    badge: 'Nível 50 ★',
  },
];

export function isThemeUnlocked(themeId: CanvasTheme, currentLevel = 1): boolean {
  const theme = CANVAS_THEMES.find((t) => t.id === themeId);
  if (!theme) return true;
  return currentLevel >= theme.minLevel;
}
