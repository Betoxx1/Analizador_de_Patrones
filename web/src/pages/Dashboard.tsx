import React, { useState, useEffect } from 'react';
import KPICard from '../components/KPICard';
import SystemStatus from '../components/SystemStatus';

// Interfaces para los nuevos datos del API
interface DashboardKPIs {
  tasaRecuperacion: number;
  promesasCumplidas: number;
  promesasIncumplidas: number;
  contactabilidad: number;
  tiempoMedioContacto: number;
  pagoMedio: number;
  porcentajePagoCompleto: number;
  clientesEnRiesgo: number;
}

interface ActivityData {
  totalInteracciones: number;
  contactosExitosos: number;
  pagosInmediatos: number;
  promesas: number;
  renegociaciones: number;
  sinRespuesta: number;
}

interface BestHoursData {
  timeSlots: Array<{
    hora: string;
    contactRate: number;
    successRate: number;
    totalInteractions: number;
  }>;
  byDayOfWeek: Array<{
    dia: string;
    contactRate: number;
    successRate: number;
    totalInteractions: number;
  }>;
}

interface FunnelData {
  intentos: number;
  respuestas: number;
  promesas: number;
  pagos: number;
  pagosCompletos: number;
}

interface AgentEffectiveness {
  agente_id: string;
  nombre: string;
  promesasCumplidas: number;
  totalPromesas: number;
  efectividad: number;
  montoTotal: number;
}

interface PromiseRisk {
  promesa_id: string;
  cliente_id: string;
  monto: number;
  fechaVencimiento: string;
  diasRestantes: number;
  riesgo: 'alto' | 'medio' | 'bajo';
}

interface SentimentData {
  positivo: number;
  neutral: number;
  negativo: number;
  friccion: number;
}

interface LastActivityData {
  ultimaInteraccion: string;
  ultimoPago: string;
  ultimaPromesa: string;
  clienteActivo: string;
}

