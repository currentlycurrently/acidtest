/**
 * Type definitions for dataflow/taint analysis
 *
 * Phase 3.1: Dataflow Implementation
 * v1.0.0 Scope: Single-file, intraprocedural analysis
 */

/**
 * Dataflow graph representing data dependencies in code
 */
export interface DataFlowGraph {
  nodes: DataFlowNode[];
  edges: DataFlowEdge[];
  sourceNodeIds: string[];  // Quick lookup for source nodes
  sinkNodeIds: string[];    // Quick lookup for sink nodes
}

/**
 * Node in the dataflow graph
 */
export interface DataFlowNode {
  id: string;                    // Unique ID (e.g., "var_secret_10_5")
  type: NodeType;                // Node classification
  identifier?: string;           // Variable/function name (if applicable)
  line: number;                  // Source line number
  column: number;                // Source column number
  scope?: string;                // Function scope (future: for interprocedural)
  isTainted?: boolean;           // Whether this node is tainted (computed)
  metadata?: {
    astNodeKind?: string;        // TypeScript SyntaxKind (for debugging)
    [key: string]: any;
  };
}

export type NodeType =
  | 'source'        // Taint source (process.env, user input, etc.)
  | 'sink'          // Taint sink (exec, fetch, eval, etc.)
  | 'variable'      // Variable declaration/usage
  | 'operation'     // Operation (template literal, etc.)
  | 'parameter'     // Function parameter
  | 'property';     // Property access (obj.prop)

/**
 * Edge in the dataflow graph (data dependency)
 */
export interface DataFlowEdge {
  from: string;     // Source node ID
  to: string;       // Target node ID
  type: EdgeType;   // Type of dataflow
  label?: string;   // Optional label (e.g., property name, param index)
}

export type EdgeType =
  | 'assignment'           // a = b
  | 'property-read'        // a = obj.prop
  | 'property-write'       // obj.prop = a
  | 'function-call'        // f(a)
  | 'function-return'      // return a (future)
  | 'template-literal'     // `${a}`
  | 'object-construction'; // { key: a }

/**
 * Taint source (where untrusted/sensitive data originates)
 */
export interface TaintSource {
  nodeId: string;                // Reference to node in dataflow graph
  type: TaintSourceType;         // Type of taint source
  identifier: string;            // Name (e.g., "API_KEY" for env var)
  line: number;                  // Source location
  column: number;
  metadata?: {
    envVarName?: string;         // For env-var sources
    paramName?: string;          // For user-input sources
    apiUrl?: string;             // For network-response sources
  };
}

export type TaintSourceType =
  | 'env-var'                    // process.env.X
  | 'user-input'                 // Function parameters, MCP args
  | 'network-response'           // fetch() responses
  | 'file-input';                // fs.readFile() (future)

/**
 * Taint sink (where tainted data causes security issues)
 */
export interface TaintSink {
  nodeId: string;                // Reference to node in dataflow graph
  type: TaintSinkType;           // Type of sink
  function: string;              // Function name (e.g., "exec", "fetch")
  line: number;                  // Sink location
  column: number;
  argumentIndex?: number;        // Which argument is tainted (0-indexed)
  metadata?: {
    url?: string;                // For network sinks
    filePath?: string;           // For file sinks
  };
}

export type TaintSinkType =
  | 'command-execution'          // exec, spawn, execSync
  | 'code-evaluation'            // eval, Function constructor
  | 'network-request'            // fetch, axios, http.request
  | 'file-write'                 // fs.writeFile
  | 'dynamic-import';            // require(), import()

/**
 * Dataflow path from source to sink
 */
export interface DataFlowPath {
  source: TaintSource;           // Where taint originated
  sink: TaintSink;               // Where taint reached
  path: DataFlowNode[];          // Intermediate nodes (source → ... → sink)
  confidence: ConfidenceLevel;   // Analysis confidence
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
}

export type ConfidenceLevel =
  | 'high'      // Direct flow, no ambiguity
  | 'medium'    // Some indirection (properties, function calls)
  | 'low';      // Complex flow, possible false positive
