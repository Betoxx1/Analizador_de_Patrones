import { Router, type Request, type Response } from 'express';
import { getGraphData, searchGraph } from '../graphitiClient.js';

const router: any = Router();

export async function getGraph(req: Request, res: Response): Promise<void> {
  try {
    console.log('🕸️ Fetching graph data');
    
    const result = await getGraphData();
    
    if (!result.success) {
      res.status(500).json({
        error: 'Failed to fetch graph data',
        message: result.error,
        source: result.source || 'graphiti_memory_search',
        data: result.data || { nodes: [], edges: [], entities: [], relationships: [] }
      });
      return;
    }
    
    res.json({
      success: true,
      data: result.data,
      source: result.source,
      total_nodes: result.total_nodes,
      total_edges: result.total_edges,
      metadata: {
        timestamp: new Date().toISOString(),
        graph_type: 'knowledge_graph',
        provider: 'graphiti'
      }
    });
  } catch (error) {
    console.error('❌ Error fetching graph data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch graph data'
    });
  }
}

export async function searchGraphiti(req: Request, res: Response): Promise<void> {
  try {
    console.log('🔍 Searching Graphiti:', req.body?.query || 'no query');
    
    const result = await searchGraph({
      query: req.body?.query || '',
      group_id: req.body?.group_id || 'analizador-patrones'
    });
    
    // Return in a format compatible with frontend expectations
    res.json({
      facts: result.results || [],
      metadata: result.metadata
    });
  } catch (error) {
    console.error('❌ Error searching Graphiti:', error);
    res.status(500).json({
      facts: [],
      error: 'Failed to search Graphiti',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Route definitions
router.get('/', getGraph);
router.post('/search', searchGraphiti);

export default router;