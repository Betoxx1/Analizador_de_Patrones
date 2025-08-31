Analizador de Patrones de Llamadas
Contexto del Problema
Una empresa de gestión de cobros necesita analizar y visualizar los patrones de interacción con sus clientes. Tu tarea es construir un sistema que procese datos históricos de interacciones, los almacene en un grafo de conocimiento usando Graphiti, y proporcione visualizaciones útiles para identificar patrones y optimizar estrategias de cobro.

Requisitos del Sistema
Datos Proporcionados
Se te proporciona un archivo interacciones_clientes.json con el siguiente esquema:

{
  "metadata": {
    "fecha_generacion": string,    // ISO timestamp
    "total_clientes": number,
    "total_interacciones": number,
    "periodo": string
  },
  "clientes": [
    {
      "id": string,                 // formato: "cliente_XXX"
      "nombre": string,
      "telefono": string,
      "monto_deuda_inicial": number,
      "fecha_prestamo": string,     // formato: "YYYY-MM-DD"
      "tipo_deuda": string           // valores: "tarjeta_credito" | "prestamo_personal" | "hipoteca" | "auto"
    }
  ],
  "interacciones": [
    {
      "id": string,                  // UUID corto
      "cliente_id": string,
      "timestamp": string,           // ISO timestamp con Z
      "tipo": string,                // valores: "llamada_saliente" | "llamada_entrante" | "email" | "sms" | "pago_recibido"
      
      // Campos condicionales según tipo:
      
      // Si tipo es llamada_*:
      "duracion_segundos"?: number,
      "agente_id"?: string,
      "resultado"?: string,          // valores: "promesa_pago" | "sin_respuesta" | "renegociacion" | "disputa" | "pago_inmediato" | "se_niega_pagar"
      "sentimiento"?: string,        // valores: "cooperativo" | "neutral" | "frustrado" | "hostil" | "n/a"
      
      // Si resultado es "promesa_pago":
      "monto_prometido"?: number,
      "fecha_promesa"?: string,
      
      // Si resultado es "renegociacion":
      "nuevo_plan_pago"?: {
        "cuotas": number,
        "monto_mensual": number
      },
      
      // Si tipo es "pago_recibido":
      "monto"?: number,
      "metodo_pago"?: string,        // valores: "transferencia" | "tarjeta" | "efectivo"
      "pago_completo"?: boolean
    }
  ]
}
El archivo contiene aproximadamente 50 clientes y 500+ interacciones distribuidas a lo largo de 90 días.

Entregables Requeridos
1. Sistema de Ingesta y Modelado de Grafo (40% de la evaluación)
Objetivo: Diseñar e implementar la estructura del grafo de conocimiento.

Requisitos mínimos:

Procesar el archivo JSON y validar los datos
Diseñar una estructura de grafo que capture:
Entidades (clientes, agentes, deudas, pagos)
Relaciones temporales entre interacciones
Estados y transiciones (promesas → pagos/incumplimientos)
Implementar la carga de datos a Graphiti usando su API REST
Documentar las decisiones de modelado tomadas
Consideraciones:

¿Cómo representar la evolución temporal de la deuda?
¿Cómo conectar promesas de pago con pagos reales posteriores?
¿Qué información derivada vale la pena pre-calcular como propiedades del grafo?
2. API de Consultas (30% de la evaluación)
Objetivo: Crear una interfaz para consultar el grafo de manera eficiente.

Opción A - API REST Básica (Mínimo requerido)
Endpoints para consultas comunes:

GET /clientes/{id}/timeline - Historial completo de un cliente
GET /agentes/{id}/efectividad - Métricas de desempeño del agente
GET /analytics/promesas-incumplidas - Clientes con promesas vencidas
GET /analytics/mejores-horarios - Análisis de horarios más efectivos
Opción B - Integración MCP + LLM (Bonus significativo)
Utilizar el servidor MCP de Graphiti existente para consultas en lenguaje natural:

Configurar el servidor MCP de Graphiti
Integrar con un LLM (OpenAI, Anthropic, o local) para interpretar consultas
3. Visualización Web (30% de la evaluación)
Objetivo: Crear una interfaz que permita explorar y entender los datos.

Vistas mínimas requeridas:

