import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import authRoutes from './modules/auth/auth.routes.js';
import menuRoutes from './modules/menu/menu.routes.js';
import reservationRoutes from './modules/reservation/reservation.routes.js';
import tableRoutes from './modules/table/table.routes.js';  
import orderRoutes from './modules/order/order.routes.js';
import { logger } from './common/logger.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';

const app = express();
const apiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(apiRateLimit);
app.use(
    pinoHttp({
        logger,
    }),
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);

//TODO: Połączenie z MongoDB


// Endpoint testowy
app.get('/', (req, res) => {
    res.send('GastroHub API is running');
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;