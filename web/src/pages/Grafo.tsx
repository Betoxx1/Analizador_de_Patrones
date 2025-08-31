import React from 'react';
import GraphView from '../components/GraphView';

const Grafo: React.FC = () => {
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
          🕸️ Vista de Grafo
        </h1>
        <p style={{
          color: '#7f8c8d',
          fontSize: '1.1rem',
          margin: 0
        }}>
          Visualización interactiva del grafo de conocimiento
        </p>
      </div>

      <GraphView />
    </div>
  );
};

export default Grafo;