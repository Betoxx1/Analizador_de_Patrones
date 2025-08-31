import { logger } from './logger.js';

export interface GraphitiFact {
  uuid: string;
  name: string;
  fact: string;
  valid_at: string;
  invalid_at: string | null;
  created_at: string;
  expired_at: string | null;
}

export interface KPIData {
  tasaRecuperacion: number;
  promesasCumplidas: number;
  promesasIncumplidas: number;
  contactabilidad: number;
  tiempoMedioContacto: number;
  pagoMedio: number;
  porcentajePagoCompleto: number;
  clientesEnRiesgo: number;
}

export interface ActivityData {
  totalInteracciones: number;
  contactosExitosos: number;
  pagosInmediatos: number;
  promesas: number;
  renegociaciones: number;
  sinRespuesta: number;
}

export interface BestHoursData {
  timeSlots: Array<{
    hora: string;
    contactRate: number;
    successRate: number;
    totalInteractions: number;
  }>;
  byDayOfWeek: Array<{
    dia: string;
    contactRate: number;
    successRate: number;
    totalInteractions: number;
  }>;
}

export interface FunnelData {
  intentos: number;
  respuestas: number;
  promesas: number;
  pagos: number;
  pagosCompletos: number;
}

export interface AgentData {
  agente_id: string;
  nombre: string;
  promesasCumplidas: number;
  totalPromesas: number;
  efectividad: number;
  montoTotal: number;
}

export interface PromiseRiskData {
  promesa_id: string;
  cliente_id: string;
  monto: number;
  fechaVencimiento: string;
  diasRestantes: number;
  riesgo: 'alto' | 'medio' | 'bajo';
}

export interface SentimentData {
  positivo: number;
  neutral: number;
  negativo: number;
  friccion: number;
}

export interface LastActivityData {
  ultimaInteraccion: string;
  ultimoPago: string;
  ultimaPromesa: string;
  clienteActivo: string;
}

export interface DashboardData {
  kpis: KPIData;
  activity: ActivityData;
  bestHours: BestHoursData;
  funnel: FunnelData;
  agents: AgentData[];
  promisesRisk: PromiseRiskData[];
  sentiment: SentimentData;
  lastActivity: LastActivityData;
}

export async function extractKPIsFromFacts(facts: GraphitiFact[]): Promise<KPIData> {
  let totalDeuda = 0;
  let totalPagado = 0;
  let totalPrometido = 0;
  let contactosExitosos = 0;
  let pagosInmediatos = 0;
  let promesas = 0;
  let totalInteracciones = facts.length;

  facts.forEach(factObj => {
    const fact = factObj.fact;
    
    // Extraer montos de deuda inicial
    const deudaMatch = fact.match(/deuda_inicial: (\d+)/);
    if (deudaMatch) totalDeuda += parseInt(deudaMatch[1]);

    // Extraer pagos inmediatos
    const pagoMatch = fact.match(/monto_pagado: (\d+)/);
    if (pagoMatch) totalPagado += parseInt(pagoMatch[1]);

    // Extraer promesas de pago
    const promesaMatch = fact.match(/monto_prometido: (\d+)/);
    if (promesaMatch) totalPrometido += parseInt(promesaMatch[1]);

    // Contar resultados de interacciones
    if (fact.includes('resultado: pago_inmediato')) pagosInmediatos++;
    if (fact.includes('resultado: promesa_pago')) promesas++;
    if (fact.includes('resultado: contacto_exitoso')) contactosExitosos++;
  });

  // Calcular métricas
  const tasaRecuperacion = totalDeuda > 0 ? (totalPagado / totalDeuda) * 100 : 0;
  const promesasCumplidas = totalPrometido > 0 ? (totalPagado / totalPrometido) * 100 : 0;
  const promesasIncumplidas = Math.max(0, totalPrometido - totalPagado);
  const contactabilidad = totalInteracciones > 0 ? (contactosExitosos / totalInteracciones) * 100 : 0;
  const pagoMedio = pagosInmediatos > 0 ? totalPagado / pagosInmediatos : 0;
  const porcentajePagoCompleto = totalDeuda > 0 ? (totalPagado / totalDeuda) * 100 : 0;

  // Calcular clientes en riesgo (simplificado)
  const clientesEnRiesgo = Math.floor(totalInteracciones * 0.1); // 10% de las interacciones

  // Tiempo medio de contacto (simplificado)
  const tiempoMedioContacto = 24; // horas

  logger.info('API', `KPIs extraídos: Deuda=${totalDeuda}, Pagado=${totalPagado}, Prometido=${totalPrometido}`);

  return {
    tasaRecuperacion: Math.round(tasaRecuperacion * 100) / 100,
    promesasCumplidas: Math.round(promesasCumplidas * 100) / 100,
    promesasIncumplidas: Math.round(promesasIncumplidas * 100) / 100,
    contactabilidad: Math.round(contactabilidad * 100) / 100,
    tiempoMedioContacto,
    pagoMedio: Math.round(pagoMedio * 100) / 100,
    porcentajePagoCompleto: Math.round(porcentajePagoCompleto * 100) / 100,
    clientesEnRiesgo
  };
}

