import { searchGraph } from './graphitiClient.js';
import { logger } from '../api/src/utils/logger.js';
import * as fs from 'fs';
import * as path from 'path';

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
  timestamp: string;
  tipo: 'llamada_saliente' | 'llamada_entrante' | 'sms' | 'email' | 'pago';
  resultado: 'sin_respuesta' | 'con_respuesta' | 'promesa_pago' | 'pago_inmediato' | 'pago_recibido' | 'renegociacion' | 'disputa';
  sentimiento: 'cooperativo' | 'neutral' | 'frustrado' | 'hostil';
  duracion_segundos: number;
  agente_id?: string;
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
      const query = `
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
      
      const result = await searchGraph({ 
        query, 
        group_id: "analizador-patrones" 
      });
      
      if (!result) {
        logger.warn('INGEST', 'Failed to create client node', { cliente_id: cliente.id });
      }
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
      const query = `
        MATCH (c:Client {id: '${cliente.id}'})
        MERGE (d:Debt {cliente_id: '${cliente.id}'})
        SET d.tipo_deuda = '${cliente.tipo_deuda}'
        SET d.fecha_prestamo = datetime('${cliente.fecha_prestamo}T00:00:00')
        SET d.monto_deuda_inicial = ${cliente.monto_deuda_inicial}
        SET d.saldo_actual = ${cliente.saldo_actual}
        SET d.estado = CASE 
          WHEN ${cliente.saldo_actual} = 0 THEN 'PAGADA'
          WHEN ${cliente.saldo_actual} < ${cliente.monto_deuda_inicial} * 0.1 THEN 'CASI_PAGADA'
          ELSE 'ACTIVA'
        END
        SET d.created_at = datetime()
        SET d.updated_at = datetime()
        MERGE (c)-[:HAS_DEBT]->(d)
      `;
      
      const result = await searchGraph({ 
        query, 
        group_id: "analizador-patrones" 
      });
      
      if (!result) {
        logger.warn('INGEST', 'Failed to create debt node', { cliente_id: cliente.id });
      }
    } catch (error: any) {
      logger.error('INGEST', 'Error creating debt node', { 
        cliente_id: cliente.id, 
        error: error.message 
      });
    }
  }
}

// Función para crear nodos de agentes (si no existen)
async function createAgentNodes(interacciones: Interaction[]): Promise<void> {
  const agentIds = new Set<string>();
  
  interacciones.forEach(interaction => {
    if (interaction.agente_id) {
      agentIds.add(interaction.agente_id);
    }
  });
  
  logger.info('INGEST', 'Creating agent nodes', { count: agentIds.size });
  
  for (const agenteId of agentIds) {
    try {
      const query = `
        MERGE (a:Agent {id: '${agenteId}'})
        SET a.nombre = 'Agente ${agenteId}'
        SET a.created_at = datetime()
        SET a.updated_at = datetime()
      `;
      
      const result = await searchGraph({ 
        query, 
        group_id: "analizador-patrones" 
      });
      
      if (!result) {
        logger.warn('INGEST', 'Failed to create agent node', { agente_id: agenteId });
      }
    } catch (error: any) {
      logger.error('INGEST', 'Error creating agent node', { 
        agente_id: agenteId, 
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
      const query = `
        MATCH (c:Client {id: '${interaction.cliente_id}'})
        MERGE (i:Interaction {id: '${interaction.id}'})
        SET i.timestamp = datetime('${interaction.timestamp}')
        SET i.tipo = '${interaction.tipo}'
        SET i.resultado = '${interaction.resultado}'
        SET i.sentimiento = '${interaction.sentimiento}'
        SET i.duracion_segundos = ${interaction.duracion_segundos}
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
      
      const result = await searchGraph({ 
        query, 
        group_id: "analizador-patrones" 
      });
      
      if (!result) {
        logger.warn('INGEST', 'Failed to create interaction node', { interaction_id: interaction.id });
      }
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
      const result = await searchGraph({ 
        query: indexQuery, 
        group_id: "analizador-patrones" 
      });
      
      if (!result) {
        logger.warn('INGEST', 'Failed to create index', { query: indexQuery });
      }
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
    logger.info('INGEST', 'Clearing existing dashboard data');
    
    const query = `
      MATCH (n)
      DETACH DELETE n
    `;
    
    const result = await searchGraph({ 
      query, 
      group_id: "analizador-patrones" 
    });
    
    if (result) {
      logger.info('INGEST', 'Dashboard data cleared successfully');
    } else {
      logger.warn('INGEST', 'Failed to clear dashboard data');
    }
    
  } catch (error: any) {
    logger.error('INGEST', 'Error clearing dashboard data', { error: error.message });
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
        const result = await searchGraph({ 
          query, 
          group_id: "analizador-patrones" 
        });
        
        if (result && result.results && result.results.length > 0) {
          const count = result.results[0];
          logger.info('INGEST', 'Database status check', { 
            query: query.split(' ')[2], 
            count: Object.values(count)[0] 
          });
        }
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
  const filePath = process.argv[2] || path.join(process.cwd(), 'interacciones_clientes.json');
  
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
