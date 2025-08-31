#!/bin/bash

echo "🚀 Configurando Testing Suite para Graphiti"
echo "=========================================="

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Debes ejecutar este script desde api/test-graphiti/"
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Verificar que tsx esté disponible
if ! command -v tsx &> /dev/null; then
    echo "📦 Instalando tsx globalmente..."
    npm install -g tsx
fi

# Crear directorio para reportes si no existe
mkdir -p reports

# Verificar variables de entorno
echo "🔧 Verificando configuración..."
if [ -z "$GRAPHITI_URL" ]; then
    echo "⚠️  GRAPHITI_URL no está configurado"
    echo "   Usando valor por defecto: http://localhost:8000"
    echo "   Para configurar: export GRAPHITI_URL=http://tu-servidor:puerto"
else
    echo "✅ GRAPHITI_URL configurado: $GRAPHITI_URL"
fi

echo ""
echo "✅ Configuración completada!"
echo ""
echo "📋 Comandos disponibles:"
echo "  npm run health     - Verificar salud de Graphiti"
echo "  npm run single     - Test individual"
echo "  npm run test       - Suite completa de tests"
echo ""
echo "🧪 Ejemplo de uso:"
echo "  tsx health-check.ts"
echo "  tsx single-test.ts -q 'clients with payments' -v"
echo "  tsx test-searchGraph.ts"
