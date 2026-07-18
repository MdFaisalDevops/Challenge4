import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { db } from './config/firestore';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { setupSwagger } from './config/swagger';
import { enforceHttps, promptInjectionProtection, auditLogMiddleware } from './middleware/security';

const app = express();
const port = process.env.PORT || 5000;

// Trust proxies (Cloud Run, load balancers) so rate limiters track client IPs correctly
app.set('trust proxy', 1);

// Enforce production security headers (Helmet) & secure HTTPS redirections
app.use(helmet());
app.use(enforceHttps);

// Lock CORS to client application origin (e.g. localhost:3000) for security compliance
const corsOrigin = process.env.CLIENT_URL || process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000';
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

// Set up HTTP request stream logging via Morgan and Winston
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  })
);

// Apply API request rate limiting for production security
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Tight rate limits for computationally heavy GenAI decision engine
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Limit each IP to 10 analysis calls per 15 minutes
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many AI decision engine calls. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
app.use('/api/v1/decision-engine', aiLimiter);

// Enforce input prompt injection filters and mutation audit logger logs
app.use('/api/', promptInjectionProtection);
app.use('/api/', auditLogMiddleware);

// Setup Swagger interactive API UI docs
setupSwagger(app);

// Register REST Routers
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import crowdReportsRouter from './routes/crowdReports';
import incidentsRouter from './routes/incidents';
import recommendationsRouter from './routes/recommendations';
import transportationRouter from './routes/transportation';
import volunteersRouter from './routes/volunteers';
import notificationsRouter from './routes/notifications';
import medicalReportsRouter from './routes/medicalReports';
import auditLogsRouter from './routes/auditLogs';
import decisionEngineRouter from './routes/decisionEngine';

import { memoryCacheMiddleware } from './middleware/cache';

// Cache GET outputs for 5 seconds to reduce Firestore query bill limits
app.use('/api/v1/transportation', memoryCacheMiddleware(5000));
app.use('/api/v1/volunteers', memoryCacheMiddleware(5000));
app.use('/api/v1/crowd-reports', memoryCacheMiddleware(5000));

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/crowd-reports', crowdReportsRouter);
app.use('/api/v1/incidents', incidentsRouter);
app.use('/api/v1/recommendations', recommendationsRouter);
app.use('/api/v1/transportation', transportationRouter);
app.use('/api/v1/volunteers', volunteersRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/medical-reports', medicalReportsRouter);
app.use('/api/v1/audit-logs', auditLogsRouter);
app.use('/api/v1/decision-engine', decisionEngineRouter);

// Base Health Check Endpoint
app.get('/health', async (_req, res, next) => {
  try {
    const testDoc = await db.collection('_health_check').doc('ping').get();
    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      services: {
        express: 'HEALTHY',
        firestore: testDoc ? 'CONNECTED' : 'FAILED',
      },
    });
  } catch (error) {
    next(error); // Forward to global error handler
  }
});

// Centralized error handling middleware (must be registered last)
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    logger.info(`CrowdMind AI Server listening at http://localhost:${port}`);
  });
}

export { app };
