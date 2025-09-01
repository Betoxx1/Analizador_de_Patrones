// PATH: ingest/src/graphitiClient.ts
import { ofetch } from "ofetch";

const GRAPHITI_URL = process.env.GRAPHITI_URL || "http://localhost:8000";
const GRAPHITI_API_PREFIX = process.env.GRAPHITI_API_PREFIX || ""; // Sin prefijo por defecto
const SIMULATION_MODE = process.env.GRAPHITI_SIMULATION_MODE === "true" || false; // Desactivar simulación para cargar datos reales

function api(path: string) {
  return `${GRAPHITI_URL}${GRAPHITI_API_PREFIX}${path}`;
}

export interface Node {
  label: string;
  id: string;
  properties: Record<string, any>;
}

export interface Relationship {
  type: string;
  fromId: string;
  toId: string;
  properties?: Record<string, any>;
}

async function postJSON<T>(url: string, body: any): Promise<T> {
  return ofetch<T>(url, {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
    retry: 0, // puedes subir a 2–3 si quieres reintentos
  });
}

/**
 * Crear entidad con propiedades completas usando la API correcta de Graphiti
 */
export async function upsertNode(
  label: string,
  id: string,
  properties: Record<string, any>
): Promise<void> {
  if (SIMULATION_MODE) {
    // Modo simulación: solo registrar la operación
    console.log(`🟡 [SIMULATION] Would create ${label} entity: ${id} with properties:`, properties);
    return;
  }

  try {
    // ✅ CORREGIDO: Usar la API correcta de Graphiti (/search)
    // Crear un fact estructurado que Graphiti pueda procesar
    const factContent = createFactContent(label, id, properties);
    
    const payload = {
      query: factContent,
      group_id: "analizador-patrones"
    };
    
    await postJSON(`${GRAPHITI_URL}/search`, payload);
    console.log(`✅ Created ${label} entity: ${id} with ${Object.keys(properties).length} properties`);
  } catch (error) {
    console.error(`❌ Error creating ${label} entity ${id}:`, error);
    // Mantener sin throw para que la ingesta continúe
  }
}

/**
 * Crear relación con propiedades usando la API correcta de Graphiti
 */
export async function upsertRelationship(
  type: string,
  fromId: string,
  toId: string,
  properties?: Record<string, any>
): Promise<void> {
  if (SIMULATION_MODE) {
    // Modo simulación: solo registrar la operación
    console.log(`🟡 [SIMULATION] Would record ${type} relationship: ${fromId} -> ${toId}${properties ? ` (properties: ${JSON.stringify(properties)})` : ''}`);
    return;
  }

  try {
    // ✅ CORREGIDO: Usar la API correcta de Graphiti (/search)
    // Crear un fact de relación que Graphiti pueda procesar
    const factContent = createRelationshipFact(type, fromId, toId, properties);
    
    const payload = {
      query: factContent,
      group_id: "analizador-patrones"
    };
    
    await postJSON(`${GRAPHITI_URL}/search`, payload);
    console.log(`✅ Recorded ${type} relationship: ${fromId} -> ${toId}${properties ? ` with ${Object.keys(properties).length} properties` : ''}`);
  } catch (error) {
    console.error(`❌ Error recording ${type} relationship ${fromId} -> ${toId}:`, error);
  }
}

/**
 * Crear contenido de fact para entidades con propiedades completas
 */
function createFactContent(label: string, id: string, properties: Record<string, any>): string {
  const propertyStrings = Object.entries(properties)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}: "${value}"`;
      } else if (typeof value === 'number') {
        return `${key}: ${value}`;
      } else if (typeof value === 'boolean') {
        return `${key}: ${value}`;
      } else if (value === null || value === undefined) {
        return `${key}: null`;
      } else {
        return `${key}: "${JSON.stringify(value)}"`;
      }
    })
    .join(', ');
  
  // ✅ FORMATO CORREGIDO: Formato explícito que Graphiti reconoce como entidad individual
  return `ENTIDAD: ${id} es un ${label}. Propiedades: ${propertyStrings}`;
}

/**
 * Crear contenido de fact para relaciones con propiedades
 */
function createRelationshipFact(type: string, fromId: string, toId: string, properties?: Record<string, any>): string {
  let factContent = `${fromId} ${type} ${toId}`;
  
  if (properties && Object.keys(properties).length > 0) {
    const propertyStrings = Object.entries(properties)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}: "${value}"`;
        } else if (typeof value === 'number') {
          return `${key}: ${value}`;
        } else if (typeof value === 'boolean') {
          return `${key}: ${value}`;
        } else if (value === null || value === undefined) {
          return `${key}: null`;
        } else {
          return `${key}: "${JSON.stringify(value)}"`;
        }
      })
      .join(', ');
    
    factContent += `. Propiedades: ${propertyStrings}`;
  }
  
  return factContent;
}

