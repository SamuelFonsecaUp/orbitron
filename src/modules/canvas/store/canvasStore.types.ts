import { CanvasNode, CanvasEdge, CanvasDoc } from '../io/jsonCanvas.types';
import { Camera, Point, SnapGuide } from '../scene/types';

export type CanvasTool = 'select' | 'hand' | 'sticky' | 'shape' | 'text' | 'frame' | 'connector' | 'pen' | 'image' | 'link';
export type CanvasShapeType = 'rectangle' | 'ellipse' | 'diamond' | 'triangle';
export type CanvasTheme = 'dark' | 'light' | 'blueprint' | 'cyberpunk' | 'golden' | 'cosmic';
export type CanvasGridPattern = 'dots' | 'lines' | 'cross' | 'none';

export interface CanvasStoreSnapshot {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  camera: Camera;
  selection: string[];
  activeTool: CanvasTool;
  toolShape: CanvasShapeType;
  toolColor: string;
  theme: CanvasTheme;
  gridPattern: CanvasGridPattern;
  snapGuides: SnapGuide[];
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  filePath: string | null;
  docHash: string;
}
