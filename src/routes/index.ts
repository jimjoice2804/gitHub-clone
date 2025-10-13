import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

/**
 * API Routes
 */
router.use('/auth', authRoutes);

/**
 * Health check route
 */
router.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'API is healthy',
        timestamp: new Date().toISOString(),
    });
});

export default router;
