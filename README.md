# 📊 Analizador de Patrones

Sistema de análisis de patrones de cobranza utilizando **Neo4j** + **Graphiti** para el grafo de conocimiento, con ingesta de datos, API REST y frontend React.

## 🏗️ Arquitectura

```
analizador-patrones/
├── docker-compose.yml          # Neo4j + Graphiti
├── package.json               # Workspace root
├── pnpm-workspace.yaml        # pnpm workspaces
├── tsconfig.base.json         # Base TypeScript config
├── README.md                  # Este archivo
├── interacciones_clientes.json # Datos para ingestar (colócalo aquí)
├── ingest/                    # 📥 Validación e ingesta de datos
│   ├── src/
│   │   ├── index.ts          # Proceso principal
│   │   ├── schema.ts         # Validación AJV
│   │   ├── types.ts          # Interfaces TypeScript
│   │   ├── derive.ts         # Cálculos derivados
│   │   └── graphitiClient.ts # Cliente Graphiti REST
├── api/                       # 🚀 API REST con Express
│   ├── src/
│   │   ├── server.ts         # Servidor principal
│   │   ├── graphitiClient.ts # Cliente Graphiti
│   │   └── routes/           # Endpoints organizados
│   │       ├── clientes.ts   # /clientes/:id/timeline
│   │       ├── agentes.ts    # /agentes/:id/efectividad
│   │       └── analytics.ts  # /analytics/*
└── web/                       # 🌐 Frontend React + Vite
    ├── src/
    │   ├── App.tsx           # Aplicación principal
    │   ├── pages/            # Páginas principales
    │   │   ├── Dashboard.tsx # KPIs y mejores horarios
    │   │   ├── Cliente.tsx   # Timeline por cliente
    │   │   └── Grafo.tsx     # Vista de grafo (placeholder)
    │   └── components/       # Componentes reutilizables
    │       ├── KPICard.tsx
    │       ├── Timeline.tsx
    │       └── GraphView.tsx
```

## 🚀 Instalación Paso a Paso

### Prerrequisitos

- **Node.js** 18+
- **pnpm** 9+
- **Docker** y **Docker Compose**

### 1. Clonar e instalar dependencias

```bash
git clone <repository-url>
cd analizador-patrones

# Instalar dependencias de todos los paquetes
pnpm install
```

### 2. Levantar infraestructura (Neo4j + Graphiti)

```bash
# Levantar contenedores en background
docker compose up -d

# Verificar que estén corriendo
docker compose ps

# Ver logs (opcional)
docker compose logs -f
```

**URLs de acceso:**
- Neo4j Browser: http://localhost:7474 (usuario: `neo4j`, password: `password123`)
- Graphiti API: http://localhost:8000

### 3. Preparar datos de entrada

Crea el archivo `interacciones_clientes.json` en la **raíz del proyecto** con la siguiente estructura:

```json
{
  "metadata": {
    "version": "1.0",
    "fecha_generacion": "2024-01-15T10:30:00Z",
    "total_clientes": 2,
    "total_interacciones": 4
  },
  "clientes": [
    {
      "id": "cliente_001",
      "nombre": "Juan Pérez",
      "telefono": "+1234567890",
      "email": "juan@example.com",
      "deuda_inicial": 15000,
      "fecha_inicio_cobranza": "2024-01-01T00:00:00Z"
    },
    {
      "id": "cliente_002",
      "nombre": "María García",
      "telefono": "+0987654321",
      "deuda_inicial": 8500,
      "fecha_inicio_cobranza": "2024-01-05T00:00:00Z"
    }
  ],
  "interacciones": [
    {
      "id": "int_001",
      "cliente_id": "cliente_001",
      "agente_id": "agente_A",
      "fecha_hora": "2024-01-10T14:30:00Z",
      "tipo": "llamada",
      "resultado": "promesa_pago",
      "monto_prometido": 5000,
      "fecha_promesa": "2024-01-15T00:00:00Z",
      "observaciones": "Cliente promete pago parcial"
    },
    {
      "id": "int_002",
      "cliente_id": "cliente_001",
      "agente_id": "agente_A",
      "fecha_hora": "2024-01-16T10:00:00Z",
      "tipo": "llamada",
      "resultado": "pago_inmediato",
      "monto_pagado": 5000,
      "observaciones": "Pago realizado durante la llamada"
    }
  ]
}
```

### 4. Ejecutar ingesta de datos

```bash
# Ingestar datos al grafo
pnpm ingest

# Deberías ver logs como:
# 📁 Loading data from: /path/to/interacciones_clientes.json
# ✅ Data validation passed
# 🚀 Starting data ingestion...
# ✅ Upserted Client node: cliente_001
# ✅ Upserted Debt node: debt_cliente_001
# ✅ Data ingestion completed successfully!
```

### 5. Levantar API

```bash
# Terminal 1: API en modo desarrollo
pnpm dev:api

# Salida esperada:
# 🚀 Analizador de Patrones API
# ==============================
# 📡 Server running on http://localhost:3000
# 🔗 Graphiti URL: http://localhost:8000
```

### 6. Levantar frontend

```bash
# Terminal 2: Web en modo desarrollo  
pnpm dev:web

# Salida esperada:
# Local:   http://localhost:5173/
# Network: use --host to expose
```

## 📡 Endpoints de la API

### Base URLs
- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

### Endpoints Principales

#### 1. Timeline de Cliente
```http
GET /api/clientes/{id}/timeline

# Ejemplo:
curl http://localhost:3000/api/clientes/cliente_001/timeline
```

