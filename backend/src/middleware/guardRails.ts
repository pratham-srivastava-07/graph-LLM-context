import { Request, Response, NextFunction } from 'express';

// Dataset-related keywords — if none match, reject immediately
const ALLOWED_KEYWORDS = [
  // Entities
  'order', 'orders', 'delivery', 'deliveries', 'invoice', 'invoices',
  'payment', 'payments', 'customer', 'customers', 'product', 'products',
  'item', 'items', 'address', 'shipment',
  // SAP-specific
  'o2c', 'order-to-cash', 'billing', 'billed', 'fulfil', 'fulfills', 'fulfilled',
  'shipped', 'delivered', 'pending', 'cancelled', 'cleared', 'overdue',
  // Operations
  'trace', 'track', 'find', 'show', 'list', 'count', 'total', 'sum',
  'highest', 'lowest', 'most', 'least', 'which', 'what', 'how many',
  'status', 'amount', 'revenue', 'outstanding', 'unpaid', 'open',
  // Identifiers
  'so-', 'iv-', 'dn-', 'pay-', 'sku-',
];

// Patterns that indicate off-topic requests
const BLOCKED_PATTERNS = [
  /write (?:a |an )?(?:poem|story|essay|email|code|script)/i,
  /explain (?:quantum|relativity|history|philosophy)/i,
  /who is (?!the customer|a customer)/i,
  /what is (?!the (?:status|total|order|invoice|delivery|payment))/i,
  /generate (?!a query|an? (?:order|invoice|report))/i,
  /translate/i,
  /recipe/i,
  /weather/i,
  /news/i,
];

export function guardrailFilter(req: Request, res: Response, next: NextFunction): void {
  const { query } = req.body as { query?: string };

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Missing query parameter' });
    return;
  }

  const lowered = query.toLowerCase();

  // Check for blocked patterns first
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(query)) {
      res.status(400).json({
        error: 'This system is designed to answer SAP Order-to-Cash dataset queries only. Please ask about orders, deliveries, invoices, payments, customers, or products.',
        code: 'OUT_OF_SCOPE'
      });
      return;
    }
  }

  // Check if at least one dataset keyword is present
  const hasKeyword = ALLOWED_KEYWORDS.some(kw => lowered.includes(kw));
  if (!hasKeyword) {
    res.status(400).json({
      error: 'This system is designed to answer SAP Order-to-Cash dataset queries only. Please ask about orders, deliveries, invoices, payments, customers, or products.',
      code: 'OUT_OF_SCOPE'
    });
    return;
  }

  next();
}

// SQL validation — only SELECT, no dangerous operations
export function validateSQL(sql: string): { valid: boolean; reason?: string } {
  const normalized = sql.trim().toUpperCase();

  if (!normalized.startsWith('SELECT')) {
    return { valid: false, reason: 'Only SELECT statements are permitted' };
  }

  const dangerous = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 'TRUNCATE', 'EXEC', 'EXECUTE', '--', ';--', 'UNION ALL SELECT'];
  for (const keyword of dangerous) {
    if (normalized.includes(keyword)) {
      return { valid: false, reason: `Dangerous keyword detected: ${keyword}` };
    }
  }

  // Must reference known tables
  const knownTables = ['customers', 'orders', 'order_items', 'products', 'deliveries', 'invoices', 'payments', 'addresses'];
  const hasKnownTable = knownTables.some(t => normalized.includes(t.toUpperCase()));
  if (!hasKnownTable) {
    return { valid: false, reason: 'Query must reference a known O2C table' };
  }

  return { valid: true };
}