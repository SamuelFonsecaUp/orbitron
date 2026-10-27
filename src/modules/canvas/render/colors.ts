import { CanvasTheme } from '../store/canvasStore.types';

export interface CanvasColorDef {
  id: string;
  name: string;
  bg: string;
  border: string;
  text: string;
  accent: string;
  shadow: string;
}

export const CANVAS_COLORS: Record<string, CanvasColorDef> = {
  '1': {
    id: '1',
    name: 'Rosa',
    bg: '#fdf2f8',
    border: '#f472b6',
    text: '#831843',
    accent: '#ec4899',
    shadow: 'rgba(236, 72, 153, 0.2)',
  },
  '2': {
    id: '2',
    name: 'Laranja',
    bg: '#fff7ed',
    border: '#fb923c',
    text: '#7c2d12',
    accent: '#f97316',
    shadow: 'rgba(249, 115, 22, 0.2)',
  },
  '3': {
    id: '3',
    name: 'Amarelo',
    bg: '#fefce8',
    border: '#facc15',
    text: '#713f12',
    accent: '#eab308',
    shadow: 'rgba(234, 179, 8, 0.2)',
  },
  '4': {
    id: '4',
    name: 'Verde',
    bg: '#f0fdf4',
    border: '#4ade80',
    text: '#14532d',
    accent: '#22c55e',
    shadow: 'rgba(34, 197, 94, 0.2)',
  },
  '5': {
    id: '5',
    name: 'Azul',
    bg: '#f0f9ff',
    border: '#38bdf8',
    text: '#0c4a6e',
    accent: '#0ea5e9',
    shadow: 'rgba(14, 165, 233, 0.2)',
  },
  '6': {
    id: '6',
    name: 'Roxo',
    bg: '#faf5ff',
    border: '#c084fc',
    text: '#581c87',
    accent: '#a855f7',
    shadow: 'rgba(168, 85, 247, 0.2)',
  },
  default: {
    id: 'default',
    name: 'Ardósia',
    bg: '#1e293b',
    border: '#475569',
    text: '#f8fafc',
    accent: '#94a3b8',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

export const CANVAS_COLORS_LIGHT: Record<string, CanvasColorDef> = {
  ...CANVAS_COLORS,
  default: {
    id: 'default',
    name: 'Ardósia',
    bg: '#ffffff',
    border: '#cbd5e1',
    text: '#0f172a',
    accent: '#64748b',
    shadow: 'rgba(0, 0, 0, 0.08)',
  },
};

export function getCanvasColor(colorId?: string, theme: CanvasTheme = 'dark'): CanvasColorDef {
  if (colorId && CANVAS_COLORS[colorId]) return CANVAS_COLORS[colorId];

  if (colorId && colorId.startsWith('#')) {
    return {
      id: colorId,
      name: 'Custom',
      bg: colorId,
      border: colorId,
      text: theme === 'light' ? '#0f172a' : '#ffffff',
      accent: colorId,
      shadow: `${colorId}33`,
    };
  }

  // Theme-specific default colors
  switch (theme) {
    case 'light':
      return CANVAS_COLORS_LIGHT.default;
    case 'blueprint':
      return {
        id: 'default',
        name: 'Blueprint',
        bg: '#0d2442',
        border: '#0284c7',
        text: '#e0f2fe',
        accent: '#38bdf8',
        shadow: 'rgba(2, 132, 199, 0.25)',
      };
    case 'cyberpunk':
      return {
        id: 'default',
        name: 'Cyberpunk',
        bg: '#1e0938',
        border: '#9333ea',
        text: '#fae8ff',
        accent: '#ec4899',
        shadow: 'rgba(236, 72, 153, 0.25)',
      };
    case 'golden':
      return {
        id: 'default',
        name: 'Matriz Dourada',
        bg: '#251b0a',
        border: '#ca8a04',
        text: '#fef08a',
        accent: '#eab308',
        shadow: 'rgba(234, 179, 8, 0.25)',
      };
    case 'cosmic':
      return {
        id: 'default',
        name: 'Cosmo Estelar',
        bg: '#170932',
        border: '#e11d48',
        text: '#ffe4e6',
        accent: '#f43f5e',
        shadow: 'rgba(244, 63, 94, 0.25)',
      };
    case 'dark':
    default:
      return CANVAS_COLORS.default;
  }
}
