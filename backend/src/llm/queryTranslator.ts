import { LLMQueryOutput } from '../types';
import { validateSQL } from '../middleware/guardRails';

// ─── Schema Context ────────────────────────────────────────────────────────────

const SCHEMA_CONTEXT = `
Database Schema (SQLite, SAP Order-to-Cash):

TABLE customers: id, name, email, phone, segment (Enterprise/SMB/Retail), region, created_at
TABLE addresses: id, street, city, state, country, postal_code, type (Billing/Shipping)
TABLE products: id, name, sku, category, unit_price, uom, weight_kg
TABLE orders: id, order_number, customer_id (FK→customers), status (Open/Confirmed/Shipped/Delivered/Cancelled), priority (High/Medium/Low), order_date, requested_delivery_date, shipping_address_id (FK→addresses), total_amount, currency, sales_org, distribution_channel
TABLE order_items: id, order_id (FK→orders), product_id (FK→products), quantity, unit_price, discount_pct, net_amount, line_number
TABLE deliveries: id, delivery_number, order_id (FK→orders), address_id (FK→addresses), status (Pending/In Transit/Delivered/Failed/Returned), carrier, tracking_number, shipped_date, delivered_date, estimated_delivery
TABLE invoices: id, invoice_number, order_id (FK→orders), status (Draft/Issued/Partial/Paid/Overdue/Cancelled), issue_date, due_date, total_amount, tax_amount, currency, billing_address_id (FK→addresses)
TABLE payments: id, payment_reference, invoice_id (FK→invoices), amount, currency, method (Bank Transfer/Credit Card/Check/ACH), status (Pending/Cleared/Failed/Reversed), payment_date, cleared_date
`.trim();

const SYSTEM_PROMPT = `You are a SQL query translator for a SAP Order-to-Cash database. Convert natural language questions into valid SQLite SELECT queries.

${SCHEMA_CONTEXT}

RULES:
1. Output ONLY valid JSON, no markdown, no explanation, no code fences
2. Only generate SELECT statements
3. Never use DROP, DELETE, INSERT, UPDATE, ALTER, CREATE, TRUNCATE
4. Only use tables and columns from the schema above
5. Use JOINs when needed to answer the question
6. Return concise, accurate queries

Output format (strict JSON):
{
  "intent": "brief description of what this query does",
  "entities": ["list", "of", "entity", "types", "involved"],
  "filters": [{"field": "column_name", "operator": "=|>|<|LIKE|IN", "value": "the_value"}],
  "query": "SELECT ... FROM ... WHERE ...",
  "query_type": "aggregation|trace|filter|comparison|status_check"
}`;

// ─── LLM Providers ────────────────────────────────────────────────────────────

async function callGroq(userQuery: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userQuery }
      ],
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    }),
  });
  if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0].message.content;
}

async function callGemini(userQuery: string, apiKey: string): Promise<string> {
  const prompt = `${SYSTEM_PROMPT}\n\nUser question: ${userQuery}\n\nRespond with ONLY valid JSON, no markdown.`;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 500 },
      }),
    }
  );
  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
  const data = await response.json() as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> };
  let text = data.candidates[0].content.parts[0].text;
  // Strip markdown fences if present
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return text;
}

// ─── Rule-Based Fallback ───────────────────────────────────────────────────────

