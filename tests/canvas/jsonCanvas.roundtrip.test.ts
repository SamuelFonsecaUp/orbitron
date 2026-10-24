import { describe, it, expect } from 'vitest';
import { parseJsonCanvas } from '../../src/modules/canvas/io/parse';
import { serializeJsonCanvas } from '../../src/modules/canvas/io/serialize';
import { CanvasDoc } from '../../src/modules/canvas/io/jsonCanvas.types';

describe('JSON Canvas 1.0 Parser and Serializer', () => {
  const sampleJson = {
    nodes: [
      {
        id: 'node-1',
        type: 'text',
        text: '# Olá Mundo\nEste é um sticky note.',
        x: 100,
        y: 150,
        width: 250,
        height: 180,
        color: '1',
        orbitron: {
          shape: 'sticky',
          rotation: 15,
        },
      },
      {
        id: 'node-2',
        type: 'file',
        file: 'Notas/Projeto.md',
        x: 450,
        y: 150,
        width: 300,
        height: 200,
      },
    ],
    edges: [
      {
        id: 'edge-1',
        fromNode: 'node-1',
        fromSide: 'right',
        toNode: 'node-2',
        toSide: 'left',
        label: 'conecta',
        orbitron: {
          routing: 'orthogonal',
        },
      },
    ],
  };

  it('parses valid JSON Canvas 1.0 with Orbitron extensions', () => {
    const rawString = JSON.stringify(sampleJson);
    const doc = parseJsonCanvas(rawString);

    expect(doc.nodes.length).toBe(2);
    expect(doc.edges.length).toBe(1);
    expect(doc.nodes[0].orbitron?.shape).toBe('sticky');
    expect(doc.nodes[0].orbitron?.rotation).toBe(15);
    expect(doc.edges[0].label).toBe('conecta');
  });

  it('serializes cleanly and performs lossless round-trip', () => {
    const doc = parseJsonCanvas(sampleJson);
    const serialized = serializeJsonCanvas(doc);
    const roundTripped = parseJsonCanvas(serialized);

    expect(roundTripped.nodes.length).toBe(doc.nodes.length);
    expect(roundTripped.edges.length).toBe(doc.edges.length);
    expect(roundTripped.nodes[0].id).toBe(doc.nodes[0].id);
    expect(roundTripped.nodes[0].x).toBe(doc.nodes[0].x);
    expect(roundTripped.nodes[0].orbitron?.rotation).toBe(15);
    expect(roundTripped.edges[0].fromNode).toBe('node-1');
  });

  it('handles empty or malformed inputs gracefully with empty document fallback', () => {
    const emptyDoc = parseJsonCanvas('');
    expect(emptyDoc).toEqual({ nodes: [], edges: [] });

    const invalidDoc = parseJsonCanvas('invalid json string {]');
    expect(invalidDoc).toEqual({ nodes: [], edges: [] });
  });
});