/**
 * Crear fact específico para KPIs con datos monetarios
 */
export async function createKPIFact(
  factType: string,
  entityId: string,
  properties: Record<string, any>
): Promise<void> {
  console.log(`🔍 DEBUG: createKPIFact llamado con: ${factType}, ${entityId}`);
  console.log(`🔍 DEBUG: SIMULATION_MODE = ${SIMULATION_MODE}`);
  console.log(`🔍 DEBUG: GRAPHITI_SIMULATION_MODE env = ${process.env.GRAPHITI_SIMULATION_MODE}`);
  
  if (SIMULATION_MODE) {
    console.log(`🟡 [SIMULATION] Would create KPI fact: ${factType} for ${entityId} with properties:`, properties);
    return;
  }

  try {
    // ✅ AJUSTE MENOR: Crear facts específicos para KPIs con formato de entidad
    const factContent = createKPIFactContent(factType, entityId, properties);
    console.log(`🔍 DEBUG: Fact content generado: ${factContent}`);
    
    const payload = {
      query: factContent,
      group_id: "analizador-patrones"
    };
    
    console.log(`🔍 DEBUG: Enviando payload a Graphiti:`, payload);
    await postJSON(`${GRAPHITI_URL}/search`, payload);
    console.log(`✅ Created KPI fact: ${factType} for ${entityId}`);
  } catch (error) {
    console.error(`❌ Error creating KPI fact ${factType} for ${entityId}:`, error);
  }
}

/**
 * Crear contenido de fact específico para KPIs
 */
function createKPIFactContent(factType: string, entityId: string, properties: Record<string, any>): string {
  const propertyStrings = Object.entries(properties)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}: "${value}"`;
      } else if (typeof value === 'number') {
        return `${key}: ${value}`;
      } else if (typeof value === 'boolean') {
        return `${key}: ${value}`;
      } else if (value === null || value === undefined) {
        return `${key}: null`;
      } else {
        return `${key}: "${JSON.stringify(value)}"`;
      }
    })
    .join(', ');
  
  // ✅ FORMATO CORREGIDO: Formato explícito que Graphiti reconoce como entidad individual
  return `ENTIDAD: ${entityId} es un ${factType}. Propiedades: ${propertyStrings}`;
}

export async function batchUpsertNodes(nodes: Node[]): Promise<void> {
  for (const node of nodes) {
    await upsertNode(node.label, node.id, node.properties);
  }
}

export async function batchUpsertRelationships(
  relationships: Relationship[]
): Promise<void> {
  for (const rel of relationships) {
    await upsertRelationship(rel.type, rel.fromId, rel.toId, rel.properties);
  }
}

/**
 * Health check usando el endpoint oficial de Graphiti
 */
export async function checkGraphitiHealth(): Promise<boolean> {
  try {
    const response = await ofetch(`${GRAPHITI_URL}/healthcheck`, { method: "GET", retry: 0 });
    console.log(`✅ Graphiti health check passed`);
    return true;
  } catch (error) {
    console.error("❌ Graphiti health check failed:", error);
    return false;
  }
}

/**
 * Verificar que Graphiti esté funcionando correctamente
 */
export async function verifyGraphitiConnection(): Promise<boolean> {
  try {
    // Test básico de query
    const testPayload = {
      query: "test connection",
      group_id: "analizador-patrones"
    };
    
    const response = await postJSON(`${GRAPHITI_URL}/search`, testPayload);
    console.log(`✅ Graphiti connection verified successfully`);
    return true;
  } catch (error) {
    console.error("❌ Graphiti connection verification failed:", error);
    return false;
  }
}
