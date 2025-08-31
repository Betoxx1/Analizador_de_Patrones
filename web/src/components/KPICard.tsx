import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: string;
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon = '📊',
  color = '#3498db' 
}) => {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '1.5rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      border: `3px solid ${color}`,
      textAlign: 'center',
      minHeight: '120px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <div style={{
        fontSize: '2rem',
        marginBottom: '0.5rem'
      }}>
        {icon}
      </div>
      <h3 style={{
        margin: '0 0 0.5rem 0',
        color: '#2c3e50',
        fontSize: '0.9rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {title}
      </h3>
      <div style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        color: color,
        margin: '0.5rem 0'
      }}>
        {value}
      </div>
      {subtitle && (
        <div style={{
          fontSize: '0.8rem',
          color: '#7f8c8d',
          marginTop: '0.5rem'
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default KPICard;