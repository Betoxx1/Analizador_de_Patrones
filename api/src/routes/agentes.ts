import { Router, type Request, type Response } from 'express';
import { getAgentEffectiveness } from '../graphitiClient.js';

const router: any = Router();

interface EffectivenessRequest extends Request {
  params: {
    id: string;
  };
}

export async function agentEffectiveness(req: EffectivenessRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        error: 'Agent ID is required'
      });
      return;
    }
    
    console.log(`📈 Fetching effectiveness for agent: ${id}`);
    
    const effectiveness = await getAgentEffectiveness(id);
    
    if (!effectiveness.success || !effectiveness.data) {
      res.status(effectiveness.success ? 404 : 500).json({
        error: effectiveness.success ? 'Agent not found' : 'Failed to fetch effectiveness',
        message: effectiveness.error,
        agent_id: id,
        source: effectiveness.source || 'graphiti_search'
      });
      return;
    }
    
    const data = effectiveness.data;
    
    // Calculate additional metrics
    const failureRate = 100 - (data.effectiveness_rate || 0);
    const avgInteractionsPerSuccess = data.successful_interactions > 0 
      ? data.total_interactions / data.successful_interactions 
      : 0;
    
    res.json({
      agent_id: data.agent_id,
      agent_name: data.agent_name,
      metrics: {
        total_interactions: data.total_interactions || 0,
        successful_interactions: data.successful_interactions || 0,
        failed_interactions: (data.total_interactions || 0) - (data.successful_interactions || 0),
        effectiveness_rate: Math.round((data.effectiveness_rate || 0) * 100) / 100,
        failure_rate: Math.round(failureRate * 100) / 100,
        avg_interactions_per_success: Math.round(avgInteractionsPerSuccess * 100) / 100
      },
      performance_level: (data.effectiveness_rate || 0) >= 80 ? 'Excellent' :
                         (data.effectiveness_rate || 0) >= 60 ? 'Good' :
                         (data.effectiveness_rate || 0) >= 40 ? 'Average' : 'Needs Improvement',
      source: effectiveness.source,
      search_query: effectiveness.search_query
    });
  } catch (error) {
    console.error('❌ Error fetching agent effectiveness:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch agent effectiveness'
    });
  }
}

// Route definition
router.get('/:id/efectividad', agentEffectiveness);

export default router;