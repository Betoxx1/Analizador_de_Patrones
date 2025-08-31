import Ajv from 'ajv';

const ajv = new Ajv();

export const dataSchema = {
  type: 'object',
  required: ['metadata', 'clientes', 'interacciones'],
  properties: {
    metadata: {
      type: 'object',
      required: ['version', 'fecha_generacion', 'total_clientes', 'total_interacciones'],
      properties: {
        version: { type: 'string' },
        fecha_generacion: { type: 'string' },
        total_clientes: { type: 'number', minimum: 0 },
        total_interacciones: { type: 'number', minimum: 0 }
      }
    },
    clientes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'nombre', 'telefono', 'deuda_inicial', 'fecha_inicio_cobranza'],
        properties: {
          id: { type: 'string', minLength: 1 },
          nombre: { type: 'string', minLength: 1 },
          telefono: { type: 'string', minLength: 1 },
          email: { type: 'string' },
          deuda_inicial: { type: 'number', minimum: 0 },
          fecha_inicio_cobranza: { type: 'string' }
        }
      }
    },
    interacciones: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'cliente_id', 'agente_id', 'fecha_hora', 'tipo', 'resultado'],
        properties: {
          id: { type: 'string', minLength: 1 },
          cliente_id: { type: 'string', minLength: 1 },
          agente_id: { type: 'string', minLength: 1 },
          fecha_hora: { type: 'string' },
          tipo: { 
            type: 'string', 
            enum: ['llamada', 'whatsapp', 'email', 'sms'] 
          },
          resultado: { 
            type: 'string', 
            enum: ['contacto_exitoso', 'no_contacto', 'promesa_pago', 'pago_inmediato', 'renegociacion', 'negativa'] 
          },
          monto_prometido: { type: 'number', minimum: 0 },
          fecha_promesa: { type: 'string' },
          monto_pagado: { type: 'number', minimum: 0 },
          observaciones: { type: 'string' }
        }
      }
    }
  }
};

export const validateData = ajv.compile(dataSchema);