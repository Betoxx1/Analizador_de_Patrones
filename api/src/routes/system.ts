import { Router, type Request, type Response } from 'express';
import { searchGraph, getMemory, checkGraphitiHealth } from '../graphitiClient.js';
import { logger } from '../utils/logger.js';

const router: any = Router();

async function checkOpenAIStatus(): Promise<any> {
  try {
    logger.info('OPENAI', 'Testing API connectivity via Graphiti...');
    
    // Try to make a simple semantic search that uses OpenAI
    const testResult = await searchGraph({ 
      query: "test connection status health check",
      group_id: "analizador-patrones"
    });
    
    logger.openaiKeyStatus(true, { test_query: "semantic search test" });
    
    return {
      status: 'available',
      test_successful: true,
      message: 'OpenAI API is working correctly',
      search_results: testResult.results?.length || 0
    };
  } catch (error: any) {
    logger.error('OPENAI', 'API test failed', { error: error.message });
    
    if (error.message?.includes('insufficient_quota') || error.message?.includes('429')) {
      logger.openaiQuotaExceeded({ error: error.message, timestamp: new Date().toISOString() });
      return {
        status: 'quota_exceeded',
        test_successful: false,
        message: 'OpenAI API quota exceeded. Please check your billing and plan.',
        error: 'insufficient_quota'
      };
    } else if (error.message?.includes('401') || error.message?.includes('invalid_api_key')) {
      logger.openaiKeyStatus(false, { error: error.message });
      return {
        status: 'invalid_key',
        test_successful: false,
        message: 'OpenAI API key is invalid or missing.',
        error: 'invalid_api_key'
      };
    } else {
      logger.error('OPENAI', 'Connection error', { error: error.message });
      return {
        status: 'connection_error',
        test_successful: false,
        message: 'Unable to connect to Graphiti/OpenAI services.',
        error: error.message
      };
    }
  }
}

