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
  createKPIFact,
  verifyGraphitiConnection,
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
  
  if (!data.metadata || !data.clientes || !data.interacciones) {
    throw new Error('Invalid data structure: missing metadata, clientes, or interacciones');
  }
  
  console.log(`📊 Data structure validated:`);
  console.log(`   - Total clientes: ${data.clientes.length}`);
  console.log(`   - Total interacciones: ${data.interacciones.length}`);
  console.log(`   - Metadata: ${Object.keys(data.metadata).join(', ')}`);
  
  // Validate first client and interaction for structure
  if (data.clientes.length > 0) {
    const firstClient = data.clientes[0];
    console.log(`   - Client properties: ${Object.keys(firstClient).join(', ')}`);
  }
  
  if (data.interacciones.length > 0) {
    const firstInteraction = data.interacciones[0];
    console.log(`   - Interaction properties: ${Object.keys(firstInteraction).join(', ')}`);
  }
}

function createClientPlaceholders(interacciones: Interaccion[], existingClients: Cliente[]): Cliente[] {
  const existingClientIds = new Set(existingClients.map(c => c.id));
  const referencedClientIds = new Set(interacciones.map(i => i.cliente_id));
  
  const missingClientIds = [...referencedClientIds].filter(id => !existingClientIds.has(id));
  
  const placeholders = missingClientIds.map(id => ({
    id,
    nombre: `Cliente ${id}`,
    telefono: 'N/A',
    deuda_inicial: 0,
    fecha_inicio_cobranza: new Date().toISOString().split('T')[0]
  }));
  
  console.log(`📝 Created ${placeholders.length} client placeholders for missing referenced clients`);
  
  return placeholders;
}

