import app from './app.js';
import { connectDB } from './database/connect.js';
import { logger } from './common/logger.js';

const PORT = process.env.PORT || 5000;

process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught exception');
    process.exit(1);
});

connectDB().then(() => {
    app.listen(PORT, () => {
        logger.info({ port: PORT }, 'Server is running');
    });
});