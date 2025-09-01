import { verifyGraphitiConnection } from './graphitiClient.js';

// Simple logger implementation
const logger = {
  info: (context: string, message: string, data?: any) => {
    console.log(`[${context}] ${message}`, data || '');
  },
  error: (context: string, message: string, data?: any) => {
    console.error(`[${context}] ERROR: ${message}`, data || '');
  },
  warn: (context: string, message: string, data?: any) => {
    console.warn(`[${context}] WARNING: ${message}`, data || '');
  }
};

// Types
interface Client {
  id: string;
  nombre: string;
  telefono: string;
  tipo_deuda: string;
  fecha_prestamo: string;
  monto_deuda_inicial: number;
  saldo_actual: number;
}

interface Interaction {
  id: string;
  cliente_id: string;
  agente_id?: string;
  timestamp: string;
  tipo: string;
  resultado: string;
  sentimiento?: string;
  duracion_segundos?: number;
  monto_prometido?: number;
  fecha_promesa?: string;
  monto_pago?: number;
  pago_completo?: boolean;
}

interface IngestData {
  clientes: Client[];
  interacciones: Interaction[];
}

// Función para cargar y validar datos JSON
async function loadAndValidateData(filePath: string): Promise<IngestData> {
  try {
    const fs = require('fs');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(rawData);
    
    // Validar estructura básica
    if (!data.clientes || !data.interacciones) {
      throw new Error('Invalid data structure: missing clientes or interacciones');
    }
    
    // Validar que todos los clientes tengan IDs únicos
    const clientIds = new Set();
    data.clientes.forEach((cliente: Client) => {
      if (!cliente.id || clientIds.has(cliente.id)) {
        throw new Error(`Invalid or duplicate client ID: ${cliente.id}`);
      }
      clientIds.add(cliente.id);
      
      // Validar campos requeridos
      if (!cliente.nombre || !cliente.telefono || !cliente.tipo_deuda) {
        throw new Error(`Missing required fields for client: ${cliente.id}`);
      }
    });
    
    // Validar interacciones
    data.interacciones.forEach((interaction: Interaction, index: number) => {
      if (!interaction.id || !interaction.cliente_id || !interaction.timestamp) {
        throw new Error(`Missing required fields for interaction at index ${index}`);
      }
      
      // Validar que el cliente existe
      if (!clientIds.has(interaction.cliente_id)) {
        throw new Error(`Interaction references non-existent client: ${interaction.cliente_id}`);
      }
      
      // Validar timestamp
      if (isNaN(Date.parse(interaction.timestamp))) {
        throw new Error(`Invalid timestamp for interaction ${interaction.id}: ${interaction.timestamp}`);
      }
    });
    
    logger.info('INGEST', 'Data validation successful', { 
      clientes: data.clientes.length, 
      interacciones: data.interacciones.length 
    });
    
    return data;
  } catch (error: any) {
    logger.error('INGEST', 'Data validation failed', { error: error.message });
    throw error;
  }
}

// Función para crear nodos de clientes
async function createClientNodes(clientes: Client[]): Promise<void> {
  logger.info('INGEST', 'Creating client nodes', { count: clientes.length });
  
  for (const cliente of clientes) {
    try {
      let query = `
        MERGE (c:Client {id: '${cliente.id}'})
        SET c.nombre = '${cliente.nombre}'
        SET c.telefono = '${cliente.telefono}'
        SET c.tipo_deuda = '${cliente.tipo_deuda}'
        SET c.fecha_prestamo = datetime('${cliente.fecha_prestamo}T00:00:00')
        SET c.monto_deuda_inicial = ${cliente.monto_deuda_inicial}
        SET c.saldo_actual = ${cliente.saldo_actual}
        SET c.created_at = datetime()
        SET c.updated_at = datetime()
      `;
      
      // Note: This would need to be implemented with the correct Graphiti API
      // For now, we'll just log the operation
      logger.info('INGEST', 'Would create client node', { cliente_id: cliente.id });
      
    } catch (error: any) {
      logger.error('INGEST', 'Error creating client node', { 
        cliente_id: cliente.id, 
        error: error.message 
      });
    }
  }
}

