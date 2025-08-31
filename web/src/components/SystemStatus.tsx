import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, Database, Brain, Key, RefreshCw } from 'lucide-react';

interface ServiceStatus {
  status: string;
  message: string;
  test_successful?: boolean;
  has_data?: boolean;
  total_nodes?: number;
  error?: string;
}

interface OpenAIBalanceData {
  status: string;
  message: string;
  has_funds: boolean;
  details: string;
  available_models?: string[];
}

interface SystemStatusData {
  timestamp: string;
  services: {
    openai: ServiceStatus;
    neo4j: ServiceStatus;
    graphiti: ServiceStatus;
  };
  data_pipeline: {
    can_ingest: boolean;
    can_query: boolean;
    has_data: boolean;
    ready_for_production: boolean;
  };
  recommendations: string[];
}

const SystemStatus: React.FC = () => {
  const [status, setStatus] = useState<SystemStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [balanceData, setBalanceData] = useState<OpenAIBalanceData | null>(null);
  const [checkingBalance, setCheckingBalance] = useState(false);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/system/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setLastUpdate(new Date());
      } else {
        console.error('Failed to fetch system status:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching system status:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkOpenAIBalance = async () => {
    setCheckingBalance(true);
    try {
      const response = await fetch('http://localhost:3000/api/system/openai-balance');
      if (response.ok) {
        const data = await response.json();
        setBalanceData(data);
      } else {
        console.error('Failed to check OpenAI balance:', response.statusText);
        setBalanceData({
          status: 'error',
          message: 'Error conectando con el servidor',
          has_funds: false,
          details: 'No se pudo conectar con el endpoint'
        });
      }
    } catch (error) {
      console.error('Error checking OpenAI balance:', error);
      setBalanceData({
        status: 'error',
        message: 'Error de conexión',
        has_funds: false,
        details: 'No se pudo conectar con el servidor'
      });
    } finally {
      setCheckingBalance(false);
    }
  };

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchSystemStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // ---------- Styles helpers ----------
  const baseShadow = '0 10px 15px rgba(0,0,0,0.05), 0 4px 6px rgba(0,0,0,0.03)';
  const softShadow = '0 6px 12px rgba(0,0,0,0.06)';

  const containerStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 12,
    boxShadow: baseShadow,
    border: '1px solid #f3f4f6',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, #2563eb, #1d4ed8)',
    padding: 24,
    color: '#fff',
  };

  const headerRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const headerLeftStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    columnGap: 12,
  };

  const headerIconBox: React.CSSProperties = {
    width: 40,
    height: 40,
    background: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const headerTextTitle: React.CSSProperties = { fontSize: 18, fontWeight: 600, margin: 0 };
  const headerTextSub: React.CSSProperties = { color: 'rgba(219,234,254,1)', fontSize: 13, marginTop: 2 };

  const headerControls: React.CSSProperties = { display: 'flex', alignItems: 'center', columnGap: 16 };

  const checkboxLabel: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    columnGap: 8,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '8px 12px',
  };

  const buttonStyle = (spinning: boolean): React.CSSProperties => ({
    background: spinning ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.10)',
    color: '#fff',
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    columnGap: 8,
    cursor: spinning ? 'wait' : 'pointer',
    transition: 'all 0.2s ease',
    transform: spinning ? 'scale(0.98)' : 'scale(1)',
    opacity: spinning ? 0.8 : 1,
    ...(spinning ? { 
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' 
    } : {
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }),
  });

  const balanceButtonStyle = (checking: boolean): React.CSSProperties => ({
    background: checking ? '#3730a3' : '#4f46e5',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 8,
    cursor: checking ? 'wait' : 'pointer',
    transition: 'all 0.2s ease',
    transform: checking ? 'scale(0.98)' : 'scale(1)',
    opacity: checking ? 0.8 : 1,
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
    minWidth: '200px'
  });

  const subHeaderRowStyle: React.CSSProperties = {
    marginTop: 12,
    display: 'flex',
    alignItems: 'center',
    columnGap: 8,
    color: 'rgba(219,234,254,1)',
    fontSize: 13,
  };

  const pageBodyStyle: React.CSSProperties = { padding: 24 };

  const grid3Style: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 24,
    marginBottom: 32,
  };

  const cardBase: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'solid',
    transition: 'box-shadow 0.2s ease',
    boxShadow: softShadow,
  };

  const cardInner: React.CSSProperties = { padding: 24 };

  const cardHeaderRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  };

  const cardHeaderLeft: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    columnGap: 12,
  };

  const iconWrap: React.CSSProperties = {
    padding: 8,
    background: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
  };

  const smallNote: React.CSSProperties = { fontSize: 12, color: '#4b5563' };
  const cardTitle: React.CSSProperties = { fontWeight: 600, color: '#111827', margin: 0 };
  const messageText: React.CSSProperties = { fontSize: 14, fontWeight: 500, color: '#1f2937', margin: 0 };

  const rowSplitSmall: React.CSSProperties = {
    marginTop: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 12,
  };

  const badgePill: React.CSSProperties = {
    padding: '4px 8px',
    background: 'rgba(255,255,255,0.6)',
    borderRadius: 999,
    fontWeight: 500,
  };

  const errorBox: React.CSSProperties = {
    fontSize: 12,
    color: '#991b1b',
    background: '#fef2f2',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    whiteSpace: 'pre-wrap',
  };

  const sectionCard: React.CSSProperties = {
    background: 'linear-gradient(90deg, #f8fafc, #f3f4f6)',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    border: '1px solid #e5e7eb',
  };

  const grid4Style: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 16,
  };

  const metricCard = (ok: boolean, warn?: boolean): React.CSSProperties => ({
    padding: 16,
    borderRadius: 10,
    border: `2px solid ${ok ? '#bbf7d0' : warn ? '#fde68a' : '#fecaca'}`,
    background: ok ? '#f0fdf4' : warn ? '#fef9c3' : '#fef2f2',
    transition: 'box-shadow 0.2s ease',
  });

  const qaContainer: React.CSSProperties = {
    background: 'linear-gradient(135deg, #f8fafc, #f3f4f6, #f1f5f9)',
    borderRadius: 16,
    padding: 32,
    border: '1px solid #e5e7eb',
    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
  };
  const boxShadow = '0 12px 24px rgba(0,0,0,0.15)';

  const qaHeaderRow: React.CSSProperties = { display: 'flex', alignItems: 'center', columnGap: 16, marginBottom: 24 };
  const qaIcon: React.CSSProperties = {
    padding: 12,
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    borderRadius: 12,
    color: '#fff',
    boxShadow,
  } as React.CSSProperties;

  const infoCard = (tone: 'yellow' | 'green' | 'red'): React.CSSProperties => {
    const tones = {
      yellow: {
        bg: 'linear-gradient(90deg, #fffbeb, #fef3c7)',
        border: '#fde68a',
        iconBg: 'linear-gradient(135deg, #f59e0b, #f59e0b)',
      },
      green: {
        bg: 'linear-gradient(90deg, #ecfdf5, #d1fae5)',
        border: '#bbf7d0',
        iconBg: 'linear-gradient(135deg, #10b981, #059669)',
      },
      red: {
        bg: 'linear-gradient(90deg, #fef2f2, #ffe4e6)',
        border: '#fecaca',
        iconBg: 'linear-gradient(135deg, #ef4444, #f43f5e)',
      },
    }[tone];

    return {
      position: 'relative',
      overflow: 'hidden',
      background: tones.bg,
      border: `2px solid ${tones.border}`,
      borderRadius: 16,
      padding: 24,
      boxShadow: softShadow,
    };
  };

  const infoIconBox = (tone: 'yellow' | 'green' | 'red'): React.CSSProperties => {
    const bg = tone === 'yellow'
      ? 'linear-gradient(135deg, #f59e0b, #f59e0b)'
      : tone === 'green'
      ? 'linear-gradient(135deg, #10b981, #059669)'
      : 'linear-gradient(135deg, #ef4444, #f43f5e)';
    return {
      width: 48,
      height: 48,
      background: bg,
      borderRadius: 14,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
    };
  };

  const mutedCard: React.CSSProperties = {
    background: 'linear-gradient(90deg, #f1f5f9, #e5e7eb)',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: 24,
  };

  const subTitle: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 8px' };
  const mutedP: React.CSSProperties = { color: '#374151', lineHeight: 1.6, margin: 0 };

  const pill = (bg: string, color: string): React.CSSProperties => ({
    padding: '4px 8px',
    borderRadius: 999,
    fontWeight: 600,
    background: bg,
    color,
    fontSize: 12,
  });

  // Color logic per status
  const getStatusStyle = (serviceStatus: string, hasData?: boolean) => {
    switch (serviceStatus) {
      case 'available':
      case 'healthy':
      case 'connected':
        if (hasData === false) {
          return { borderColor: '#fde68a', background: '#fffbeb' }; // yellow
        }
        return { borderColor: '#bbf7d0', background: '#f0fdf4' }; // green
      case 'quota_exceeded':
      case 'invalid_key':
      case 'disconnected':
      case 'unreachable':
      case 'unhealthy':
        return { borderColor: '#fecaca', background: '#fef2f2' }; // red
      default:
        return { borderColor: '#e5e7eb', background: '#f9fafb' }; // gray
    }
  };

  // Icons (no classes, use props)
  const getStatusIcon = (serviceStatus: string, hasData?: boolean) => {
    switch (serviceStatus) {
      case 'available':
      case 'healthy':
      case 'connected':
        return hasData === false ? (
          <AlertCircle size={20} color="#eab308" />
        ) : (
          <CheckCircle size={20} color="#22c55e" />
        );
      case 'quota_exceeded':
      case 'invalid_key':
      case 'disconnected':
      case 'unreachable':
      case 'unhealthy':
        return <AlertCircle size={20} color="#ef4444" />;
      default:
        return <Clock size={20} color="#9ca3af" />;
    }
  };

  // ---------- Render ----------
  if (loading) {
    return (
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: baseShadow, padding: 24 }}>
        <style>{`@keyframes spin { from {transform: rotate(0deg);} to {transform: rotate(360deg);} }`}</style>
        <div style={{ display: 'flex', alignItems: 'center', columnGap: 8, marginBottom: 16 }}>
          <div style={{ animation: 'spin 1s linear infinite', display: 'inline-flex' }}>
            <Clock size={20} color="#9ca3af" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 500, color: '#111827', margin: 0 }}>Checking System Status...</h3>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: baseShadow, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', columnGap: 8, marginBottom: 16 }}>
          <AlertCircle size={20} color="#ef4444" />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>Cannot Connect to API</h3>
        </div>
        <p style={{ color: '#4b5563', margin: 0 }}>
          Unable to fetch system status. Make sure the API server is running on port 3000.
        </p>
        <button 
          onClick={fetchSystemStatus} 
          style={{
            marginTop: 16,
            padding: '8px 16px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500
          }}
        >
          🔄 Reintentar Conexión
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <style>{`@keyframes spin { from {transform: rotate(0deg);} to {transform: rotate(360deg);} }`}</style>

      {/* Header */}
      <div style={headerStyle}>
        <div style={headerRowStyle}>
          <div style={headerLeftStyle}>
            <div style={headerIconBox}><span style={{ fontSize: 20 }}>⚡</span></div>
            <div>
              <h3 style={headerTextTitle}>System Status</h3>
              <p style={headerTextSub}>Real-time service monitoring</p>
            </div>
          </div>

          <div style={headerControls}>
            <label style={checkboxLabel}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ accentColor: '#2563eb', width: 16, height: 16 }}
              />
              <span style={{ fontSize: 14, color: '#fff' }}>Auto-refresh</span>
            </label>
            <button onClick={fetchSystemStatus} style={buttonStyle(loading)}>
              <div style={loading ? { animation: 'spin 1s linear infinite', display: 'inline-flex' } : {}}>
                <RefreshCw size={16} color="#ffffff" />
              </div>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {lastUpdate && (
          <div style={subHeaderRowStyle}>
            <Clock size={16} color="rgba(219,234,254,1)" />
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      <div style={pageBodyStyle}>
        {/* Services Grid */}
        <div style={grid3Style}>
          {/* OpenAI */}
          <div style={{ ...cardBase, ...getStatusStyle(status.services.openai.status) }}>
            <div style={cardInner}>
              <div style={cardHeaderRow}>
                <div style={cardHeaderLeft}>
                  <div style={iconWrap}><Key size={24} color="#374151" /></div>
                  <div>
                    <h4 style={cardTitle}>OpenAI API</h4>
                    <p style={smallNote}>AI Processing Engine</p>
                  </div>
                </div>
                <div style={{ fontSize: 24 }}>{getStatusIcon(status.services.openai.status)}</div>
              </div>

              <div style={{ display: 'grid', rowGap: 8 }}>
                <p style={messageText}>{status.services.openai.message}</p>
                <div style={rowSplitSmall}>
                  <span style={badgePill}>
                    {status.services.openai.status.replace('_', ' ').toUpperCase()}
                  </span>
                  {status.services.openai.test_successful !== undefined && (
                    <span
                      style={
                        status.services.openai.test_successful
                          ? pill('#dcfce7', '#166534')
                          : pill('#fee2e2', '#7f1d1d')
                      }
                    >
                      {status.services.openai.test_successful ? 'Test Passed' : 'Test Failed'}
                    </span>
                  )}
                </div>
                {status.services.openai.error && <p style={errorBox}>{status.services.openai.error}</p>}
              </div>
            </div>
          </div>

          {/* Neo4j */}
          <div
            style={{
              ...cardBase,
              ...getStatusStyle(status?.services?.neo4j?.status, status?.services?.neo4j?.has_data),
            }}
          >
            <div style={cardInner}>
              <div style={cardHeaderRow}>
                <div style={cardHeaderLeft}>
                  <div style={iconWrap}><Database size={24} color="#374151" /></div>
                  <div>
                    <h4 style={cardTitle}>Neo4j Database</h4>
                    <p style={smallNote}>Graph Database</p>
                  </div>
                </div>
                <div style={{ fontSize: 24 }}>
                  {getStatusIcon(status?.services?.neo4j?.status, status?.services?.neo4j?.has_data)}
                </div>
              </div>

              <div style={{ display: 'grid', rowGap: 8 }}>
                <p style={messageText}>{status?.services?.neo4j?.message}</p>
                <div style={rowSplitSmall}>
                  <span style={badgePill}>{status?.services?.neo4j?.status.replace('_', ' ').toUpperCase()}</span>
                  {typeof status?.services?.neo4j?.total_nodes === 'number' && (
                    <span
                      style={
                        status?.services?.neo4j?.total_nodes > 0
                          ? pill('#dbeafe', '#1e40af')
                          : pill('#fef3c7', '#92400e')
                      }
                    >
                      {status?.services?.neo4j?.total_nodes} nodes
                    </span>
                  )}
                </div>
                {status?.services?.neo4j?.error && <p style={errorBox}>{status?.services?.neo4j?.error}</p>}
              </div>
            </div>
          </div>

          {/* Graphiti */}
          <div style={{ ...cardBase, ...getStatusStyle(status.services.graphiti.status) }}>
            <div style={cardInner}>
              <div style={cardHeaderRow}>
                <div style={cardHeaderLeft}>
                  <div style={iconWrap}><Brain size={24} color="#374151" /></div>
                  <div>
                    <h4 style={cardTitle}>Graphiti Service</h4>
                    <p style={smallNote}>AI Knowledge Layer</p>
                  </div>
                </div>
                <div style={{ fontSize: 24 }}>{getStatusIcon(status.services.graphiti.status)}</div>
              </div>

              <div style={{ display: 'grid', rowGap: 8 }}>
                <p style={messageText}>{status.services.graphiti.message}</p>
                <div style={rowSplitSmall}>
                  <span style={badgePill}>{status.services.graphiti.status.replace('_', ' ').toUpperCase()}</span>
                </div>
                {status.services.graphiti.error && <p style={errorBox}>{status.services.graphiti.error}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Data Pipeline */}
        <div style={sectionCard}>
          <div style={{ display: 'flex', alignItems: 'center', columnGap: 12, marginBottom: 16 }}>
            <div style={{ padding: 8, background: '#f3e8ff', borderRadius: 10 }}>
              <span style={{ fontSize: 20 }}>🔄</span>
            </div>
            <div>
              <h4 style={cardTitle}>Data Pipeline Status</h4>
              <p style={smallNote}>End-to-end data flow monitoring</p>
            </div>
          </div>

          <div style={grid4Style}>
            <div style={metricCard(status.data_pipeline.can_ingest)}>
              <div style={{ display: 'flex', alignItems: 'center', columnGap: 8, marginBottom: 8 }}>
                {status.data_pipeline.can_ingest ? (
                  <CheckCircle size={20} color="#22c55e" />
                ) : (
                  <AlertCircle size={20} color="#ef4444" />
                )}
                <span style={{ fontWeight: 600, color: '#111827' }}>Ingestion</span>
              </div>
              <p style={{ fontSize: 12, color: '#4b5563', margin: 0 }}>
                {status.data_pipeline.can_ingest ? 'Ready to load data' : 'Cannot load data'}
              </p>
            </div>

            <div style={metricCard(status.data_pipeline.can_query)}>
              <div style={{ display: 'flex', alignItems: 'center', columnGap: 8, marginBottom: 8 }}>
                {status.data_pipeline.can_query ? (
                  <CheckCircle size={20} color="#22c55e" />
                ) : (
                  <AlertCircle size={20} color="#ef4444" />
                )}
                <span style={{ fontWeight: 600, color: '#111827' }}>Query</span>
              </div>
              <p style={{ fontSize: 12, color: '#4b5563', margin: 0 }}>
                {status.data_pipeline.can_query ? 'Ready to query data' : 'Cannot query data'}
              </p>
            </div>

            <div style={metricCard(status.data_pipeline.has_data, !status.data_pipeline.has_data)}>
              <div style={{ display: 'flex', alignItems: 'center', columnGap: 8, marginBottom: 8 }}>
                {status.data_pipeline.has_data ? (
                  <CheckCircle size={20} color="#22c55e" />
                ) : (
                  <AlertCircle size={20} color="#eab308" />
                )}
                <span style={{ fontWeight: 600, color: '#111827' }}>Data</span>
              </div>
              <p style={{ fontSize: 12, color: '#4b5563', margin: 0 }}>
                {status.data_pipeline.has_data ? 'Data loaded' : 'No data loaded'}
              </p>
            </div>

            <div style={metricCard(status.data_pipeline.ready_for_production)}>
              <div style={{ display: 'flex', alignItems: 'center', columnGap: 8, marginBottom: 8 }}>
                {status.data_pipeline.ready_for_production ? (
                  <CheckCircle size={20} color="#22c55e" />
                ) : (
                  <AlertCircle size={20} color="#ef4444" />
                )}
                <span style={{ fontWeight: 600, color: '#111827' }}>Production</span>
              </div>
              <p style={{ fontSize: 12, color: '#4b5563', margin: 0 }}>
                {status.data_pipeline.ready_for_production ? 'Production ready' : 'Not ready'}
              </p>
            </div>
          </div>
        </div>

        {/* OpenAI Balance Check */}
        <div style={sectionCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', columnGap: 12 }}>
              <div style={{ padding: 8, background: '#fef3c7', borderRadius: 10 }}>
                <span style={{ fontSize: 20 }}>💳</span>
              </div>
              <div>
                <h4 style={cardTitle}>Verificar Fondos OpenAI</h4>
                <p style={smallNote}>Comprueba si tu API key de OpenAI tiene créditos disponibles</p>
              </div>
            </div>
            <button onClick={checkOpenAIBalance} style={balanceButtonStyle(checkingBalance)}>
              <div style={checkingBalance ? { animation: 'spin 1s linear infinite', display: 'inline-flex' } : {}}>
                <Key size={16} color="#ffffff" />
              </div>
              <span>{checkingBalance ? 'Verificando...' : 'Verificar Fondos'}</span>
            </button>
          </div>

          {balanceData && (
            <div style={{
              ...infoCard(balanceData.status === 'success' ? 'green' : balanceData.status === 'warning' ? 'yellow' : 'red'),
              marginTop: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', columnGap: 12 }}>
                <div style={{ fontSize: 24, paddingTop: 4 }}>
                  {balanceData.status === 'success' ? '✅' : balanceData.status === 'warning' ? '⚠️' : '❌'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, margin: 0, marginBottom: 8 }}>{balanceData.message}</p>
                  <p style={{ fontSize: 14, margin: 0, marginBottom: 8, opacity: 0.8 }}>{balanceData.details}</p>
                  {balanceData.available_models && balanceData.available_models.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, margin: 0, marginBottom: 4 }}>Modelos disponibles:</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {balanceData.available_models.map((model, idx) => (
                          <span key={idx} style={{
                            background: 'rgba(255,255,255,0.6)',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 500
                          }}>
                            {model}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recommendations */}
        {status.recommendations && status.recommendations.length > 0 && (
          <div
            style={{
              background: 'linear-gradient(90deg, #eff6ff, #e0e7ff)',
              borderRadius: 12,
              padding: 24,
              marginBottom: 24,
              border: '1px solid #bfdbfe',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', columnGap: 12, marginBottom: 16 }}>
              <div style={{ padding: 8, background: '#dbeafe', borderRadius: 10 }}>
                <span style={{ fontSize: 20 }}>💡</span>
              </div>
              <div>
                <h4 style={{ ...cardTitle, color: '#1e3a8a' }}>Quick Actions</h4>
                <p style={{ ...smallNote, color: '#1d4ed8' }}>Recommended steps to improve system status</p>
              </div>
            </div>

            <div style={{ display: 'grid', rowGap: 12 }}>
              {status.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    columnGap: 12,
                    padding: 12,
                    background: 'rgba(255,255,255,0.6)',
                    borderRadius: 10,
                    border: '1px solid #bfdbfe',
                  }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      width: 24,
                      height: 24,
                      background: '#dbeafe',
                      borderRadius: 999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563eb',
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1e3a8a' }}>{recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Health Summary */}
        <div style={{ display: 'grid', rowGap: 24 }}>
          <div style={qaContainer}>
            <div style={qaHeaderRow}>
              <div style={qaIcon}><span style={{ fontSize: 24 }}>🎯</span></div>
              <div>
                <h4 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>¿Qué está pasando en tu sistema?</h4>
                <p style={{ color: '#4b5563', margin: 0 }}>Diagnóstico completo del estado actual</p>
              </div>
            </div>

            {/* Current Status Explanation */}
            <div style={{ display: 'grid', rowGap: 24 }}>
              {!status.data_pipeline.has_data ? (
                <div style={infoCard('yellow')}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', columnGap: 16 }}>
                      <div style={{ flexShrink: 0 }}>
                        <div style={infoIconBox('yellow')}><span style={{ fontSize: 22 }}>📋</span></div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <h5 style={{ fontSize: 18, fontWeight: 800, color: '#713f12', margin: '0 0 6px' }}>
                          Sistema Listo - Esperando Datos
                        </h5>
                        <p style={{ color: '#854d0e', margin: '0 0 12px', lineHeight: 1.6 }}>
                          Todos los servicios están funcionando correctamente, pero la base de datos está vacía.
                          Necesitas cargar datos para ver información real.
                        </p>
                        <div
                          style={{
                            background: 'linear-gradient(90deg, #fef3c7, #fde68a)',
                            borderRadius: 10,
                            padding: 16,
                            border: '1px solid #fde68a',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', columnGap: 12, marginBottom: 10 }}>
                            <span style={{ fontSize: 18 }}>🚀</span>
                            <p style={{ color: '#713f12', fontWeight: 800, margin: 0 }}>Para empezar:</p>
                          </div>
                          <div
                            style={{
                              background: '#713f12',
                              color: '#fef3c7',
                              padding: '10px 12px',
                              borderRadius: 8,
                              fontFamily:
                                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                              fontSize: 13,
                              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)',
                            }}
                          >
                            pnpm ingest
                          </div>
                          <p style={{ color: '#92400e', fontSize: 12, marginTop: 10 }}>
                            Este comando cargará los datos de ejemplo en la base de datos
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : status.data_pipeline.ready_for_production ? (
                <div style={infoCard('green')}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', columnGap: 16 }}>
                      <div style={{ flexShrink: 0 }}>
                        <div style={infoIconBox('green')}><span style={{ fontSize: 22 }}>✅</span></div>
                      </div>
                      <div>
                        <h5 style={{ fontSize: 18, fontWeight: 800, color: '#064e3b', margin: '0 0 6px' }}>
                          ¡Sistema Completamente Operativo!
                        </h5>
                        <p style={{ color: '#065f46', margin: 0, lineHeight: 1.6 }}>
                          Todos los servicios están funcionando y hay datos cargados.
                          El sistema está listo para uso en producción.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={infoCard('red')}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', columnGap: 16 }}>
                      <div style={{ flexShrink: 0 }}>
                        <div style={infoIconBox('red')}><span style={{ fontSize: 22 }}>⚠️</span></div>
                      </div>
                      <div>
                        <h5 style={{ fontSize: 18, fontWeight: 800, color: '#7f1d1d', margin: '0 0 6px' }}>
                          Problemas Detectados
                        </h5>
                        <p style={{ color: '#991b1b', margin: '0 0 10px', lineHeight: 1.6 }}>
                          Hay problemas con uno o más servicios que impiden el funcionamiento completo:
                        </p>
                        <div style={{ display: 'grid', rowGap: 8 }}>
                          {status.services.openai.status !== 'available' && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                columnGap: 8,
                                color: '#991b1b',
                                fontSize: 14,
                                background: '#fee2e2',
                                padding: 8,
                                borderRadius: 8,
                              }}
                            >
                              <AlertCircle size={16} color="#991b1b" />
                              <span>Problema con OpenAI API: {status.services.openai.message}</span>
                            </div>
                          )}
                          {status?.services?.neo4j?.status !== 'connected' && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                columnGap: 8,
                                color: '#991b1b',
                                fontSize: 14,
                                background: '#fee2e2',
                                padding: 8,
                                borderRadius: 8,
                              }}
                            >
                              <AlertCircle size={16} color="#991b1b" />
                              <span>Problema con Neo4j: {status?.services?.neo4j?.message}</span>
                            </div>
                          )}
                          {status.services.graphiti.status !== 'healthy' && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                columnGap: 8,
                                color: '#991b1b',
                                fontSize: 14,
                                background: '#fee2e2',
                                padding: 8,
                                borderRadius: 8,
                              }}
                            >
                              <AlertCircle size={16} color="#991b1b" />
                              <span>Problema con Graphiti: {status.services.graphiti.message}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Why errors explanation */}
              <div style={mutedCard}>
                <div style={{ display: 'flex', alignItems: 'flex-start', columnGap: 16 }}>
                  <div style={{ flexShrink: 0 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        background: 'linear-gradient(135deg, #9ca3af, #64748b)',
                        borderRadius: 14,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        boxShadow: softShadow,
                      }}
                    >
                      <span style={{ fontSize: 22 }}>💡</span>
                    </div>
                  </div>
                  <div>
                    <h5 style={subTitle}>¿Por qué veo errores en otras páginas?</h5>
                    <p style={mutedP}>
                      Los errores que ves (como "Error 500") son <strong>normales y esperados</strong> cuando no hay datos
                      cargados. El sistema ya no muestra datos falsos - ahora te dice la verdad sobre el estado real.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>       
    </div>
  );
};

export default SystemStatus;
