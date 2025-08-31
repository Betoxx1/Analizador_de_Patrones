import React, { useState, useEffect } from 'react';
import { Terminal, Filter, RefreshCw } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  service: 'SYSTEM' | 'OPENAI' | 'GRAPHITI' | 'NEO4J' | 'API';
  message: string;
  details?: any;
}

interface LogsResponse {
  logs: LogEntry[];
  total: number;
  services: string[];
}

const SystemLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedService) params.append('service', selectedService);
      params.append('limit', '100');

      const response = await fetch(`http://localhost:3000/api/system/logs?${params}`);
      if (response.ok) {
        const data: LogsResponse = await response.json();
        setLogs(data.logs);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedService]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => fetchLogs(), 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedService]);

  // ---------- style helpers ----------
  const cardContainer: React.CSSProperties = {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 10px 15px rgba(0,0,0,0.05), 0 4px 6px rgba(0,0,0,0.03)',
  };

  const header: React.CSSProperties = {
    padding: 24,
    borderBottom: '1px solid #e5e7eb',
  };

  const headerRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  };

  const inlineRow: React.CSSProperties = { display: 'flex', alignItems: 'center', columnGap: 8 };
  const title: React.CSSProperties = { fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 };
  const subtitle: React.CSSProperties = { fontSize: 12, color: '#6b7280' };

  const controlRow: React.CSSProperties = { display: 'flex', alignItems: 'center', columnGap: 16 };
  const labelRow: React.CSSProperties = { display: 'flex', alignItems: 'center', columnGap: 8 };
  const refreshBtn: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    columnGap: 6,
    fontSize: 14,
    color: '#2563eb',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  };

  const filterRow: React.CSSProperties = { display: 'flex', alignItems: 'center', columnGap: 16 };
  const selectStyle: React.CSSProperties = {
    fontSize: 14,
    border: '1px solid #d1d5db',
    borderRadius: 6,
    padding: '6px 8px',
    outline: 'none',
  };

  const listContainer: React.CSSProperties = { maxHeight: 384, overflowY: 'auto' };
  const emptyState: React.CSSProperties = {
    padding: 24,
    textAlign: 'center',
    color: '#6b7280',
  };

  const logRow: React.CSSProperties = {
    padding: 16,
    borderTop: '1px solid #f3f4f6',
  };

  const logHeaderRow: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    columnGap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  };

  const servicePill = (bg: string, color: string): React.CSSProperties => ({
    padding: '4px 8px',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 999,
    background: bg,
    color,
  });

  const levelPill = (fg: string, bg: string, border: string): React.CSSProperties => ({
    padding: '4px 8px',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 8,
    color: fg,
    background: bg,
    border: `1px solid ${border}`,
  });

  const messageText: React.CSSProperties = { fontSize: 14, color: '#111827', fontWeight: 600, margin: 0 };
  const detailsSummary: React.CSSProperties = {
    marginTop: 8,
    fontSize: 12,
    color: '#4b5563',
    cursor: 'pointer',
  };
  const detailsPre: React.CSSProperties = {
    marginTop: 6,
    fontSize: 12,
    color: '#4b5563',
    background: '#f9fafb',
    padding: 8,
    borderRadius: 6,
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
  };

  // color maps
  const getServiceStyle = (service: string) => {
    switch (service) {
      case 'OPENAI':
        return servicePill('#dcfce7', '#166534'); // green
      case 'GRAPHITI':
        return servicePill('#ede9fe', '#5b21b6'); // purple
      case 'NEO4J':
        return servicePill('#dbeafe', '#1e40af'); // blue
      case 'SYSTEM':
        return servicePill('#f3f4f6', '#1f2937'); // gray
      case 'API':
        return servicePill('#fef3c7', '#92400e'); // amber
      default:
        return servicePill('#f3f4f6', '#4b5563');
    }
  };

  const getLevelStyle = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return levelPill('#16a34a', '#f0fdf4', '#bbf7d0'); // green
      case 'INFO':
        return levelPill('#2563eb', '#eff6ff', '#bfdbfe'); // blue
      case 'WARN':
        return levelPill('#ca8a04', '#fffbeb', '#fde68a'); // yellow
      case 'ERROR':
        return levelPill('#dc2626', '#fef2f2', '#fecaca'); // red
      default:
        return levelPill('#4b5563', '#f9fafb', '#e5e7eb'); // gray
    }
  };

  // ---------- render ----------
  if (loading) {
    return (
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 10px 15px rgba(0,0,0,0.05)', padding: 24 }}>
        <style>{`@keyframes pulse {0%{opacity:.6} 50%{opacity:1} 100%{opacity:.6}}`}</style>
        <div style={{ ...inlineRow, marginBottom: 16 }}>
          <div style={{ animation: 'pulse 1.2s ease-in-out infinite' }}>
            <Terminal size={20} color="#9ca3af" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 500, color: '#111827', margin: 0 }}>Loading System Logs...</h3>
        </div>
      </div>
    );
  }

  return (
    <div style={cardContainer}>
      <style>{`@keyframes spin {from{transform:rotate(0)} to{transform:rotate(360deg)}}`}</style>
      {/* Header */}
      <div style={header}>
        <div style={headerRow}>
          <div style={{ ...inlineRow, columnGap: 8 }}>
            <Terminal size={20} color="#374151" />
            <h3 style={title}>System Logs</h3>
            <span style={subtitle}>({logs.length} entries)</span>
          </div>

          <div style={controlRow}>
            <label style={labelRow}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#2563eb' }}
              />
              <span style={{ fontSize: 14, color: '#4b5563' }}>Auto-refresh</span>
            </label>

            <button onClick={fetchLogs} style={refreshBtn} aria-label="Refresh">
              <div style={{ display: 'inline-flex' }}>
                <RefreshCw size={16} color="#2563eb" />
              </div>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={filterRow}>
          <div style={labelRow}>
            <Filter size={16} color="#6b7280" />
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              style={selectStyle}
            >
              <option value="">All Services</option>
              <option value="SYSTEM">System</option>
              <option value="OPENAI">OpenAI</option>
              <option value="GRAPHITI">Graphiti</option>
              <option value="NEO4J">Neo4j</option>
              <option value="API">API</option>
            </select>
          </div>

          {lastUpdate && (
            <span style={{ ...subtitle, fontSize: 12 }}>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Logs */}
      <div style={listContainer}>
        {logs.length === 0 ? (
          <div style={emptyState}>
            <div style={{ marginBottom: 8 }}>
              <Terminal size={32} color="#9ca3af" />
            </div>
            <p style={{ margin: 0 }}>No logs available</p>
          </div>
        ) : (
          <div>
            {logs.map((log, index) => (
              <div key={index} style={logRow}>
                <div style={{ display: 'flex', alignItems: 'flex-start', columnGap: 12 }}>
                  <div style={{ flexShrink: 0 }}>
                    <span style={{ fontSize: 18 }}>
                      {log.level === 'SUCCESS'
                        ? '✅'
                        : log.level === 'INFO'
                        ? 'ℹ️'
                        : log.level === 'WARN'
                        ? '⚠️'
                        : log.level === 'ERROR'
                        ? '❌'
                        : '📝'}
                    </span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={logHeaderRow}>
                      <span style={getServiceStyle(log.service)}>{log.service}</span>
                      <span style={getLevelStyle(log.level)}>{log.level}</span>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p style={messageText}>{log.message}</p>

                    {log.details && (
                      <details style={{ marginTop: 8 }}>
                        <summary style={detailsSummary}>Show details</summary>
                        <pre style={detailsPre}>{JSON.stringify(log.details, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemLogs;
