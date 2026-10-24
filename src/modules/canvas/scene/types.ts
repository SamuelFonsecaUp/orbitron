import { JsonCanvasNode, JsonCanvasEdge } from '../io/jsonCanvas.types';

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Camera {
  x: number; // world x at screen center
  y: number; // world y at screen center
  zoom: number; // entre 0.1 e 4.0
}

export type CanvasNode = JsonCanvasNode;
export type CanvasEdge = JsonCanvasEdge;

export interface Scene {
  version: number;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
}

export interface Viewport {
  width: number;
  height: number;
}

export type HandleType =
  | 'nw' | 'n' | 'ne'
  | 'w'  |     'e'
  | 'sw' | 's' | 'se'
  | 'rot'; // rotação

export interface SnapGuide {
  type: 'x' | 'y';
  position: number; // coordenadas de mundo
  start: number;
  end: number;
}
