import { PrismaClient } from '@prisma/client';
import config from '@config/index';

/**
 * Prisma Client Instance
 * Singleton pattern to ensure only one instance across the application
 */

const prismaClientSingleton = () => {
    return new PrismaClient({
        log: config.server.env === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
};

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (config.server.env !== 'production') {
    globalThis.prismaGlobal = prisma;
}

export default prisma;

/**
 * Disconnect Prisma Client (useful for testing and cleanup)
 */
export const disconnectPrisma = async (): Promise<void> => {
    await prisma.$disconnect();
};

/**
 * Connect to database (useful for testing)
 */
export const connectPrisma = async (): Promise<void> => {
    await prisma.$connect();
};
