import { readFile } from 'fs/promises';
import { join } from 'path';
import { validateData } from './schema.js';
import { 
  linkPromisesToPayments, 
  calculateBestTimeSlots, 
  calculateDebtInfo 
} from './derive.js';
import { 
  upsertNode, 
  upsertRelationship, 
  checkGraphitiHealth, 
  type Node, 
  type Relationship 
} from './graphitiClient.js';
import type { RawData, Cliente, Interaccion } from './types.js';

async function loadData(): Promise<RawData> {
  // Try multiple locations: current dir, parent dir, or specific path
  const possiblePaths = [
    join(process.cwd(), 'interacciones_clientes.json'),
    join(process.cwd(), '..', 'interacciones_clientes.json'),
    'interacciones_clientes.json'
  ];
  
  let filePath = '';
  let rawData = '';
  
  for (const path of possiblePaths) {
    try {
      filePath = path;
      rawData = await readFile(path, 'utf-8');
      break;
    } catch (error) {
      // Try next path
      continue;
    }
  }
  
  if (!rawData) {
    throw new Error(`Failed to load data from any of the following locations: ${possiblePaths.join(', ')}`);
  }
  
  try {
    console.log(`📁 Loading data from: ${filePath}`);
    const data = JSON.parse(rawData);
    
    console.log('✅ Data loaded successfully');
    return data;
  } catch (error) {
    console.error('❌ Error parsing data file:', error);
    throw new Error(`Failed to parse data from ${filePath}. Make sure it's valid JSON.`);
  }
}

function validateDataStructure(data: RawData): void {
  console.log('🔍 Validating data structure...');
  
  const isValid = validateData(data);
  
  if (!isValid) {
    console.error('❌ Data validation failed:');
    console.error(JSON.stringify(validateData.errors, null, 2));
    throw new Error('Data validation failed. Check the schema requirements.');
  }
  
  console.log('✅ Data validation passed');
  console.log(`📊 Metadata:`, data.metadata);
  console.log(`👥 Clients: ${data.clientes.length}`);
  console.log(`📞 Interactions: ${data.interacciones.length}`);
}

function createClientPlaceholders(interacciones: Interaccion[], existingClients: Cliente[]): Cliente[] {
  const existingClientIds = new Set(existingClients.map(c => c.id));
  const missingClientIds = new Set<string>();
  
  // Find missing client IDs
  for (const interaccion of interacciones) {
    if (!existingClientIds.has(interaccion.cliente_id)) {
      missingClientIds.add(interaccion.cliente_id);
    }
  }
  
  const placeholders: Cliente[] = [];
  
  for (const clientId of missingClientIds) {
    console.warn(`⚠️  Creating placeholder for missing client: ${clientId}`);
    placeholders.push({
      id: clientId,
      nombre: `Cliente ${clientId} (Placeholder)`,
      telefono: 'N/A',
      email: undefined,
      deuda_inicial: 0,
      fecha_inicio_cobranza: new Date().toISOString()
    });
  }
  
  return placeholders;
}

