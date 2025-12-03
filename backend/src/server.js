import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import 'express-async-errors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { config } from './core/config/index.js';
import { errorHandler } from './core/middleware/errorHandler.js';
import { requestLogger } from './core/middleware/requestLogger.js';
import { logger } from './core/utils/logger.js';

// Import routes
import authRoutes from './modules/auth/routes.js';
import patientRoutes from './modules/patients/routes.js';
import visitRoutes from './modules/visits/routes.js';
import vitalRoutes from './modules/vitals/routes.js';
import consultationRoutes from './modules/consultations/routes.js';
import prescriptionRoutes from './modules/prescriptions/routes.js';
import pharmacyRoutes from './modules/pharmacy/routes.js';
import labRoutes from './modules/labs/routes.js';
import billingRoutes from './modules/billing/routes.js';
import serviceRoutes from './modules/services/routes.js';
import ipdRoutes from './modules/ipd/routes.js';

// Load environment variables
dotenv.config();

const app = express();

// =====================
// SECURITY MIDDLEWARE
// =====================
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// =====================
// GENERAL MIDDLEWARE
// =====================
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// =====================
// HEALTH CHECK
// =====================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv
  });
});

// =====================
// API ROUTES
// =====================
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/vitals', vitalRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/ipd', ipdRoutes);

// =====================
// ERROR HANDLING
// =====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

app.use(errorHandler);

// =====================
// SERVER START
// =====================
const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`🏥 HIS Backend running on port ${PORT}`);
  logger.info(`📊 Environment: ${config.nodeEnv}`);
  logger.info(`🔒 Security: Enabled`);
});

export default app;
