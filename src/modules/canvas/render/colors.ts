export interface CanvasColorDef {
  id: string;
  name: string;
  bg: string;
  border: string;
  text: string;
  accent: string;
}

export const CANVAS_COLORS: Record<string, CanvasColorDef> = {
  '1': { id: '1', name: 'Vermelho', bg: '#ef444420', border: '#ef4444', text: '#fca5a5', accent: '#ef4444' },
  '2': { id: '2', name: 'Laranja', bg: '#f9731620', border: '#f97316', text: '#fdba74', accent: '#f97316' },
  '3': { id: '3', name: 'Amarelo', bg: '#eab30820', border: '#eab308', text: '#fde047', accent: '#eab308' },
  '4': { id: '4', name: 'Verde', bg: '#22c55e20', border: '#22c55e', text: '#86efac', accent: '#22c55e' },
  '5': { id: '5', name: 'Ciano', bg: '#06b6d420', border: '#06b6d4', text: '#67e8f9', accent: '#06b6d4' },
  '6': { id: '6', name: 'Roxo', bg: '#a855f720', border: '#a855f7', text: '#d8b4fe', accent: '#a855f7' },
  default: { id: 'default', name: 'Neutro', bg: '#1e293b80', border: '#475569', text: '#f1f5f9', accent: '#94a3b8' },
};

export function getCanvasColor(colorId?: string): CanvasColorDef {
  if (!colorId) return CANVAS_COLORS.default;
  if (CANVAS_COLORS[colorId]) return CANVAS_COLORS[colorId];
  if (colorId.startsWith('#')) {
    return {
      id: colorId,
      name: 'Custom',
      bg: `${colorId}25`,
      border: colorId,
      text: '#f1f5f9',
      accent: colorId,
    };
  }
  return CANVAS_COLORS.default;
}