async function ingestData(data: RawData): Promise<void> {
  console.log('🚀 Starting data ingestion...');
  
  // Create missing client placeholders
  const placeholderClients = createClientPlaceholders(data.interacciones, data.clientes);
  const allClients = [...data.clientes, ...placeholderClients];
  
  // Collect all nodes and relationships
  const nodes: Node[] = [];
  const relationships: Relationship[] = [];
  
  // Create client nodes and debt info
  for (const client of allClients) {
    const debtInfo = calculateDebtInfo(data.interacciones, client.id, client.deuda_inicial);
    
    nodes.push({
      label: 'Client',
      id: client.id,
      properties: {
        name: client.nombre,
        phone: client.telefono,
        email: client.email,
        initial_debt: client.deuda_inicial,
        current_debt: debtInfo.current_debt,
        total_paid: debtInfo.total_paid,
        start_date: client.fecha_inicio_cobranza,
        is_placeholder: placeholderClients.includes(client)
      }
    });
    
    // Create debt node
    nodes.push({
      label: 'Debt',
      id: `debt_${client.id}`,
      properties: {
        client_id: client.id,
        initial_amount: client.deuda_inicial,
        current_amount: debtInfo.current_debt,
        total_paid: debtInfo.total_paid
      }
    });
    
    // Create OWNS relationship
    relationships.push({
      type: 'OWNS',
      fromId: client.id,
      toId: `debt_${client.id}`
    });
  }
  
  // Create agent nodes (collect unique agents)
  const agentIds = new Set(data.interacciones.map(i => i.agente_id));
  for (const agentId of agentIds) {
    nodes.push({
      label: 'Agent',
      id: agentId,
      properties: {
        name: `Agent ${agentId}`
      }
    });
  }
  
  // Create interaction nodes and relationships
  for (const interaccion of data.interacciones) {
    nodes.push({
      label: 'Interaction',
      id: interaccion.id,
      properties: {
        client_id: interaccion.cliente_id,
        agent_id: interaccion.agente_id,
        datetime: interaccion.fecha_hora,
        type: interaccion.tipo,
        result: interaccion.resultado,
        observations: interaccion.observaciones
      }
    });
    
    // HAD_INTERACTION relationship
    relationships.push({
      type: 'HAD_INTERACTION',
      fromId: interaccion.cliente_id,
      toId: interaccion.id
    });
    
    // PERFORMED relationship
    relationships.push({
      type: 'PERFORMED',
      fromId: interaccion.agente_id,
      toId: interaccion.id
    });
    
    // Handle promises
    if (interaccion.resultado === 'promesa_pago' && interaccion.monto_prometido && interaccion.fecha_promesa) {
      const promiseId = `promise_${interaccion.id}`;
      
      nodes.push({
        label: 'Promise',
        id: promiseId,
        properties: {
          interaction_id: interaccion.id,
          client_id: interaccion.cliente_id,
          amount: interaccion.monto_prometido,
          promised_date: interaccion.fecha_promesa
        }
      });
      
      relationships.push({
        type: 'RESULTED_IN',
        fromId: interaccion.id,
        toId: promiseId
      });
    }
    
    // Handle payments
    if (interaccion.resultado === 'pago_inmediato' && interaccion.monto_pagado) {
      const paymentId = `payment_${interaccion.id}`;
      
      nodes.push({
        label: 'Payment',
        id: paymentId,
        properties: {
          interaction_id: interaccion.id,
          client_id: interaccion.cliente_id,
          amount: interaccion.monto_pagado,
          payment_date: interaccion.fecha_hora
        }
      });
      
      relationships.push({
        type: 'RESULTED_IN',
        fromId: interaccion.id,
        toId: paymentId
      });
      
      relationships.push({
        type: 'APPLIES_TO',
        fromId: paymentId,
        toId: `debt_${interaccion.cliente_id}`
      });
    }
  }
  
  // Link promises to payments
  const promiseLinks = linkPromisesToPayments(data.interacciones);
  for (const link of promiseLinks) {
    for (const paymentId of link.paymentIds) {
      relationships.push({
        type: 'FULFILLED_BY',
        fromId: `promise_${link.promiseId}`,
        toId: `payment_${paymentId}`,
        properties: {
          status: link.status,
          grace_hours_used: link.graceHoursUsed
        }
      });
    }
  }
  
  // Create best time slot nodes
  const bestSlots = calculateBestTimeSlots(data.interacciones);
  for (const slot of bestSlots) {
    nodes.push({
      label: 'BestSlot',
      id: `slot_${slot.bucket}`,
      properties: {
        bucket: slot.bucket,
        success_rate: slot.success_rate,
        total_interactions: slot.total_interactions,
        successful_interactions: slot.successful_interactions
      }
    });
  }
  
  console.log(`📦 Prepared ${nodes.length} nodes and ${relationships.length} relationships`);
  
  // Upsert all nodes
  console.log('📤 Upserting nodes...');
  for (const node of nodes) {
    await upsertNode(node.label, node.id, node.properties);
  }
  
  // Upsert all relationships
  console.log('🔗 Upserting relationships...');
  for (const rel of relationships) {
    await upsertRelationship(rel.type, rel.fromId, rel.toId, rel.properties);
  }
  
  console.log('✅ Data ingestion completed successfully!');
}

async function main(): Promise<void> {
  try {
    console.log('🌟 Analizador de Patrones - Data Ingestion');
    console.log('==========================================');
    
    // Check Graphiti health
    const isHealthy = await checkGraphitiHealth();
    if (!isHealthy) {
      console.warn('⚠️  Graphiti seems to be down, but continuing with ingestion...');
    }
    
    // Load and validate data
    const data = await loadData();
    validateDataStructure(data);
    
    // Ingest data
    await ingestData(data);
    
    console.log('🎉 Ingestion process completed successfully!');
  } catch (error) {
    console.error('💥 Ingestion failed:', error);
    process.exit(1);
  }
}

// Run the main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}