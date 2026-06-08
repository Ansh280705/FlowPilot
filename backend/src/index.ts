import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import workflowRoutes from './routes/workflows';
import executionRoutes from './routes/executions';
import documentRoutes from './routes/documents';
import aiRoutes from './routes/ai';
import authRoutes from './routes/auth';

// Only load .env file in local development — Vercel injects env vars directly
if (!process.env.VERCEL) {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Orvicc Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      workflows: '/api/workflows',
      executions: '/api/executions',
      documents: '/api/documents',
      ai: '/api/ai'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Export for Vercel serverless
export default app;

// Start local server when not on Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Orvicc backend server running on port ${PORT}`);
  });
}
