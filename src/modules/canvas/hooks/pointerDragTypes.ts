import { Point, Rect, HandleType } from '../scene/types';
import { CanvasNode } from '../io/jsonCanvas.types';

export type DragMode =
  | 'none'
  | 'pan'
  | 'move'
  | 'resize'
  | 'rotate'
  | 'select_box'
  | 'connector'
  | 'pen';

export interface DragState {
  mode: DragMode;
  startScreen: Point;
  startWorld: Point;
  lastWorld: Point;
  nodeInitialPos?: Map<string, Point>;
  resizeNode?: CanvasNode;
  resizeInitialRect?: Rect;
  resizeHandle?: HandleType;
  rotateNode?: CanvasNode;
  rotateInitialAngle?: number;
  rotateCenter?: Point;
  connectorSourceNode?: CanvasNode;
  penPoints?: Point[];
}
