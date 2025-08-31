import dayjs from 'dayjs';
import type { Interaccion, PromisePaymentLink, BestTimeSlot, DebtInfo } from './types.js';

export function linkPromisesToPayments(
  interacciones: Interaccion[], 
  graceHours: number = 48
): PromisePaymentLink[] {
  const promesas = interacciones.filter(i => i.resultado === 'promesa_pago' && i.fecha_promesa);
  const pagos = interacciones.filter(i => i.resultado === 'pago_inmediato' && i.monto_pagado);
  
  const links: PromisePaymentLink[] = [];
  
  for (const promesa of promesas) {
    if (!promesa.fecha_promesa) continue;
    
    const promiseDate = dayjs(promesa.fecha_promesa);
    const graceEndDate = promiseDate.add(graceHours, 'hour');
    const now = dayjs();
    
    // Find payments by the same client within grace period
    const relatedPayments = pagos.filter(pago => 
      pago.cliente_id === promesa.cliente_id &&
      dayjs(pago.fecha_hora).isBefore(graceEndDate) &&
      dayjs(pago.fecha_hora).isAfter(promiseDate.subtract(1, 'hour')) // Allow payments slightly before promise
    );
    
    let status: 'PENDIENTE' | 'CUMPLIDA' | 'INCUMPLIDA';
    
    if (relatedPayments.length > 0) {
      status = 'CUMPLIDA';
    } else if (now.isAfter(graceEndDate)) {
      status = 'INCUMPLIDA';
    } else {
      status = 'PENDIENTE';
    }
    
    links.push({
      promiseId: promesa.id,
      paymentIds: relatedPayments.map(p => p.id),
      status,
      graceHoursUsed: graceHours
    });
  }
  
  return links;
}

export function bucketKey(timestamp: string): string {
  const date = dayjs(timestamp);
  const dayOfWeek = date.format('dddd').toLowerCase();
  const hour = date.hour();
  return `${dayOfWeek}:${hour.toString().padStart(2, '0')}`;
}

export function calculateBestTimeSlots(interacciones: Interaccion[]): BestTimeSlot[] {
  const successfulResults = new Set(['promesa_pago', 'pago_inmediato', 'renegociacion']);
  const buckets = new Map<string, { total: number; successful: number }>();
  
  for (const interaccion of interacciones) {
    const bucket = bucketKey(interaccion.fecha_hora);
    const isSuccessful = successfulResults.has(interaccion.resultado);
    
    if (!buckets.has(bucket)) {
      buckets.set(bucket, { total: 0, successful: 0 });
    }
    
    const stats = buckets.get(bucket)!;
    stats.total += 1;
    if (isSuccessful) {
      stats.successful += 1;
    }
  }
  
  const timeSlots: BestTimeSlot[] = [];
  for (const [bucket, stats] of buckets.entries()) {
    if (stats.total >= 5) { // Only consider slots with at least 5 interactions
      timeSlots.push({
        bucket,
        success_rate: stats.successful / stats.total,
        total_interactions: stats.total,
        successful_interactions: stats.successful
      });
    }
  }
  
  return timeSlots.sort((a, b) => b.success_rate - a.success_rate);
}

export function calculateCurrentDebt(interacciones: Interaccion[], initialDebt: number): number {
  const totalPaid = interacciones
    .filter(i => i.resultado === 'pago_inmediato' && i.monto_pagado)
    .reduce((sum, i) => sum + (i.monto_pagado || 0), 0);
  
  return Math.max(0, initialDebt - totalPaid);
}

export function calculateDebtInfo(interacciones: Interaccion[], clientId: string, initialDebt: number): DebtInfo {
  const clientInteractions = interacciones.filter(i => i.cliente_id === clientId);
  const totalPaid = clientInteractions
    .filter(i => i.resultado === 'pago_inmediato' && i.monto_pagado)
    .reduce((sum, i) => sum + (i.monto_pagado || 0), 0);
  
  return {
    clientId,
    current_debt: Math.max(0, initialDebt - totalPaid),
    initial_debt: initialDebt,
    total_paid: totalPaid
  };
}