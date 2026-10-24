import { CanvasDoc, CanvasNode, CanvasEdge } from '../io/jsonCanvas.types';
import { Camera, Rect, Point, HandleType, SnapGuide } from '../scene/types';

export interface SceneRendererProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  camera: Camera;
  selection: string[];
  snapGuides: SnapGuide[];
  viewportWidth: number;
  viewportHeight: number;
  hoveredNodeId?: string | null;
  hoveredHandle?: HandleType | null;
  activeSelectionBox?: Rect | null;
  ephemeralTransform?: {
    type: 'move' | 'resize' | 'rotate' | 'edge';
    targetIds: string[];
    dx?: number;
    dy?: number;
    rect?: Rect;
    rotation?: number;
  } | null;
  onNodePointerDown?: (e: React.PointerEvent, node: CanvasNode) => void;
  onHandlePointerDown?: (e: React.PointerEvent, handle: HandleType, node: CanvasNode) => void;
  onRotateHandlePointerDown?: (e: React.PointerEvent, node: CanvasNode) => void;
  onEdgePointerDown?: (e: React.PointerEvent, edge: CanvasEdge) => void;
  onCanvasPointerDown?: (e: React.PointerEvent) => void;
  onNodeDoubleClick?: (e: React.MouseEvent, node: CanvasNode) => void;
}