export async function extractActivityFromFacts(facts: GraphitiFact[]): Promise<ActivityData> {
  let contactosExitosos = 0;
  let pagosInmediatos = 0;
  let promesas = 0;
  let renegociaciones = 0;
  let sinRespuesta = 0;

  facts.forEach(factObj => {
    const fact = factObj.fact;
    
    if (fact.includes('resultado: contacto_exitoso')) contactosExitosos++;
    else if (fact.includes('resultado: pago_inmediato')) pagosInmediatos++;
    else if (fact.includes('resultado: promesa_pago')) promesas++;
    else if (fact.includes('resultado: renegociacion')) renegociaciones++;
    else if (fact.includes('resultado: sin_respuesta')) sinRespuesta++;
  });

  return {
    totalInteracciones: facts.length,
    contactosExitosos,
    pagosInmediatos,
    promesas,
    renegociaciones,
    sinRespuesta
  };
}

export async function extractBestHoursFromFacts(facts: GraphitiFact[]): Promise<BestHoursData> {
  const timeSlots: { [hour: string]: { total: number; success: number } } = {};
  const daySlots: { [day: string]: { total: number; success: number } } = {};

  // Inicializar slots de tiempo
  for (let i = 0; i < 24; i++) {
    timeSlots[i.toString().padStart(2, '0')] = { total: 0, success: 0 };
  }

  // Inicializar días de la semana
  const dias = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  dias.forEach(dia => {
    daySlots[dia] = { total: 0, success: 0 };
  });

  facts.forEach(factObj => {
    const fact = factObj.fact;
    const timeMatch = fact.match(/fecha_hora: "([^"]+)"/);
    if (timeMatch) {
      try {
        const date = new Date(timeMatch[1]);
        const hour = date.getHours().toString().padStart(2, '0');
        const day = dias[date.getDay()] || 'lunes';
        
        timeSlots[hour].total++;
        daySlots[day].total++;

        // Considerar exitoso si es contacto exitoso, pago o promesa
        if (fact.includes('resultado: contacto_exitoso') || 
            fact.includes('resultado: pago_inmediato') || 
            fact.includes('resultado: promesa_pago')) {
          timeSlots[hour].success++;
          daySlots[day].success++;
        }
      } catch (error) {
        logger.error('API', `Error procesando fecha: ${timeMatch[1]}`, error);
      }
    }
  });

  // Convertir a arrays con métricas
  const timeSlotsArray = Object.entries(timeSlots).map(([hora, data]) => ({
    hora: `${hora}:00`,
    contactRate: data.total > 0 ? (data.total / facts.length) * 100 : 0,
    successRate: data.total > 0 ? (data.success / data.total) * 100 : 0,
    totalInteractions: data.total
  }));

  const daySlotsArray = Object.entries(daySlots).map(([dia, data]) => ({
    dia: dia.charAt(0).toUpperCase() + dia.slice(1),
    contactRate: data.total > 0 ? (data.total / facts.length) * 100 : 0,
    successRate: data.total > 0 ? (data.success / data.total) * 100 : 0,
    totalInteractions: data.total
  }));

  return {
    timeSlots: timeSlotsArray,
    byDayOfWeek: daySlotsArray
  };
}

