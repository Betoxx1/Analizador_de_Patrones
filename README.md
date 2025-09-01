# Hypernova - Sistema de Análisis de Patrones

Sistema de análisis de patrones de cobranza con Neo4j y Graphiti que proporciona insights y KPIs a través de un dashboard interactivo.

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js >= 18
- pnpm >= 9
- Docker y Docker Compose (para Graphiti y Neo4j)

### Configuración Inicial

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd hypernova
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   ```

3. **Configurar variables de entorno**
   
   Crea archivos `.env` en cada workspace con las configuraciones necesarias:
   - `api/.env` - Configuración del backend
   - `ingest/.env` - Configuración de ingesta
   - `web/.env` - Configuración del frontend

4. **Iniciar servicios externos**
   ```bash
   docker-compose up -d
   ```

## 🏗️ Estructura del Proyecto

```
hypernova/
├── api/                    # Backend API (Express + TypeScript)
│   ├── src/
│   │   ├── routes/        # Endpoints REST
│   │   ├── utils/         # Utilidades y procesadores
│   │   └── server.ts      # Servidor principal
│   └── package.json
├── ingest/                # Sistema de ingesta de datos
│   ├── src/
│   │   ├── graphitiClient.ts  # Cliente Graphiti
│   │   ├── index.ts           # Proceso principal
│   │   └── types.ts           # Definiciones de tipos
│   └── package.json
├── web/                   # Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas principales
│   │   └── App.tsx        # Componente raíz
│   └── package.json
├── docker-compose.yml     # Servicios Docker
└── pnpm-workspace.yaml    # Configuración workspace
```

## 🛠️ Comandos Disponibles

### Desarrollo

```bash
# Iniciar API en modo desarrollo
pnpm dev:api

# Iniciar frontend en modo desarrollo  
pnpm dev:web

# Ejecutar proceso de ingesta
pnpm ingest
```

### Build

```bash
# Build completo
pnpm build

# Build individual por workspace
pnpm build:api
pnpm build:web
pnpm build:ingest
```

## 📊 Funcionalidades

- **Dashboard Interactivo**: Visualización de KPIs y métricas clave
- **Análisis de Grafos**: Exploración de relaciones entre entidades
- **Sistema de Ingesta**: Procesamiento automatizado de datos
- **API REST**: Endpoints para consulta de datos y métricas
- **Visualización Timeline**: Seguimiento temporal de interacciones

## 🎯 Demostración

![Sistema en funcionamiento](files/2025-09-01%2016-16-00.gif)

## 🔧 Tecnologías

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Base de Datos**: Neo4j con Graphiti
- **Build Tool**: pnpm workspaces
- **Containerización**: Docker Compose