async function checkNeo4jDirectStatus(): Promise<any> {
  try {
    logger.info('NEO4J', 'Testing direct Neo4j connection...');
    
    const credentials = Buffer.from(`${process.env.NEO4J_USER}:${process.env.NEO4J_PASSWORD}`).toString('base64');
    const response = await fetch('http://localhost:7474/db/neo4j/tx/commit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify({
        statements: [
          { statement: 'MATCH (n) RETURN labels(n) as labels, count(n) as count ORDER BY count DESC' },
          { statement: 'MATCH ()-[r]->() RETURN count(r) as total_relationships' }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Neo4j responded with ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors && data.errors.length > 0) {
      throw new Error(data.errors[0].message);
    }

    const nodeResults = data.results[0]?.data || [];
    const relationshipResults = data.results[1]?.data || [];
    
    const totalNodes = nodeResults.reduce((sum: number, row: any) => sum + row.row[1], 0);
    const totalRelationships = relationshipResults[0]?.row[0] || 0;
    
    const nodeTypes = nodeResults.map((row: any) => ({
      labels: row.row[0],
      count: row.row[1]
    }));

    logger.neo4jConnection(true, totalNodes);

    return {
      status: 'connected',
      has_data: totalNodes > 0,
      total_nodes: totalNodes,
      total_relationships: totalRelationships,
      node_types: nodeTypes,
      message: `Neo4j connected directly with ${totalNodes} nodes, ${totalRelationships} relationships`
    };
  } catch (error: any) {
    logger.neo4jConnection(false);
    return {
      status: 'disconnected',
      has_data: false,
      total_nodes: 0,
      node_types: [],
      message: 'Unable to connect to Neo4j directly',
      error: error.message
    };
  }
}

async function checkNeo4jStatus(): Promise<any> {
  try {
    logger.info('NEO4J', 'Testing database connectivity via Graphiti...');
    
    // Use search to check if we have data
    const searchResult = await searchGraph({ 
      query: "clients agents interactions data entities payments promises"
    });
    
    const results = Array.isArray(searchResult.results) ? searchResult.results : (searchResult.results ? [searchResult.results] : []);
    const hasSearchResults = results && results.length > 0;
    const searchCount = results.length;
    
    const totalItems = searchCount;
    logger.neo4jConnection(hasSearchResults, totalItems);
    
    return {
      status: hasSearchResults ? 'connected' : 'no_data',
      has_data: hasSearchResults,
      total_nodes: totalItems,
      search_results: searchCount,
      message: totalItems > 0 ? 
        `Neo4j accessible via Graphiti with ${totalItems} items` : 
        'Neo4j accessible but no data loaded'
    };
  } catch (error: any) {
    logger.neo4jConnection(false);
    return {
      status: 'disconnected',
      has_data: false,
      total_nodes: 0,
      message: 'Unable to connect to Neo4j via Graphiti',
      error: error.message
    };
  }
}

async function checkGraphitiStatus(): Promise<any> {
  try {
    logger.info('GRAPHITI', 'Testing service health...');
    
    const isHealthy = await checkGraphitiHealth();
    
    if (isHealthy) {
      logger.graphitiHealth(true, 'http://localhost:8000/healthcheck');
      return {
        status: 'healthy',
        message: 'Graphiti service is running'
      };
    } else {
      logger.graphitiHealth(false, 'http://localhost:8000/healthcheck');
      return {
        status: 'unhealthy',
        message: 'Graphiti service is not responding correctly'
      };
    }
  } catch (error: any) {
    logger.graphitiHealth(false, 'http://localhost:8000/healthcheck');
    return {
      status: 'unreachable',
      message: 'Unable to reach Graphiti service',
      error: error.message
    };
  }
}

// Get system logs endpoint
export async function getSystemLogs(req: Request, res: Response): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const service = req.query.service as string;
    
    let logs;
    if (service) {
      logs = logger.getLogsByService(service as any, limit);
    } else {
      logs = logger.getLogs(limit);
    }
    
    res.json({
      logs,
      total: logger.getLogs().length,
      services: ['SYSTEM', 'OPENAI', 'GRAPHITI', 'NEO4J', 'API']
    });
  } catch (error) {
    console.error('❌ Error fetching logs:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch system logs'
    });
  }
}

export async function getSystemStatus(req: Request, res: Response): Promise<void> {
  try {
    logger.info('SYSTEM', 'Running comprehensive system status check...');
    
    // Check all services in parallel
    const [openaiStatus, neo4jStatus, neo4jDirectStatus, graphitiStatus] = await Promise.all([
      checkOpenAIStatus(),
      checkNeo4jStatus(), 
      checkNeo4jDirectStatus(),
      checkGraphitiStatus()
    ]);
    
    const overallStatus: any = {
      timestamp: new Date().toISOString(),
      services: {
        openai: openaiStatus,
        neo4j_via_graphiti: neo4jStatus,
        neo4j_direct: neo4jDirectStatus,
        graphiti: graphitiStatus
      },
      data_pipeline: {
        can_ingest: graphitiStatus.status === 'healthy' && openaiStatus.status === 'available',
        can_query: graphitiStatus.status === 'healthy',
        has_data: neo4jDirectStatus.has_data,
        graphiti_integration_working: neo4jStatus.has_data,
        ready_for_production: openaiStatus.status === 'available' && 
                              neo4jDirectStatus.has_data && 
                              graphitiStatus.status === 'healthy'
      },
      recommendations: []
    };
    
    // Add recommendations based on status
    if (openaiStatus.status === 'quota_exceeded') {
      overallStatus.recommendations.push('Add credits to your OpenAI account or upgrade your plan');
    }
    if (openaiStatus.status === 'invalid_key') {
      overallStatus.recommendations.push('Check your OPENAI_API_KEY environment variable');
    }
    if (!neo4jDirectStatus.has_data) {
      overallStatus.recommendations.push('Run data ingestion: pnpm ingest');
    } else if (!neo4jStatus.has_data) {
      overallStatus.recommendations.push('Neo4j has data but Graphiti integration not working properly - check Graphiti configuration');
    }
    if (graphitiStatus.status !== 'healthy') {
      overallStatus.recommendations.push('Check Graphiti service status: docker logs analizador-graphiti');
    }
    
    res.json(overallStatus);
  } catch (error) {
    console.error('❌ Error checking system status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to check system status'
    });
  }
}

