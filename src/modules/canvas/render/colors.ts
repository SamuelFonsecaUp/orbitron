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

export function getCanvasColor(colorId?: string): CanvasColorDef {
  if (!colorId) return CANVAS_COLORS.default;
  if (CANVAS_COLORS[colorId]) return CANVAS_COLORS[colorId];
  if (colorId.startsWith('#')) {
    return {
      id: colorId,
      name: 'Custom',
      bg: colorId,
      border: colorId,
      text: '#ffffff',
      accent: colorId,
      shadow: `${colorId}33`,
    };
  }
  return CANVAS_COLORS.default;
}
