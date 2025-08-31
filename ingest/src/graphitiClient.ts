// PATH: ingest/src/graphitiClient.ts
import { ofetch } from "ofetch";

const GRAPHITI_URL = process.env.GRAPHITI_URL || "http://localhost:8000";
const GRAPHITI_API_PREFIX = process.env.GRAPHITI_API_PREFIX || "/api"; // por si cambia
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

export async function upsertNode(
  label: string,
  id: string,
  properties: Record<string, any>
): Promise<void> {
  if (SIMULATION_MODE) {
    // Modo simulación: solo registrar la operación
    console.log(`🟡 [SIMULATION] Would create ${label} entity: ${id} with properties:`, Object.keys(properties));
    return;
  }

  try {
    // Usar la API de entity-node de Graphiti
    const payload = {
      uuid: id,
      group_id: "analizador-patrones", // Grupo fijo para nuestros datos
      name: `${label}: ${properties.name || properties.client_name || id}`,
      summary: `${label} entity with properties: ${Object.keys(properties).join(', ')}`
    };
    
    await postJSON(`${GRAPHITI_URL}/entity-node`, payload); // Sin prefijo API
    console.log(`✅ Created ${label} entity: ${id}`);
  } catch (error) {
    console.error(`❌ Error creating ${label} entity ${id}:`, error);
    // Mantener sin throw para que la ingesta continúe
  }
}

export async function upsertRelationship(
  type: string,
  fromId: string,
  toId: string,
  properties?: Record<string, any>
): Promise<void> {
  if (SIMULATION_MODE) {
    // Modo simulación: solo registrar la operación
    console.log(`🟡 [SIMULATION] Would record ${type} relationship: ${fromId} -> ${toId}${properties ? ` (properties: ${Object.keys(properties)})` : ''}`);
    return;
  }

  try {
    // Graphiti maneja las relaciones a través de mensajes/episodios
    // Creamos un mensaje que describe la relación
    const relationshipMessage = {
      group_id: "analizador-patrones",
      messages: [{
        content: `${fromId} ${type} ${toId}. ${properties ? `Properties: ${JSON.stringify(properties)}` : ''}`,
        role_type: "system" as const,
        role: "data_ingester",
        timestamp: new Date().toISOString(),
        source_description: "Data ingestion relationship mapping"
      }]
    };
    
    await postJSON(`${GRAPHITI_URL}/messages`, relationshipMessage); // Sin prefijo API
    console.log(`✅ Recorded ${type} relationship: ${fromId} -> ${toId}`);
  } catch (error) {
    console.error(`❌ Error recording ${type} relationship ${fromId} -> ${toId}:`, error);
  }
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
