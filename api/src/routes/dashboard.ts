import { Router, type Request, type Response } from 'express';
import { searchGraph } from '../graphitiClient.js';
import { logger } from '../utils/logger.js';
import { processGraphitiFacts } from '../utils/fact-processor.js';
import { GRAPHITI_QUERIES, buildDynamicQuery } from '../utils/graphiti-queries.js';

const router: any = Router();

interface DashboardQueryParams {
  desde?: string;
  hasta?: string;
  tipo_deuda?: string;
  agente_id?: string;
  groupBy?: string;
  sort?: string;
}

// Función helper para validar fechas
function validateDateRange(desde: string, hasta: string): boolean {
  if (!desde || !hasta) return true; // Permitir sin filtros de fecha
  const desdeDate = new Date(desde);
  const hastaDate = new Date(hasta);
  return !isNaN(desdeDate.getTime()) && !isNaN(hastaDate.getTime()) && desdeDate <= hastaDate;
}

// Función helper para calcular delta vs período anterior
function calculateDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 100) / 100;
}

// 1. KPIs del Dashboard
export async function getDashboardKPIs(req: Request, res: Response): Promise<void> {
  try {
    const { /*desde,*/ hasta, tipo_deuda, agente_id } = req.query as unknown as DashboardQueryParams;
    const desde = "2016-01-01"
    if (desde && hasta && !validateDateRange(desde, hasta)) {
      res.status(400).json({
        error: 'Invalid date range',
        message: 'desde and hasta must be valid dates in YYYY-MM-DD format'
      });
      return;
    }

    logger.info('API', 'Fetching dashboard KPIs', { desde, hasta, tipo_deuda, agente_id });

    // Construir query semántica para Graphiti
    const query = buildDynamicQuery({ desde, hasta, tipo_deuda, agente_id });
    
    // Obtener datos de Graphiti
    const result = await searchGraph({ 
      query: query + " " + GRAPHITI_QUERIES.kpis,
      group_id: "analizador-patrones"
    });

    if (!result || !result.facts || result.facts.length === 0) {
      logger.warn('API', 'No facts returned from Graphiti for KPIs');
      res.status(404).json({
        error: 'No data available',
        message: 'No dashboard data found for the specified criteria'
      });
      return;
    }

    // Procesar facts para extraer KPIs
    const dashboardData = await processGraphitiFacts(result.facts);
    
    res.json({
      success: true,
      data: dashboardData.kpis,
      metadata: {
        totalFacts: result.facts.length,
        query: query,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    logger.error('API', 'Error fetching dashboard KPIs', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch dashboard KPIs'
    });
  }
}

// 2. Actividad por Tiempo
export async function getDashboardActivity(req: Request, res: Response): Promise<void> {
  try {
    const { desde, hasta, tipo_deuda, agente_id } = req.query as unknown as DashboardQueryParams;
    
    if (desde && hasta && !validateDateRange(desde, hasta)) {
      res.status(400).json({
        error: 'Invalid date range',
        message: 'desde and hasta must be valid dates in YYYY-MM-DD format'
      });
      return;
    }

    logger.info('API', 'Fetching dashboard activity data', { desde, hasta, tipo_deuda, agente_id });

    const query = buildDynamicQuery({ desde, hasta, tipo_deuda, agente_id });
    
    const result = await searchGraph({ 
      query: query + " " + GRAPHITI_QUERIES.activity,
      group_id: "analizador-patrones"
    });

    if (!result || !result.facts || result.facts.length === 0) {
      res.status(404).json({
        error: 'No data available',
        message: 'No activity data found'
      });
      return;
    }

    const dashboardData = await processGraphitiFacts(result.facts);
    
    res.json({
      success: true,
      data: dashboardData.activity,
      metadata: {
        totalFacts: result.facts.length,
        query: query,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    logger.error('API', 'Error fetching dashboard activity', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch activity data'
    });
  }
}

// 3. Mejores Horarios
export async function getDashboardBestHours(req: Request, res: Response): Promise<void> {
  try {
    const { desde, hasta, tipo_deuda, agente_id } = req.query as unknown as DashboardQueryParams;
    
    if (desde && hasta && !validateDateRange(desde, hasta)) {
      res.status(400).json({
        error: 'Invalid date range',
        message: 'desde and hasta must be valid dates in YYYY-MM-DD format'
      });
      return;
    }

    logger.info('API', 'Fetching dashboard best hours data', { desde, hasta, tipo_deuda, agente_id });

    const query = buildDynamicQuery({ desde, hasta, tipo_deuda, agente_id });
    
    const result = await searchGraph({ 
      query: query + " " + GRAPHITI_QUERIES.bestHours,
      group_id: "analizador-patrones"
    });

    if (!result || !result.facts || result.facts.length === 0) {
      res.status(404).json({
        error: 'No data available',
        message: 'No best hours data found'
      });
      return;
    }

    const dashboardData = await processGraphitiFacts(result.facts);
    
    res.json({
      success: true,
      data: dashboardData.bestHours,
      metadata: {
        totalFacts: result.facts.length,
        query: query,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    logger.error('API', 'Error fetching dashboard best hours', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch best hours data'
    });
  }
}

// 4. Embudo de Cobranza
export async function getDashboardFunnel(req: Request, res: Response): Promise<void> {
  try {
    const { desde, hasta, tipo_deuda, agente_id } = req.query as unknown as DashboardQueryParams;
    
    if (desde && hasta && !validateDateRange(desde, hasta)) {
      res.status(400).json({
        error: 'Invalid date range',
        message: 'desde and hasta must be valid dates in YYYY-MM-DD format'
      });
      return;
    }

    logger.info('API', 'Fetching dashboard funnel data', { desde, hasta, tipo_deuda, agente_id });

    const query = buildDynamicQuery({ desde, hasta, tipo_deuda, agente_id });
    
    const result = await searchGraph({ 
      query: query + " " + GRAPHITI_QUERIES.funnel,
      group_id: "analizador-patrones"
    });

    if (!result || !result.facts || result.facts.length === 0) {
      res.status(404).json({
        error: 'No data available',
        message: 'No funnel data found'
      });
      return;
    }

    const dashboardData = await processGraphitiFacts(result.facts);
    
    res.json({
      success: true,
      data: dashboardData.funnel,
      metadata: {
        totalFacts: result.facts.length,
        query: query,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    logger.error('API', 'Error fetching dashboard funnel', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch funnel data'
    });
  }
}

// 5. Efectividad de Agentes
export async function getDashboardAgents(req: Request, res: Response): Promise<void> {
  try {
    const { desde, hasta, tipo_deuda, agente_id } = req.query as unknown as DashboardQueryParams;
    
    if (desde && hasta && !validateDateRange(desde, hasta)) {
      res.status(400).json({
        error: 'Invalid date range',
        message: 'desde and hasta must be valid dates in YYYY-MM-DD format'
      });
      return;
    }

    logger.info('API', 'Fetching dashboard agents data', { desde, hasta, tipo_deuda, agente_id });

    const query = buildDynamicQuery({ desde, hasta, tipo_deuda, agente_id });
    
    const result = await searchGraph({ 
      query: query + " " + GRAPHITI_QUERIES.agents,
      group_id: "analizador-patrones"
    });

    if (!result || !result.facts || result.facts.length === 0) {
      res.status(404).json({
        error: 'No data available',
        message: 'No agents data found'
      });
      return;
    }

    const dashboardData = await processGraphitiFacts(result.facts);
    
    res.json({
      success: true,
      data: dashboardData.agents,
      metadata: {
        totalFacts: result.facts.length,
        query: query,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    logger.error('API', 'Error fetching dashboard agents', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch agents data'
    });
  }
}

// 6. Promesas en Riesgo
export async function getDashboardPromisesRisk(req: Request, res: Response): Promise<void> {
  try {
    const { desde, hasta, tipo_deuda, agente_id } = req.query as unknown as DashboardQueryParams;
    
    if (desde && hasta && !validateDateRange(desde, hasta)) {
      res.status(400).json({
        error: 'Invalid date range',
        message: 'desde and hasta must be valid dates in YYYY-MM-DD format'
      });
      return;
    }

    logger.info('API', 'Fetching dashboard promises risk data', { desde, hasta, tipo_deuda, agente_id });

    const query = buildDynamicQuery({ desde, hasta, tipo_deuda, agente_id });
    
    const result = await searchGraph({ 
      query: query + " " + GRAPHITI_QUERIES.promisesRisk,
      group_id: "analizador-patrones"
    });

    if (!result || !result.facts || result.facts.length === 0) {
      res.status(404).json({
        error: 'No data available',
        message: 'No promises risk data found'
      });
      return;
    }

    const dashboardData = await processGraphitiFacts(result.facts);
    
    res.json({
      success: true,
      data: dashboardData.promisesRisk,
      metadata: {
        totalFacts: result.facts.length,
        query: query,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    logger.error('API', 'Error fetching dashboard promises risk', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch promises risk data'
    });
  }
}

// 7. Sentimiento y Fricción
export async function getDashboardSentiment(req: Request, res: Response): Promise<void> {
  try {
    const { desde, hasta, tipo_deuda, agente_id } = req.query as unknown as DashboardQueryParams;
    
    if (desde && hasta && !validateDateRange(desde, hasta)) {
      res.status(400).json({
        error: 'Invalid date range',
        message: 'desde and hasta must be valid dates in YYYY-MM-DD format'
      });
      return;
    }

    logger.info('API', 'Fetching dashboard sentiment data', { desde, hasta, tipo_deuda, agente_id });

    const query = buildDynamicQuery({ desde, hasta, tipo_deuda, agente_id });
    
    const result = await searchGraph({ 
      query: query + " " + GRAPHITI_QUERIES.sentiment,
      group_id: "analizador-patrones"
    });

    if (!result || !result.facts || result.facts.length === 0) {
      res.status(404).json({
        error: 'No data available',
        message: 'No sentiment data found'
      });
      return;
    }

    const dashboardData = await processGraphitiFacts(result.facts);
    
    res.json({
      success: true,
      data: dashboardData.sentiment,
      metadata: {
        totalFacts: result.facts.length,
        query: query,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    logger.error('API', 'Error fetching dashboard sentiment', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch sentiment data'
    });
  }
}

// 8. Última Actividad
export async function getDashboardLastActivity(req: Request, res: Response): Promise<void> {
  try {
    const { desde, hasta, tipo_deuda, agente_id } = req.query as unknown as DashboardQueryParams;
    
    if (desde && hasta && !validateDateRange(desde, hasta)) {
      res.status(400).json({
        error: 'Invalid date range',
        message: 'desde and hasta must be valid dates in YYYY-MM-DD format'
      });
      return;
    }

    logger.info('API', 'Fetching dashboard last activity data', { desde, hasta, tipo_deuda, agente_id });

    const query = buildDynamicQuery({ desde, hasta, tipo_deuda, agente_id });
    
    const result = await searchGraph({ 
      query: query + " " + GRAPHITI_QUERIES.lastActivity,
      group_id: "analizador-patrones"
    });

    if (!result || !result.facts || result.facts.length === 0) {
      res.status(404).json({
        error: 'No data available',
        message: 'No last activity data found'
      });
      return;
    }

    const dashboardData = await processGraphitiFacts(result.facts);
    
    res.json({
      success: true,
      data: dashboardData.lastActivity,
      metadata: {
        totalFacts: result.facts.length,
        query: query,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    logger.error('API', 'Error fetching dashboard last activity', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch last activity data'
    });
  }
}

// 9. Dashboard Completo (todos los datos)
export async function getDashboardComplete(req: Request, res: Response): Promise<void> {
  try {
    const { desde, hasta, tipo_deuda, agente_id } = req.query as unknown as DashboardQueryParams;
    
    if (desde && hasta && !validateDateRange(desde, hasta)) {
      res.status(400).json({
        error: 'Invalid date range',
        message: 'desde and hasta must be valid dates in YYYY-MM-DD format'
      });
      return;
    }

    logger.info('API', 'Fetching complete dashboard data', { desde, hasta, tipo_deuda, agente_id });

    const query = buildDynamicQuery({ desde, hasta, tipo_deuda, agente_id });
    
    const result = await searchGraph({ 
      query: query + " " + GRAPHITI_QUERIES.dashboard,
      group_id: "analizador-patrones"
    });

    if (!result || !result.facts || result.facts.length === 0) {
      res.status(404).json({
        error: 'No data available',
        message: 'No dashboard data found'
      });
      return;
    }

    const dashboardData = await processGraphitiFacts(result.facts);
    
    res.json({
      success: true,
      data: dashboardData,
      metadata: {
        totalFacts: result.facts.length,
        query: query,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    logger.error('API', 'Error fetching complete dashboard data', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch complete dashboard data'
    });
  }
}

// Registrar todas las rutas
router.get('/kpis', getDashboardKPIs);
router.get('/activity', getDashboardActivity);
router.get('/best-hours', getDashboardBestHours);
router.get('/funnel', getDashboardFunnel);
router.get('/agents', getDashboardAgents);
router.get('/promises-risk', getDashboardPromisesRisk);
router.get('/sentiment', getDashboardSentiment);
router.get('/last-activity', getDashboardLastActivity);
router.get('/complete', getDashboardComplete);

export default router;