1. Dashboard General
KPIs principales (tasa de recuperación, promesas cumplidas, etc.)
Distribución de tipos de deuda
Actividad por período de tiempo
2. Vista de Cliente Individual
Timeline interactivo de todas las interacciones
Estado actual y evolución de la deuda
Predicción de comportamiento futuro (si es posible)
3. Vista de Grafo
Visualización del grafo de relaciones
Capacidad de explorar conexiones entre entidades
Filtros por tipo de relación, período, resultado
Tecnologías sugeridas (no obligatorias):

Frontend: React, Vue, o vanilla JS
Visualización de grafos: D3.js, Cytoscape.js, o Vis.js
Gráficos: Chart.js, Recharts, o Plotly
Criterios de Evaluación
1. Calidad del Modelado de Datos
¿El modelo de grafo captura eficientemente las relaciones importantes?
¿Las consultas son eficientes?
¿Se aprovechan las capacidades de Graphiti?
2. Robustez del Código
Manejo de errores y casos edge
Código limpio y mantenible
Tests (bonus)
3. Utilidad de las Consultas/Análisis
¿Las métricas extraídas son útiles para el negocio?
¿Se identifican patrones no obvios?
4. Experiencia de Usuario
¿La visualización es intuitiva y útil?
¿La información se presenta de manera clara?
5. Documentación
README claro con instrucciones de instalación
Documentación de decisiones de diseño
Ejemplos de uso
Bonus (No requerido pero valorado)
Análisis Predictivo
Detección de Anomalías
Optimización de Estrategias
Tests Automatizados
Deployment
Integración MCP + LLM
Recursos y Referencias
Documentación Esencial
Graphiti
Getting Started with Graphiti
CRUD Operations
Knowledge Graph MCP Server
Model Context Protocol (MCP) - Solo si decides implementar la integración avanzada
Writing MCP Clients
Visualización de Grafos
D3.js Force-Directed Graph
Cytoscape.js Documentation
Neo4j Visualization Guide
Integraciones LLM (si implementas MCP + LLM)
OpenAI API Documentation
Anthropic API Documentation
Ollama (para modelos locales)
Configuración Inicial
Docker Compose para Graphiti:

version: '3.8'
services:
  neo4j:
    image: neo4j:5-community
    ports:
      - "7474:7474"
      - "7687:7687"
    environment:
      NEO4J_AUTH: neo4j/password123
      NEO4J_PLUGINS: '["apoc"]'
    volumes:
      - neo4j_data:/data

  graphiti:
    image: getzep/graphiti:latest
    depends_on:
      - neo4j
    ports:
      - "8000:8000"
    environment:
      - NEO4J_URI=bolt://neo4j:7687
      - NEO4J_USER=neo4j
      - NEO4J_PASSWORD=password123

volumes:
  neo4j_data:
Instrucciones de Entrega
1. Repositorio Git
Código fuente organizado
.gitignore apropiado
No incluir credenciales
2. README.md debe incluir
Descripción de la solución
Instrucciones de instalación paso a paso
Cómo ejecutar el proyecto
Decisiones técnicas importantes
Mejoras futuras identificadas
3. Documentación adicional
Esquema del modelo de grafo (diagrama o descripción)
Lista de endpoints API implementados
Screenshots o video demo (opcional pero recomendado)
Consideraciones Importantes
6-8 horas
Tiempo Estimado
2 días
Plazo de Entrega
✓
Uso de IA Permitido
Calidad
Sobre Features
Uso de IA: Se permite y alienta el uso de asistentes de IA para desarrollo
Evaluación: Se valorará más una implementación sólida de los requisitos mínimos que features incompletos
Preguntas: Si algo no está claro, documenta tus suposiciones y continúa
Preguntas para Reflexionar
Incluye en tu documentación respuestas breves a estas preguntas:

¿Qué ventajas ofrece usar un grafo de conocimiento vs. una base de datos relacional para este problema?
¿Cómo escalaría tu solución si tuviéramos 1 millón de clientes?
¿Qué otras fuentes de datos serían útiles para mejorar el análisis?
Nota: Este ejercicio está diseñado para evaluar tu capacidad de integrar múltiples tecnologías, modelar datos complejos y crear soluciones útiles. No esperamos perfección, sino ver tu proceso de pensamiento y habilidades de resolución de problemas.