export async function extractFunnelFromFacts(facts: GraphitiFact[]): Promise<FunnelData> {
  let intentos = facts.length;
  let respuestas = 0;
  let promesas = 0;
  let pagos = 0;
  let pagosCompletos = 0;

  facts.forEach(factObj => {
    const fact = factObj.fact;
    
    if (fact.includes('resultado: contacto_exitoso') || 
        fact.includes('resultado: pago_inmediato') || 
        fact.includes('resultado: promesa_pago') ||
        fact.includes('resultado: renegociacion')) {
      respuestas++;
    }
    
    if (fact.includes('resultado: promesa_pago')) {
      promesas++;
    }
    
    if (fact.includes('resultado: pago_inmediato')) {
      pagos++;
      pagosCompletos++; // Simplificado: pago inmediato = pago completo
    }
  });

  return {
    intentos,
    respuestas,
    promesas,
    pagos,
    pagosCompletos
  };
}

export async function extractAgentsFromFacts(facts: GraphitiFact[]): Promise<AgentData[]> {
  const agentStats: { [key: string]: { promesas: number; pagos: number; montoTotal: number } } = {};

  facts.forEach(factObj => {
    const fact = factObj.fact;
    const agenteMatch = fact.match(/agente_id: "([^"]+)"/);
    if (agenteMatch) {
      const agenteId = agenteMatch[1];
      
      if (!agentStats[agenteId]) {
        agentStats[agenteId] = { promesas: 0, pagos: 0, montoTotal: 0 };
      }

      if (fact.includes('resultado: promesa_pago')) {
        agentStats[agenteId].promesas++;
        const montoMatch = fact.match(/monto_prometido: (\d+)/);
        if (montoMatch) {
          agentStats[agenteId].montoTotal += parseInt(montoMatch[1]);
        }
      }

      if (fact.includes('resultado: pago_inmediato')) {
        agentStats[agenteId].pagos++;
        const montoMatch = fact.match(/monto_pagado: (\d+)/);
        if (montoMatch) {
          agentStats[agenteId].montoTotal += parseInt(montoMatch[1]);
        }
      }
    }
  });

  return Object.entries(agentStats).map(([agente_id, stats]) => ({
    agente_id,
    nombre: `Agente ${agente_id.replace('agente_', '')}`,
    promesasCumplidas: stats.pagos,
    totalPromesas: stats.promesas + stats.pagos,
    efectividad: (stats.promesas + stats.pagos) > 0 ? (stats.pagos / (stats.promesas + stats.pagos)) * 100 : 0,
    montoTotal: stats.montoTotal
  })).sort((a, b) => b.efectividad - a.efectividad);
}

