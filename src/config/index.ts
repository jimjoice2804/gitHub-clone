import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
    server: {
        port: number;
        env: string;
        apiVersion: string;
    };
    database: {
        url: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshSecret: string;
        refreshExpiresIn: string;
    };
    cors: {
        origin: string;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    upload: {
        maxFileSize: number;
        uploadDir: string;
    };
    git: {
        storagePath: string;
    };
}

const config: Config = {
    server: {
        port: parseInt(process.env.PORT || '3000', 10),
        env: process.env.NODE_ENV || 'development',
        apiVersion: process.env.API_VERSION || 'v1',
    },
    database: {
        url: process.env.DATABASE_URL || '',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
        uploadDir: process.env.UPLOAD_DIR || './uploads',
    },
    git: {
        storagePath: process.env.GIT_STORAGE_PATH || './repositories',
    },
};

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0 && config.server.env !== 'test') {
    console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    console.error('Please check your .env file');
}

export default config;
