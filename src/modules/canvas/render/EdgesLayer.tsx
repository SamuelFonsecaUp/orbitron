import React from 'react';
import { CanvasEdge, CanvasNode } from '../io/jsonCanvas.types';
import { routeEdge } from '../scene/connectors';
import { getCanvasColor } from './colors';
import { EphemeralTransform, getEffectiveNodeRect, getEffectiveNodeRotation } from '../scene/ephemeral.types';

interface EdgesLayerProps {
  edges: CanvasEdge[];
  nodesMap: Map<string, CanvasNode>;
  selection: string[];
  ephemeral: EphemeralTransform;
  onEdgePointerDown?: (e: React.PointerEvent, edge: CanvasEdge) => void;
}

export const EdgesLayer: React.FC<EdgesLayerProps> = ({
  edges,
  nodesMap,
  selection,
  ephemeral,
  onEdgePointerDown,
}) => {
  const selectionSet = new Set(selection);

  return (
    <g className="edges-layer">
      <defs>
        <marker
          id="edge-arrowhead"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#a855f7" />
        </marker>
        <marker
          id="edge-arrowhead-default"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
        </marker>
      </defs>

      {/* Existing edges */}
      {edges.map((edge) => {
        const fromRaw = nodesMap.get(edge.fromNode);
        const toRaw = nodesMap.get(edge.toNode);
        if (!fromRaw || !toRaw) return null;

        // Apply effective positions for 60fps synchronous edge dragging
        const fromNode: CanvasNode = {
          ...fromRaw,
          ...getEffectiveNodeRect(fromRaw, ephemeral),
          orbitron: { ...fromRaw.orbitron, rotation: getEffectiveNodeRotation(fromRaw, ephemeral) },
        };
        const toNode: CanvasNode = {
          ...toRaw,
          ...getEffectiveNodeRect(toRaw, ephemeral),
          orbitron: { ...toRaw.orbitron, rotation: getEffectiveNodeRotation(toRaw, ephemeral) },
        };

        const isSelected = selectionSet.has(edge.id);
        const color = getCanvasColor(edge.color);
        const route = routeEdge(edge, fromNode, toNode);
        const isDashed = edge.orbitron?.strokeStyle === 'dashed';
        const hasArrow = edge.toEnd !== 'none';

        const strokeColor = isSelected ? '#a855f7' : color.border;
        const markerEnd = isSelected ? 'url(#edge-arrowhead)' : 'url(#edge-arrowhead-default)';

        return (
          <g
            key={edge.id}
            className="cursor-pointer"
            onPointerDown={(e) => onEdgePointerDown?.(e, edge)}
          >
            <path d={route.path} fill="none" stroke="transparent" strokeWidth={14} />
            {isSelected && <path d={route.path} fill="none" stroke="#a855f7" strokeWidth={5} opacity={0.4} />}
            <path
              d={route.path}
              fill="none"
              stroke={strokeColor}
              strokeWidth={2}
              strokeDasharray={isDashed ? '6 4' : undefined}
              markerEnd={hasArrow ? markerEnd : undefined}
            />
            {edge.label && (
              <g transform={`translate(${route.midpoint.x}, ${route.midpoint.y})`}>
                <rect
                  x={-(edge.label.length * 4 + 10)}
                  y={-11}
                  width={edge.label.length * 8 + 20}
                  height={22}
                  rx={6}
                  fill="#0f172a"
                  stroke={isSelected ? '#a855f7' : '#334155'}
                  strokeWidth={1}
                />
                <text
                  textAnchor="middle"
                  dy="4"
                  fill="#e2e8f0"
                  fontSize={11}
                  fontWeight="500"
                  className="font-sans pointer-events-none select-none"
                >
                  {edge.label}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Live elastic connector dragging in progress (Lucidspark style) */}
      {ephemeral && ephemeral.type === 'connector' && (
        <g className="live-connector pointer-events-none">
          <path
            d={`M ${ephemeral.fromPt.x} ${ephemeral.fromPt.y} Q ${(ephemeral.fromPt.x + ephemeral.currentPt.x) / 2} ${ephemeral.fromPt.y} ${ephemeral.currentPt.x} ${ephemeral.currentPt.y}`}
            fill="none"
            stroke="#c084fc"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            markerEnd="url(#edge-arrowhead)"
          />
          <circle cx={ephemeral.fromPt.x} cy={ephemeral.fromPt.y} r={4} fill="#c084fc" />
          <circle cx={ephemeral.currentPt.x} cy={ephemeral.currentPt.y} r={4} fill="#a855f7" />
        </g>
      )}

      {/* Live freehand pen drawing in progress */}
      {ephemeral && ephemeral.type === 'pen' && ephemeral.points.length > 1 && (
        <path
          d={`M ${ephemeral.points[0].x} ${ephemeral.points[0].y} ` + ephemeral.points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')}
          fill="none"
          stroke={ephemeral.color || '#a855f7'}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none"
        />
      )}
    </g>
  );
};
