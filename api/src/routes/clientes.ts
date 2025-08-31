import { Router, type Request, type Response } from 'express';
import { getClientTimeline } from '../graphitiClient.js';

const router: any = Router();

interface TimelineRequest extends Request {
  params: {
    id: string;
  };
}

export async function timelineByClient(req: TimelineRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        error: 'Client ID is required'
      });
      return;
    }
    
    console.log(`📊 Fetching timeline for client: ${id}`);
    
    const timeline = await getClientTimeline(id);
    
    if (timeline.success) {
      res.json({
        client_id: id,
        timeline: timeline.data,
        total_interactions: timeline.data.length,
        source: timeline.source,
        search_query: timeline.search_query
      });
    } else {
      res.status(500).json({
        error: 'Failed to fetch timeline',
        message: timeline.error,
        client_id: id,
        data: []
      });
    }
  } catch (error) {
    console.error('❌ Error fetching client timeline:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch client timeline'
    });
  }
}

// Route definition
router.get('/:id/timeline', timelineByClient);

export default router;