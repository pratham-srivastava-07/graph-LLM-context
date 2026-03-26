import Database from 'better-sqlite3';
import path from 'path';
import { GraphData, GraphNode, GraphEdge } from '../types';

const DB_PATH = path.join(__dirname, '../../data/o2c.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
  }
  return _db;
}

// ─── Schema Creation ───────────────────────────────────────────────────────────

export function createSchema(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      segment TEXT CHECK(segment IN ('Enterprise','SMB','Retail')),
      region TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      street TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      postal_code TEXT,
      type TEXT CHECK(type IN ('Billing','Shipping'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      category TEXT,
      unit_price REAL,
      uom TEXT,
      weight_kg REAL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      customer_id TEXT REFERENCES customers(id),
      status TEXT CHECK(status IN ('Open','Confirmed','Shipped','Delivered','Cancelled')),
      priority TEXT CHECK(priority IN ('High','Medium','Low')),
      order_date TEXT,
      requested_delivery_date TEXT,
      shipping_address_id TEXT REFERENCES addresses(id),
      total_amount REAL,
      currency TEXT,
      sales_org TEXT,
      distribution_channel TEXT
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT REFERENCES orders(id),
      product_id TEXT REFERENCES products(id),
      quantity REAL,
      unit_price REAL,
      discount_pct REAL,
      net_amount REAL,
      line_number INTEGER
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id TEXT PRIMARY KEY,
      delivery_number TEXT UNIQUE NOT NULL,
      order_id TEXT REFERENCES orders(id),
      address_id TEXT REFERENCES addresses(id),
      status TEXT CHECK(status IN ('Pending','In Transit','Delivered','Failed','Returned')),
      carrier TEXT,
      tracking_number TEXT,
      shipped_date TEXT,
      delivered_date TEXT,
      estimated_delivery TEXT
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      order_id TEXT REFERENCES orders(id),
      status TEXT CHECK(status IN ('Draft','Issued','Partial','Paid','Overdue','Cancelled')),
      issue_date TEXT,
      due_date TEXT,
      total_amount REAL,
      tax_amount REAL,
      currency TEXT,
      billing_address_id TEXT REFERENCES addresses(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      payment_reference TEXT UNIQUE NOT NULL,
      invoice_id TEXT REFERENCES invoices(id),
      amount REAL,
      currency TEXT,
      method TEXT CHECK(method IN ('Bank Transfer','Credit Card','Check','ACH')),
      status TEXT CHECK(status IN ('Pending','Cleared','Failed','Reversed')),
      payment_date TEXT,
      cleared_date TEXT
    );
  `);
}

// ─── Graph Query Functions ─────────────────────────────────────────────────────

export function getFullGraph(): GraphData {
  const db = getDb();

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Customers
  const customers = db.prepare('SELECT * FROM customers').all() as Record<string, unknown>[];
  customers.forEach(c => nodes.push({ id: c.id as string, type: 'Customer', label: c.name as string, properties: c }));

  // Addresses
  const addresses = db.prepare('SELECT * FROM addresses').all() as Record<string, unknown>[];
  addresses.forEach(a => nodes.push({ id: a.id as string, type: 'Address', label: `${a.city}, ${a.country}` as string, properties: a }));

  // Products
  const products = db.prepare('SELECT * FROM products').all() as Record<string, unknown>[];
  products.forEach(p => nodes.push({ id: p.id as string, type: 'Product', label: p.name as string, properties: p }));

  // Orders
  const orders = db.prepare('SELECT * FROM orders').all() as Record<string, unknown>[];
  orders.forEach(o => {
    nodes.push({ id: o.id as string, type: 'Order', label: o.order_number as string, properties: o });
    edges.push({ id: `e-${o.id}-cust`, source: o.id as string, target: o.customer_id as string, type: 'PLACED_BY' });
    edges.push({ id: `e-${o.id}-addr`, source: o.id as string, target: o.shipping_address_id as string, type: 'SHIPS_TO' });
  });

  // Order Items
  const items = db.prepare('SELECT * FROM order_items').all() as Record<string, unknown>[];
  items.forEach(i => {
    nodes.push({ id: i.id as string, type: 'OrderItem', label: `Line ${i.line_number} (x${i.quantity})`, properties: i });
    edges.push({ id: `e-${i.id}-order`, source: i.order_id as string, target: i.id as string, type: 'HAS_ITEM' });
    edges.push({ id: `e-${i.id}-prod`, source: i.id as string, target: i.product_id as string, type: 'CONTAINS' });
  });

  // Deliveries
  const deliveries = db.prepare('SELECT * FROM deliveries').all() as Record<string, unknown>[];
  deliveries.forEach(d => {
    nodes.push({ id: d.id as string, type: 'Delivery', label: d.delivery_number as string, properties: d });
    edges.push({ id: `e-${d.id}-order`, source: d.id as string, target: d.order_id as string, type: 'FULFILLS' });
    edges.push({ id: `e-${d.id}-addr`, source: d.id as string, target: d.address_id as string, type: 'DELIVERED_TO' });
  });

  // Invoices
  const invoices = db.prepare('SELECT * FROM invoices').all() as Record<string, unknown>[];
  invoices.forEach(inv => {
    nodes.push({ id: inv.id as string, type: 'Invoice', label: inv.invoice_number as string, properties: inv });
    edges.push({ id: `e-${inv.id}-order`, source: inv.id as string, target: inv.order_id as string, type: 'BILLED_FOR' });
  });

  // Payments
  const payments = db.prepare('SELECT * FROM payments').all() as Record<string, unknown>[];
  payments.forEach(p => {
    nodes.push({ id: p.id as string, type: 'Payment', label: p.payment_reference as string, properties: p });
    edges.push({ id: `e-${p.id}-inv`, source: p.id as string, target: p.invoice_id as string, type: 'SETTLED_BY' });
  });

  return { nodes, edges };
}

export function getNodeById(id: string): { node: GraphNode | null; neighbors: GraphNode[]; edges: GraphEdge[] } {
  const graph = getFullGraph();
  const node = graph.nodes.find(n => n.id === id) || null;
  const connectedEdges = graph.edges.filter(e => e.source === id || e.target === id);
  const neighborIds = new Set(connectedEdges.flatMap(e => [e.source, e.target]).filter(nid => nid !== id));
  const neighbors = graph.nodes.filter(n => neighborIds.has(n.id));
  return { node, neighbors, edges: connectedEdges };
}

export function getNeighbors(id: string): GraphNode[] {
  return getNodeById(id).neighbors;
}

export function executeQuery(sql: string): Record<string, unknown>[] {
  const db = getDb();
  // Only allow SELECT statements
  const normalized = sql.trim().toUpperCase();
  if (!normalized.startsWith('SELECT')) {
    throw new Error('Only SELECT queries are permitted');
  }
  const stmt = db.prepare(sql);
  return stmt.all() as Record<string, unknown>[];
}