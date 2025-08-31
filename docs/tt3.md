  "¿Cuál sería el uso de Graphiti según el issue?"

  1. Graphiti como Knowledge Graph Store: Almacenar entidades y relaciones semánticamente, no como
  queries SQL
  2. API semántica: Los endpoints de tu API deben usar búsquedas semánticas (/search) en lugar de
  queries Cypher
  3. Memoria contextual: Usar /get-memory para recuperar contexto de clientes/agentes
  4. MCP Integration (Bonus): Conectar con LLM para consultas en lenguaje natural

  🚨 El Problema Real

  No es que Graphiti sea malo o esté mal usado. Es que estás mezclando paradigmas:
  - Ingesta: Correcto ✅ (usa API de Graphiti)
  - API Queries: Incorrecto ❌ (intenta usar Cypher en lugar de búsqueda semántica)

  La solución es refactorizar api/src/graphitiClient.ts para usar búsquedas semánticas en lugar de
  queries estructuradas.