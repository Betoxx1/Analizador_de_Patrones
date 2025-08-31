import React from 'react';
import SystemStatus from '../components/SystemStatus';
import SystemLogs from '../components/SystemLogs';

const Sistema: React.FC = () => {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          color: '#2c3e50',
          fontSize: '2.5rem',
          margin: '0 0 0.5rem 0'
        }}>
          ⚡ Estado del Sistema
        </h1>
        <p style={{
          color: '#7f8c8d',
          fontSize: '1.1rem',
          margin: 0
        }}>
          Monitor en tiempo real de servicios y conectividad
        </p>
      </div>

      <SystemStatus />

      <div style={{ marginBottom: '2rem' }}>
        <SystemLogs />
      </div>
    </div>
  );
};

export default Sistema;