**Respuesta:**
```json
{
  "client_id": "cliente_001",
  "timeline": [
    {
      "id": "int_001",
      "datetime": "2024-01-10T14:30:00Z",
      "type": "llamada",
      "result": "promesa_pago",
      "agent": { "id": "agente_A", "name": "Agente A" },
      "promise": { "amount": 5000, "promised_date": "2024-01-15T00:00:00Z" }
    }
  ],
  "total_interactions": 2
}
```

#### 2. Efectividad de Agente
```http
GET /api/agentes/{id}/efectividad

# Ejemplo:
curl http://localhost:3000/api/agentes/agente_A/efectividad
```

#### 3. Promesas Incumplidas
```http
GET /api/analytics/promesas-incumplidas?diasVencidas=5

# Sin filtro de días:
curl http://localhost:3000/api/analytics/promesas-incumplidas
```

#### 4. Mejores Horarios
```http
GET /api/analytics/mejores-horarios

curl http://localhost:3000/api/analytics/mejores-horarios
```

## 🖥️ Uso del Frontend

1. **Dashboard** (http://localhost:5173/): 
   - KPIs generales
   - Lista de mejores horarios para contacto
   - Métricas de éxito

2. **Cliente** (http://localhost:5173/cliente):
   - Ingresa un ID de cliente (ej: `cliente_001`)
   - Ve el timeline completo de interacciones
   - Resumen de pagos y promesas

3. **Grafo** (http://localhost:5173/grafo):
   - Vista placeholder para futura integración con Cytoscape.js
   - Documentación técnica para implementar visualización

## 🔧 Scripts Disponibles

```bash
# Desarrollo
pnpm dev:api          # API en modo desarrollo
pnpm dev:web          # Frontend en modo desarrollo
pnpm ingest           # Ejecutar ingesta de datos

# Construcción
pnpm build            # Build de todos los paquetes
pnpm build:ingest     # Build solo ingesta
pnpm build:api        # Build solo API
pnpm build:web        # Build solo frontend

# Docker
docker compose up -d            # Levantar servicios
docker compose down             # Bajar servicios
docker compose logs graphiti    # Ver logs de Graphiti
docker compose logs neo4j       # Ver logs de Neo4j
```

## 🗂️ Modelo de Datos

### Nodos en el Grafo

- **Client**: Información del cliente y deuda actual
- **Agent**: Agentes de cobranza
- **Interaction**: Cada interacción registrada
- **Promise**: Promesas de pago extraídas
- **Payment**: Pagos realizados
- **Debt**: Estado de deuda por cliente
- **BestSlot**: Mejores horarios calculados

### Relaciones

- `Client -[OWNS]-> Debt`
- `Client -[HAD_INTERACTION]-> Interaction`
- `Agent -[PERFORMED]-> Interaction`
- `Interaction -[RESULTED_IN]-> Promise/Payment`
- `Promise -[FULFILLED_BY]-> Payment` (si se cumple)
- `Payment -[APPLIES_TO]-> Debt`

## 🛠️ Decisiones de Diseño

### Tecnológicas
- **ESM**: Todos los paquetes usan ES Modules para consistencia
- **TypeScript**: Tipado estricto en toda la aplicación
- **pnpm workspaces**: Gestión eficiente de dependencias monorepo
- **Placeholder clients**: Auto-creación de clientes faltantes con warnings

### Arquitecturales
- **Separación clara**: Ingesta, API y Frontend como paquetes independientes
- **Graphiti REST**: Uso de APIs REST placeholder adaptables
- **Validación robusta**: AJV schema validation para datos de entrada
- **Manejo de errores**: Fallbacks y datos mock para desarrollo

### UX/UI
- **Responsive**: Grid layouts que se adaptan a diferentes pantallas  
- **Estado visual**: Colores e iconos para diferentes tipos de interacción
- **Feedback**: Loading states y mensajes de error claros
- **Navegación**: Routing client-side con React Router

## 🚀 Próximas Mejoras

### Funcionalidades
- [ ] **Autenticación**: Sistema de login para agentes
- [ ] **Filtros avanzados**: Por fechas, tipos, resultados
- [ ] **Exportación**: PDF/Excel de reportes
- [ ] **Notifications**: Alertas por promesas vencidas
- [ ] **Real-time**: WebSockets para updates en vivo

### Técnicas
- [ ] **GraphQL**: Migrar de REST a GraphQL para queries complejas
- [ ] **Caching**: Redis para cache de consultas frecuentes
- [ ] **Testing**: Jest/Vitest + React Testing Library
- [ ] **CI/CD**: GitHub Actions para deployment automático
- [ ] **Monitoring**: Logging estructurado y métricas

### Visualización
- [ ] **Cytoscape.js**: Implementar vista interactiva del grafo
- [ ] **Charts**: Gráficos de tendencias y métricas históricas  
- [ ] **Heatmaps**: Visualización de efectividad por horario
- [ ] **Geolocalización**: Mapas de distribución de clientes

## 🐛 Troubleshooting

### Docker no levanta
```bash
# Ver logs detallados
docker compose logs

# Limpiar volúmenes si hay problemas de persistencia
docker compose down -v
docker compose up -d
```

### API retorna errores 500
```bash
# Verificar que Graphiti esté corriendo
curl http://localhost:8000/health

# Ver logs de API
pnpm dev:api
```

### Frontend no conecta con API
```bash
# Verificar CORS en server.ts
# Asegurarse que API esté en puerto 3000
curl http://localhost:3000/api
```

### Error en ingesta
```bash
# Verificar formato del JSON
node -e "console.log(JSON.parse(require('fs').readFileSync('interacciones_clientes.json')))"

# Ejecutar con logs detallados
DEBUG=* pnpm ingest
```

## 📄 Licencia

MIT License - Ver archivo `LICENSE` para más detalles.

---

**Desarrollado con ❤️ usando TypeScript, React, Neo4j y Graphiti**