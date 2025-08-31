import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';

interface DatabaseStatusProps {}

const DatabaseStatus: React.FC<DatabaseStatusProps> = () => {
  const [neo4jData, setNeo4jData] = useState<any>(null);
  const [graphitiData, setGraphitiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [graphitiLoading, setGraphitiLoading] = useState(false);
  const [graphitiTimeout, setGraphitiTimeout] = useState(false);

  useEffect(() => {
    const checkDatabases = async () => {
      try {
        // Check Neo4j data
        const neo4jResponse = await fetch('http://localhost:3000/api/system/neo4j-status');
        if (neo4jResponse.ok) {
          const neo4jResult = await neo4jResponse.json();
          setNeo4jData(neo4jResult);
        }

        // Check Graphiti data with timeout and loading state
        setGraphitiLoading(true);
        setGraphitiTimeout(false);
        
        const graphitiController = new AbortController();
        const graphitiTimeoutId = setTimeout(() => {
          setGraphitiTimeout(true);
          graphitiController.abort();
        }, 12000); // 12 seconds timeout
        
        try {
          const graphitiResponse = await fetch('http://localhost:3000/api/graph/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'clients' }),
            signal: graphitiController.signal
          });
          
          clearTimeout(graphitiTimeoutId);
          
          if (graphitiResponse.ok) {
            const graphitiResult = await graphitiResponse.json();
            setGraphitiData(graphitiResult);
          }
        } catch (error: any) {
          clearTimeout(graphitiTimeoutId);
          if (error.name === 'AbortError') {
            console.log('Graphiti request timed out after 12 seconds');
            setGraphitiTimeout(true);
          } else {
            console.error('Graphiti request failed:', error);
          }
        } finally {
          setGraphitiLoading(false);
        }
      } catch (error) {
        console.error('Error checking databases:', error);
      } finally {
        setLoading(false);
      }
    };

    checkDatabases();
  }, []);

  if (loading) {
    return (
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: '#fff3cd',
        borderRadius: '6px',
        border: '1px solid #ffeaa7'
      }}>
        🔍 Verificando estado de las bases de datos...
      </div>
    );
  }

  return (
    <div style={{
      marginTop: '1rem',
      padding: '1rem',
      backgroundColor: '#e8f4fd',
      borderRadius: '6px',
      border: '1px solid #bee5eb'
    }}>
      <strong>📊 Estado de las Bases de Datos:</strong>
      <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
        <div>
          <strong>Neo4j:</strong> 
          {neo4jData ? (
            <span style={{ color: '#28a745' }}>
              ✓ {neo4jData.total_nodes || 0} nodos, {neo4jData.total_relationships || 0} relaciones
            </span>
          ) : (
            <span style={{ color: '#dc3545' }}>✗ No disponible</span>
          )}
        </div>
        <div>
          <strong>Graphiti:</strong>
          {graphitiLoading ? (
            <span style={{ color: '#007bff' }}>⏳ Consultando... (puede tardar hasta 12s)</span>
          ) : graphitiTimeout ? (
            <span style={{ color: '#dc3545' }}>⏰ Timeout después de 12s</span>
          ) : graphitiData ? (
            <span style={{ color: graphitiData.facts?.length > 0 ? '#28a745' : '#ffc107' }}>
              {graphitiData.facts?.length > 0 ? '✓' : '⚠️'} {graphitiData.facts?.length || 0} facts
            </span>
          ) : (
            <span style={{ color: '#dc3545' }}>✗ No disponible</span>
          )}
        </div>
      </div>
    </div>
  );
};

interface GraphViewProps {
  // data prop not used anymore - component fetches its own data
}

