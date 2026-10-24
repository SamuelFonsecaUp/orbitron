import { useSyncExternalStore } from 'react';
import { CanvasNode, CanvasEdge, CanvasDoc } from '../io/jsonCanvas.types';
import { Camera, Point, SnapGuide } from '../scene/types';
import { Command, CanvasState } from '../scene/commands';
import { zoomAtPoint } from '../scene/camera';
import { HistoryManager } from './history';
import { CanvasStoreSnapshot, CanvasTool, CanvasShapeType } from './canvasStore.types';

export class CanvasStore {
  private nodes: CanvasNode[] = [];
  private edges: CanvasEdge[] = [];
  private camera: Camera = { x: 0, y: 0, zoom: 1 };
  private selection: string[] = [];
  private activeTool: CanvasTool = 'select';
  private toolShape: CanvasShapeType = 'rectangle';
  private toolColor: string = '1';
  private snapGuides: SnapGuide[] = [];
  private history = new HistoryManager(100);
  private isDirty = false;
  private filePath: string | null = null;
  private docHash: string = '';
  private listeners = new Set<() => void>();
  private saveTimer: any = null;
  private snapshotCache: CanvasStoreSnapshot | null = null;

  private emit() {
    this.snapshotCache = null;
    this.listeners.forEach((l) => l());
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public getSnapshot = (): CanvasStoreSnapshot => {
    if (!this.snapshotCache) {
      this.snapshotCache = {
        nodes: this.nodes,
        edges: this.edges,
        camera: this.camera,
        selection: this.selection,
        activeTool: this.activeTool,
        toolShape: this.toolShape,
        toolColor: this.toolColor,
        snapGuides: this.snapGuides,
        canUndo: this.history.canUndo(),
        canRedo: this.history.canRedo(),
        isDirty: this.isDirty,
        filePath: this.filePath,
        docHash: this.docHash,
      };
    }
    return this.snapshotCache;
  };

  public loadDocument(filePath: string, doc: CanvasDoc, hash: string) {
    this.filePath = filePath;
    this.nodes = doc.nodes || [];
    this.edges = doc.edges || [];
    this.docHash = hash;
    this.isDirty = false;
    this.selection = [];
    this.snapGuides = [];
    this.history.clear();
    this.emit();
  }

  public dispatch(command: Command) {
    const currentState: CanvasState = {
      nodes: this.nodes,
      edges: this.edges,
      selection: this.selection,
    };
    const nextState = command.execute(currentState);
    this.history.push(command);
    this.nodes = nextState.nodes;
    this.edges = nextState.edges;
    this.selection = nextState.selection;
    this.isDirty = true;
    this.scheduleAutosave();
    this.emit();
  }

  public undo() {
    const currentState: CanvasState = {
      nodes: this.nodes,
      edges: this.edges,
      selection: this.selection,
    };
    const nextState = this.history.undo(currentState);
    if (!nextState) return;
    this.nodes = nextState.nodes;
    this.edges = nextState.edges;
    this.selection = nextState.selection;
    this.isDirty = true;
    this.scheduleAutosave();
    this.emit();
  }

  public redo() {
    const currentState: CanvasState = {
      nodes: this.nodes,
      edges: this.edges,
      selection: this.selection,
    };
    const nextState = this.history.redo(currentState);
    if (!nextState) return;
    this.nodes = nextState.nodes;
    this.edges = nextState.edges;
    this.selection = nextState.selection;
    this.isDirty = true;
    this.scheduleAutosave();
    this.emit();
  }

  public setCamera(patch: Partial<Camera>) {
    this.camera = { ...this.camera, ...patch };
    this.emit();
  }

  public pan(dx: number, dy: number) {
    this.camera = { ...this.camera, x: this.camera.x + dx, y: this.camera.y + dy };
    this.emit();
  }

  public zoomAt(screenPoint: Point, viewportSize: { width: number; height: number }, delta: number) {
    this.camera = zoomAtPoint(this.camera, screenPoint, viewportSize, delta);
    this.emit();
  }

  public setSelection(ids: string[]) {
    this.selection = ids;
    this.emit();
  }

  public toggleSelection(id: string) {
    const set = new Set(this.selection);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.selection = Array.from(set);
    this.emit();
  }

  public setActiveTool(tool: CanvasTool) {
    this.activeTool = tool;
    this.emit();
  }

  public setToolShape(shape: CanvasShapeType) {
    this.toolShape = shape;
    this.emit();
  }

  public setToolColor(color: string) {
    this.toolColor = color;
    this.emit();
  }

  public setSnapGuides(guides: SnapGuide[]) {
    this.snapGuides = guides;
    this.emit();
  }

  public scheduleAutosave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.flushSave();
    }, 400);
  }

  public async flushSave() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    if (!this.filePath || !this.isDirty) return;

    const doc: CanvasDoc = { nodes: this.nodes, edges: this.edges };
    try {
      const api = (window as any).electronAPI?.canvas || (window as any).orbitronCanvasApi;
      if (api?.write) {
        const res = await api.write(this.filePath, doc);
        if (res?.hash) {
          this.docHash = res.hash;
          this.isDirty = false;
          this.emit();
        }
      }
    } catch (e) {
      console.error('[CanvasStore] Autosave failed:', e);
    }
  }
}

export const canvasStore = new CanvasStore();

export function useCanvasStore(): CanvasStoreSnapshot;
export function useCanvasStore<T>(selector: (state: CanvasStoreSnapshot) => T): T;
export function useCanvasStore<T>(selector?: (state: CanvasStoreSnapshot) => T): T | CanvasStoreSnapshot {
  return useSyncExternalStore(
    canvasStore.subscribe,
    () => {
      const snap = canvasStore.getSnapshot();
      return selector ? selector(snap) : snap;
    }
  );
}
