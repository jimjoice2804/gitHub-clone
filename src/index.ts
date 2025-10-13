import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config';
import routes from './routes';
import { ApiError } from './types/index';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(
    cors({
        origin: config.cors.origin,
        credentials: true,
    })
);

// Rate limiting
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to GitHub Clone API',
        version: config.server.apiVersion,
        docs: '/api/docs',
        endpoints: {
            auth: '/api/auth',
            health: '/api/health',
        },
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
app.use((err: Error | ApiError, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);

    if (err instanceof ApiError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }

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