export async function checkOpenAIBalance(req: Request, res: Response): Promise<any> {
  try {
    logger.info('OPENAI', 'Checking API key balance and validity...');
    
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return res.json({
        status: 'error',
        message: 'OPENAI_API_KEY no encontrada en las variables de entorno',
        has_funds: false,
        details: 'La variable de entorno OPENAI_API_KEY no está configurada'
      });
    }

    if (!apiKey.startsWith('sk-')) {
      return res.json({
        status: 'error',
        message: 'Formato de API key inválido',
        has_funds: false,
        details: 'La API key debe comenzar con "sk-"'
      });
    }

    // Test the API key by making a minimal request to OpenAI
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        logger.error('OPENAI', 'API key is invalid or expired');
        return res.json({
          status: 'error',
          message: 'API key inválida o expirada',
          has_funds: false,
          details: 'La API key proporcionada no es válida o ha expirado'
        });
      }

      if (response.status === 429) {
        logger.error('OPENAI', 'Rate limit exceeded or quota exhausted');
        return res.json({
          status: 'error',
          message: 'Límite de uso excedido o sin fondos',
          has_funds: false,
          details: 'Has alcanzado el límite de tu plan o tu cuenta no tiene créditos disponibles'
        });
      }

      if (response.status === 403) {
        logger.error('OPENAI', 'API key does not have sufficient permissions');
        return res.json({
          status: 'error',
          message: 'API key sin permisos suficientes',
          has_funds: false,
          details: 'La API key no tiene permisos para acceder a los modelos necesarios'
        });
      }

      if (!response.ok) {
        logger.error('OPENAI', `API returned status ${response.status}`);
        return res.json({
          status: 'error',
          message: `Error de API: ${response.status}`,
          has_funds: false,
          details: `La API de OpenAI respondió con status ${response.status}`
        });
      }

      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        logger.info('OPENAI', 'API key is valid and has access to models');
        return res.json({
          status: 'success',
          message: 'API key válida y con acceso',
          has_funds: true,
          details: `Acceso confirmado a ${data.data.length} modelos`,
          available_models: data.data.slice(0, 5).map((model: any) => model.id)
        });
      } else {
        return res.json({
          status: 'warning',
          message: 'API key válida pero sin modelos disponibles',
          has_funds: false,
          details: 'La API key es válida pero no tiene acceso a ningún modelo'
        });
      }

    } catch (fetchError: any) {
      logger.error('OPENAI', 'Failed to connect to OpenAI API', { error: fetchError.message });
      return res.json({
        status: 'error',
        message: 'Error de conexión con OpenAI',
        has_funds: false,
        details: `No se pudo conectar con la API: ${fetchError.message}`
      });
    }

  } catch (error: any) {
    logger.error('OPENAI', 'Error checking API key balance', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor',
      has_funds: false,
      details: error.message
    });
  }
}

export async function getNeo4jStatus(req: Request, res: Response): Promise<void> {
  try {
    const status = await checkNeo4jDirectStatus();
    res.json(status);
  } catch (error) {
    console.error('❌ Error checking Neo4j status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to check Neo4j status'
    });
  }
}

// Route definitions
router.get('/status', getSystemStatus);
router.get('/logs', getSystemLogs);
router.get('/openai-balance', checkOpenAIBalance);
router.get('/neo4j-status', getNeo4jStatus);

export default router;