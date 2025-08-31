export const GRAPHITI_QUERIES = {
  // Query principal para obtener todos los datos del dashboard
  dashboard: "interacciones clientes deuda inicial pagos inmediatos promesas de pago contactos exitosos agentes fechas horas",
  
  // Queries específicas para cada sección
  kpis: "clientes con deuda inicial, interacciones con pagos inmediatos, promesas de pago, contactos exitosos, montos pagados y prometidos",
  
  activity: "interacciones por fecha y hora, tipos de contacto (llamada, email, sms), resultados (pago_inmediato, promesa_pago, contacto_exitoso, renegociacion, sin_respuesta)",
  
  bestHours: "interacciones exitosas por hora del día, contactos por día de la semana, patrones de actividad temporal",
  
  funnel: "embudo de cobranza: intentos de contacto, respuestas exitosas, promesas de pago, pagos realizados, pagos completos",
  
  agents: "agentes y su efectividad, promesas cumplidas por agente, montos totales por agente, rendimiento individual",
  
  promisesRisk: "promesas de pago con fechas de vencimiento, montos prometidos, clientes con promesas, días restantes para vencimiento",
  
  sentiment: "sentimiento de interacciones, fricción en contactos, resultados positivos y negativos, calidad de comunicación",
  
  lastActivity: "última interacción por cliente, último pago realizado, última promesa de pago, cliente más activo recientemente"
};

export const GRAPHITI_QUERY_PARAMS = {
  // Parámetros para limitar y filtrar resultados
  limit: 1000,
  includeMetadata: true,
  includeTimestamps: true,
  includeAmounts: true,
  includeResults: true
};

// Función para construir queries dinámicas basadas en filtros
export function buildDynamicQuery(filters: {
  desde?: string;
  hasta?: string;
  tipo_deuda?: string;
  agente_id?: string;
  cliente_id?: string;
}): string {
  let baseQuery = GRAPHITI_QUERIES.dashboard;
  
  if (filters.desde && filters.hasta) {
    baseQuery += ` entre ${filters.desde} y ${filters.hasta}`;
  }
  
  if (filters.tipo_deuda) {
    baseQuery += ` deuda ${filters.tipo_deuda}`;
  }
  
  if (filters.agente_id) {
    baseQuery += ` agente ${filters.agente_id}`;
  }
  
  if (filters.cliente_id) {
    baseQuery += ` cliente ${filters.cliente_id}`;
  }
  
  return baseQuery;
}

// Queries especializadas para métricas específicas
export const SPECIALIZED_QUERIES = {
  // Para KPIs financieros
  financial: "deuda inicial total, montos pagados, montos prometidos, tasa de recuperación, efectividad de cobranza",
  
  // Para análisis temporal
  temporal: "patrones de actividad por hora, día de la semana, mes, estacionalidad en contactos y pagos",
  
  // Para análisis de agentes
  agentPerformance: "rendimiento por agente, promesas cumplidas vs incumplidas, montos totales por agente, efectividad individual",
  
  // Para análisis de riesgo
  riskAnalysis: "promesas vencidas, clientes en riesgo, montos en peligro, probabilidad de incumplimiento"
};
