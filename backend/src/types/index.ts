// ─── Node Types ────────────────────────────────────────────────────────────────

export type NodeType =
  | 'Customer'
  | 'Order'
  | 'OrderItem'
  | 'Product'
  | 'Delivery'
  | 'Invoice'
  | 'Payment'
  | 'Address';

export type EdgeType =
  | 'PLACED_BY'       // Order → Customer
  | 'HAS_ITEM'        // Order → OrderItem
  | 'CONTAINS'        // OrderItem → Product
  | 'SHIPS_TO'        // Order → Address
  | 'FULFILLS'        // Delivery → Order
  | 'BILLED_FOR'      // Invoice → Order
  | 'SETTLED_BY'      // Payment → Invoice
  | 'LIVES_AT'        // Customer → Address
  | 'DELIVERED_TO';   // Delivery → Address

// ─── Entity Interfaces ─────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  segment: 'Enterprise' | 'SMB' | 'Retail';
  region: string;
  created_at: string;
}

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  type: 'Billing' | 'Shipping';
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  uom: string;
  weight_kg: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  status: 'Open' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  priority: 'High' | 'Medium' | 'Low';
  order_date: string;
  requested_delivery_date: string;
  shipping_address_id: string;
  total_amount: number;
  currency: string;
  sales_org: string;
  distribution_channel: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  net_amount: number;
  line_number: number;
}

export interface Delivery {
  id: string;
  delivery_number: string;
  order_id: string;
  address_id: string;
  status: 'Pending' | 'In Transit' | 'Delivered' | 'Failed' | 'Returned';
  carrier: string;
  tracking_number: string;
  shipped_date: string | null;
  delivered_date: string | null;
  estimated_delivery: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  status: 'Draft' | 'Issued' | 'Partial' | 'Paid' | 'Overdue' | 'Cancelled';
  issue_date: string;
  due_date: string;
  total_amount: number;
  tax_amount: number;
  currency: string;
  billing_address_id: string;
}

export interface Payment {
  id: string;
  payment_reference: string;
  invoice_id: string;
  amount: number;
  currency: string;
  method: 'Bank Transfer' | 'Credit Card' | 'Check' | 'ACH';
  status: 'Pending' | 'Cleared' | 'Failed' | 'Reversed';
  payment_date: string;
  cleared_date: string | null;
}

// ─── Graph Structures ──────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  properties?: Record<string, unknown>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ─── LLM Query Structures ──────────────────────────────────────────────────────

export interface LLMQueryOutput {
  intent: string;
  entities: string[];
  filters: Array<{ field: string; operator: string; value: string | number }>;
  query: string;
  query_type: 'aggregation' | 'trace' | 'filter' | 'comparison' | 'status_check';
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