#!/usr/bin/env tsx

/**
 * 🧪 Script de Verificación de Ingesta Corregida
 * 
 * Este script verifica que la ingesta de datos se haya realizado correctamente
 * y que Graphiti pueda acceder a todos los datos necesarios para los KPIs.
 */

import { verifyGraphitiConnection, createKPIFact } from './graphitiClient.js';

interface VerificationResult {
  test: string;
  passed: boolean;
  details: string;
  timestamp: string;
}

class IngestVerifier {
  private results: VerificationResult[] = [];
  private graphitiUrl: string;

  constructor() {
    this.graphitiUrl = process.env.GRAPHITI_URL || 'http://localhost:8000';
  }

  /**
   * Ejecutar todas las verificaciones
   */
  async run(): Promise<void> {
    console.log('🔍 Iniciando verificación de ingesta corregida...\n');

    try {
      // 1. Verificar conectividad con Graphiti
      await this.verifyGraphitiConnection();

      // 2. Verificar datos básicos
      await this.verifyBasicData();

      // 3. Verificar datos de KPIs
      await this.verifyKPIData();

      // 4. Verificar relaciones
      await this.verifyRelationships();

      // 5. Generar reporte
      this.generateReport();

    } catch (error) {
      console.error('❌ Error durante la verificación:', error);
      process.exit(1);
    }
  }

  /**
   * Verificar conectividad con Graphiti
   */
  private async verifyGraphitiConnection(): Promise<void> {
    console.log('🔌 Verificando conectividad con Graphiti...');
    
    try {
      const isConnected = await verifyGraphitiConnection();
      
      if (isConnected) {
        this.addResult('Conectividad Graphiti', true, 'Graphiti responde correctamente');
        console.log('✅ Conectividad con Graphiti verificada');
      } else {
        this.addResult('Conectividad Graphiti', false, 'Graphiti no responde');
        console.log('❌ No se pudo conectar con Graphiti');
      }
    } catch (error) {
      this.addResult('Conectividad Graphiti', false, `Error: ${error}`);
      console.log('❌ Error al verificar conectividad con Graphiti');
    }
  }

  /**
   * Verificar datos básicos
   */
  private async verifyBasicData(): Promise<void> {
    console.log('\n📊 Verificando datos básicos...');
    
    const basicQueries = [
      { name: 'Clientes', query: 'clientes con deuda inicial' },
      { name: 'Agentes', query: 'agentes de cobranza' },
      { name: 'Interacciones', query: 'interacciones con clientes' }
    ];

    for (const test of basicQueries) {
      await this.verifyQuery(test.name, test.query);
    }
  }

  /**
   * Verificar datos de KPIs
   */
  private async verifyKPIData(): Promise<void> {
    console.log('\n📈 Verificando datos de KPIs...');
    
    const kpiQueries = [
      { name: 'Deuda Inicial', query: 'deuda inicial total clientes' },
      { name: 'Pagos Realizados', query: 'pagos realizados montos' },
      { name: 'Promesas de Pago', query: 'promesas pago montos fechas' },
      { name: 'Resultados Interacciones', query: 'resultados interacciones exitosos' }
    ];

    for (const test of kpiQueries) {
      await this.verifyQuery(test.name, test.query);
    }
  }

  /**
   * Verificar relaciones
   */
  private async verifyRelationships(): Promise<void> {
    console.log('\n🔗 Verificando relaciones...');
    
    const relationshipQueries = [
      { name: 'OWNS', query: 'cliente OWNS deuda' },
      { name: 'HAD_INTERACTION', query: 'cliente HAD_INTERACTION interaccion' },
      { name: 'PERFORMED', query: 'agente PERFORMED interaccion' },
      { name: 'RESULTED_IN', query: 'interaccion RESULTED_IN resultado' }
    ];

    for (const test of relationshipQueries) {
      await this.verifyQuery(test.name, test.query);
    }
  }

  /**
   * Verificar una query específica
   */
  private async verifyQuery(testName: string, query: string): Promise<void> {
    try {
      const response = await fetch(`${this.graphitiUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          group_id: "analizador-patrones"
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.facts && data.facts.length > 0) {
          this.addResult(testName, true, `Encontrados ${data.facts.length} facts`);
          console.log(`✅ ${testName}: ${data.facts.length} facts encontrados`);
        } else {
          this.addResult(testName, false, 'Query exitosa pero sin facts');
          console.log(`⚠️ ${testName}: Query exitosa pero sin facts`);
        }
      } else {
        this.addResult(testName, false, `HTTP ${response.status}: ${response.statusText}`);
        console.log(`❌ ${testName}: HTTP ${response.status}`);
      }
    } catch (error) {
      this.addResult(testName, false, `Error: ${error}`);
      console.log(`❌ ${testName}: Error - ${error}`);
    }
  }

  /**
   * Agregar resultado de verificación
   */
  private addResult(test: string, passed: boolean, details: string): void {
    this.results.push({
      test,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generar reporte de verificación
   */
  private async generateReport(): Promise<void> {
    console.log('\n📋 REPORTE DE VERIFICACIÓN DE INGESTA');
    console.log('=====================================');
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`📊 Total de tests: ${totalTests}`);
    console.log(`✅ Tests exitosos: ${passedTests}`);
    console.log(`❌ Tests fallidos: ${failedTests}`);
    console.log(`📈 Tasa de éxito: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    console.log('\n📝 Detalles por test:');
    this.results.forEach((result, index) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`   ${index + 1}. ${status} ${result.test}: ${result.details}`);
    });
    
    console.log('\n🎯 Estado de la ingesta:');
    if (failedTests === 0) {
      console.log('🎉 ¡INGESTA COMPLETAMENTE EXITOSA!');
      console.log('   Todos los datos están disponibles para los KPIs');
    } else if (passedTests > failedTests) {
      console.log('⚠️  INGESTA PARCIALMENTE EXITOSA');
      console.log('   Algunos datos pueden no estar disponibles');
    } else {
      console.log('❌ INGESTA FALLIDA');
      console.log('   La mayoría de los datos no están disponibles');
    }
    
    // Guardar reporte en archivo
    await this.saveReport();
  }

  /**
   * Guardar reporte en archivo
   */
  private async saveReport(): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.length,
        passedTests: this.results.filter(r => r.passed).length,
        failedTests: this.results.filter(r => !r.passed).length
      },
      results: this.results
    };
    
    // Usar import dinámico para fs y path
    const fs = await import('fs');
    const path = await import('path');
    
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const reportFile = path.join(reportsDir, 'ingestion-verification-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Reporte guardado en: ${reportFile}`);
  }
}

// Función principal
async function main() {
  const verifier = new IngestVerifier();
  await verifier.run();
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { IngestVerifier };
