import express, { Application, Request, Response, NextFunction } from 'express';
import config from './config';

const app: Application = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'GitHub Clone API is running',
        timestamp: new Date().toISOString(),
        environment: config.server.env,
    });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to GitHub Clone API',
        version: config.server.apiVersion,
        docs: '/api/docs',
    });
});

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: config.server.env === 'development' ? err.message : undefined,
    });
});

// Start server
const PORT = config.server.port;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📝 Environment: ${config.server.env}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
