export type CanvasNodeType = 'text' | 'file' | 'link' | 'group';

export type CanvasSide = 'top' | 'right' | 'bottom' | 'left';

export type OrbitronShape =
  | 'sticky'
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'triangle'
  | 'pen'
  | 'divider_horizontal'
  | 'divider_vertical'
  | 'kanban_task'
  | 'vault_note';

export interface OrbitronNodeMeta {
  shape?: OrbitronShape;
  rotation?: number; // em graus
  fontSize?: number;
  fontColor?: string;
  align?: 'left' | 'center' | 'right';
  filled?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed';
  penPoints?: Array<{ x: number; y: number }>;
  // Integrations with Kanban & Vault Notes
  taskId?: string;
  taskTitle?: string;
  taskStatus?: string;
  taskPriority?: string;
  taskColumnId?: string;
  taskColor?: string;
  notePath?: string;
  noteTitle?: string;
  noteSnippet?: string;
}

export interface OrbitronEdgeMeta {
  routing?: 'orthogonal' | 'straight' | 'curved' | 'bezier' | 'cyclic' | 'cycle';
  arrowStart?: boolean;
  arrowEnd?: boolean;
}

export interface JsonCanvasNode {
  id: string;
  type: CanvasNodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string; // "1" a "6" ou hex "#..."
  text?: string;
  file?: string;
  subpath?: string;
  url?: string;
  label?: string;
  background?: string;
  backgroundStyle?: 'cover' | 'ratio' | 'repeat';
  orbitron?: OrbitronNodeMeta;
}

export interface JsonCanvasEdge {
  id: string;
  fromNode: string;
  fromSide?: CanvasSide;
  fromEnd?: 'none' | 'arrow';
  toNode: string;
  toSide?: CanvasSide;
  toEnd?: 'none' | 'arrow';
  color?: string;
  label?: string;
  orbitron?: OrbitronEdgeMeta;
}

export interface JsonCanvas {
  nodes?: JsonCanvasNode[];
  edges?: JsonCanvasEdge[];
}

export type CanvasNode = JsonCanvasNode;
export type CanvasEdge = JsonCanvasEdge;
export type CanvasDoc = JsonCanvas;

