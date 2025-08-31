import { Router, type Request, type Response } from 'express';
import { getBrokenPromises, getBestTimeSlots } from '../graphitiClient.js';

const router: any = Router();

interface BrokenPromisesRequest extends Request {
  query: {
    diasVencidas?: string;
  };
}

export async function brokenPromises(req: BrokenPromisesRequest, res: Response): Promise<void> {
  try {
    const { diasVencidas } = req.query;
    
    let daysOverdue: number | undefined;
    if (diasVencidas) {
      daysOverdue = parseInt(diasVencidas, 10);
      if (isNaN(daysOverdue) || daysOverdue < 0) {
        res.status(400).json({
          error: 'Invalid diasVencidas parameter',
          message: 'Must be a positive integer'
        });
        return;
      }
    }
    
    console.log(`📉 Fetching broken promises${daysOverdue ? ` for ${daysOverdue} days overdue` : ''}`);
    
    const result = await getBrokenPromises(daysOverdue);
    
    if (!result.success) {
      res.status(500).json({
        error: 'Failed to fetch broken promises',
        message: result.error,
        filter: { days_overdue_minimum: daysOverdue || 0 },
        source: result.source || 'graphiti_search'
      });
      return;
    }
    
    const promises = result.data || [];
    
    // Calculate summary statistics
    const totalAmount = promises.reduce((sum: number, p: any) => {
      return sum + (p.amount || p.promise?.amount || p.monto_prometido || 0);
    }, 0);
    
    const avgDaysOverdue = promises.length > 0 
      ? promises.reduce((sum: number, p: any) => {
          const promisedDate = new Date(p.promised_date || p.promise?.promised_date || p.fecha_promesa);
          const daysOverdue = Math.floor((Date.now() - promisedDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + Math.max(0, daysOverdue);
        }, 0) / promises.length
      : 0;
    
    // Group by client
    const byClient = promises.reduce((acc: any, p: any) => {
      const clientId = p.client_id || p.cliente_id;
      if (!acc[clientId]) {
        acc[clientId] = {
          client_id: clientId,
          client_name: p.client_name || p.client?.name || `Client ${clientId}`,
          promises: [],
          total_amount: 0,
          count: 0
        };
      }
      
      acc[clientId].promises.push(p);
      acc[clientId].total_amount += p.amount || p.promise?.amount || p.monto_prometido || 0;
      acc[clientId].count += 1;
      
      return acc;
    }, {});
    
    res.json({
      filter: {
        days_overdue_minimum: daysOverdue || 0
      },
      summary: {
        total_broken_promises: promises.length,
        total_amount: totalAmount,
        avg_days_overdue: Math.round(avgDaysOverdue * 100) / 100,
        unique_clients: Object.keys(byClient).length
      },
      promises: promises.map((p: any) => ({
        promise_id: p.promise_id || p.id,
        client_id: p.client_id || p.cliente_id,
        client_name: p.client_name || p.client?.name || `Client ${p.client_id || p.cliente_id}`,
        amount: p.amount || p.promise?.amount || p.monto_prometido,
        promised_date: p.promised_date || p.promise?.promised_date || p.fecha_promesa,
        days_overdue: p.days_overdue || Math.max(0, Math.floor((Date.now() - new Date(p.promised_date || p.promise?.promised_date || p.fecha_promesa).getTime()) / (1000 * 60 * 60 * 24)))
      })),
      by_client: Object.values(byClient),
      source: result.source,
      search_query: result.search_query,
      total_results: result.total_broken_promises
    });
  } catch (error) {
    console.error('❌ Error fetching broken promises:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch broken promises'
    });
  }
}

export async function bestSlots(req: Request, res: Response): Promise<void> {
  try {
    console.log('🎯 Fetching best time slots');
    
    const result = await getBestTimeSlots();
    
    if (!result.success) {
      res.status(500).json({
        error: 'Failed to fetch best time slots',
        message: result.error,
        source: result.source || 'graphiti_search'
      });
      return;
    }
    
    const slots = result.data || [];
    console.log('📊 Raw slots data:', JSON.stringify(slots, null, 2));
    
    // Parse bucket format (e.g., "tuesday:10" -> {day: "tuesday", hour: 10})
    const formattedSlots = slots.map((slot: any) => {
      // Handle both mock data format and Graphiti format
      const bucket = slot.bucket || slot.bs?.bucket || '';
      const [day, hour] = bucket.split(':');
      const successRate = slot.success_rate || slot.bs?.success_rate || 0;
      
      return {
        bucket: bucket,
        day_of_week: day || 'unknown',
        hour: parseInt(hour, 10) || 0,
        success_rate: Math.round(successRate * 10000) / 100, // Convert to percentage
        total_interactions: slot.total_interactions || slot.bs?.total_interactions || 0,
        successful_interactions: slot.successful_interactions || slot.bs?.successful_interactions || 0,
        recommendation: successRate > 0.7 ? 'Highly Recommended' :
                       successRate > 0.5 ? 'Recommended' : 'Consider'
      };
    });
    
    // Group by day of week
    const byDay = formattedSlots.reduce((acc: any, slot: any) => {
      if (!acc[slot.day_of_week]) {
        acc[slot.day_of_week] = [];
      }
      acc[slot.day_of_week].push(slot);
      return acc;
    }, {});
    
    // Find overall best slot
    const bestSlot = formattedSlots.reduce((best: any, current: any) => {
      if (!best || current.success_rate > best.success_rate) {
        return current;
      }
      return best;
    }, null);
    
    res.json({
      summary: {
        total_time_slots_analyzed: formattedSlots.length,
        best_overall_slot: bestSlot,
        avg_success_rate: formattedSlots.length > 0 
          ? Math.round(formattedSlots.reduce((sum: number, s: any) => sum + s.success_rate, 0) / formattedSlots.length * 100) / 100
          : 0
      },
      time_slots: formattedSlots,
      by_day_of_week: byDay,
      recommendations: {
        peak_hours: formattedSlots.filter((s: any) => s.success_rate >= 70),
        avoid_hours: formattedSlots.filter((s: any) => s.success_rate < 30)
      },
      source: result.source,
      search_query: result.search_query,
      total_slots: result.total_slots
    });
  } catch (error) {
    console.error('❌ Error fetching best time slots:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch best time slots'
    });
  }
}

// Route definitions
router.get('/promesas-incumplidas', brokenPromises);
router.get('/mejores-horarios', bestSlots);

export default router;