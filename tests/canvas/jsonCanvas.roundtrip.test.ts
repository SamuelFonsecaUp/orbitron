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

  it('preserves kanban_task and vault_note embedded shapes and metadata in roundtrip', () => {
    const embeddedJson = {
      nodes: [
        {
          id: 'kanban-node-1',
          type: 'text',
          text: 'Planejar orçamento',
          x: 200,
          y: 200,
          width: 260,
          height: 150,
          orbitron: {
            shape: 'kanban_task' as const,
            taskId: 'task-123',
            taskTitle: 'Planejar orçamento',
            taskPriority: 'urgent',
            taskColumnId: 'col-todo',
          },
        },
        {
          id: 'vault-node-1',
          type: 'file',
          file: 'Pessoal/Ideias.md',
          text: 'Ideias de novos recursos',
          x: 500,
          y: 200,
          width: 280,
          height: 170,
          orbitron: {
            shape: 'vault_note' as const,
            notePath: 'Pessoal/Ideias.md',
            noteTitle: 'Ideias',
            noteSnippet: 'Ideias de novos recursos',
          },
        },
      ],
      edges: [
        {
          id: 'edge-kanban-vault',
          fromNode: 'kanban-node-1',
          fromSide: 'right',
          toNode: 'vault-node-1',
          toSide: 'left',
          orbitron: {
            routing: 'curved' as const,
          },
        },
      ],
    };

    const doc = parseJsonCanvas(embeddedJson);
    expect(doc.nodes[0].orbitron?.shape).toBe('kanban_task');
    expect(doc.nodes[0].orbitron?.taskId).toBe('task-123');
    expect(doc.nodes[1].orbitron?.shape).toBe('vault_note');
    expect(doc.nodes[1].orbitron?.notePath).toBe('Pessoal/Ideias.md');

    const serialized = serializeJsonCanvas(doc);
    const roundTripped = parseJsonCanvas(serialized);

    expect(roundTripped.nodes.length).toBe(2);
    expect(roundTripped.nodes[0].orbitron?.shape).toBe('kanban_task');
    expect(roundTripped.nodes[0].orbitron?.taskPriority).toBe('urgent');
    expect(roundTripped.nodes[1].orbitron?.shape).toBe('vault_note');
    expect(roundTripped.edges[0].orbitron?.routing).toBe('curved');
  });

  it('handles empty or malformed inputs gracefully with empty document fallback', () => {
    const emptyDoc = parseJsonCanvas('');
    expect(emptyDoc).toEqual({ nodes: [], edges: [] });

    const invalidDoc = parseJsonCanvas('invalid json string {]');
    expect(invalidDoc).toEqual({ nodes: [], edges: [] });
  });
});