interface DashboardData {
  kpis: DashboardKPIs;
  activity: ActivityData;
  bestHours: BestHoursData;
  funnel: FunnelData;
  agents: AgentEffectiveness[];
  promisesRisk: PromiseRisk[];
  sentiment: SentimentData;
  lastActivity: LastActivityData;
}

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({
    desde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días atrás
    hasta: new Date().toISOString().split('T')[0], // hoy
    tipo_deuda: 'todos',
    agente_id: 'todos'
  });

  useEffect(() => {
    fetchDashboardData();
  }, [filtros]);

  useEffect(() => {
    console.clear();
    console.log({dashboardData});
  }, [dashboardData]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch KPIs
      const kpisResponse = await fetch(
        `http://localhost:3000/api/dashboard/kpis?desde=${filtros.desde}&hasta=${filtros.hasta}&tipo_deuda=${filtros.tipo_deuda}&agente_id=${filtros.agente_id}`
      );

      if (!kpisResponse.ok) {
        throw new Error(`Error ${kpisResponse.status}: ${kpisResponse.statusText}`);
      }

      const kpisData = await kpisResponse.json();

      // Fetch Activity
      const activityResponse = await fetch(
        `http://localhost:3000/api/dashboard/activity?desde=${filtros.desde}&hasta=${filtros.hasta}`
      );

      if (!activityResponse.ok) {
        throw new Error(`Error ${activityResponse.status}: ${activityResponse.statusText}`);
      }

      const activityData = await activityResponse.json();

      // Fetch Best Hours
      const bestHoursResponse = await fetch(
        `http://localhost:3000/api/dashboard/best-hours?desde=${filtros.desde}&hasta=${filtros.hasta}&tipo_deuda=${filtros.tipo_deuda}&agente_id=${filtros.agente_id}`
      );

      if (!bestHoursResponse.ok) {
        throw new Error(`Error ${bestHoursResponse.status}: ${bestHoursResponse.statusText}`);
      }

      const bestHoursData = await bestHoursResponse.json();

      // Fetch Funnel
      const funnelResponse = await fetch(
        `http://localhost:3000/api/dashboard/funnel?desde=${filtros.desde}&hasta=${filtros.hasta}`
      );

      if (!funnelResponse.ok) {
        throw new Error(`Error ${funnelResponse.status}: ${funnelResponse.statusText}`);
      }

      const funnelData = await funnelResponse.json();

      // Fetch Agents
      const agentsResponse = await fetch(
        `http://localhost:3000/api/dashboard/agents?desde=${filtros.desde}&hasta=${filtros.hasta}`
      );

      if (!agentsResponse.ok) {
        throw new Error(`Error ${agentsResponse.status}: ${agentsResponse.statusText}`);
      }

      const agentsData = await agentsResponse.json();

      // Fetch Promises Risk
      const promisesResponse = await fetch(
        `http://localhost:3000/api/dashboard/promises-risk?desde=${filtros.desde}&hasta=${filtros.hasta}`
      );

      if (!promisesResponse.ok) {
        throw new Error(`Error ${promisesResponse.status}: ${promisesResponse.statusText}`);
      }

      const promisesData = await promisesResponse.json();

      // Fetch Sentiment
      const sentimentResponse = await fetch(
        `http://localhost:3000/api/dashboard/sentiment?desde=${filtros.desde}&hasta=${filtros.hasta}`
      );

      if (!sentimentResponse.ok) {
        throw new Error(`Error ${sentimentResponse.status}: ${sentimentResponse.statusText}`);
      }

      const sentimentData = await sentimentResponse.json();

      // Combinar todos los datos
      const combinedData: DashboardData = {
        kpis: kpisData.data || kpisData,
        activity: activityData.data || activityData,
        bestHours: bestHoursData.data || bestHoursData,
        funnel: funnelData.data || funnelData,
        agents: agentsData.data || agentsData,
        promisesRisk: promisesData.data || promisesData,
        sentiment: sentimentData.data || sentimentData,
        lastActivity: {
          ultimaInteraccion: 'No data available',
          ultimoPago: 'No data available',
          ultimaPromesa: 'No data available',
          clienteActivo: 'No data available'
        }
      };

      setDashboardData(combinedData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-PA', {
      style: 'currency',
      currency: 'PAB'
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value?.toFixed(1)}%`;
  };

  // const formatDelta = (delta: number): string => {
  //   if (delta > 0) return `↑ +${formatPercentage(delta)}`;
  //   if (delta < 0) return `↓ ${formatPercentage(Math.abs(delta))}`;
  //   return '→ 0%';
  // };

  const formatTime = (hours: number): string => {
    if (hours < 24) return `${hours.toFixed(1)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours.toFixed(1)}h`;
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{
          fontSize: '2rem',
          color: '#3498db'
        }}>
          ⏳ Cargando dashboard...
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          fontSize: '2rem',
          color: '#e74c3c'
        }}>
          ❌ Error cargando dashboard
        </div>
        <div style={{
          color: '#7f8c8d',
          fontSize: '1.1rem'
        }}>
          {error || 'No se pudieron cargar los datos'}
        </div>
        <button 
          onClick={fetchDashboardData}
          style={{
            padding: '0.5rem 1rem',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🔄 Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header con filtros */}
      <div style={{
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{
            color: '#2c3e50',
            fontSize: '2.5rem',
            margin: '0 0 0.5rem 0'
          }}>
            📊 Dashboard de Cobranza
          </h1>
          <p style={{
            color: '#7f8c8d',
            fontSize: '1.1rem',
            margin: 0
          }}>
            Período: Últimos 90 días
          </p>
        </div>

        {/* Filtros */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <input
            type="date"
            value={filtros.desde}
            onChange={(e) => setFiltros(prev => ({ ...prev, desde: e.target.value }))}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
          <span>a</span>
          <input
            type="date"
            value={filtros.hasta}
            onChange={(e) => setFiltros(prev => ({ ...prev, hasta: e.target.value }))}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
          <select
            value={filtros.tipo_deuda}
            onChange={(e) => setFiltros(prev => ({ ...prev, tipo_deuda: e.target.value }))}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="todos">Todos los tipos de deuda</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="personal">Personal</option>
            <option value="hipoteca">Hipoteca</option>
            <option value="auto">Auto</option>
          </select>
        </div>
      </div>

      {/* KPIs Principales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <KPICard
          title="Tasa de Recuperación"
          value={formatPercentage(dashboardData?.kpis.tasaRecuperacion)}
          subtitle={`vs período anterior: → ${dashboardData?.kpis.tasaRecuperacion}%`}
          icon="💰"
          color="#27ae60"
        />
        
        <KPICard
          title="Promesas Cumplidas"
          value={formatPercentage(dashboardData?.kpis.promesasCumplidas)}
          subtitle={`${dashboardData?.activity.promesas} promesas totales`}
          icon="✅"
          color="#f39c12"
        />
        
        <KPICard
          title="Promesas Incumplidas"
          value={dashboardData?.kpis.promesasIncumplidas?.toString()}
          subtitle={`${formatCurrency(dashboardData?.kpis?.promesasIncumplidas)} en riesgo`}
          icon="⚠️"
          color="#e74c3c"
        />
        
        <KPICard
          title="Contactabilidad"
          value={formatPercentage(dashboardData?.kpis?.contactabilidad)}
          subtitle={`${dashboardData?.activity.contactosExitosos}/${dashboardData?.activity.totalInteracciones} respuestas`}
          icon="📞"
          color="#3498db"
        />
        
        <KPICard
          title="Tiempo Medio 1er Contacto"
          value={formatTime(dashboardData?.kpis.tiempoMedioContacto)}
          subtitle={`vs período anterior: → ${dashboardData?.kpis.tiempoMedioContacto}h`}
          icon="⏱️"
          color="#9b59b6"
        />
        
        <KPICard
          title="Pago Medio por Cliente"
          value={formatCurrency(dashboardData?.kpis.pagoMedio)}
          subtitle={`Ticket más alto: ${formatCurrency(dashboardData?.kpis.pagoMedio)}`}
          icon="💳"
          color="#1abc9c"
        />
        
        <KPICard
          title="% Pago Completo"
          value={formatPercentage(dashboardData?.kpis.porcentajePagoCompleto)}
          subtitle={`${dashboardData?.funnel.pagos}/${dashboardData?.funnel.pagosCompletos} pagos`}
          icon="🎯"
          color="#e67e22"
        />
        
        <KPICard
          title="Clientes en Riesgo"
          value={dashboardData?.kpis?.clientesEnRiesgo?.toString()}
          subtitle={`Criterio: >3 intentos sin respuesta + sentimiento hostil/frustrado`}
          icon="🚨"
          color="#c0392b"
        />
      </div>

      {/* Gráficos y Widgets */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Actividad por Tiempo */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            color: '#2c3e50',
            margin: '0 0 1rem 0',
            fontSize: '1.3rem'
          }}>
            📈 Actividad por Tiempo
          </h3>
          <div style={{
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7f8c8d',
            border: '2px dashed #ddd',
            borderRadius: '8px'
          }}>
            Gráfico de actividad por día (implementar con Chart.js o similar)
          </div>
        </div>

        {/* Embudo de Cobranza */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            color: '#2c3e50',
            margin: '0 0 1rem 0',
            fontSize: '1.3rem'
          }}>
            🎯 Embudo de Cobranza
          </h3>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {dashboardData?.funnel.intentos > 0 && (
              <div className="funnel-container">
                <div className="funnel-stage">
                  <div className="stage-label">Intentos de Contacto</div>
                  <div className="stage-count">{dashboardData?.funnel.intentos}</div>
                  <div className="stage-percentage">100%</div>
                </div>
                
                <div className="funnel-arrow">→</div>
                
                <div className="funnel-stage">
                  <div className="stage-label">Respuestas</div>
                  <div className="stage-count">{dashboardData?.funnel.respuestas}</div>
                  <div className="stage-percentage">
                    {dashboardData?.funnel.intentos > 0 ? ((dashboardData?.funnel.respuestas / dashboardData?.funnel.intentos) * 100).toFixed(1) : 0}%
                  </div>
                </div>
                
                <div className="funnel-arrow">→</div>
                
                <div className="funnel-stage">
                  <div className="stage-label">Promesas</div>
                  <div className="stage-count">{dashboardData?.funnel.promesas}</div>
                  <div className="stage-percentage">
                    {dashboardData?.funnel.intentos > 0 ? ((dashboardData?.funnel.promesas / dashboardData?.funnel.intentos) * 100).toFixed(1) : 0}%
                  </div>
                </div>
                
                <div className="funnel-arrow">→</div>
                
                <div className="funnel-stage">
                  <div className="stage-label">Pagos</div>
                  <div className="stage-count">{dashboardData?.funnel.pagos}</div>
                  <div className="stage-percentage">
                    {dashboardData?.funnel.intentos > 0 ? ((dashboardData?.funnel.pagos / dashboardData?.funnel.intentos) * 100).toFixed(1) : 0}%
                  </div>
                </div>
                
                <div className="funnel-arrow">→</div>
                
                <div className="funnel-stage">
                  <div className="stage-label">Pagos Completos</div>
                  <div className="stage-count">{dashboardData?.funnel.pagosCompletos}</div>
                  <div className="stage-percentage">
                    {dashboardData?.funnel.intentos > 0 ? ((dashboardData?.funnel.pagosCompletos / dashboardData?.funnel.intentos) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mejores Horarios */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '1.5rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h3 style={{
          color: '#2c3e50',
          margin: '0 0 1rem 0',
          fontSize: '1.3rem'
        }}>
          🕐 Mejores Horarios para Contacto
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {dashboardData?.bestHours.timeSlots?.filter(slot => slot.totalInteractions > 0).slice(0, 8).map((slot, index) => (
            <div key={`hour-${index}`} className="time-slot">
              <div className="time-label">{slot.hora}</div>
              <div className="time-metrics">
                <div className="metric">
                  <span className="metric-label">Contact Rate:</span>
                  <span className="metric-value">{slot.contactRate.toFixed(1)}%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Success Rate:</span>
                  <span className="metric-value">{slot.successRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agentes y Promesas en Riesgo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* Efectividad de Agentes */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            color: '#2c3e50',
            margin: '0 0 1rem 0',
            fontSize: '1.3rem'
          }}>
            👥 Efectividad de Agentes
          </h3>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {dashboardData?.agents?.slice(0, 5).map((agente, index) => (
              <div key={`agente-${agente.agente_id}-${index}`} className="agent-card">
                <div className="agent-header">
                  <h4>{agente.nombre}</h4>
                  <span className="agent-effectiveness">{agente.efectividad.toFixed(1)}% cumplidas</span>
                </div>
                <div className="agent-stats">
                  <div className="stat">
                    <span className="stat-label">Total:</span>
                    <span className="stat-value">{formatCurrency(agente.montoTotal)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Promesas:</span>
                    <span className="stat-value">{agente.totalPromesas}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Promesas en Riesgo */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            color: '#2c3e50',
            margin: '0 0 1rem 0',
            fontSize: '1.3rem'
          }}>
            ⚠️ Promesas en Riesgo
          </h3>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {dashboardData?.promisesRisk.slice(0, 5).map((promesa, index) => (
              <div key={`promesa-${promesa.promesa_id}-${index}`} className="promise-card">
                <div className="promise-header">
                  <h4>Cliente {promesa.cliente_id}</h4>
                  <span className={`risk-level risk-${promesa.riesgo}`}>{promesa.riesgo.toUpperCase()}</span>
                </div>
                <div className="promise-details">
                  <div className="detail">
                    <span className="detail-label">Monto:</span>
                    <span className="detail-value">{formatCurrency(promesa.monto)}</span>
                  </div>
                  <div className="detail">
                    <span className="detail-label">Vence en:</span>
                    <span className="detail-value">{promesa.diasRestantes} días</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div style={{ marginBottom: '2rem' }}>
        <SystemStatus />
      </div>
    </div>
  );
};

export default Dashboard;