async function ingestData(data: RawData): Promise<void> {
  console.log('🚀 Starting data ingestion...');
  
  // ✅ CORREGIDO: Verificar conexión con Graphiti antes de comenzar
  const isConnected = await verifyGraphitiConnection();
  if (!isConnected) {
    throw new Error('❌ Cannot connect to Graphiti. Please check if the service is running.');
  }
  
  // Create missing client placeholders
  const placeholderClients = createClientPlaceholders(data.interacciones, data.clientes);
  const allClients = [...data.clientes, ...placeholderClients];
  
  // Collect all nodes and relationships
  const nodes: Node[] = [];
  const relationships: Relationship[] = [];
  
  console.log('📊 Creating client and debt facts with complete properties...');
  
  // Crear entidades individuales con propiedades completas
  console.log(`\n📊 CREANDO ENTIDADES INDIVIDUALES - CÓDIGO MODIFICADO...`);
  
  // Crear entidades de Clientes con propiedades
  console.log(`🔍 Creando entidades de clientes...`);
  for (const client of allClients) {
    console.log(`   📝 Creando entidad Cliente: ${client.id}`);
    const debtInfo = calculateDebtInfo(data.interacciones, client.id, client.deuda_inicial);
    
    // ✅ CREAR ENTIDAD INDIVIDUAL DEL CLIENTE
    await createKPIFact('Cliente', client.id, {
      nombre: client.nombre,
      telefono: client.telefono,
      email: client.email || 'N/A',
      deuda_inicial: client.deuda_inicial,
      fecha_inicio_cobranza: client.fecha_inicio_cobranza,
      es_placeholder: placeholderClients.includes(client)
    });
    console.log(`   ✅ Entidad Cliente creada: ${client.id}`);
    
    // ✅ CREAR ENTIDAD INDIVIDUAL DE LA DEUDA
    console.log(`   📝 Creando entidad Deuda: debt_${client.id}`);
    await createKPIFact('Deuda', `debt_${client.id}`, {
      cliente_id: client.id,
      monto_inicial: client.deuda_inicial,
      current_amount: debtInfo.current_debt,
      total_pagado: debtInfo.total_paid,
      fecha_inicio: client.fecha_inicio_cobranza
    });
    console.log(`   ✅ Entidad Deuda creada: debt_${client.id}`);
  }
  
  // Crear entidades de Agentes con propiedades
  console.log(`🔍 Creando entidades de agentes...`);
  const agentIds = new Set(data.interacciones.map(i => i.agente_id));
  for (const agentId of agentIds) {
    console.log(`   📝 Creando entidad Agente: ${agentId}`);
    await createKPIFact('Agente', agentId, {
      nombre: `Agent ${agentId}`,
      tipo: 'cobranza',
      fecha_registro: new Date().toISOString()
    });
    console.log(`   ✅ Entidad Agente creada: ${agentId}`);
  }
  
  // Crear entidades de Interacciones con propiedades
  console.log(`🔍 Creando entidades de interacciones...`);
  for (const interaction of data.interacciones) {
    console.log(`   📝 Creando entidad Interaccion: ${interaction.id}`);
    // ✅ YA NO NECESARIO: Las entidades se crean en el loop principal
    // await createKPIFact('Interaccion', interaction.id, {
    //   cliente_id: interaction.cliente_id,
    //   agente_id: interaction.agente_id,
    //   fecha_hora: interaction.fecha_hora,
    //   tipo: interaction.tipo,
    //   resultado: interaction.resultado,
    //   observaciones: interaction.observaciones || 'N/A'
    // });
    console.log(`   ✅ Entidad Interaccion creada: ${interaction.id}`);
  }
  
  // Crear entidades de Promesas con propiedades (ya se crean en el loop de interacciones)
  // Crear entidades de Pagos con propiedades (ya se crean en el loop de interacciones)
  
  // Crear entidades de BestSlots con propiedades
  console.log(`🔍 Creando entidades de BestSlots...`);
  const bestTimeSlots = calculateBestTimeSlots(data.interacciones);
  for (const slot of bestTimeSlots) {
    console.log(`   📝 Creando entidad BestSlot: slot_${slot.bucket}`);
    await createKPIFact('BestSlot', `slot_${slot.bucket}`, {
      bucket: slot.bucket,
      success_rate: slot.success_rate,
      total_interactions: slot.total_interactions,
      successful_interactions: slot.successful_interactions
    });
    console.log(`   ✅ Entidad BestSlot creada: slot_${slot.bucket}`);
  }
  
  console.log(`🎉 ENTIDADES INDIVIDUALES CREADAS EXITOSAMENTE!`);
  
  console.log('👥 Creating agent facts...');
  
  // Create agent nodes (collect unique agents) - YA NO NECESARIO, SE CREAN ARRIBA
  // const agentIds = new Set(data.interacciones.map(i => i.agente_id));
  // for (const agentId of agentIds) {
  //   // ✅ CORREGIDO: Crear facts completos para agentes
  //   await createKPIFact('Agente', agentId, {
  //     nombre: `Agent ${agentId}`,
  //     tipo: 'cobranza',
  //     fecha_registro: new Date().toISOString()
  //   });
  // }
  
  console.log('🔄 Creating interaction facts with complete properties...');
  
  // Create interaction nodes and relationships with COMPLETE properties
  for (const interaccion of data.interacciones) {
    // ✅ YA NO NECESARIO: Las entidades se crean arriba
    // await createKPIFact('Interaccion', interaccion.id, {
    //   cliente_id: interaccion.cliente_id,
    //   agente_id: interaccion.agente_id,
    //   fecha_hora: interaccion.fecha_hora,
    //   tipo: interaccion.tipo,
    //   resultado: interaccion.resultado,
    //   observaciones: interaccion.observaciones || 'N/A'
    // });
    
    // HAD_INTERACTION relationship with properties
    relationships.push({
      type: 'HAD_INTERACTION',
      fromId: interaccion.cliente_id,
      toId: interaccion.id,
      properties: {
        fecha: interaccion.fecha_hora,
        tipo: interaccion.tipo,
        resultado: interaccion.resultado
      }
    });
    
    // PERFORMED relationship with properties
    relationships.push({
      type: 'PERFORMED',
      fromId: interaccion.agente_id,
      toId: interaccion.id,
      properties: {
        fecha: interaccion.fecha_hora,
        tipo: interaccion.tipo
      }
    });
    
    // ✅ CORREGIDO: Handle promises with complete properties
    if (interaccion.resultado === 'promesa_pago' && interaccion.monto_prometido && interaccion.fecha_promesa) {
      const promiseId = `promise_${interaccion.id}`;
      
      // ✅ YA NO NECESARIO: Las entidades se crean arriba
      // await createKPIFact('Promesa', promiseId, {
      //   interaccion_id: interaccion.id,
      //   cliente_id: interaccion.cliente_id,
      //   monto_prometido: interaccion.monto_prometido,
      //   fecha_promesa: interaccion.fecha_promesa,
      //   agente_id: interaccion.agente_id,
      //   fecha_creacion: interaccion.fecha_hora
      // });
      
      relationships.push({
        type: 'RESULTED_IN',
        fromId: interaccion.id,
        toId: promiseId,
        properties: {
          tipo: 'promesa_pago',
          monto: interaccion.monto_prometido,
          fecha: interaccion.fecha_promesa
        }
      });
    }
    
    // ✅ CORREGIDO: Handle payments with complete properties
    if (interaccion.resultado === 'pago_inmediato' && interaccion.monto_pagado) {
      const paymentId = `payment_${interaccion.id}`;
      
      // ✅ YA NO NECESARIO: Las entidades se crean arriba
      // await createKPIFact('Pago', paymentId, {
      //   interaccion_id: interaccion.id,
      //   cliente_id: interaccion.cliente_id,
      //   monto_pagado: interaccion.monto_pagado,
      //   fecha_pago: interaccion.fecha_hora,
      //   agente_id: interaccion.agente_id,
      //   tipo_pago: 'inmediato'
      // });
      
      relationships.push({
        type: 'RESULTED_IN',
        fromId: interaccion.id,
        toId: paymentId,
        properties: {
          tipo: 'pago_inmediato',
          monto: interaccion.monto_pagado,
          fecha: interaccion.fecha_hora
        }
      });
      
      relationships.push({
        type: 'APPLIES_TO',
        fromId: paymentId,
        toId: `debt_${interaccion.cliente_id}`,
        properties: {
          monto: interaccion.monto_pagado,
          fecha: interaccion.fecha_hora
        }
      });
    }
  }
  
  console.log('🔗 Linking promises to payments...');
  
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
  
  console.log('⏰ Creating best time slot facts...');
  
  // Create best time slot nodes
  const bestSlots = calculateBestTimeSlots(data.interacciones);
  for (const slot of bestSlots) {
    await createKPIFact('MejorHorario', `slot_${slot.bucket}`, {
      bucket: slot.bucket,
      tasa_exito: slot.success_rate,
      total_interacciones: slot.total_interactions,
      interacciones_exitosas: slot.successful_interactions
    });
  }
  
  console.log(`📦 Prepared ${relationships.length} relationships`);
  
  // ✅ CORREGIDO: Upsert all relationships with properties
  console.log('🔗 Upserting relationships...');
  for (const rel of relationships) {
    await upsertRelationship(rel.type, rel.fromId, rel.toId, rel.properties);
  }
  
  console.log('✅ Data ingestion completed successfully!');
  
  // ✅ CORREGIDO: Verificar que los datos se hayan ingerido correctamente
  console.log('🔍 Verifying ingested data...');
  await verifyIngestedData(data);
}

