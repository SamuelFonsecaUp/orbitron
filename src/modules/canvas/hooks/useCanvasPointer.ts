import { useState, useRef, useCallback, useEffect } from 'react';
import { canvasStore, useCanvasStore } from '../store/canvasStore';
import { screenToWorld } from '../scene/camera';
import { Point, Rect, HandleType } from '../scene/types';
import { CanvasNode, CanvasSide } from '../io/jsonCanvas.types';
import { DragState } from './pointerDragTypes';
import { EphemeralTransform } from '../scene/ephemeral.types';
import { createAddNodeCommand } from '../scene/commands';
import { getNodeSidePoint } from '../scene/connectors';
import { createNewPlacedNode } from './pointerNodeCreation';
import { processPointerMove, processPointerUp } from './pointerDragHandlers';

export function useCanvasPointer(svgRef: React.RefObject<SVGSVGElement | null>) {
  const store = useCanvasStore();
  const [selectionBox, setSelectionBox] = useState<Rect | null>(null);
  const [ephemeral, setEphemeral] = useState<EphemeralTransform>(null);
  const [isSpaceActive, setIsSpaceActive] = useState(false);
  const [isSpaceDragging, setIsSpaceDragging] = useState(false);
  const isSpacePressedRef = useRef(false);

  const dragRef = useRef<DragState>({
    mode: 'none',
    startScreen: { x: 0, y: 0 },
    startWorld: { x: 0, y: 0 },
    lastWorld: { x: 0, y: 0 },
  });

  // Track global spacebar key for space+drag camera panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const target = e.target as HTMLElement;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable ||
            target.closest('input') ||
            target.closest('textarea') ||
            target.closest('.canvas-node-editor'))
        ) {
          return;
        }
        // Prevent default spacebar page scrolling
        e.preventDefault();
        if (!isSpacePressedRef.current) {
          isSpacePressedRef.current = true;
          setIsSpaceActive(true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        setIsSpaceActive(false);
      }
    };

    const handleBlur = () => {
      isSpacePressedRef.current = false;
      setIsSpaceActive(false);
      setIsSpaceDragging(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const getPointerWorld = useCallback((e: MouseEvent | React.PointerEvent): Point => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return screenToWorld({ x: e.clientX - rect.left, y: e.clientY - rect.top }, store.camera);
  }, [svgRef, store.camera]);

  const onCanvasPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const ptWorld = getPointerWorld(e);
    if (e.button === 1 || store.activeTool === 'hand' || isSpacePressedRef.current) {
      dragRef.current = { mode: 'pan', startScreen: { x: e.clientX, y: e.clientY }, startWorld: ptWorld, lastWorld: ptWorld };
      setIsSpaceDragging(true);
      return;
    }
    if (['sticky', 'shape', 'text', 'frame', 'pen'].includes(store.activeTool)) {
      if (store.activeTool === 'pen') {
        dragRef.current = { mode: 'pen', startScreen: { x: e.clientX, y: e.clientY }, startWorld: ptWorld, lastWorld: ptWorld, penPoints: [ptWorld] };
        setEphemeral({ type: 'pen', points: [ptWorld], color: store.toolColor });
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

  const onAnchorPointerDown = (e: React.PointerEvent, node: CanvasNode, side: CanvasSide, pt: Point) => {
    e.stopPropagation();
    const ptWorld = getPointerWorld(e);
    if (e.button === 1 || store.activeTool === 'hand' || isSpacePressedRef.current) {
      dragRef.current = { mode: 'pan', startScreen: { x: e.clientX, y: e.clientY }, startWorld: ptWorld, lastWorld: ptWorld };
      setIsSpaceDragging(true);
      return;
    }
    const anchorPt = pt || getNodeSidePoint(node, side);
    dragRef.current = {
      mode: 'connector',
      startScreen: { x: e.clientX, y: e.clientY },
      startWorld: ptWorld,
      lastWorld: ptWorld,
      connectorSourceNode: node,
      connectorSourceSide: side,
      connectorFromPt: anchorPt,
    };
    setEphemeral({
      type: 'connector',
      fromNodeId: node.id,
      fromSide: side,
      fromPt: anchorPt,
      currentPt: ptWorld,
    });
  };

  const onNodePointerDown = (e: React.PointerEvent, node: CanvasNode) => {
    e.stopPropagation();
    const ptWorld = getPointerWorld(e);
    if (e.button === 1 || store.activeTool === 'hand' || isSpacePressedRef.current) {
      dragRef.current = { mode: 'pan', startScreen: { x: e.clientX, y: e.clientY }, startWorld: ptWorld, lastWorld: ptWorld };
      setIsSpaceDragging(true);
      return;
    }
    if (store.activeTool === 'connector') {
      const sides: CanvasSide[] = ['top', 'right', 'bottom', 'left'];
      let bestSide: CanvasSide = 'right';
      let bestDist = Infinity;
      for (const s of sides) {
        const p = getNodeSidePoint(node, s);
        const d = Math.hypot(p.x - ptWorld.x, p.y - ptWorld.y);
        if (d < bestDist) { bestDist = d; bestSide = s; }
      }
      const fromPt = getNodeSidePoint(node, bestSide);
      dragRef.current = {
        mode: 'connector',
        startScreen: { x: e.clientX, y: e.clientY },
        startWorld: ptWorld,
        lastWorld: ptWorld,
        connectorSourceNode: node,
        connectorSourceSide: bestSide,
        connectorFromPt: fromPt,
      };
      setEphemeral({
        type: 'connector',
        fromNodeId: node.id,
        fromSide: bestSide,
        fromPt,
        currentPt: ptWorld,
      });
      return;
    }
    if (e.shiftKey) { canvasStore.toggleSelection(node.id); return; }
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
    if (e.button === 1 || store.activeTool === 'hand' || isSpacePressedRef.current) {
      dragRef.current = { mode: 'pan', startScreen: { x: e.clientX, y: e.clientY }, startWorld: ptWorld, lastWorld: ptWorld };
      setIsSpaceDragging(true);
      return;
    }
    dragRef.current = {
      mode: 'resize', startScreen: { x: e.clientX, y: e.clientY }, startWorld: ptWorld, lastWorld: ptWorld,
      resizeNode: node, resizeInitialRect: { x: node.x, y: node.y, width: node.width, height: node.height }, resizeHandle: handle,
    };
  };

  const onRotateHandlePointerDown = (e: React.PointerEvent, node: CanvasNode) => {
    e.stopPropagation();
    const ptWorld = getPointerWorld(e);
    if (e.button === 1 || store.activeTool === 'hand' || isSpacePressedRef.current) {
      dragRef.current = { mode: 'pan', startScreen: { x: e.clientX, y: e.clientY }, startWorld: ptWorld, lastWorld: ptWorld };
      setIsSpaceDragging(true);
      return;
    }
    dragRef.current = {
      mode: 'rotate', startScreen: { x: e.clientX, y: e.clientY }, startWorld: ptWorld, lastWorld: ptWorld,
      rotateNode: node, rotateInitialAngle: node.orbitron?.rotation || 0,
      rotateCenter: { x: node.x + node.width / 2, y: node.y + node.height / 2 },
    };
  };

  const handlePointerMoveInternal = useCallback((e: MouseEvent | React.PointerEvent) => {
    processPointerMove({
      drag: dragRef.current,
      ptWorld: getPointerWorld(e),
      screenPos: { x: e.clientX, y: e.clientY },
      shiftKey: e.shiftKey,
      store,
      selectionBox,
      setEphemeral,
      setSelectionBox,
    });
  }, [getPointerWorld, selectionBox, store]);

  const handlePointerUpInternal = useCallback((e: MouseEvent | React.PointerEvent) => {
    if (dragRef.current.mode === 'pan') {
      setIsSpaceDragging(false);
    }
    processPointerUp({
      drag: dragRef.current,
      ptWorld: getPointerWorld(e),
      screenPos: { x: e.clientX, y: e.clientY },
      shiftKey: e.shiftKey,
      store,
      selectionBox,
      setEphemeral,
      setSelectionBox,
    });
  }, [getPointerWorld, selectionBox, store]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => handlePointerMoveInternal(e);
    const onUp = (e: MouseEvent) => handlePointerUpInternal(e);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [handlePointerMoveInternal, handlePointerUpInternal]);

  return {
    selectionBox,
    ephemeral,
    isSpaceActive,
    isSpaceDragging,
    onCanvasPointerDown,
    onNodePointerDown,
    onAnchorPointerDown,
    onHandlePointerDown,
    onRotateHandlePointerDown,
    onEdgePointerDown: (e: React.PointerEvent, edge: any) => {
      e.stopPropagation();
      if (e.button === 1 || store.activeTool === 'hand' || isSpacePressedRef.current) {
        const ptWorld = getPointerWorld(e);
        dragRef.current = { mode: 'pan', startScreen: { x: e.clientX, y: e.clientY }, startWorld: ptWorld, lastWorld: ptWorld };
        setIsSpaceDragging(true);
        return;
      }
      if (e.shiftKey) canvasStore.toggleSelection(edge.id);
      else canvasStore.setSelection([edge.id]);
    },
    onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => handlePointerMoveInternal(e),
    onPointerUp: (e: React.PointerEvent<SVGSVGElement>) => handlePointerUpInternal(e),
  };
}