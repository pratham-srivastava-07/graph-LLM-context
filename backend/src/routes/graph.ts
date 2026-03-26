import { Router, Request, Response } from 'express';
import { getFullGraph, getNodeById, getNeighbors } from '../services/db';

const router = Router();

// GET /graph — full graph data for visualization
router.get('/', (_req: Request, res: Response) => {
  try {
    const graph = getFullGraph();
    res.json({ success: true, data: graph });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

// GET /graph/node/:id — single node with neighbors
router.get('/node/:id', (req: Request, res: Response) => {
  try {
    const result = getNodeById(req.params.id as string);
    if (!result.node) {
      res.status(404).json({ success: false, error: 'Node not found' });
      return;
    }
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

// GET /graph/neighbors/:id — only neighbors
router.get('/neighbors/:id', (req: Request, res: Response) => {
  try {
    const neighbors = getNeighbors(req.params.id as string);
    res.json({ success: true, data: neighbors });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

// GET /graph/stats — summary statistics
router.get('/stats', (_req: Request, res: Response) => {
  try {
    const graph = getFullGraph();
    const nodesByType: Record<string, number> = {};
    const edgesByType: Record<string, number> = {};

    graph.nodes.forEach(n => { nodesByType[n.type] = (nodesByType[n.type] || 0) + 1; });
    graph.edges.forEach(e => { edgesByType[e.type] = (edgesByType[e.type] || 0) + 1; });

    res.json({
      success: true,
      data: {
        totalNodes: graph.nodes.length,
        totalEdges: graph.edges.length,
        nodesByType,
        edgesByType,
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: (e as Error).message });
  }
});

export default router;