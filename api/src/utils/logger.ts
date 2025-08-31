interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  service: 'SYSTEM' | 'OPENAI' | 'GRAPHITI' | 'NEO4J' | 'API';
  message: string;
  details?: any;
}

class SystemLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep only last 100 logs

  private addLog(level: LogEntry['level'], service: LogEntry['service'], message: string, details?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service,
      message,
      details
    };

    this.logs.unshift(entry); // Add to beginning
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Console output with colors
    const timestamp = new Date().toLocaleTimeString();
    const emoji = {
      'INFO': '🔵',
      'WARN': '🟡', 
      'ERROR': '🔴',
      'SUCCESS': '🟢'
    }[level];

    const serviceColor = {
      'SYSTEM': '\x1b[36m',    // Cyan
      'OPENAI': '\x1b[32m',    // Green
      'GRAPHITI': '\x1b[35m',  // Magenta
      'NEO4J': '\x1b[34m',     // Blue
      'API': '\x1b[33m'        // Yellow
    }[service];

    console.log(
      `${emoji} [${timestamp}] ${serviceColor}${service}\x1b[0m: ${message}`,
      details ? '\n   Details:' : '',
      details ? JSON.stringify(details, null, 2).split('\n').map(line => '   ' + line).join('\n') : ''
    );
  }

  info(service: LogEntry['service'], message: string, details?: any) {
    this.addLog('INFO', service, message, details);
  }

  warn(service: LogEntry['service'], message: string, details?: any) {
    this.addLog('WARN', service, message, details);
  }

  error(service: LogEntry['service'], message: string, details?: any) {
    this.addLog('ERROR', service, message, details);
  }

  success(service: LogEntry['service'], message: string, details?: any) {
    this.addLog('SUCCESS', service, message, details);
  }

  // OpenAI specific logging
  openaiKeyStatus(isValid: boolean, quotaInfo?: any) {
    if (isValid) {
      this.success('OPENAI', 'API key is valid and working', quotaInfo);
    } else {
      this.error('OPENAI', 'API key issues detected', quotaInfo);
    }
  }

  openaiQuotaExceeded(details: any) {
    this.error('OPENAI', '💳 QUOTA EXCEEDED: OpenAI API credits exhausted', details);
  }

  openaiRequest(query: string, success: boolean, error?: any) {
    if (success) {
      this.success('OPENAI', 'Query executed successfully', { query: query.slice(0, 100) + '...' });
    } else {
      this.error('OPENAI', 'Query failed', { query: query.slice(0, 100) + '...', error: error?.message });
    }
  }

  // Graphiti specific logging
  graphitiHealth(healthy: boolean, endpoint: string) {
    if (healthy) {
      this.success('GRAPHITI', `Service is healthy at ${endpoint}`);
    } else {
      this.error('GRAPHITI', `Service unreachable at ${endpoint}`);
    }
  }

  graphitiQuery(query: string, success: boolean, error?: any, responseData?: any) {
    if (success) {
      this.success('GRAPHITI', 'Database query successful', { 
        query: query.slice(0, 100) + '...', 
        recordCount: responseData?.data?.length || 0
      });
    } else {
      this.error('GRAPHITI', 'Database query failed', { 
        query: query.slice(0, 100) + '...', 
        error: error?.message,
        statusCode: error?.response?.status
      });
    }
  }

  // Neo4j specific logging
  neo4jConnection(connected: boolean, nodeCount?: number) {
    if (connected) {
      this.success('NEO4J', `Connected successfully. Nodes in database: ${nodeCount || 0}`);
      if (nodeCount === 0) {
        this.warn('NEO4J', '⚠️  Database is empty - run data ingestion to load data');
      }
    } else {
      this.error('NEO4J', 'Connection failed - check database configuration');
    }
  }

  // Get logs for API endpoint
  getLogs(limit?: number): LogEntry[] {
    return limit ? this.logs.slice(0, limit) : this.logs;
  }

  // Get logs by service
  getLogsByService(service: LogEntry['service'], limit?: number): LogEntry[] {
    const filtered = this.logs.filter(log => log.service === service);
    return limit ? filtered.slice(0, limit) : filtered;
  }

  // Clear logs
  clear() {
    this.logs = [];
    this.info('SYSTEM', 'Logs cleared');
  }
}

export const logger = new SystemLogger();
export type { LogEntry };