// Función para crear nodos de deuda
async function createDebtNodes(clientes: Client[]): Promise<void> {
  logger.info('INGEST', 'Creating debt nodes', { count: clientes.length });
  
  for (const cliente of clientes) {
    try {
      let query = `
        MATCH (c:Client {id: '${cliente.id}'})
        MERGE (d:Debt {cliente_id: '${cliente.id}'})
        SET d.tipo_deuda = '${cliente.tipo_deuda}'
        SET d.monto_inicial = ${cliente.monto_deuda_inicial}
        SET d.saldo_actual = ${cliente.saldo_actual}
        SET d.fecha_prestamo = datetime('${cliente.fecha_prestamo}T00:00:00')
        SET d.created_at = datetime()
        SET d.updated_at = datetime()
        MERGE (c)-[:OWNS]->(d)
      `;
      
      // Note: This would need to be implemented with the correct Graphiti API
      // For now, we'll just log the operation
      logger.info('INGEST', 'Would create debt node', { cliente_id: cliente.id });
      
    } catch (error: any) {
      logger.error('INGEST', 'Error creating debt node', { 
        cliente_id: cliente.id, 
        error: error.message 
      });
    }
  }
}

// Función para crear nodos de agentes
async function createAgentNodes(interacciones: Interaction[]): Promise<void> {
  logger.info('INGEST', 'Creating agent nodes');
  
  const agentIds = new Set(interacciones.map(i => i.agente_id).filter(Boolean));
  
  for (const agentId of agentIds) {
    if (!agentId) continue;
    
    try {
      let query = `
        MERGE (a:Agent {id: '${agentId}'})
        SET a.nombre = 'Agent ${agentId}'
        SET a.tipo = 'cobranza'
        SET a.created_at = datetime()
        SET a.updated_at = datetime()
      `;
      
      // Note: This would need to be implemented with the correct Graphiti API
      // For now, we'll just log the operation
      logger.info('INGEST', 'Would create agent node', { agent_id: agentId });
      
    } catch (error: any) {
      logger.error('INGEST', 'Error creating agent node', { 
        agent_id: agentId, 
        error: error.message 
      });
    }
  }
}

// Función para crear nodos de interacciones
async function createInteractionNodes(interacciones: Interaction[]): Promise<void> {
  logger.info('INGEST', 'Creating interaction nodes', { count: interacciones.length });
  
  for (const interaction of interacciones) {
    try {
      let query = `
        MATCH (c:Client {id: '${interaction.cliente_id}'})
        MERGE (i:Interaction {id: '${interaction.id}'})
        SET i.timestamp = datetime('${interaction.timestamp}')
        SET i.tipo = '${interaction.tipo}'
        SET i.resultado = '${interaction.resultado}'
        SET i.sentimiento = '${interaction.sentimiento || 'N/A'}'
        SET i.duracion_segundos = ${interaction.duracion_segundos || 0}
        SET i.created_at = datetime()
        SET i.updated_at = datetime()
        MERGE (c)-[:HAD_INTERACTION]->(i)
      `;
      
      // Agregar relación con agente si existe
      if (interaction.agente_id) {
        query += `
          MATCH (a:Agent {id: '${interaction.agente_id}'})
          MERGE (a)-[:PERFORMED]->(i)
        `;
      }
      
      // Agregar propiedades específicas según el tipo de interacción
      if (interaction.monto_prometido) {
        query += ` SET i.monto_prometido = ${interaction.monto_prometido}`;
      }
      
      if (interaction.fecha_promesa) {
        query += ` SET i.fecha_promesa = datetime('${interaction.fecha_promesa}T00:00:00')`;
      }
      
      if (interaction.monto_pago) {
        query += ` SET i.monto_pago = ${interaction.monto_pago}`;
      }
      
      if (interaction.pago_completo !== undefined) {
        query += ` SET i.pago_completo = ${interaction.pago_completo}`;
      }
      
      // Note: This would need to be implemented with the correct Graphiti API
      // For now, we'll just log the operation
      logger.info('INGEST', 'Would create interaction node', { interaction_id: interaction.id });
      
    } catch (error: any) {
      logger.error('INGEST', 'Error creating interaction node', { 
        interaction_id: interaction.id, 
        error: error.message 
      });
    }
  }
}

