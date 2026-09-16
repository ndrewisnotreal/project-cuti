import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { config as loadEnv } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';
import { initOpenTelemetry } from './logging/otel/tracing';
import { LoggingService } from './logging/logging.service';

// Load .env SEBELUM initOpenTelemetry — ConfigModule belum jalan di titik ini.
// Samakan prioritas Nest ConfigModule: file pertama menang (.env.$NODE_ENV lalu .env).
const nodeEnv = process.env.NODE_ENV || 'development';
loadEnv({ path: `.env.${nodeEnv}` });
loadEnv({ path: '.env' }); // tidak menimpa key yang sudah di-set di atas

async function bootstrap() {
  // Inisialisasi OpenTelemetry SEBELUM NestFactory.create()
  // agar auto-instrumentation menangkap module load & request.
  const transport = process.env.LOG_TRANSPORT || 'otel';
  initOpenTelemetry({
    serviceName: process.env.OTEL_SERVICE_NAME || 'api-template',
    endpoint:
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318',
    level: process.env.LOG_LEVEL || 'info',
    enabled: transport === 'otel' || transport === 'both',
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
    { bufferLogs: true },
  );

  const logger = app.get(LoggingService);
  app.useLogger(logger);

  const config = app.get(ConfigService);
  const uploadDir = path.resolve(config.get<string>('UPLOAD_DIR', 'uploads'));
  fs.mkdirSync(uploadDir, { recursive: true });

  await app.register(fastifyCookie, {
    secret: config.get<string>('COOKIE_SECRET', 'dev-cookie-secret'),
  });

  const corsOriginEnv = config.get<string>('CORS_ORIGIN', 'http://localhost:5173');
  const allowedOrigins = corsOriginEnv.includes(',')
    ? corsOriginEnv.split(',').map((s) => s.trim())
    : corsOriginEnv;

  await app.register(fastifyCors, {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(fastifyMultipart, {
    limits: { fileSize: 500 * 1024 * 1024 },
  });

  await app.register(fastifyStatic, {
    root: uploadDir,
    prefix: '/uploads/',
    decorateReply: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = config.get<number>('PORT', 3000);
  const nodeEnv = config.get<string>('NODE_ENV', 'development');
  const swaggerFlag = config.get<string>('SWAGGER_ENABLED');
  const swaggerEnabled =
    swaggerFlag === 'true' ||
    (swaggerFlag !== 'false' && nodeEnv !== 'production');

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('API Template')
      .setDescription(
        [
          'NestJS + Fastify API template (auth, user, menu, action, permission, settings).',
          '',
          '## Cara testing di Swagger (QA)',
          '',
          '1. Pastikan header **x-api-key** diisi dengan nilai `API_TOKEN` dari `.env` (tombol **Authorize**).',
          '2. Jalankan **POST /auth/authorize** (public) dengan user seed, mis. `super` + password seed.',
          '3. Salin `data.access_token` dari response (JWT plaintext).',
          '4. Klik **Authorize** → paste token di skema **Bearer** (tanpa prefix `Bearer `).',
          '5. Gunakan **Try it out** pada endpoint protected.',
          '',
          '**Catatan:** Cookie httpOnly `token` berisi JWT yang dienkripsi AES (untuk browser/frontend).',
          'Untuk Swagger, pakai **Bearer** + `access_token`, bukan nilai cookie.',
          '',
          'Envelope response: `{ success, error, data }`.',
        ].join('\n'),
      )
      .setVersion('1.0')
      .addServer(`http://localhost:${port}`, 'Local')
      .addTag('auth', 'Login, logout, password, session menu')
      .addTag('health', 'Health check')
      .addTag('master/user', 'Manajemen user & role dropdown')
      .addTag(
        'master/permission',
        'Permission role (public) & private per user',
      )
      .addTag('system/menu', 'Struktur menu sidebar / admin board')
      .addTag('system/action', 'Master action & mapping menu')
      .addTag('system/settings', 'Website settings & tema UI')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'JWT plaintext dari `data.access_token` setelah POST /auth/authorize',
        },
        'bearer',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'x-api-key',
          in: 'header',
          description: 'Nilai sama dengan `API_TOKEN` di environment',
        },
        'x-api-key',
      )
      .addCookieAuth('token', {
        type: 'apiKey',
        in: 'cookie',
        name: 'token',
        description:
          'Cookie AES-encrypted (browser). Untuk Swagger lebih mudah pakai Bearer.',
      })
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'API Template — Docs',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        filter: true,
        displayRequestDuration: true,
        tryItOutEnabled: true,
        operationsSorter: 'alpha',
      },
      customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 24px 0 16px; }
        .swagger-ui .info .title { font-size: 1.75rem; font-weight: 650; letter-spacing: -0.02em; }
        .swagger-ui .info .description { max-width: 52rem; line-height: 1.55; }
        .swagger-ui .info .description h2 { font-size: 1.1rem; margin-top: 1.25rem; }
        .swagger-ui .scheme-container { background: #f7f8f6; box-shadow: none; border-bottom: 1px solid #e2e5e1; padding: 12px 0; }
        .swagger-ui .opblock-tag { border-bottom: 1px solid #e8ebe6; padding: 12px 0; }
        .swagger-ui .opblock { border-radius: 6px; box-shadow: none; margin: 0 0 8px; }
        .swagger-ui .btn.authorize { border-color: #1f6b4a; color: #1f6b4a; }
        .swagger-ui .btn.authorize svg { fill: #1f6b4a; }
        .swagger-ui .btn.execute { background: #1f6b4a; border-color: #1f6b4a; }
      `,
    });
  }

  await app.listen(port, '0.0.0.0');

  logger.log(
    swaggerEnabled
      ? `API Template listening on http://localhost:${port} (docs at /api/docs)`
      : `API Template listening on http://localhost:${port} (Swagger disabled)`,
    'Bootstrap',
  );
}

void bootstrap();
