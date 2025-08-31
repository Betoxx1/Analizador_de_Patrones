import React from 'react';

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

interface TimelineProps {
  clientId: string;
  items: TimelineItem[];
}

const Timeline: React.FC<TimelineProps> = ({ clientId, items }) => {
  const getResultColor = (result: string): string => {
    switch (result) {
      case 'pago_inmediato':
        return '#27ae60';
      case 'promesa_pago':
        return '#f39c12';
      case 'renegociacion':
        return '#3498db';
      case 'contacto_exitoso':
        return '#9b59b6';
      case 'no_contacto':
        return '#e74c3c';
      case 'negativa':
        return '#c0392b';
      default:
        return '#95a5a6';
    }
  };

  const getResultIcon = (result: string): string => {
    switch (result) {
      case 'pago_inmediato':
        return '💰';
      case 'promesa_pago':
        return '🤝';
      case 'renegociacion':
        return '📋';
      case 'contacto_exitoso':
        return '✅';
      case 'no_contacto':
        return '❌';
      case 'negativa':
        return '🚫';
      default:
        return '📞';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'llamada':
        return '📞';
      case 'whatsapp':
        return '💬';
      case 'email':
        return '📧';
      case 'sms':
        return '📱';
      default:
        return '📞';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (items.length === 0) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>
          No se encontraron interacciones para el cliente {clientId}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '1.5rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{
        margin: '0 0 1.5rem 0',
        color: '#2c3e50',
        fontSize: '1.3rem'
      }}>
        📈 Timeline del Cliente {clientId}
      </h2>
      
      <div style={{ position: 'relative' }}>
        {items.map((item, index) => (
          <div key={item.id} style={{
            position: 'relative',
            paddingLeft: '3rem',
            paddingBottom: index < items.length - 1 ? '2rem' : '0'
          }}>
            {/* Timeline line */}
            {index < items.length - 1 && (
              <div style={{
                position: 'absolute',
                left: '1.25rem',
                top: '2rem',
                bottom: '-1rem',
                width: '2px',
                backgroundColor: '#ecf0f1'
              }} />
            )}
            
            {/* Timeline dot */}
            <div style={{
              position: 'absolute',
              left: '0.5rem',
              top: '0.5rem',
              width: '1.5rem',
              height: '1.5rem',
              borderRadius: '50%',
              backgroundColor: getResultColor(item.result),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem'
            }}>
              {getResultIcon(item.result)}
            </div>
            
            {/* Timeline content */}
            <div style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              padding: '1rem',
              borderLeft: `4px solid ${getResultColor(item.result)}`
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '0.5rem'
              }}>
                <div>
                  <span style={{
                    fontWeight: 'bold',
                    color: '#2c3e50'
                  }}>
                    {getTypeIcon(item.type)} {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </span>
                  <span style={{
                    marginLeft: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '12px',
                    backgroundColor: getResultColor(item.result),
                    color: 'white',
                    fontSize: '0.8rem'
                  }}>
                    {item.result.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  color: '#7f8c8d'
                }}>
                  {formatDate(item.datetime)}
                </div>
              </div>
              
              {item.agent && (
                <div style={{
                  fontSize: '0.9rem',
                  color: '#34495e',
                  marginBottom: '0.5rem'
                }}>
                  👤 Agente: {item.agent.name || item.agent.id}
                </div>
              )}
              
              {item.promise && (
                <div style={{
                  backgroundColor: '#fff3cd',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  marginTop: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  🤝 Promesa: ${item.promise.amount?.toLocaleString()} 
                  {item.promise.promised_date && ` para el ${formatDate(item.promise.promised_date)}`}
                </div>
              )}
              
              {item.payment && (
                <div style={{
                  backgroundColor: '#d4edda',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  marginTop: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  💰 Pago: ${item.payment.amount?.toLocaleString()}
                </div>
              )}
              
              {item.observations && (
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.85rem',
                  color: '#6c757d',
                  fontStyle: 'italic'
                }}>
                  📝 {item.observations}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;