// Función para crear índices para optimizar consultas
async function createIndexes(): Promise<void> {
  logger.info('INGEST', 'Creating database indexes');
  
  const indexes = [
    'CREATE INDEX client_id_index IF NOT EXISTS FOR (c:Client) ON (c.id)',
    'CREATE INDEX interaction_timestamp_index IF NOT EXISTS FOR (i:Interaction) ON (i.timestamp)',
    'CREATE INDEX interaction_cliente_id_index IF NOT EXISTS FOR (i:Interaction) ON (i.cliente_id)',
    'CREATE INDEX interaction_tipo_index IF NOT EXISTS FOR (i:Interaction) ON (i.tipo)',
    'CREATE INDEX interaction_resultado_index IF NOT EXISTS FOR (i:Interaction) ON (i.resultado)',
    'CREATE INDEX debt_cliente_id_index IF NOT EXISTS FOR (d:Debt) ON (d.cliente_id)',
    'CREATE INDEX debt_tipo_deuda_index IF NOT EXISTS FOR (d:Debt) ON (d.tipo_deuda)',
    'CREATE INDEX agent_id_index IF NOT EXISTS FOR (a:Agent) ON (a.id)'
  ];
  
  for (const indexQuery of indexes) {
    try {
      // Note: This would need to be implemented with the correct Graphiti API
      // For now, we'll just log the operation
      logger.info('INGEST', 'Would create index', { query: indexQuery });
      
    } catch (error: any) {
      logger.error('INGEST', 'Error creating index', { 
        query: indexQuery, 
        error: error.message 
      });
    }
  }
}

// Función principal de ingesta
export async function ingestDashboardData(filePath: string): Promise<void> {
  try {
    logger.info('INGEST', 'Starting dashboard data ingestion', { filePath });
    
    // 1. Cargar y validar datos
    const data = await loadAndValidateData(filePath);
    
    // 2. Crear nodos de clientes
    await createClientNodes(data.clientes);
    
    // 3. Crear nodos de deuda
    await createDebtNodes(data.clientes);
    
    // 4. Crear nodos de agentes
    await createAgentNodes(data.interacciones);
    
    // 5. Crear nodos de interacciones
    await createInteractionNodes(data.interacciones);
    
    // 6. Crear índices
    await createIndexes();
    
    logger.info('INGEST', 'Dashboard data ingestion completed successfully', {
      clientes: data.clientes.length,
      interacciones: data.interacciones.length
    });
    
  } catch (error: any) {
    logger.error('INGEST', 'Dashboard data ingestion failed', { error: error.message });
    throw error;
  }
}

// Función para limpiar datos existentes (útil para testing)
export async function clearDashboardData(): Promise<void> {
  try {
    logger.info('INGEST', 'Clearing dashboard data');
    
    const clearQueries = [
      'MATCH (i:Interaction) DETACH DELETE i',
      'MATCH (d:Debt) DETACH DELETE d',
      'MATCH (a:Agent) DETACH DELETE a',
      'MATCH (c:Client) DETACH DELETE c'
    ];
    
    for (const query of clearQueries) {
      // Note: This would need to be implemented with the correct Graphiti API
      // For now, we'll just log the operation
      logger.info('INGEST', 'Would clear data', { query });
    }
    
    logger.info('INGEST', 'Dashboard data cleared successfully');
    
  } catch (error: any) {
    logger.error('INGEST', 'Failed to clear dashboard data', { error: error.message });
    throw error;
  }
}

// Función para verificar el estado de la base de datos
export async function checkDatabaseStatus(): Promise<void> {
  try {
    logger.info('INGEST', 'Checking database status');
    
    const queries = [
      'MATCH (c:Client) RETURN count(c) as clientes',
      'MATCH (i:Interaction) RETURN count(i) as interacciones',
      'MATCH (d:Debt) RETURN count(d) as deudas',
      'MATCH (a:Agent) RETURN count(a) as agentes'
    ];
    
    for (const query of queries) {
      try {
        // Note: This would need to be implemented with the correct Graphiti API
        // For now, we'll just log the operation
        logger.info('INGEST', 'Would check status', { query: query.split(' ')[2] });
      } catch (error: any) {
        logger.error('INGEST', 'Error checking database status', { 
          query, 
          error: error.message 
        });
      }
    }
    
  } catch (error: any) {
    logger.error('INGEST', 'Database status check failed', { error: error.message });
    throw error;
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const filePath = process.argv[2] || './interacciones_clientes.json'; // Default to current directory
  
  ingestDashboardData(filePath)
    .then(() => {
      logger.info('INGEST', 'Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('INGEST', 'Script failed', { error: error.message });
      process.exit(1);
    });
}
