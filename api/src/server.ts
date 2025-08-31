import dotenv from 'dotenv';
import path from 'path';

// Load .env from the parent directory (project root)
dotenv.config({ path: path.join(process.cwd(), '../.env') });
import express from 'express';
import cors from 'cors';
import clientesRouter from './routes/clientes.js';
import agentesRouter from './routes/agentes.js';
import analyticsRouter from './routes/analytics.js';
import graphRouter from './routes/graph.js';
import systemRouter from './routes/system.js';
import dashboardRouter from './routes/dashboard.js';

const app: any = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: any, res: any, next: any) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: any, res: any) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/clientes', clientesRouter);
app.use('/api/agentes', agentesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/graph', graphRouter);
app.use('/api/system', systemRouter);
app.use('/api/dashboard', dashboardRouter);

// Root endpoint
app.get('/api', (req: any, res: any) => {
  res.json({
    name: 'Analizador de Patrones API',
    version: '1.0.0',
    description: 'REST API for debt collection pattern analysis',
    endpoints: {
      health: 'GET /health',
      system_status: 'GET /api/system/status',
      client_timeline: 'GET /api/clientes/:id/timeline',
      agent_effectiveness: 'GET /api/agentes/:id/efectividad',
      broken_promises: 'GET /api/analytics/promesas-incumplidas?diasVencidas=N',
      best_time_slots: 'GET /api/analytics/mejores-horarios',
      graph_data: 'GET /api/graph'
    },
    graphiti_url: process.env.GRAPHITI_URL || 'http://localhost:8000'
  });
});

// 404 handler
app.use('*', (req: any, res: any) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    available_endpoints: [
      'GET /api',
      'GET /health',
      'GET /api/system/status',
      'GET /api/clientes/:id/timeline',
      'GET /api/agentes/:id/efectividad',
      'GET /api/analytics/promesas-incumplidas',
      'GET /api/analytics/mejores-horarios',
      'GET /api/graph'
    ]
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Analizador de Patrones API');
  console.log('==============================');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🔗 Graphiti URL: ${process.env.GRAPHITI_URL || 'http://localhost:8000'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  GET  http://localhost:${PORT}/api`);
  console.log(`  GET  http://localhost:${PORT}/health`);
  console.log(`  GET  http://localhost:${PORT}/api/system/status`);
  console.log(`  GET  http://localhost:${PORT}/api/clientes/:id/timeline`);
  console.log(`  GET  http://localhost:${PORT}/api/agentes/:id/efectividad`);
  console.log(`  GET  http://localhost:${PORT}/api/analytics/promesas-incumplidas`);
  console.log(`  GET  http://localhost:${PORT}/api/analytics/mejores-horarios`);
  console.log(`  GET  http://localhost:${PORT}/api/graph`);
  console.log('');
});

export default app;