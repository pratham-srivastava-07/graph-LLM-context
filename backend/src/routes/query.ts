import { Router, Request, Response } from 'express';
import { guardrailFilter } from '../middleware/guardRails';
import { translateQueryToSQL, generateSummary } from '../llm/queryTranslator';
import { executeQuery, getFullGraph } from '../services/db';
import { QueryResult } from '../types';

const router = Router();

// POST /query — natural language query endpoint
router.post('/', guardrailFilter, async (req: Request, res: Response) => {
  const { query } = req.body as { query: string };

  try {
    // 1. Translate NL → SQL via LLM
    const llmOutput = await translateQueryToSQL(query);

    // 2. Execute validated SQL
    const rows = executeQuery(llmOutput.query);

    // 3. Find highlighted node IDs from results
    const graph = getFullGraph();
    const highlightedIds = findHighlightedNodes(rows, graph.nodes.map(n => ({ id: n.id, type: n.type })));

    // 4. Generate human-readable summary
    const summary = generateSummary(llmOutput.intent, rows);

    const result: QueryResult = {
      success: true,
      intent: llmOutput.intent,
      query: llmOutput.query,
      rows,
      summary,
      highlighted_node_ids: highlightedIds,
    };

    res.json(result);
  } catch (e) {
    const err = e as Error;
    res.status(500).json({
      success: false,
      error: err.message,
      intent: 'Query failed',
      query: '',
      rows: [],
      summary: `Error: ${err.message}`,
    } as QueryResult);
  }
});

// GET /query/suggestions — preset example queries
router.get('/suggestions', (_req: Request, res: Response) => {
  res.json({
    suggestions: [
      'Which products have the highest billing count?',
      'Find orders that are delivered but not billed',
      'Show all outstanding invoices',
      'What is the total revenue by customer?',
      'Show pending payments',
      'List all orders for Acme Corporation',
      'Which deliveries are currently in transit?',
      'Show invoices due this month',
      'Find cancelled orders',
      'What is the order status for SO-2024-0004?',
    ]
  });
});

// ─── Helper: Map result rows back to graph node IDs ────────────────────────────

function findHighlightedNodes(
  rows: Record<string, unknown>[],
  nodeIndex: Array<{ id: string; type: string }>
): string[] {
  const highlightedIds = new Set<string>();

  // Extract all string values from rows that look like entity IDs
  const idPatterns = [/^(ORD|DEL|INV|PAY|C|P|A|OI)\d+$/i, /^SO-/, /^IV-/, /^DN-/, /^PAY-/];

  rows.forEach(row => {
    Object.values(row).forEach(val => {
      if (typeof val === 'string') {
        const matchesPattern = idPatterns.some(p => p.test(val));
        if (matchesPattern) {
          const node = nodeIndex.find(n => n.id === val);
          if (node) highlightedIds.add(val);
        }
      }
    });
  });

  // If no IDs found directly, try to match order_numbers
  if (highlightedIds.size === 0) {
    rows.forEach(row => {
      const orderNum = row.order_number as string | undefined;
      if (orderNum) {
        const node = nodeIndex.find(n => n.id.startsWith('ORD') || n.id.startsWith('SO'));
        if (node) highlightedIds.add(node.id);
      }
    });
  }

  return Array.from(highlightedIds);
}

export default router;