function ruleBasedFallback(query: string): LLMQueryOutput | null {
  const q = query.toLowerCase();

  if (q.includes('highest billing') || q.includes('most billed') || q.includes('top product')) {
    return {
      intent: 'Find products with highest billing count',
      entities: ['Product', 'OrderItem', 'Invoice'],
      filters: [],
      query: `SELECT p.name, p.sku, COUNT(oi.id) AS order_count, SUM(oi.net_amount) AS total_billed
              FROM products p
              JOIN order_items oi ON oi.product_id = p.id
              JOIN orders o ON o.id = oi.order_id
              JOIN invoices inv ON inv.order_id = o.id
              GROUP BY p.id, p.name, p.sku
              ORDER BY order_count DESC`,
      query_type: 'aggregation',
    };
  }

  if ((q.includes('delivered') && q.includes('not billed')) || (q.includes('no invoice') && q.includes('order'))) {
    return {
      intent: 'Find orders that are delivered but have no invoice',
      entities: ['Order', 'Delivery', 'Invoice'],
      filters: [{ field: 'deliveries.status', operator: '=', value: 'Delivered' }],
      query: `SELECT o.order_number, o.status AS order_status, o.total_amount, o.currency, c.name AS customer
              FROM orders o
              JOIN customers c ON c.id = o.customer_id
              JOIN deliveries d ON d.order_id = o.id
              LEFT JOIN invoices inv ON inv.order_id = o.id
              WHERE d.status = 'Delivered' AND inv.id IS NULL`,
      query_type: 'filter',
    };
  }

  if (q.includes('outstanding') || q.includes('unpaid') || (q.includes('overdue') && q.includes('invoice'))) {
    return {
      intent: 'Find unpaid or overdue invoices',
      entities: ['Invoice', 'Order', 'Customer'],
      filters: [{ field: 'invoices.status', operator: 'IN', value: 'Issued,Partial,Overdue' }],
      query: `SELECT inv.invoice_number, inv.status, inv.total_amount, inv.currency, inv.due_date, c.name AS customer
              FROM invoices inv
              JOIN orders o ON o.id = inv.order_id
              JOIN customers c ON c.id = o.customer_id
              WHERE inv.status IN ('Issued','Partial','Overdue')
              ORDER BY inv.due_date ASC`,
      query_type: 'status_check',
    };
  }

  if (q.includes('revenue') || q.includes('total amount') || q.includes('total sales')) {
    return {
      intent: 'Show total revenue by customer',
      entities: ['Customer', 'Order'],
      filters: [],
      query: `SELECT c.name, c.segment, c.region, COUNT(o.id) AS order_count, SUM(o.total_amount) AS total_revenue, o.currency
              FROM customers c
              JOIN orders o ON o.customer_id = c.id
              WHERE o.status != 'Cancelled'
              GROUP BY c.id, c.name, c.segment, c.region, o.currency
              ORDER BY total_revenue DESC`,
      query_type: 'aggregation',
    };
  }

  if (q.includes('pending') && q.includes('payment')) {
    return {
      intent: 'Find pending payments',
      entities: ['Payment', 'Invoice'],
      filters: [{ field: 'payments.status', operator: '=', value: 'Pending' }],
      query: `SELECT p.payment_reference, p.amount, p.currency, p.method, p.payment_date, inv.invoice_number, c.name AS customer
              FROM payments p
              JOIN invoices inv ON inv.id = p.invoice_id
              JOIN orders o ON o.id = inv.order_id
              JOIN customers c ON c.id = o.customer_id
              WHERE p.status = 'Pending'`,
      query_type: 'filter',
    };
  }

  return null;
}

// ─── Main Translate Function ───────────────────────────────────────────────────

export async function translateQueryToSQL(userQuery: string): Promise<LLMQueryOutput> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  let rawOutput: string | null = null;
  let parsed: LLMQueryOutput | null = null;

  // Try LLM providers
  if (groqKey) {
    try {
      rawOutput = await callGroq(userQuery, groqKey);
    } catch (e) {
      console.warn('Groq failed, trying fallback:', (e as Error).message);
    }
  }

  if (!rawOutput && geminiKey) {
    try {
      rawOutput = await callGemini(userQuery, geminiKey);
    } catch (e) {
      console.warn('Gemini failed, trying rule-based fallback:', (e as Error).message);
    }
  }

  // Parse LLM output
  if (rawOutput) {
    try {
      parsed = JSON.parse(rawOutput) as LLMQueryOutput;
    } catch {
      console.warn('Failed to parse LLM output, using rule-based fallback');
    }
  }

  // Rule-based fallback
  if (!parsed) {
    const fallback = ruleBasedFallback(userQuery);
    if (fallback) {
      return fallback;
    }
    // Last resort
    return {
      intent: 'List all orders with customer details',
      entities: ['Order', 'Customer'],
      filters: [],
      query: `SELECT o.order_number, o.status, o.total_amount, o.currency, o.order_date, c.name AS customer
              FROM orders o JOIN customers c ON c.id = o.customer_id
              ORDER BY o.order_date DESC`,
      query_type: 'filter',
    };
  }

  // Validate the SQL
  const validation = validateSQL(parsed.query);
  if (!validation.valid) {
    throw new Error(`Generated query is unsafe: ${validation.reason}`);
  }

  return parsed;
}

// ─── Natural Language Summary ──────────────────────────────────────────────────

export function generateSummary(intent: string, rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return `No results found for: ${intent}`;
  return `Found ${rows.length} result${rows.length !== 1 ? 's' : ''} for: ${intent}`;
}