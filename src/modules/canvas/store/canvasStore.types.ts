import { CanvasNode, CanvasEdge, CanvasDoc } from '../io/jsonCanvas.types';
import { Camera, Point, SnapGuide } from '../scene/types';

export type CanvasTool = 'select' | 'hand' | 'sticky' | 'shape' | 'text' | 'frame' | 'connector' | 'pen';
export type CanvasShapeType = 'rectangle' | 'ellipse' | 'diamond' | 'triangle';

export interface CanvasStoreSnapshot {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  camera: Camera;
  selection: string[];
  activeTool: CanvasTool;
  toolShape: CanvasShapeType;
  toolColor: string;
  snapGuides: SnapGuide[];
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  filePath: string | null;
  docHash: string;
}