const GraphView: React.FC<GraphViewProps> = () => {
  const cyRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<cytoscape.Core | null>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch graph data from API
  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
        
        const response = await fetch('http://localhost:3000/api/graph', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        
        // Handle the API response format
        if (data.success === false) {
          // API returned error information
          const errorMessage = data.error_type === 'graphiti_search_error' 
            ? `Error de búsqueda en Graphiti: ${data.error}` 
            : data.error || 'Error desconocido';
          setError(errorMessage);
          setGraphData(null);
        } else if (data.data) {
          // API returned graph data with success wrapper
          console.log('🎯 Graph data received:', data.data);
          console.log('📊 Nodes count:', data.data.nodes?.length);
          console.log('🔗 Edges count:', data.data.edges?.length);
          setGraphData(data.data);
        } else {
          setError('Formato de respuesta inesperado');
          setGraphData(null);
        }
      } catch (err: any) {
        console.error('Error fetching graph data:', err);
        if (err.name === 'AbortError') {
          setError('La consulta tardó más de 20 segundos y fue cancelada');
        } else {
          setError(err instanceof Error ? err.message : 'Error desconocido');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, []);

  // Initialize Cytoscape when data is ready
  useEffect(() => {
    if (!graphData || !cyRef.current) return;

    // Clean up previous instance
    if (cyInstance.current) {
      cyInstance.current.destroy();
    }

    // Prepare elements for Cytoscape with proper data mapping
    const elements = [
      // Map nodes to Cytoscape format
      ...(graphData.nodes || []).map((node: any) => ({
        data: {
          id: node.id,
          label: node.label,
          type: node.type,
          group: node.type?.toLowerCase() || 'default', // Cytoscape uses 'group' for styling
          amount: node.properties?.amount,
          ...node.properties
        },
        group: 'nodes'
      })),
      // Map edges to Cytoscape format
      ...(graphData.edges || []).map((edge: any) => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          relationship: edge.type, // Use 'relationship' for edge labels
          type: edge.type,
          ...edge.properties
        },
        group: 'edges'
      }))
    ];

    console.log('🎨 Elements prepared for Cytoscape:', elements);
    console.log('📊 Nodes elements:', elements.filter(el => el.group === 'nodes').length);
    console.log('🔗 Edges elements:', elements.filter(el => el.group === 'edges').length);

    // Initialize Cytoscape
    cyInstance.current = cytoscape({
      container: cyRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
                      'background-color': (node: any) => {
            const group = node.data('group');
            console.log('🎨 Node group for styling:', group, 'from node:', node.data());
            switch (group) {
              case 'client': return '#3498db';
              case 'agent': return '#9b59b6';
              case 'interaction': return '#e74c3c';
              case 'promise': return '#f39c12';
              case 'payment': return '#27ae60';
              case 'debt': return '#e67e22';
              default: return '#95a5a6';
            }
          },
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': 'white',
            'text-outline-color': '#000',
            'text-outline-width': 1,
            'font-size': '12px',
            'font-weight': 'bold',
            'width': '60px',
            'height': '60px'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#bdc3c7',
            'target-arrow-color': '#bdc3c7',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(relationship)',
            'font-size': '10px',
            'text-rotation': 'autorotate',
            'text-margin-y': -10,
            'color': '#7f8c8d'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 3,
            'border-color': '#2c3e50'
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: true,
        animationDuration: 1000,
        fit: true,
        padding: 50,
        nodeRepulsion: 8000,
        nodeOverlap: 20,
        idealEdgeLength: 100
      }
    });

    // Add click event handler
    cyInstance.current.on('tap', 'node', function(evt) {
      const node = evt.target;
      const data = node.data();
      console.log('Node clicked:', data);
      
      // You can add tooltip or modal logic here
      alert(`${data.type}: ${data.label}\n${data.amount ? `Amount: $${data.amount}` : ''}`);
    });

    // Cleanup on unmount
    return () => {
      if (cyInstance.current) {
        cyInstance.current.destroy();
        cyInstance.current = null;
      }
    };
  }, [graphData]);

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          fontSize: '2rem',
          color: '#3498db'
        }}>
          ⏳ Cargando grafo...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '1rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      minHeight: '600px'
    }}>
      {error && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '6px',
          padding: '1rem',
          marginBottom: '1rem',
          color: '#856404'
        }}>
          ⚠️ Error conectando con la API: {error}. Mostrando datos de ejemplo si están disponibles.
        </div>
      )}
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        borderBottom: '1px solid #dee2e6',
        paddingBottom: '1rem'
      }}>
        <div>
          <h2 style={{
            color: '#2c3e50',
            margin: '0 0 0.5rem 0',
            fontSize: '1.5rem'
          }}>
            🕸️ Vista Interactiva del Grafo
          </h2>
          {graphData && (
            <p style={{
              color: '#7f8c8d',
              margin: 0,
              fontSize: '0.9rem'
            }}>
              {graphData.nodes?.length || 0} nodos • {graphData.edges?.length || 0} relaciones
            </p>
          )}
        </div>
        
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          {[
            { type: 'Client', color: '#3498db', icon: '👤' },
            { type: 'Agent', color: '#9b59b6', icon: '👨‍💼' },
            { type: 'Interaction', color: '#e74c3c', icon: '📞' },
            { type: 'Promise', color: '#f39c12', icon: '🤝' },
            { type: 'Payment', color: '#27ae60', icon: '💰' },
            { type: 'Debt', color: '#e67e22', icon: '📋' }
          ].map(node => (
            <div key={node.type} style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: node.color,
              color: 'white',
              borderRadius: '12px',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              {node.icon} {node.type}
            </div>
          ))}
        </div>
      </div>
      
      <div
        ref={cyRef}
        style={{
          width: '100%',
          height: '500px',
          border: '1px solid #dee2e6',
          borderRadius: '6px'
        }}
      />
      
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        fontSize: '0.9rem',
        color: '#6c757d'
      }}>
        <strong>💡 Instrucciones:</strong>
        <ul style={{ margin: '0.5rem 0 0 1rem', paddingLeft: '1rem' }}>
          <li>Haz clic en cualquier nodo para ver sus detalles</li>
          <li>Arrastra para mover nodos</li>
          <li>Usa la rueda del mouse para hacer zoom</li>
          <li>Arrastra el fondo para desplazar la vista</li>
        </ul>
      </div>
      
      <DatabaseStatus />
    </div>
  );
};

export default GraphView;