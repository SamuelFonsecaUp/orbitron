import { Point, Rect, HandleType } from '../scene/types';
import { CanvasNode, CanvasEdge } from '../io/jsonCanvas.types';
import { DragState } from './pointerDragTypes';
import { EphemeralTransform } from '../scene/ephemeral.types';
import { canvasStore } from '../store/canvasStore';
import {
  createMoveNodesCommand,
  createResizeNodeCommand,
  createRotateNodeCommand,
  createAddNodeCommand,
  createAddEdgeCommand,
} from '../scene/commands';
import { resizeWithRotation, calculateRotationAngle } from '../scene/transforms';
import { boxesIntersect, getNodeAABB } from '../scene/geometry';
import { findConnectorTarget } from '../scene/connectors';
import { createNewEdge, createPenNode } from './pointerNodeCreation';

export interface PointerHandlerContext {
  store: {
    nodes: CanvasNode[];
    selection: string[];
    toolColor: string;
  };
  drag: DragState;
  ptWorld: Point;
  screenPos: Point;
  shiftKey: boolean;
  selectionBox: Rect | null;
  setEphemeral: (val: EphemeralTransform | ((prev: EphemeralTransform) => EphemeralTransform)) => void;
  setSelectionBox: (val: Rect | null) => void;
}

export function processPointerMove(ctx: PointerHandlerContext): void {
  const { drag, ptWorld, screenPos, shiftKey, store, setEphemeral, setSelectionBox } = ctx;
  if (drag.mode === 'none') return;

  if (drag.mode === 'pan') {
    canvasStore.pan(screenPos.x - drag.startScreen.x, screenPos.y - drag.startScreen.y);
    drag.startScreen = { x: screenPos.x, y: screenPos.y };
    return;
  }
  if (drag.mode === 'move') {
    const dx = ptWorld.x - drag.startWorld.x;
    const dy = ptWorld.y - drag.startWorld.y;
    drag.lastWorld = { x: dx, y: dy };
    setEphemeral({ type: 'move', nodeIds: store.selection, dx, dy });
    return;
  }
  if (drag.mode === 'resize' && drag.resizeNode && drag.resizeInitialRect && drag.resizeHandle) {
    const rot = drag.resizeNode.orbitron?.rotation || 0;
    const res = resizeWithRotation(drag.resizeInitialRect, rot, drag.resizeHandle, ptWorld, shiftKey);
    drag.lastWorld = { x: res.x, y: res.y };
    setEphemeral({ type: 'resize', nodeId: drag.resizeNode.id, rect: res });
    return;
  }
  if (drag.mode === 'rotate' && drag.rotateNode && drag.rotateCenter) {
    const newAngle = calculateRotationAngle(drag.rotateCenter, ptWorld, shiftKey);
    setEphemeral({ type: 'rotate', nodeId: drag.rotateNode.id, angle: newAngle });
    return;
  }
  if (drag.mode === 'connector' && drag.connectorSourceNode) {
    const candidate = findConnectorTarget(store.nodes, drag.connectorSourceNode.id, ptWorld, 30);
    if (candidate) {
      setEphemeral({
        type: 'connector',
        fromNodeId: drag.connectorSourceNode.id,
        fromSide: drag.connectorSourceSide,
        fromPt: drag.connectorFromPt || drag.startWorld,
        currentPt: candidate.snapPt,
        targetNodeId: candidate.target.id,
        targetSide: candidate.bestSide,
      });
    } else {
      setEphemeral({
        type: 'connector',
        fromNodeId: drag.connectorSourceNode.id,
        fromSide: drag.connectorSourceSide,
        fromPt: drag.connectorFromPt || drag.startWorld,
        currentPt: ptWorld,
      });
    }
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
  if (drag.mode === 'pen') {
    drag.penPoints?.push(ptWorld);
    setEphemeral({ type: 'pen', points: [...(drag.penPoints || [])], color: store.toolColor });
  }
}

export function processPointerUp(ctx: PointerHandlerContext): void {
  const { drag, ptWorld, shiftKey, store, selectionBox, setEphemeral, setSelectionBox } = ctx;
  if (drag.mode === 'none') return;

  if (drag.mode === 'move' && drag.nodeInitialPos) {
    const dx = Math.round(drag.lastWorld.x);
    const dy = Math.round(drag.lastWorld.y);
    if (dx !== 0 || dy !== 0) {
      canvasStore.dispatch(createMoveNodesCommand(store.selection, { dx, dy }));
    }
  } else if (drag.mode === 'resize' && drag.resizeNode && drag.resizeInitialRect && drag.resizeHandle) {
    const rot = drag.resizeNode.orbitron?.rotation || 0;
    const res = resizeWithRotation(drag.resizeInitialRect, rot, drag.resizeHandle, ptWorld, shiftKey);
    canvasStore.dispatch(createResizeNodeCommand(drag.resizeNode.id, drag.resizeInitialRect, res));
  } else if (drag.mode === 'rotate' && drag.rotateNode && drag.rotateCenter) {
    const newAngle = calculateRotationAngle(drag.rotateCenter, ptWorld, shiftKey);
    canvasStore.dispatch(createRotateNodeCommand(drag.rotateNode.id, drag.rotateInitialAngle || 0, newAngle));
  } else if (drag.mode === 'select_box' && selectionBox) {
    const ids = store.nodes.filter((n) => boxesIntersect(selectionBox, getNodeAABB(n))).map((n) => n.id);
    canvasStore.setSelection(ids);
    setSelectionBox(null);
  } else if (drag.mode === 'connector' && drag.connectorSourceNode) {
    const candidate = findConnectorTarget(store.nodes, drag.connectorSourceNode.id, ptWorld, 35);
    if (candidate && candidate.target.id !== drag.connectorSourceNode.id) {
      const edge = createNewEdge(
        drag.connectorSourceNode.id,
        candidate.target.id,
        store.toolColor,
        drag.connectorSourceSide,
        candidate.bestSide,
        'orthogonal'
      );
      canvasStore.dispatch(createAddEdgeCommand(edge));
    }
    canvasStore.setActiveTool('select');
  } else if (drag.mode === 'pen' && drag.penPoints && drag.penPoints.length > 1) {
    canvasStore.dispatch(createAddNodeCommand(createPenNode(drag.penPoints, store.toolColor)));
    canvasStore.setActiveTool('select');
  }

  setEphemeral(null);
  drag.mode = 'none';
  drag.startScreen = { x: 0, y: 0 };
  drag.startWorld = { x: 0, y: 0 };
  drag.lastWorld = { x: 0, y: 0 };
}