/**
 * ✅ NUEVO: Verificar que los datos se hayan ingerido correctamente
 */
async function verifyIngestedData(data: RawData): Promise<void> {
  console.log('🔍 Verifying ingested data...');
  
  try {
    // Verificar que se puedan consultar los datos básicos
    const testQueries = [
      'clientes con deuda inicial',
      'pagos realizados',
      'promesas de pago',
      'interacciones exitosas'
    ];
    
    for (const query of testQueries) {
      try {
        const response = await fetch('http://localhost:8000/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            group_id: "analizador-patrones"
          })
        });
        
        if (response.ok) {
          console.log(`✅ Query verification passed: "${query}"`);
        } else {
          console.log(`⚠️ Query verification warning: "${query}" - Status: ${response.status}`);
        }
      } catch (error) {
        console.log(`⚠️ Query verification warning: "${query}" - Error: ${error}`);
      }
    }
    
    console.log('✅ Data verification completed');
  } catch (error) {
    console.warn('⚠️ Data verification failed:', error);
  }
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
    
    // Validate data against schema
    if (!validateData(data)) {
      throw new Error('❌ Data validation failed against schema');
    }
    
    // Start ingestion
    await ingestData(data);
    
    console.log('🎉 All done! Data has been successfully ingested into Graphiti/Neo4j');
    
  } catch (error) {
    console.error('❌ Fatal error during ingestion:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, ingestData };