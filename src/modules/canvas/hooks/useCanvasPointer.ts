import { useState, useRef, useCallback } from 'react';
import { canvasStore, useCanvasStore } from '../store/canvasStore';
import { screenToWorld } from '../scene/camera';
import { Point, Rect, HandleType } from '../scene/types';
import { CanvasNode } from '../io/jsonCanvas.types';
import { DragState } from './pointerDragTypes';
import {
  createMoveNodesCommand,
  createResizeNodeCommand,
  createRotateNodeCommand,
  createAddNodeCommand,
  createAddEdgeCommand,
} from '../scene/commands';
import { resizeWithRotation, calculateRotationAngle } from '../scene/transforms';
import { calculateSnapping } from '../scene/snapping';
import { boxesIntersect, getNodeAABB } from '../scene/geometry';
import { createNewPlacedNode, createNewEdge, createPenNode } from './pointerNodeCreation';

export function useCanvasPointer(svgRef: React.RefObject<SVGSVGElement | null>) {
  const store = useCanvasStore();
  const [selectionBox, setSelectionBox] = useState<Rect | null>(null);
  const dragRef = useRef<DragState>({
    mode: 'none',
    startScreen: { x: 0, y: 0 },
    startWorld: { x: 0, y: 0 },
    lastWorld: { x: 0, y: 0 },
  });

  const getPointerWorld = useCallback((e: React.PointerEvent): Point => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return screenToWorld({ x: e.clientX - rect.left, y: e.clientY - rect.top }, store.camera);
  }, [svgRef, store.camera]);

  const onCanvasPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const ptWorld = getPointerWorld(e);
    if (e.button === 1 || store.activeTool === 'hand' || e.spaceKey) {
      dragRef.current = { mode: 'pan', startScreen: { x: e.clientX, y: e.clientY }, startWorld: ptWorld, lastWorld: ptWorld };
      return;
    }
    if (['sticky', 'shape', 'text', 'frame', 'pen'].includes(store.activeTool)) {
      if (store.activeTool === 'pen') {
        dragRef.current = { mode: 'pen', startScreen: { x: e.clientX, y: e.clientY }, startWorld: ptWorld, lastWorld: ptWorld, penPoints: [ptWorld] };
        return;
      }
      const node = createNewPlacedNode(store.activeTool, store.toolShape, store.toolColor, ptWorld);
      canvasStore.dispatch(createAddNodeCommand(node));
      canvasStore.setActiveTool('select');
      return;
    }
    if (!e.shiftKey) canvasStore.setSelection([]);
    dragRef.current = { mode: 'select_box', startScreen: { x: e.clientX, y: e.clientY }, startWorld: ptWorld, lastWorld: ptWorld };
    setSelectionBox({ x: ptWorld.x, y: ptWorld.y, width: 0, height: 0 });
  };

  const onNodePointerDown = (e: React.PointerEvent, node: CanvasNode) => {
    e.stopPropagation();
    const ptWorld = getPointerWorld(e);
    if (store.activeTool === 'connector') {
      dragRef.current = { mode: 'connector', startScreen: { x: e.clientX, y: e.clientY }, startWorld: ptWorld, lastWorld: ptWorld, connectorSourceNode: node };
      return;
    }
    if (e.shiftKey) {
      canvasStore.toggleSelection(node.id);
      return;
    }
    let currentSel = store.selection;
    if (!currentSel.includes(node.id)) {
      currentSel = [node.id];
      canvasStore.setSelection(currentSel);
    }
    const posMap = new Map<string, Point>();
    store.nodes.filter((n) => currentSel.includes(n.id)).forEach((n) => posMap.set(n.id, { x: n.x, y: n.y }));
    dragRef.current = { mode: 'move', startScreen: { x: e.clientX, y: e.clientY }, startWorld: ptWorld, lastWorld: ptWorld, nodeInitialPos: posMap };
  };

  const onHandlePointerDown = (e: React.PointerEvent, handle: HandleType, node: CanvasNode) => {
    e.stopPropagation();
    const ptWorld = getPointerWorld(e);
    dragRef.current = {
      mode: 'resize',
      startScreen: { x: e.clientX, y: e.clientY },
      startWorld: ptWorld,
      lastWorld: ptWorld,
      resizeNode: node,
      resizeInitialRect: { x: node.x, y: node.y, width: node.width, height: node.height },
      resizeHandle: handle,
    };
  };

  const onRotateHandlePointerDown = (e: React.PointerEvent, node: CanvasNode) => {
    e.stopPropagation();
    const ptWorld = getPointerWorld(e);
    dragRef.current = {
      mode: 'rotate',
      startScreen: { x: e.clientX, y: e.clientY },
      startWorld: ptWorld,
      lastWorld: ptWorld,
      rotateNode: node,
      rotateInitialAngle: node.orbitron?.rotation || 0,
      rotateCenter: { x: node.x + node.width / 2, y: node.y + node.height / 2 },
    };
  };

  const onEdgePointerDown = (e: React.PointerEvent, edge: any) => {
    e.stopPropagation();
    if (e.shiftKey) canvasStore.toggleSelection(edge.id);
    else canvasStore.setSelection([edge.id]);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (drag.mode === 'none') return;
    const ptWorld = getPointerWorld(e);

    if (drag.mode === 'pan') {
      canvasStore.pan(e.clientX - drag.startScreen.x, e.clientY - drag.startScreen.y);
      drag.startScreen = { x: e.clientX, y: e.clientY };
      return;
    }
    if (drag.mode === 'move') {
      let dx = ptWorld.x - drag.startWorld.x;
      let dy = ptWorld.y - drag.startWorld.y;
      const selSet = new Set(store.selection);
      const first = store.nodes.find((n) => selSet.has(n.id));
      if (first) {
        const snap = calculateSnapping({ x: first.x + dx, y: first.y + dy, width: first.width, height: first.height }, store.nodes.filter((n) => !selSet.has(n.id)), store.camera.zoom);
        dx = snap.x - first.x;
        dy = snap.y - first.y;
        canvasStore.setSnapGuides(snap.guides);
      }
      drag.lastWorld = { x: dx, y: dy };
      return;
    }
    if (drag.mode === 'select_box') {
      setSelectionBox({
        x: Math.min(drag.startWorld.x, ptWorld.x),
        y: Math.min(drag.startWorld.y, ptWorld.y),
        width: Math.abs(ptWorld.x - drag.startWorld.x),
        height: Math.abs(ptWorld.y - drag.startWorld.y),
      });
      return;
    }
    if (drag.mode === 'pen') drag.penPoints?.push(ptWorld);
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (drag.mode === 'none') return;
    const ptWorld = getPointerWorld(e);

    if (drag.mode === 'move' && drag.nodeInitialPos) {
      const dx = Math.round(drag.lastWorld.x);
      const dy = Math.round(drag.lastWorld.y);
      if (dx !== 0 || dy !== 0) canvasStore.dispatch(createMoveNodesCommand(store.selection, { dx, dy }));
      canvasStore.setSnapGuides([]);
    } else if (drag.mode === 'resize' && drag.resizeNode && drag.resizeInitialRect && drag.resizeHandle) {
      const rot = drag.resizeNode.orbitron?.rotation || 0;
      const res = resizeWithRotation(drag.resizeInitialRect, rot, drag.resizeHandle, ptWorld, e.shiftKey);
      canvasStore.dispatch(createResizeNodeCommand(drag.resizeNode.id, drag.resizeInitialRect, res));
    } else if (drag.mode === 'rotate' && drag.rotateNode && drag.rotateCenter) {
      const newAngle = calculateRotationAngle(drag.rotateCenter, ptWorld, e.shiftKey);
      canvasStore.dispatch(createRotateNodeCommand(drag.rotateNode.id, drag.rotateInitialAngle || 0, newAngle));
    } else if (drag.mode === 'select_box' && selectionBox) {
      const ids = store.nodes.filter((n) => boxesIntersect(selectionBox, getNodeAABB(n))).map((n) => n.id);
      canvasStore.setSelection(ids);
      setSelectionBox(null);
    } else if (drag.mode === 'connector' && drag.connectorSourceNode) {
      const target = store.nodes.find((n) => n.id !== drag.connectorSourceNode?.id && boxesIntersect(getNodeAABB(n), { x: ptWorld.x, y: ptWorld.y, width: 1, height: 1 }));
      if (target) canvasStore.dispatch(createAddEdgeCommand(createNewEdge(drag.connectorSourceNode.id, target.id, store.toolColor)));
      canvasStore.setActiveTool('select');
    } else if (drag.mode === 'pen' && drag.penPoints && drag.penPoints.length > 1) {
      canvasStore.dispatch(createAddNodeCommand(createPenNode(drag.penPoints, store.toolColor)));
      canvasStore.setActiveTool('select');
    }

    dragRef.current = { mode: 'none', startScreen: { x: 0, y: 0 }, startWorld: { x: 0, y: 0 }, lastWorld: { x: 0, y: 0 } };
  };

  return {
    selectionBox,
    onCanvasPointerDown,
    onNodePointerDown,
    onHandlePointerDown,
    onRotateHandlePointerDown,
    onEdgePointerDown,
    onPointerMove,
    onPointerUp,
  };
}
