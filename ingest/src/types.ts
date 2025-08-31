export interface Metadata {
  version: string;
  fecha_generacion: string;
  total_clientes: number;
  total_interacciones: number;
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  deuda_inicial: number;
  fecha_inicio_cobranza: string;
}

export interface Interaccion {
  id: string;
  cliente_id: string;
  agente_id: string;
  fecha_hora: string;
  tipo: 'llamada' | 'whatsapp' | 'email' | 'sms';
  resultado: 'contacto_exitoso' | 'no_contacto' | 'promesa_pago' | 'pago_inmediato' | 'renegociacion' | 'negativa';
  monto_prometido?: number;
  fecha_promesa?: string;
  monto_pagado?: number;
  observaciones?: string;
}

export interface RawData {
  metadata: Metadata;
  clientes: Cliente[];
  interacciones: Interaccion[];
}

export interface PromisePaymentLink {
  promiseId: string;
  paymentIds: string[];
  status: 'PENDIENTE' | 'CUMPLIDA' | 'INCUMPLIDA';
  graceHoursUsed: number;
}

export interface BestTimeSlot {
  bucket: string;
  success_rate: number;
  total_interactions: number;
  successful_interactions: number;
}

export interface DebtInfo {
  clientId: string;
  current_debt: number;
  initial_debt: number;
  total_paid: number;
}