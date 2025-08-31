# 🧪 Testing Suite para Graphiti SearchGraph

Este directorio contiene herramientas completas para testear y analizar el funcionamiento del método `searchGraph` de Graphiti.

## 📁 Estructura

```
test-graphiti/
├── test-searchGraph.ts    # Suite completa de tests
├── health-check.ts        # Verificación de salud de Graphiti
├── single-test.ts         # Test individual personalizable
├── package.json           # Dependencias y scripts
└── README.md             # Este archivo
```

## 🚀 Instalación

```bash
cd api/test-graphiti
npm install
```

## 📋 Scripts Disponibles

### 1. Suite Completa de Tests
```bash
npm run test
```
Ejecuta una batería completa de tests con diferentes queries y valida las respuestas.

### 2. Health Check Rápido
```bash
npm run health
```
Verifica si Graphiti está funcionando correctamente y hace una prueba simple.

### 3. Test Individual
```bash
npm run single
```
Ejecuta un test individual con parámetros personalizables.

## 🧪 Uso Detallado

### Health Check
```bash
# Verificar salud básica
tsx health-check.ts
```

### Test Individual
```bash
# Test básico
tsx single-test.ts -q "clients with payments"

# Test con group_id específico
tsx single-test.ts -q "agents" -g "analizador-patrones"

# Test verbose (muestra todos los resultados)
tsx single-test.ts -q "broken promises" -v

# Test con timeout personalizado
tsx single-test.ts -q "interactions" -t 30000

# Ver ayuda
tsx single-test.ts --help
```

### Suite Completa
```bash
# Ejecutar todos los tests
tsx test-searchGraph.ts
```

## 📊 Análisis de Resultados

### Logs Capturados
El sistema captura automáticamente:
- ✅ Logs de información
- ❌ Logs de error
- ⚠️ Logs de advertencia
- ⏱️ Tiempos de respuesta

### Reportes Generados
Después de ejecutar la suite completa, se genera un archivo JSON con:
- Resumen de tests (exitosos/fallidos)
- Tiempos de respuesta
- Logs detallados por test
- Análisis de errores

### Análisis de Errores Comunes

| Error | Significado | Solución |
|-------|-------------|----------|
| `ECONNREFUSED` | Graphiti no está ejecutándose | Iniciar servicio Graphiti |
| `timeout` | Graphiti tarda demasiado | Aumentar timeout o revisar carga |
| `401` | Error de autenticación | Verificar API keys |
| `404` | Endpoint no encontrado | Verificar URL de Graphiti |
| `500` | Error interno del servidor | Revisar logs de Graphiti |

## 🔧 Configuración

### Variables de Entorno
Asegúrate de tener configurado:
```bash
GRAPHITI_URL=http://localhost:8000  # URL de tu instancia Graphiti
```

### Personalización de Tests
Puedes modificar los casos de prueba en `test-searchGraph.ts`:

```typescript
const testCases: TestCase[] = [
  {
    name: 'Mi test personalizado',
    query: 'mi query específica',
    group_id: 'mi-grupo',
    expected: { 
      hasResults: true,
      minResults: 5,
      maxResults: 100
    }
  }
];
```

## 📈 Métricas Analizadas

### Performance
- ⏱️ Tiempo de respuesta por query
- 📊 Tiempo promedio de todos los tests
- 🏃‍♂️ Tests más rápidos y lentos

### Calidad
- ✅ Tasa de éxito general
- 📋 Validación de respuestas
- 🔍 Análisis de estructura de datos

### Conectividad
- 🏥 Estado de salud del servicio
- 🔗 Verificación de conectividad
- ⚡ Timeouts y reintentos

## 🐛 Debugging

### Logs Detallados
Cada test captura logs completos que incluyen:
- Timestamps precisos
- Niveles de log (INFO, ERROR, WARN)
- Contexto de la operación

### Análisis de Errores
El sistema categoriza automáticamente los errores y sugiere soluciones basadas en:
- Tipo de error HTTP
- Mensajes de error específicos
- Patrones de timeout

### Exportación de Datos
Los reportes se guardan en formato JSON para análisis posterior:
```bash
# Los reportes se guardan como:
test-report-2024-01-15T10-30-45-123Z.json
```

## 🎯 Casos de Uso

### 1. Verificación Inicial
```bash
npm run health
```

### 2. Testing de Desarrollo
```bash
tsx single-test.ts -q "mi nueva funcionalidad" -v
```

### 3. Testing de Producción
```bash
npm run test
```

### 4. Análisis de Performance
```bash
# Ejecutar suite y revisar reporte JSON
npm run test
# Revisar test-report-*.json
```

## 🔄 Integración Continua

Puedes integrar estos tests en tu CI/CD:

```yaml
# Ejemplo para GitHub Actions
- name: Test Graphiti
  run: |
    cd api/test-graphiti
    npm install
    npm run test
```

## 📞 Soporte

Si encuentras problemas:
1. Ejecuta `npm run health` para diagnóstico básico
2. Revisa los logs en los reportes JSON
3. Verifica la configuración de `GRAPHITI_URL`
4. Asegúrate de que Graphiti esté ejecutándose
