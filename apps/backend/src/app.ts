import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import routes from './routes/index';
import errorHandler from './common/middlewares/error-handler.middleware';
import notFoundMiddleware from './common/middlewares/not-found.middleware';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors());
app.use(compression());

const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
});
app.use('/api', limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Branding images (logos, favicons) are displayed by the frontend on another
// origin, so they need a cross-origin resource policy. Uploads are validated
// raster images with server-generated names, so they are safe to cache long.
app.use(
  '/uploads/branding',
  express.static(path.resolve(env.LOCAL_STORAGE_DIR, 'branding'), {
    fallthrough: false,
    index: false,
    setHeaders: (res) => {
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      res.set('Content-Security-Policy', "default-src 'none'");
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    },
  }),
);

// Serve uploaded files statically and force download
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  setHeaders: (res, path) => {
    res.set('Content-Disposition', 'attachment');
  }
}));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1', routes);

// 404 handler — must come after all routes
app.use(notFoundMiddleware);

// Global error handler — must be last
app.use(errorHandler);

export default app;