export async function extractPromisesRiskFromFacts(facts: GraphitiFact[]): Promise<PromiseRiskData[]> {
  const promises: PromiseRiskData[] = [];

  facts.forEach(factObj => {
    const fact = factObj.fact;
    
    if (fact.includes('resultado: promesa_pago')) {
      const promesaMatch = fact.match(/id: "([^"]+)"/);
      const clienteMatch = fact.match(/cliente_id: "([^"]+)"/);
      const montoMatch = fact.match(/monto_prometido: (\d+)/);
      const fechaMatch = fact.match(/fecha_promesa: "([^"]+)"/);

      if (promesaMatch && clienteMatch && montoMatch && fechaMatch) {
        try {
          const fechaPromesa = new Date(fechaMatch[1]);
          const hoy = new Date();
          const diasRestantes = Math.ceil((fechaPromesa.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

          let riesgo: 'alto' | 'medio' | 'bajo' = 'bajo';
          if (diasRestantes < 0) riesgo = 'alto';
          else if (diasRestantes <= 7) riesgo = 'medio';

          promises.push({
            promesa_id: promesaMatch[1],
            cliente_id: clienteMatch[1],
            monto: parseInt(montoMatch[1]),
            fechaVencimiento: fechaMatch[1],
            diasRestantes,
            riesgo
          });
        } catch (error) {
          logger.error('API', `Error procesando promesa: ${fact}`, error);
        }
      }
    }
  });

  return promises.sort((a, b) => a.diasRestantes - b.diasRestantes);
}

export async function extractSentimentFromFacts(facts: GraphitiFact[]): Promise<SentimentData> {
  let positivo = 0;
  let neutral = 0;
  let negativo = 0;
  let friccion = 0;

  facts.forEach(factObj => {
    const fact = factObj.fact;
    
    if (fact.includes('resultado: pago_inmediato') || fact.includes('resultado: promesa_pago')) {
      positivo++;
    } else if (fact.includes('resultado: contacto_exitoso')) {
      neutral++;
    } else if (fact.includes('resultado: sin_respuesta') || fact.includes('resultado: renegociacion')) {
      negativo++;
      friccion++;
    }
  });

  return {
    positivo,
    neutral,
    negativo,
    friccion
  };
}

export async function extractLastActivityFromFacts(facts: GraphitiFact[]): Promise<LastActivityData> {
  let ultimaInteraccion = '';
  let ultimoPago = '';
  let ultimaPromesa = '';
  let clienteActivo = '';

  facts.forEach(factObj => {
    const fact = factObj.fact;
    const timeMatch = fact.match(/fecha_hora: "([^"]+)"/);
    const clienteMatch = fact.match(/cliente_id: "([^"]+)"/);
    
    if (timeMatch) {
      const timestamp = timeMatch[1];
      
      if (!ultimaInteraccion || timestamp > ultimaInteraccion) {
        ultimaInteraccion = timestamp;
        if (clienteMatch) clienteActivo = clienteMatch[1];
      }

      if (fact.includes('resultado: pago_inmediato')) {
        if (!ultimoPago || timestamp > ultimoPago) {
          ultimoPago = timestamp;
        }
      }

      if (fact.includes('resultado: promesa_pago')) {
        if (!ultimaPromesa || timestamp > ultimaPromesa) {
          ultimaPromesa = timestamp;
        }
      }
    }
  });

  return {
    ultimaInteraccion: ultimaInteraccion || 'N/A',
    ultimoPago: ultimoPago || 'N/A',
    ultimaPromesa: ultimaPromesa || 'N/A',
    clienteActivo: clienteActivo || 'N/A'
  };
}

export async function processGraphitiFacts(facts: GraphitiFact[]): Promise<DashboardData> {
  logger.info('API', `Procesando ${facts.length} facts de Graphiti`);

  try {
    const [
      kpis,
      activity,
      bestHours,
      funnel,
      agents,
      promisesRisk,
      sentiment,
      lastActivity
    ] = await Promise.all([
      extractKPIsFromFacts(facts),
      extractActivityFromFacts(facts),
      extractBestHoursFromFacts(facts),
      extractFunnelFromFacts(facts),
      extractAgentsFromFacts(facts),
      extractPromisesRiskFromFacts(facts),
      extractSentimentFromFacts(facts),
      extractLastActivityFromFacts(facts)
    ]);

    return {
      kpis,
      activity,
      bestHours,
      funnel,
      agents,
      promisesRisk,
      sentiment,
      lastActivity
    };
  } catch (error) {
    logger.error('API', 'Error procesando facts de Graphiti', error);
    throw error;
  }
}
