export type NodeType =
  | 'Customer' | 'Order' | 'OrderItem' | 'Product'
  | 'Delivery' | 'Invoice' | 'Payment' | 'Address';

export type EdgeType =
  | 'PLACED_BY' | 'HAS_ITEM' | 'CONTAINS' | 'SHIPS_TO'
  | 'FULFILLS' | 'BILLED_FOR' | 'SETTLED_BY' | 'LIVES_AT' | 'DELIVERED_TO';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  properties: Record<string, unknown>;
  // Force graph adds these
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: EdgeType;
  properties?: Record<string, unknown>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface QueryResult {
  success: boolean;
  intent: string;
  query: string;
  rows: Record<string, unknown>[];
  summary: string;
  highlighted_node_ids?: string[];
  error?: string;
}

export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  nodesByType: Record<string, number>;
  edgesByType: Record<string, number>;
}