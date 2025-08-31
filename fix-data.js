import { readFile, writeFile } from 'fs/promises';

async function fixDataStructure() {
  console.log('🔧 Fixing data structure to match schema...');
  
  // Read the current data
  const rawData = await readFile('ingest/interacciones_clientes.json', 'utf-8');
  const data = JSON.parse(rawData);
  
  console.log('📊 Current structure:', {
    metadata: Object.keys(data.metadata),
    clientsSample: Object.keys(data.clientes[0] || {}),
    interactionsSample: Object.keys(data.interacciones[0] || {})
  });
  
  // Fix metadata
  data.metadata.version = "1.0"; // Add missing version
  
  // Fix clientes structure
  data.clientes = data.clientes.map(cliente => ({
    id: cliente.id,
    nombre: cliente.nombre,
    telefono: cliente.telefono,
    email: cliente.email, // Optional, might be undefined
    deuda_inicial: cliente.monto_deuda_inicial || cliente.deuda_inicial || 0,
    fecha_inicio_cobranza: cliente.fecha_prestamo || cliente.fecha_inicio_cobranza || new Date().toISOString()
  }));
  
  // Fix interactions structure
  data.interacciones = data.interacciones.map(interaccion => {
    // Map tipo values to expected enum
    let tipo = interaccion.tipo;
    if (tipo === 'pago_recibido') tipo = 'llamada'; // Default mapping
    if (!['llamada', 'whatsapp', 'email', 'sms'].includes(tipo)) {
      tipo = 'llamada'; // Default fallback
    }
    
    // Map resultado values to expected enum  
    let resultado = interaccion.resultado || 'contacto_exitoso';
    if (interaccion.tipo === 'pago_recibido') resultado = 'pago_inmediato';
    if (!['contacto_exitoso', 'no_contacto', 'promesa_pago', 'pago_inmediato', 'renegociacion', 'negativa'].includes(resultado)) {
      resultado = 'contacto_exitoso'; // Default fallback
    }
    
    return {
      id: interaccion.id,
      cliente_id: interaccion.cliente_id,
      agente_id: interaccion.agente_id || 'agente_default',
      fecha_hora: interaccion.timestamp || interaccion.fecha_hora || new Date().toISOString(),
      tipo: tipo,
      resultado: resultado,
      monto_prometido: interaccion.monto_prometido,
      fecha_promesa: interaccion.fecha_promesa, 
      monto_pagado: interaccion.monto_pagado || (interaccion.tipo === 'pago_recibido' ? interaccion.monto : undefined),
      observaciones: interaccion.observaciones || interaccion.descripcion
    };
  });
  
  // Write the fixed data
  await writeFile('interacciones_clientes.json', JSON.stringify(data, null, 2));
  
  console.log('✅ Data structure fixed!');
  console.log('📊 New structure:', {
    metadata: Object.keys(data.metadata),
    totalClientes: data.clientes.length,
    totalInteracciones: data.interacciones.length,
    clientsSample: Object.keys(data.clientes[0] || {}),
    interactionsSample: Object.keys(data.interacciones[0] || {})
  });
}

fixDataStructure().catch(console.error);