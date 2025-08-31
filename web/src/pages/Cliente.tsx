import React, { useState } from 'react';
import Timeline from '../components/Timeline';

interface TimelineItem {
  id: string;
  datetime: string;
  type: string;
  result: string;
  agent?: {
    id: string;
    name: string;
  };
  promise?: {
    amount?: number;
    promised_date?: string;
  };
  payment?: {
    amount?: number;
  };
  observations?: string;
}

interface TimelineResponse {
  client_id: string;
  timeline: TimelineItem[];
  total_interactions: number;
}

const Cliente: React.FC = () => {
  const [clientId, setClientId] = useState('');
  const [timeline, setTimeline] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = async () => {
    if (!clientId.trim()) {
      setError('Por favor ingrese un ID de cliente');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3000/api/clientes/${encodeURIComponent(clientId.trim())}/timeline`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Cliente ${clientId} no encontrado`);
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle the API response format
      if (data.error) {
        // API returned error information
        const errorMessage = data.error_type === 'graphiti_search_error' 
          ? `Error de búsqueda en Graphiti: ${data.error}` 
          : data.error || 'Error desconocido';
        setError(errorMessage);
        setTimeline(null);
      } else if (data.timeline) {
        // API returned timeline data directly
        setTimeline(data);
      } else {
        setError('Formato de respuesta inesperado');
        setTimeline(null);
      }
    } catch (err) {
      console.error('Error fetching timeline:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setTimeline(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTimeline();
  };

  return (
    <div>
      <div style={{
        marginBottom: '2rem'
      }}>
        <h1 style={{
          color: '#2c3e50',
          fontSize: '2.5rem',
          margin: '0 0 0.5rem 0'
        }}>
          👤 Análisis por Cliente
        </h1>
        <p style={{
          color: '#7f8c8d',
          fontSize: '1.1rem',
          margin: 0
        }}>
          Consulta el timeline de interacciones de un cliente específico
        </p>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '1.5rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-end'
        }}>
          <div style={{ flex: 1 }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#2c3e50',
              fontWeight: 'bold'
            }}>
              ID del Cliente
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Ejemplo: cliente_001"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '1rem',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: loading ? '#bdc3c7' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => {
              if (!loading) (e.target as HTMLElement).style.backgroundColor = '#2980b9';
            }}
            onMouseOut={(e) => {
              if (!loading) (e.target as HTMLElement).style.backgroundColor = '#3498db';
            }}
          >
            {loading ? '🔍 Consultando...' : '🔍 Consultar'}
          </button>
        </form>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '6px',
          padding: '1rem',
          marginBottom: '2rem',
          color: '#721c24'
        }}>
          ❌ {error}
          {error.includes('Error') && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              💡 Mostrando datos de ejemplo. Verifica que la API esté funcionando en http://localhost:3000
            </div>
          )}
        </div>
      )}

      {timeline && (
        <div>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{
              color: '#2c3e50',
              margin: '0 0 1rem 0',
              fontSize: '1.3rem'
            }}>
              📊 Resumen del Cliente {timeline.client_id}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{
                textAlign: 'center',
                padding: '1rem',
                backgroundColor: '#e8f5e8',
                borderRadius: '6px'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📞</div>
                <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                  {timeline.total_interactions}
                </div>
                <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                  Total Interacciones
                </div>
              </div>
              
              <div style={{
                textAlign: 'center',
                padding: '1rem',
                backgroundColor: '#e3f2fd',
                borderRadius: '6px'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
                <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                  {timeline.timeline.filter(t => t.result === 'pago_inmediato').length}
                </div>
                <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                  Pagos Realizados
                </div>
              </div>
              
              <div style={{
                textAlign: 'center',
                padding: '1rem',
                backgroundColor: '#fff3e0',
                borderRadius: '6px'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤝</div>
                <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                  {timeline.timeline.filter(t => t.result === 'promesa_pago').length}
                </div>
                <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                  Promesas de Pago
                </div>
              </div>
            </div>
          </div>
          
          <Timeline 
            clientId={timeline.client_id} 
            items={timeline.timeline} 
          />
        </div>
      )}

      {!timeline && !loading && !error && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '3rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1rem',
            color: '#bdc3c7'
          }}>
            👤
          </div>
          <p style={{
            color: '#7f8c8d',
            fontSize: '1.1rem',
            margin: 0
          }}>
            Ingresa un ID de cliente para consultar su timeline de interacciones
          </p>
        </div>
      )}
    </div>
  );
};

export default Cliente;