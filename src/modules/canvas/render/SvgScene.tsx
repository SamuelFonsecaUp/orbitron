import React, { useMemo } from 'react';
import { CanvasNode, CanvasEdge } from '../io/jsonCanvas.types';
import { Camera, HandleType, SnapGuide, Rect } from '../scene/types';
import { GridLayer } from './GridLayer';
import { EdgesLayer } from './EdgesLayer';
import { NodesLayer } from './NodesLayer';
import { SelectionLayer } from './SelectionLayer';

interface SvgSceneProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  camera: Camera;
  selection: string[];
  snapGuides: SnapGuide[];
  viewportWidth: number;
  viewportHeight: number;
  selectionBox?: Rect | null;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  onPointerDown?: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerMove?: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp?: (e: React.PointerEvent<SVGSVGElement>) => void;
  onNodePointerDown?: (e: React.PointerEvent, node: CanvasNode) => void;
  onNodeDoubleClick?: (e: React.MouseEvent, node: CanvasNode) => void;
  onEdgePointerDown?: (e: React.PointerEvent, edge: CanvasEdge) => void;
  onHandlePointerDown?: (e: React.PointerEvent, handle: HandleType, node: CanvasNode) => void;
  onRotateHandlePointerDown?: (e: React.PointerEvent, node: CanvasNode) => void;
}

export const SvgScene: React.FC<SvgSceneProps> = ({
  nodes,
  edges,
  camera,
  selection,
  snapGuides,
  viewportWidth,
  viewportHeight,
  selectionBox,
  svgRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onNodePointerDown,
  onNodeDoubleClick,
  onEdgePointerDown,
  onHandlePointerDown,
  onRotateHandlePointerDown,
}) => {
  const nodesMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const selectedNodes = useMemo(
    () => nodes.filter((n) => selection.includes(n.id)),
    [nodes, selection]
  );

  return (
    <svg
      ref={svgRef}
      width={viewportWidth}
      height={viewportHeight}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="w-full h-full block bg-[#090d16] select-none touch-none overflow-hidden"
    >
      {/* Background Infinite Grid */}
      <GridLayer
        camera={camera}
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
      />

      {/* World transform layer */}
      <g transform={`translate(${camera.x}, ${camera.y}) scale(${camera.zoom})`}>
        {/* Edges underneath nodes */}
        <EdgesLayer
          edges={edges}
          nodesMap={nodesMap}
          selection={selection}
          onEdgePointerDown={onEdgePointerDown}
        />

        {/* Nodes */}
        <NodesLayer
          nodes={nodes}
          selection={selection}
          onNodePointerDown={onNodePointerDown}
          onNodeDoubleClick={onNodeDoubleClick}
        />

        {/* Handles, guides and selection rectangle */}
        <SelectionLayer
          selectedNodes={selectedNodes}
          snapGuides={snapGuides}
          selectionBox={selectionBox}
          onHandlePointerDown={onHandlePointerDown}
          onRotateHandlePointerDown={onRotateHandlePointerDown}
        />
      </g>
    </svg>
  );
};
