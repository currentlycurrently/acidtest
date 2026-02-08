/**
 * Taint Propagation using Worklist Algorithm
 *
 * Propagates taint from sources through the dataflow graph:
 * 1. Initialize worklist with all source nodes
 * 2. For each node in worklist, mark all successors as tainted
 * 3. Repeat until no new tainted nodes (fixpoint)
 *
 * Complexity: O(N + E) where N = nodes, E = edges
 *
 * Phase 3.1: Dataflow Implementation
 */

import { DataFlowGraph, TaintSource, TaintSink, DataFlowPath, DataFlowNode } from './dataflow-types.js';

/**
 * Propagate taint through dataflow graph
 */
export function propagateTaint(
  graph: DataFlowGraph,
  sources: TaintSource[]
): Set<string> {
  const tainted = new Set<string>();  // Set of tainted node IDs
  const worklist: string[] = [];       // Nodes to process

  // Initialize: Add all source nodes to worklist
  for (const source of sources) {
    if (!tainted.has(source.nodeId)) {
      tainted.add(source.nodeId);
      worklist.push(source.nodeId);
    }
  }

  // Propagate taint until no changes
  while (worklist.length > 0) {
    const nodeId = worklist.shift()!;

    // Find all successors (outgoing edges from this node)
    for (const edge of graph.edges.filter((e) => e.from === nodeId)) {
      const successorId = edge.to;

      // If successor is not already tainted, mark it and add to worklist
      if (!tainted.has(successorId)) {
        tainted.add(successorId);
        worklist.push(successorId);
      }
    }
  }

  return tainted;
}

/**
 * Find all taint paths from sources to sinks
 */
export function findTaintPaths(
  graph: DataFlowGraph,
  sources: TaintSource[],
  sinks: TaintSink[],
  taintedNodeIds: Set<string>
): DataFlowPath[] {
  const paths: DataFlowPath[] = [];

  // For each sink, check if it's tainted and trace back to sources
  for (const sink of sinks) {
    if (!taintedNodeIds.has(sink.nodeId)) {
      continue; // Sink is not reachable from any source
    }

    // Find which sources can reach this sink
    for (const source of sources) {
      const path = findPathBFS(graph, source.nodeId, sink.nodeId);
      if (path) {
        const confidence = calculateConfidence(path);
        const severity = calculateSeverity(source, sink);

        paths.push({
          source,
          sink,
          path,
          confidence,
          severity,
        });
      }
    }
  }

  return paths;
}

/**
 * Find path from source to sink using BFS
 */
function findPathBFS(
  graph: DataFlowGraph,
  sourceNodeId: string,
  sinkNodeId: string
): DataFlowNode[] | null {
  const visited = new Set<string>();
  const queue: Array<{ nodeId: string; path: string[] }> = [
    { nodeId: sourceNodeId, path: [sourceNodeId] },
  ];

  while (queue.length > 0) {
    const { nodeId, path } = queue.shift()!;

    // Found the sink
    if (nodeId === sinkNodeId) {
      return path.map((id) => graph.nodes.find((n) => n.id === id)!);
    }

    if (visited.has(nodeId)) {
      continue;
    }
    visited.add(nodeId);

    // Add all successors to queue
    for (const edge of graph.edges.filter((e) => e.from === nodeId)) {
      if (!visited.has(edge.to)) {
        queue.push({ nodeId: edge.to, path: [...path, edge.to] });
      }
    }
  }

  return null; // No path found
}

/**
 * Calculate confidence level based on path complexity
 */
function calculateConfidence(path: DataFlowNode[]): 'high' | 'medium' | 'low' {
  // Direct flow (source → sink): high confidence
  if (path.length <= 2) {
    return 'high';
  }

  // Short path (2-5 steps): high confidence
  if (path.length <= 5) {
    return 'high';
  }

  // Medium path (5-10 steps): medium confidence
  if (path.length <= 10) {
    return 'medium';
  }

  // Long path (10+ steps): low confidence (likely false positive)
  return 'low';
}

/**
 * Calculate severity based on source and sink types
 */
function calculateSeverity(
  source: TaintSource,
  sink: TaintSink
): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' {
  // Environment variable → command execution: CRITICAL
  if (source.type === 'env-var' && sink.type === 'command-execution') {
    return 'CRITICAL';
  }

  // Environment variable → code evaluation: CRITICAL
  if (source.type === 'env-var' && sink.type === 'code-evaluation') {
    return 'CRITICAL';
  }

  // Environment variable → network request: CRITICAL (exfiltration)
  if (source.type === 'env-var' && sink.type === 'network-request') {
    return 'CRITICAL';
  }

  // User input → command execution: CRITICAL (command injection)
  if (source.type === 'user-input' && sink.type === 'command-execution') {
    return 'CRITICAL';
  }

  // User input → code evaluation: CRITICAL (code injection)
  if (source.type === 'user-input' && sink.type === 'code-evaluation') {
    return 'CRITICAL';
  }

  // User input → network request: HIGH (data exfiltration)
  if (source.type === 'user-input' && sink.type === 'network-request') {
    return 'HIGH';
  }

  // Network response → command execution: HIGH (supply chain attack)
  if (source.type === 'network-response' && sink.type === 'command-execution') {
    return 'HIGH';
  }

  // Network response → code evaluation: HIGH (supply chain attack)
  if (source.type === 'network-response' && sink.type === 'code-evaluation') {
    return 'HIGH';
  }

  // File write with tainted path: HIGH (path traversal)
  if (sink.type === 'file-write') {
    return 'HIGH';
  }

  // Dynamic import with tainted module: HIGH (malicious code loading)
  if (sink.type === 'dynamic-import') {
    return 'HIGH';
  }

  // Default: MEDIUM
  return 'MEDIUM';
}

/**
 * Extract taint sources from dataflow graph
 */
export function extractTaintSources(graph: DataFlowGraph): TaintSource[] {
  const sources: TaintSource[] = [];

  for (const nodeId of graph.sourceNodeIds) {
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    const sourceType = node.metadata?.sourceType || 'env-var';
    const envVarName = node.metadata?.envVarName || node.identifier || 'UNKNOWN';

    sources.push({
      nodeId: node.id,
      type: sourceType,
      identifier: node.identifier || 'unknown',
      line: node.line,
      column: node.column,
      metadata: {
        envVarName,
      },
    });
  }

  return sources;
}

/**
 * Extract taint sinks from dataflow graph
 */
export function extractTaintSinks(graph: DataFlowGraph): TaintSink[] {
  const sinks: TaintSink[] = [];

  for (const nodeId of graph.sinkNodeIds) {
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    const sinkType = node.metadata?.sinkType || 'unknown';
    const functionName = node.metadata?.functionName || node.identifier || 'unknown';

    sinks.push({
      nodeId: node.id,
      type: sinkType as any,
      function: functionName,
      line: node.line,
      column: node.column,
    });
  }

  return sinks;
}
