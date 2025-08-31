#!/usr/bin/env tsx

import { checkGraphitiHealth, searchGraph } from '../src/graphitiClient.js';

async function main() {
  console.log('🏥 Verificando salud de Graphiti...\n');
  
  try {
    // Health check
    const isHealthy = await checkGraphitiHealth();
    
    if (isHealthy) {
      console.log('✅ Graphiti está saludable');
      
      // Probar una búsqueda simple
      console.log('\n🧪 Probando búsqueda simple...');
      const result = await searchGraph({ query: 'test' });
      
      console.log('✅ Búsqueda exitosa');
      console.log(`📊 Resultados: ${Array.isArray(result.results) ? result.results.length : 'N/A'}`);
      
      if (result.metadata) {
        console.log(`📈 Metadata:`, result.metadata);
      }
      
    } else {
      console.log('❌ Graphiti no está respondiendo correctamente');
      console.log('\n🔧 Posibles soluciones:');
      console.log('  1. Verificar que Graphiti esté ejecutándose');
      console.log('  2. Verificar la URL en GRAPHITI_URL');
      console.log('  3. Verificar la conectividad de red');
      console.log('  4. Revisar logs de Graphiti');
    }
    
  } catch (error: any) {
    console.error('💥 Error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔧 Graphiti no está ejecutándose en el puerto especificado');
    } else if (error.message.includes('timeout')) {
      console.log('\n🔧 Graphiti está tardando demasiado en responder');
    } else if (error.message.includes('401')) {
      console.log('\n🔧 Error de autenticación - verificar API keys');
    }
  }
}

main();
